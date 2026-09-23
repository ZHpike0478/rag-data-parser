import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Sliders, 
  Check, 
  RotateCcw,
  Sparkles
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
import { HermesModelConfig } from '@/types/hermes';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: HermesModelConfig;
  onUpdateModelConfig: (updated: Partial<HermesModelConfig>) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  currentModel,
  onUpdateModelConfig,
}) => {
  const [gpuLayers, setGpuLayers] = useState<number>(currentModel.gpuLayers);
  const [threads, setThreads] = useState<number>(currentModel.threads);
  const [temperature, setTemperature] = useState<number>(currentModel.temperature);
  const [contextLength, setContextLength] = useState<number>(currentModel.contextLength);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are Zeus, an ultra-fast autonomous AI workstation agent built in Rust and C++ with native function calling, tool execution, and local hardware acceleration.'
  );

  const handleSave = () => {
    onUpdateModelConfig({
      gpuLayers,
      threads,
      temperature,
      contextLength,
    });
    toast.success('Zeus C++ & Rust engine settings updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-100">
            <Settings className="w-4 h-4 text-cyan-400" />
            Zeus Desktop Configuration & Runtime Flags
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Configure C++ llama.cpp tensor offloading, Rust thread pool, and agent personality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
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
              className="py-2"
            />
            <p className="text-[10px] text-slate-500">
              Higher values offload more transformer attention and MLP blocks into GPU VRAM for maximum tokens/sec.
            </p>
          </div>

          {/* CPU Threads */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                CPU Matrix Multiplication Threads
              </span>
              <span className="text-emerald-400 font-bold">{threads} threads</span>
            </div>
            <Slider
              value={[threads]}
              min={1}
              max={32}
              step={1}
              onValueChange={(val) => setThreads(val[0])}
              className="py-2"
            />
          </div>

          {/* Context Window */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                Context Window (KV Cache Paged Tokens)
              </span>
              <span className="text-purple-400 font-bold">{(contextLength / 1024).toFixed(0)}k tokens</span>
            </div>
            <Slider
              value={[contextLength]}
              min={4096}
              max={131072}
              step={4096}
              onValueChange={(val) => setContextLength(val[0])}
              className="py-2"
            />
          </div>

          {/* Temperature */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300 font-medium">Temperature (Sampling Creativity)</span>
              <span className="text-amber-400 font-bold">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[temperature]}
              min={0}
              max={1.0}
              step={0.05}
              onValueChange={(val) => setTemperature(val[0])}
              className="py-2"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Zeus System Prompt & Instructions
            </label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-200 text-xs font-mono min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
