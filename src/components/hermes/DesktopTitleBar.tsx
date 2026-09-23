import React from 'react';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  Settings,
  Download,
  Sparkles,
  Layers,
  ChevronDown,
  Activity,
  HardDrive,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HermesModelConfig, EngineTelemetry } from '@/types/hermes';

interface DesktopTitleBarProps {
  currentModel: HermesModelConfig;
  models: HermesModelConfig[];
  onSelectModel: (model: HermesModelConfig) => void;
  telemetry: EngineTelemetry;
  onOpenSettings: () => void;
  onExportZip: () => void;
  osStyle: 'macos' | 'linux' | 'windows';
  onChangeOsStyle: (style: 'macos' | 'linux' | 'windows') => void;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({
  currentModel,
  models,
  onSelectModel,
  telemetry,
  onOpenSettings,
  onExportZip,
  osStyle,
  onChangeOsStyle,
}) => {
  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between select-none backdrop-blur-md sticky top-0 z-40">
      {/* Left: Window controls & Branding */}
      <div className="flex items-center gap-3">
        {/* OS-styled Window Dots */}
        {osStyle === 'macos' && (
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors shadow-sm cursor-pointer" title="Close" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors shadow-sm cursor-pointer" title="Minimize" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer" title="Maximize" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-slate-100 text-sm flex items-center gap-1">
                Zeus Desktop
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                C++ & Rust Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              v0.2.0 • Ultra-Fast AI Workstation
            </p>
          </div>
        </div>
      </div>

      {/* Center: Model Selector & Native Engine Status */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 bg-slate-900/90 border-slate-700/70 hover:bg-slate-800 text-slate-200 text-xs gap-2 px-3 shadow-inner"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[160px] truncate font-medium">{currentModel.name}</span>
              <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700 py-0 px-1 font-mono">
                {currentModel.quantization.split(' ')[0]}
              </Badge>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-slate-900 border-slate-800 text-slate-200">
            <DropdownMenuLabel className="text-xs text-slate-400">Available Native Models</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            {models.map((m) => (
              <DropdownMenuItem 
                key={m.id}
                onClick={() => onSelectModel(m)}
                className={`cursor-pointer text-xs p-2.5 focus:bg-slate-800 ${m.id === currentModel.id ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''}`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between font-medium text-slate-100">
                    <span>{m.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{m.backend}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{m.quantization}</span>
                    <span>•</span>
                    <span>{(m.contextLength / 1024).toFixed(0)}k context</span>
                    <span>•</span>
                    <span>{m.gpuLayers} GPU layers</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Live Engine Status Indicators */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300" title="Rust Tokio Async Daemon">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Rust:</span>
            <span className="text-emerald-400">Tokio OK</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300" title="C++ llama.cpp Inference Speed">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">C++ Core:</span>
            <span className="text-cyan-400 font-semibold">{telemetry.cpp.inferenceSpeedTps} t/s</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300" title="Zero-Copy CXX FFI Latency">
            <span className="text-slate-400">FFI:</span>
            <span className="text-amber-400 font-semibold">{telemetry.cpp.ffiCallLatencyUs}µs</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* OS switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 text-slate-400 hover:text-slate-200 text-xs hidden lg:flex"
            >
              OS: <span className="capitalize text-slate-200 font-mono ml-1">{osStyle}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
            <DropdownMenuItem onClick={() => onChangeOsStyle('macos')}>macOS Shell</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeOsStyle('linux')}>Linux Shell (Wayland/X11)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeOsStyle('windows')}>Windows Shell (WinUI)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={onExportZip}
          variant="outline"
          size="sm"
          className="h-8 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800/80 text-xs gap-1.5 px-3"
          title="Download the complete native C++ and Rust project codebase"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export C++/Rust Code</span>
          <span className="sm:hidden">Export</span>
        </Button>

        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Zeus Settings & Inference Config"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
