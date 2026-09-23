import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Sliders, 
  Check, 
  RotateCcw,
  Sparkles,
  Server,
  Zap,
  Globe,
  RefreshCw,
  Radio
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { HermesModelConfig } from '@/types/hermes';
import { BackendEndpointConfig, SessionStore } from '@/services/sessionStore';
import { RealAgentService } from '@/services/realAgentService';
import { detectRealSystemInfo, RealSystemInfo } from '@/services/realSystemService';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: HermesModelConfig;
  onUpdateModelConfig: (updated: Partial<HermesModelConfig>) => void;
  endpointConfig: BackendEndpointConfig;
  onUpdateEndpointConfig: (config: BackendEndpointConfig) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  currentModel,
  onUpdateModelConfig,
  endpointConfig,
  onUpdateEndpointConfig,
}) => {
  const [gpuLayers, setGpuLayers] = useState<number>(currentModel.gpuLayers);
  const [threads, setThreads] = useState<number>(currentModel.threads);
  const [temperature, setTemperature] = useState<number>(currentModel.temperature);
  const [contextLength, setContextLength] = useState<number>(currentModel.contextLength);
  
  // Endpoint config state
  const [endpointMode, setEndpointMode] = useState<BackendEndpointConfig['mode']>(endpointConfig.mode);
  const [baseUrl, setBaseUrl] = useState<string>(endpointConfig.baseUrl);
  const [apiKey, setApiKey] = useState<string>(endpointConfig.apiKey || '');
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{ online: boolean; models: string[]; latencyMs: number } | null>(null);

  // Real hardware detected state
  const [realSys, setRealSys] = useState<RealSystemInfo | null>(null);

  useEffect(() => {
    if (open) {
      detectRealSystemInfo().then(setRealSys);
    }
  }, [open]);

  const handleProbeEndpoint = async () => {
    setIsProbing(true);
    setProbeResult(null);

    const testConfig: BackendEndpointConfig = {
      mode: endpointMode,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      isOnline: false,
      discoveredModels: [],
    };

    const res = await RealAgentService.probeEndpoint(testConfig);
    setIsProbing(false);
    setProbeResult(res);

    if (res.online) {
      toast.success(`Connected to ${endpointMode} (${res.latencyMs}ms)! Found ${res.models.length} models.`);
    } else {
      toast.info(`Endpoint not currently reachable (${res.latencyMs}ms). Zeus will continue in high-fidelity native mode.`);
    }
  };

  const handleSave = () => {
    onUpdateModelConfig({
      gpuLayers,
      threads,
      temperature,
      contextLength,
    });

    const updatedEndpoint: BackendEndpointConfig = {
      mode: endpointMode,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      isOnline: probeResult ? probeResult.online : endpointConfig.isOnline,
      lastChecked: new Date().toLocaleTimeString(),
      discoveredModels: probeResult && probeResult.models.length > 0 ? probeResult.models : endpointConfig.discoveredModels,
    };

    onUpdateEndpointConfig(updatedEndpoint);
    SessionStore.saveEndpointConfig(updatedEndpoint);

    toast.success('Zeus Desktop settings saved');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-100">
            <Settings className="w-4 h-4 text-cyan-400" />
            Zeus Desktop Configuration & Real Backend Integration
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Configure live local inference (Ollama / llama.cpp C++ server), hardware offloading, and real system resources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Live Backend Connection Section */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Live Inference Provider
              </span>
              <Badge variant="outline" className={`text-[10px] font-mono ${endpointConfig.isOnline ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20' : 'border-slate-700 text-slate-400'}`}>
                {endpointConfig.isOnline ? 'Online / Connected' : 'Native Core Active'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'zeus_engine', label: 'Built-in Zeus' },
                { id: 'ollama', label: 'Local Ollama' },
                { id: 'llama_cpp', label: 'llama.cpp C++' },
                { id: 'openai_compatible', label: 'OpenAI / Custom' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    setEndpointMode(prov.id as any);
                    if (prov.id === 'ollama') setBaseUrl('http://localhost:11434');
                    if (prov.id === 'llama_cpp') setBaseUrl('http://localhost:8080');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                    endpointMode === prov.id
                      ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>

            {endpointMode !== 'zeus_engine' && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Server URL (e.g. http://localhost:11434 or http://localhost:8080)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-slate-900 border-slate-800 text-slate-200 text-xs font-mono h-8 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleProbeEndpoint}
                      disabled={isProbing}
                      className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1 px-3 shrink-0"
                    >
                      <RefreshCw className={`w-3 h-3 text-cyan-400 ${isProbing ? 'animate-spin' : ''}`} />
                      {isProbing ? 'Pinging...' : 'Test Connection'}
                    </Button>
                  </div>
                </div>

                {endpointMode === 'openai_compatible' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      API Key (Optional for local servers)
                    </label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="bg-slate-900 border-slate-800 text-slate-200 text-xs font-mono h-8"
                    />
                  </div>
                )}

                {probeResult && (
                  <div className={`p-2 rounded border text-[11px] font-mono ${probeResult.online ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' : 'bg-amber-950/20 border-amber-800 text-amber-300'}`}>
                    {probeResult.online
                      ? `✓ Success (${probeResult.latencyMs}ms). Discovered models: ${probeResult.models.slice(0, 3).join(', ')}`
                      : `Endpoint offline or CORS restricted (${probeResult.latencyMs}ms). Zeus will fall back to its internal native C++/Rust simulation.`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real Detected System Hardware */}
          {realSys && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Live Host Hardware Detected
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">CPU Cores:</span>
                  <span className="text-emerald-400">{realSys.cpuCores} Threads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RAM:</span>
                  <span className="text-slate-200">~{realSys.deviceMemoryGb} GB</span>
                </div>
                <div className="flex justify-between col-span-2 truncate">
                  <span className="text-slate-500 mr-2">GPU:</span>
                  <span className="text-cyan-400 truncate">{realSys.gpuRenderer}</span>
                </div>
              </div>
            </div>
          )}

          {/* GPU Layers Offload */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                GPU Layers Offloaded to CUDA/Metal
              </span>
              <span className="text-cyan-400 font-bold">{gpuLayers} layers</span>
            </div>
            <Slider
              value={[gpuLayers]}
              min={0}
              max={80}
              step={1}
              onValueChange={(val) => setGpuLayers(val[0])}
              className="py-1"
            />
          </div>

          {/* CPU Threads */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Tokio Worker Threads
              </span>
              <span className="text-emerald-400 font-bold">{threads} threads</span>
            </div>
            <Slider
              value={[threads]}
              min={1}
              max={32}
              step={1}
              onValueChange={(val) => setThreads(val[0])}
              className="py-1"
            />
          </div>

          {/* Context Window */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                Context Window (KV Cache Buffer)
              </span>
              <span className="text-purple-400 font-bold">{(contextLength / 1024).toFixed(0)}k tokens</span>
            </div>
            <Slider
              value={[contextLength]}
              min={4096}
              max={131072}
              step={4096}
              onValueChange={(val) => setContextLength(val[0])}
              className="py-1"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Provider: {endpointMode}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
            >
              Apply Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
