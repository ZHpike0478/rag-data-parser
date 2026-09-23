import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  ArrowDownCircle, 
  Download, 
  Search, 
  Check, 
  Copy, 
  ShieldAlert,
  Sliders,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogEntry, LogLevel } from '@/types/harness';

interface ConsoleLogStreamerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ConsoleLogStreamer: React.FC<ConsoleLogStreamerProps> = ({
  logs,
  onClearLogs,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLevel && matchSearch;
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.component}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.component}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `systemone_harness_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'ROUTE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60">ROUTE</span>;
      case 'WARN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">WARN</span>;
      case 'ERROR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/60">ERROR</span>;
      case 'TRACE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">TRACE</span>;
      case 'INFO':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">INFO</span>;
    }
  };

  const errorCount = logs.filter(l => l.level === 'ERROR').length;
  const warnCount = logs.filter(l => l.level === 'WARN').length;
  const routeCount = logs.filter(l => l.level === 'ROUTE').length;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl space-y-4">
      {/* Console Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300 ml-2">
              systemone-harness.telemetry.log
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
            {routeCount > 0 && (
              <Badge variant="outline" className="text-indigo-300 border-indigo-800/80 bg-indigo-950/40 text-[10px]">
                {routeCount} routes
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="text-amber-300 border-amber-800/80 bg-amber-950/40 text-[10px]">
                {warnCount} warnings
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="text-rose-300 border-rose-800/80 bg-rose-950/40 text-[10px]">
                {errorCount} errors
              </Badge>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            {['ALL', 'INFO', 'ROUTE', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  filterLevel === lvl 
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-32 sm:w-40"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-8 px-2 text-xs font-mono ${autoScroll ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
            title="Toggle Live Stream Auto-Follow"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />
            Live
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLogs}
            className="h-8 px-2 text-xs font-mono text-slate-400 hover:text-slate-200"
            title="Copy Filtered Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownloadLogs}
            className="h-8 px-2 text-xs font-mono text-slate-400 hover:text-slate-200"
            title="Download Log File"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearLogs}
            className="h-8 px-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
            title="Clear Log Stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div 
        ref={scrollRef}
        className="h-[360px] overflow-y-auto bg-[#060913] border border-slate-800/90 rounded-xl p-3 font-mono text-xs space-y-1.5 select-text shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Terminal className="w-6 h-6 mb-2 opacity-50 text-cyan-400" />
            <span>No log entries match the current filter.</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/60 p-1 rounded transition-colors group">
              <span className="text-slate-500 select-none text-[11px] shrink-0">{log.timestamp}</span>
              <div className="shrink-0">{getLevelBadge(log.level)}</div>
              <span className="text-cyan-400 font-bold shrink-0 text-[11px]">[{log.component}]</span>
              <span className="text-slate-300 group-hover:text-slate-100 break-all leading-tight">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
