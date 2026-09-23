import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Play, 
  Settings, 
  Terminal, 
  Code, 
  CheckCircle2, 
  Sliders, 
  FileText, 
  Cpu, 
  Layers, 
  Zap, 
  Server, 
  BookOpen, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { TelemetryOverview } from '@/components/TelemetryOverview';
import { ScenarioRunner } from '@/components/ScenarioRunner';
import { RouterPlayground } from '@/components/RouterPlayground';
import { ConsoleLogStreamer } from '@/components/ConsoleLogStreamer';
import { SettingsModal } from '@/components/SettingsModal';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { DEFAULT_CONFIG, INITIAL_SCENARIOS, AVAILABLE_ROUTES } from '@/services/harnessData';
import { HarnessEngine } from '@/services/harnessEngine';
import { Scenario, HarnessConfig, RoutingStrategy, LogEntry } from '@/types/harness';
import { toast } from 'sonner';

const Index: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<HarnessConfig>(DEFAULT_CONFIG);
  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeTab, setActiveTab] = useState<string>('scenarios');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Engine instance
  const engine = useMemo(() => {
    return new HarnessEngine(DEFAULT_CONFIG);
  }, []);

  // Execution states
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [isPinging, setIsPinging] = useState(false);

  // Subscribe to engine logs
  useEffect(() => {
    // Initial welcome logs
    engine.addLog('INFO', 'SYSTEM', 'SystemOne Harness Console initialized successfully.');
    engine.addLog('INFO', 'ROUTER', 'Dynamic routing arbitration engine primed with 5 target nodes.');
    engine.addLog('INFO', 'HARNESS', `Loaded 5 verified benchmark scenarios into memory cache.`);
    setLogs([...engine.getLogs()]);

    const unsubscribe = engine.subscribeLogs((newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 499)]);
    });

    return () => unsubscribe();
  }, [engine]);

  // Ping backend
  const handlePing = useCallback(async () => {
    setIsPinging(true);
    const result = await engine.pingBackend();
    setBackendHealthy(result.success);
    setIsPinging(false);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.warning(result.message);
    }
  }, [engine]);

  // Run a single scenario
  const handleRunScenario = async (scenario: Scenario) => {
    setRunningId(scenario.id);
    setScenarios((prev) =>
      prev.map((s) => (s.id === scenario.id ? { ...s, status: 'running' } : s))
    );

    try {
      const result = await engine.runScenario(scenario);
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? {
                ...s,
                status: result.allPassed ? 'passed' : 'failed',
                lastResult: result,
              }
            : s
        )
      );
      if (result.allPassed) {
        toast.success(`Scenario [${scenario.id}] Passed (${result.durationMs}ms)`);
      } else {
        toast.error(`Scenario [${scenario.id}] Failed assertion requirements`);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(`Scenario execution failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunningId(null);
    }
  };

  // Run all scenarios sequentially
  const handleRunAll = async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    engine.addLog('INFO', 'SUITE', `Starting batch execution of all ${scenarios.length} scenarios...`);
    toast.info(`Running all ${scenarios.length} scenarios...`);

    for (const scen of scenarios) {
      setRunningId(scen.id);
      setScenarios((prev) =>
        prev.map((s) => (s.id === scen.id ? { ...s, status: 'running' } : s))
      );
      try {
        const result = await engine.runScenario(scen);
        setScenarios((prev) =>
          prev.map((s) =>
            s.id === scen.id
              ? {
                  ...s,
                  status: result.allPassed ? 'passed' : 'failed',
                  lastResult: result,
                }
              : s
          )
        );
      } catch (err) {
        console.error(err);
      }
    }

    setRunningId(null);
    setIsRunningAll(false);
    engine.addLog('INFO', 'SUITE', 'All benchmark scenarios completed.');
    toast.success('All benchmark scenarios finished evaluation.');
  };

  const handleStrategyChange = (strategy: RoutingStrategy) => {
    const updated = { ...config, defaultStrategy: strategy };
    setConfig(updated);
    engine.updateConfig(updated);
    toast.info(`Routing policy set to: ${strategy}`);
  };

  const handleClearLogs = () => {
    engine.clearLogs();
    setLogs([]);
    toast.success('Console logs cleared.');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation & Status Bar */}
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRunAll={handleRunAll}
        isRunningAll={isRunningAll}
        onStrategyChange={handleStrategyChange}
        backendHealthy={backendHealthy}
        onPing={handlePing}
        isPinging={isPinging}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Telemetry Key Stats */}
        <TelemetryOverview scenarios={scenarios} />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <TabsList className="bg-[#0c1322] border border-slate-800 p-1 rounded-xl h-11">
              <TabsTrigger
                value="scenarios"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 text-slate-400 font-mono text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Test Suites</span>
                <Badge className="bg-slate-800 text-slate-300 text-[10px] ml-1 px-1.5 py-0 border-0">
                  {scenarios.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="playground"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 text-slate-400 font-mono text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Router Playground</span>
              </TabsTrigger>

              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 text-slate-400 font-mono text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Execution Logs</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 ml-1 inline-block animate-pulse" />
              </TabsTrigger>

              <TabsTrigger
                value="docs"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 text-slate-400 font-mono text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Architecture</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick action info badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="hidden md:inline text-slate-500">Target Endpoint:</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                {config.backendMode === 'mock' ? 'local://systemone-sandbox' : config.backendUrl}
              </span>
            </div>
          </div>

          {/* TAB 1: Scenarios & Test Suite Runner */}
          <TabsContent value="scenarios" className="focus-visible:outline-none">
            <ScenarioRunner
              engine={engine}
              scenarios={scenarios}
              onUpdateScenarios={setScenarios}
              onRunScenario={handleRunScenario}
              runningId={runningId}
            />
          </TabsContent>

          {/* TAB 2: Router Playground */}
          <TabsContent value="playground" className="focus-visible:outline-none">
            <RouterPlayground
              engine={engine}
              config={config}
              onUpdateConfig={(newCfg) => {
                setConfig(newCfg);
                engine.updateConfig(newCfg);
              }}
            />
          </TabsContent>

          {/* TAB 3: Real-time Telemetry Logs */}
          <TabsContent value="logs" className="focus-visible:outline-none">
            <ConsoleLogStreamer
              logs={logs}
              onClearLogs={handleClearLogs}
            />
          </TabsContent>

          {/* TAB 4: Architecture & API Docs */}
          <TabsContent value="docs" className="focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0d1424] border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">About SystemOne Harness</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Repository: github.com/HarnessRouter/SystemOneHarness
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong>SystemOneHarness</strong> is an enterprise evaluation, routing arbitration, and testing framework engineered for high-throughput AI systems, agent cascades, and multi-model router orchestration. It enables developers to benchmark latency, token cost, output invariant conformance, and fallback circuit breakers across heterogeneous model providers.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-xs space-y-1.5">
                      <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        Dynamic Route Arbitration
                      </div>
                      <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                        Scoring incoming prompts based on AST complexity, token bounds, and latency SLAs to route to Claude 3.5, GPT-4o, DeepSeek-V3, or local vLLM.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-xs space-y-1.5">
                      <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Circuit Breaker Fallback
                      </div>
                      <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                        Continuous node health monitoring. Automatically diverts traffic to secondary open-weight nodes upon 503 or latency spikes &gt; 600ms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Integration CLI Guide */}
                <div className="p-6 rounded-2xl bg-[#0d1424] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      Connecting Your Backend Service
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-400">
                      HTTP REST Specs
                    </Badge>
                  </div>

                  <div className="space-y-3 text-xs font-mono text-slate-300">
                    <p className="text-slate-400 font-sans">
                      To run your local or remote SystemOneHarness backend with this web console, run your server and configure the endpoint in <strong>Config</strong>:
                    </p>

                    <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 text-cyan-300 space-y-1">
                      <div className="text-slate-500"># 1. Clone SystemOneHarness repository</div>
                      <div>git clone https://github.com/HarnessRouter/SystemOneHarness.git</div>
                      <div className="text-slate-500 mt-2"># 2. Start the harness runner service</div>
                      <div>cd SystemOneHarness && python -m harness.server --port 8000</div>
                      <div className="text-slate-500 mt-2"># 3. Enter http://localhost:8000 into the Console Settings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Model Nodes */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Model Routing Nodes
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400">5 Live</span>
                  </div>

                  <div className="space-y-3">
                    {AVAILABLE_ROUTES.map((node) => (
                      <div key={node.id} className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 font-mono">{node.name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono border-cyan-900/60 text-cyan-300 bg-cyan-950/30">
                            {node.provider}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>Avg Latency: <span className="text-cyan-300">{node.latencyMsAvg}ms</span></span>
                          <span>Cost: <span className="text-slate-200">${node.costPer1kTokens}/1k</span></span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {node.capabilities.map((cap, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          engine.updateConfig(newConfig);
          toast.success('Configuration saved.');
        }}
        engine={engine}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SystemOne Harness Console • Built for HarnessRouter/SystemOneHarness</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Configure Endpoint
            </button>
            <span>•</span>
            <a 
              href="https://github.com/HarnessRouter/SystemOneHarness" 
              target="_blank" 
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        <div className="mt-3">
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
};

export default Index;
