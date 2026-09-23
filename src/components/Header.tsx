import React from 'react';
import { 
  Terminal, 
  Settings, 
  GitBranch, 
  RefreshCw, 
  Play, 
  Pause,
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Radio,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HarnessConfig, RoutingStrategy } from '@/types/harness';

interface HeaderProps {
  config: HarnessConfig;
  onOpenSettings: () => void;
  onRunAll: () => void;
  isRunningAll: boolean;
  onStrategyChange: (strategy: RoutingStrategy) => void;
  backendHealthy: boolean;
  onPing: () => void;
  isPinging: boolean;
  daemonActive: boolean;
  onToggleDaemon: () => void;
  liveRps: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onRunAll,
  isRunningAll,
  onStrategyChange,
  backendHealthy,
  onPing,
  isPinging,
  daemonActive,
  onToggleDaemon,
  liveRps
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-950/60 bg-[#0a0f1d]/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-indigo-600/30 border border-cyan-500/40 glow-cyan-sm">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0a0f1d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base lg:text-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                SYSTEM ONE
              </span>
              <span className="text-xs font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                HARNESS
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex border-slate-700/80 text-slate-400 text-[10px] font-mono">
                v1.4.2
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                <GitBranch className="w-3 h-3 text-cyan-400" />
                HarnessRouter/SystemOneHarness
              </span>
              <span className="text-slate-600">•</span>
              <a 
                href="https://github.com/HarnessRouter/SystemOneHarness" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                title="View GitHub Repository"
              >
                git repo <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* Center / Status info */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Live Daemon Toggle */}
          <button
            onClick={onToggleDaemon}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
              daemonActive 
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
            title="Toggle background harness daemon & real-time traffic pulse"
          >
            <span className={`w-2 h-2 rounded-full ${daemonActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="font-bold">{daemonActive ? 'DAEMON: ACTIVE' : 'DAEMON: PAUSED'}</span>
            {daemonActive ? (
              <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-1 rounded ml-1">
                {liveRps.toFixed(1)} rps
              </span>
            ) : null}
          </button>

          {/* Engine Status pill */}
          <button
            onClick={onPing}
            disabled={isPinging}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-300 transition-all font-mono"
            title="Click to ping backend"
          >
            <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'} ${isPinging ? 'animate-ping' : ''}`} />
            <span className="text-slate-400 font-sans text-[11px]">Backend:</span>
            <span className="font-semibold text-slate-200">
              {config.backendMode === 'mock' ? 'Local Sandbox' : 'Custom Endpoint'}
            </span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isPinging ? 'animate-spin text-cyan-400' : 'hover:text-cyan-300'}`} />
          </button>

          {/* Strategy selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 text-[11px]">Strategy:</span>
            <select
              value={config.defaultStrategy}
              onChange={(e) => onStrategyChange(e.target.value as RoutingStrategy)}
              className="bg-transparent text-cyan-400 font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="latency_first" className="bg-slate-900 text-slate-200">Latency-First</option>
              <option value="cost_optimized" className="bg-slate-900 text-slate-200">Cost-Optimized</option>
              <option value="accuracy_cascade" className="bg-slate-900 text-slate-200">Accuracy Cascade</option>
              <option value="failover_redundancy" className="bg-slate-900 text-slate-200">Failover Redundancy</option>
            </select>
          </div>
        </div>

        {/* Right action triggers */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onRunAll}
            disabled={isRunningAll}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950 font-semibold shadow-sm transition-all h-8 px-3 rounded-lg"
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 fill-slate-950 ${isRunningAll ? 'animate-spin' : ''}`} />
            {isRunningAll ? 'Running Suite...' : 'Re-Run All'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-300 h-8 px-2.5 rounded-lg"
            title="Configure Backend URL & Router Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1.5 text-xs">Config</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
