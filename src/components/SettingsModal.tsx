import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Sliders, 
  Cpu, 
  Database,
  Radio,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { HarnessConfig, RoutingStrategy } from '@/types/harness';
import { AVAILABLE_ROUTES } from '@/services/harnessData';
import { HarnessEngine } from '@/services/harnessEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HarnessConfig;
  onSaveConfig: (config: HarnessConfig) => void;
  engine: HarnessEngine;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  engine,
}) => {
  const [formData, setFormData] = useState<HarnessConfig>({ ...config });
  const [pingStatus, setPingStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ tested: false, loading: false });

  // Reset form when dialog reopens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...config });
      setPingStatus({ tested: false, loading: false });
    }
  }, [isOpen, config]);

  const handleTestConnection = async () => {
    setPingStatus({ tested: true, loading: true });
    // Temporarily update engine config for testing
    engine.updateConfig(formData);
    const result = await engine.pingBackend();
    setPingStatus({
      tested: true,
      loading: false,
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
    });
  };

  const handleSave = () => {
    onSaveConfig(formData);
    engine.updateConfig(formData);
    onClose();
  };

  const quickPresets = ['http://localhost:8000', 'http://127.0.0.1:8080', 'http://localhost:3000'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0c1222] border-slate-800 text-slate-100 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base text-cyan-300 font-mono flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            SystemOne Harness Router & Backend Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Backend Execution Mode */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase font-mono block">
                  Harness Execution Engine Mode
                </span>
                <p className="text-[11px] text-slate-400">
                  Switch between built-in high-fidelity sandbox and live external SystemOneHarness backend API.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, backendMode: 'mock' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.backendMode === 'mock'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                    : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200">Built-in Sandbox</span>
                  {formData.backendMode === 'mock' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Offline emulation with simulated latency & model routes. Zero setup needed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, backendMode: 'custom' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.backendMode === 'custom'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                    : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200">Custom Backend API</span>
                  {formData.backendMode === 'custom' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Connect to your running SystemOneHarness Python/Node instance via HTTP/REST.
                </p>
              </button>
            </div>
          </div>

          {/* Endpoint URL & Key Inputs */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                API Endpoint Configuration
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-400">
                REST / JSON
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300">Backend Host URL</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                  {quickPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, backendUrl: preset })}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                    >
                      {preset.replace('http://', '')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={formData.backendUrl}
                  onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
                  placeholder="http://localhost:8000"
                  className="pl-9 bg-[#080d1a] border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Harness Authorization Token / API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Bearer token or soh_..."
                  className="pl-9 bg-[#080d1a] border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTestConnection}
                disabled={pingStatus.loading}
                className="border-cyan-800/80 hover:bg-cyan-950/40 text-cyan-300 text-xs font-mono h-8 rounded-lg"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${pingStatus.loading ? 'animate-spin' : ''}`} />
                {pingStatus.loading ? 'Testing Connection...' : 'Ping Endpoint & Test Health'}
              </Button>

              <div className="text-xs font-mono">
                <span className="text-slate-500">Timeout: </span>
                <span className="text-slate-300">{formData.timeoutMs}ms</span>
              </div>
            </div>

            {/* Health check diagnostic banner */}
            {pingStatus.tested && (
              <div className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2.5 ${
                pingStatus.success 
                  ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-200' 
                  : 'bg-amber-950/40 border border-amber-800/80 text-amber-200'
              }`}>
                {pingStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {pingStatus.success ? 'Endpoint Verified' : 'Diagnostic Notice'}
                    {pingStatus.latencyMs && ` (${pingStatus.latencyMs}ms latency)`}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {pingStatus.message}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Router Strategy Parameters */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono block">
              Router Policy & Safeguards
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Default Strategy</label>
                <select
                  value={formData.defaultStrategy}
                  onChange={(e) => setFormData({ ...formData, defaultStrategy: e.target.value as RoutingStrategy })}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-cyan-300 font-mono focus:border-cyan-500 cursor-pointer"
                >
                  <option value="latency_first">Latency-First</option>
                  <option value="cost_optimized">Cost-Optimized</option>
                  <option value="accuracy_cascade">Accuracy Cascade</option>
                  <option value="failover_redundancy">Failover Redundancy</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#080d1a] border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Circuit Breaker Failover</span>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-cascade if node &gt; 600ms</span>
                </div>
                <Switch
                  checked={formData.failoverEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, failoverEnabled: checked })}
                />
              </div>
            </div>
          </div>

          {/* Model Route Pool Overview */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono block">
              Configured Route Pool ({AVAILABLE_ROUTES.length} Available Nodes)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_ROUTES.map((route) => (
                <div key={route.id} className="p-2.5 rounded-lg bg-[#080d1a] border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-semibold block">{route.name}</span>
                    <span className="text-[10px] text-slate-500">{route.provider}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-400 text-[11px] block">{route.latencyMsAvg}ms</span>
                    <span className="text-[10px] text-slate-400">${route.costPer1kTokens}/1k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="text-xs text-slate-400">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs">
            Save & Apply Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
