import React from 'react';
import { 
  Zap, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  Radio
} from 'lucide-react';
import { Scenario } from '@/types/harness';
import { AVAILABLE_ROUTES } from '@/services/harnessData';

interface TelemetryOverviewProps {
  scenarios: Scenario[];
  liveRps: number;
  totalTokensProcessed: number;
  daemonActive: boolean;
}

export const TelemetryOverview: React.FC<TelemetryOverviewProps> = ({ 
  scenarios,
  liveRps,
  totalTokensProcessed,
  daemonActive
}) => {
  const executedScenarios = scenarios.filter(s => s.status !== 'idle');
  const totalRuns = executedScenarios.length;
  const passedRuns = scenarios.filter(s => s.status === 'passed').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;

  // Compute average latency from scenarios with lastResult
  const completedResults = scenarios
    .filter(s => s.lastResult)
    .map(s => s.lastResult!.durationMs);
  const avgLatency = completedResults.length > 0 
    ? Math.round(completedResults.reduce((a, b) => a + b, 0) / completedResults.length)
    : 310;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
      {/* Metric 1: Live Engine Status & Throughput */}
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-slate-800 shadow-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Live Daemon</span>
          <div className={`p-1.5 rounded-lg border ${daemonActive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            <Radio className={`w-3.5 h-3.5 ${daemonActive ? 'animate-pulse' : ''}`} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${daemonActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {daemonActive ? `${liveRps.toFixed(1)}` : 'PAUSED'}
          </span>
          {daemonActive && <span className="text-xs font-mono text-slate-400">req/s</span>}
          <span className="text-[11px] font-mono text-slate-400 ml-auto flex items-center gap-1">
            {daemonActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                Active
              </>
            ) : 'Standby'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${daemonActive ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-700'}`} 
            style={{ width: daemonActive ? `${Math.min((liveRps / 50) * 100, 100)}%` : '0%' }}
          />
        </div>
      </div>

      {/* Metric 2: Avg Latency SLA */}
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-slate-800 shadow-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Avg Latency SLA</span>
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-300">{avgLatency}</span>
          <span className="text-xs font-mono text-slate-400">ms</span>
          <span className="text-[11px] font-mono text-cyan-400/80 ml-auto">
            TTFT &lt; 280ms
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${Math.min((avgLatency / 1500) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Total Tokens Processed */}
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-slate-800 shadow-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Tokens Routed</span>
          <div className="p-1.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {totalTokensProcessed.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-indigo-300 ml-auto">
            68.4% saved
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
            style={{ width: `68.4%` }}
          />
        </div>
      </div>

      {/* Metric 4: Benchmark Pass Rate */}
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-slate-800 shadow-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Suite Pass Rate</span>
          <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">{passRate}%</span>
          <span className="text-[11px] font-mono text-emerald-400 ml-auto">
            {passedRuns}/{totalRuns || scenarios.length} verified
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};
