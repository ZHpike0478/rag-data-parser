import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle,
  RotateCw,
  Sparkles,
  FileCheck,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Scenario, ScenarioResult } from '@/types/harness';
import { HarnessEngine } from '@/services/harnessEngine';

interface ScenarioRunnerProps {
  engine: HarnessEngine;
  scenarios: Scenario[];
  onUpdateScenarios: (scenarios: Scenario[]) => void;
  onRunScenario: (scenario: Scenario) => Promise<void>;
  runningId: string | null;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  engine,
  scenarios,
  onUpdateScenarios,
  onRunScenario,
  runningId
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0]?.id || '');
  
  // Custom scenario creation dialog state
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Scenario['category']>('Reasoning & Logic');
  const [newDescription, setNewDescription] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newExpectedRoute, setNewExpectedRoute] = useState('Claude 3.5 Sonnet (v2)');
  const [newAssertionTarget, setNewAssertionTarget] = useState('');

  const categories = ['All', 'Agentic Tooling', 'Reasoning & Logic', 'Router Fallback', 'Guardrails', 'Latency Benchmark'];

  const filteredScenarios = scenarios.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase()) ||
                          s.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const newScen: Scenario = {
      id: `SCEN-${String(scenarios.length + 1).padStart(3, '0')}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom user-defined evaluation scenario for SystemOne Harness.',
      prompt: newPrompt.trim(),
      expectedRoute: newExpectedRoute,
      status: 'idle',
      assertions: [
        {
          id: 'a_' + Date.now(),
          type: 'contains',
          target: newAssertionTarget.trim() || 'success',
        },
        {
          id: 'a_lat_' + Date.now(),
          type: 'latency_under',
          target: '2500',
        }
      ]
    };

    onUpdateScenarios([newScen, ...scenarios]);
    setActiveScenarioId(newScen.id);
    setIsNewDialogOpen(false);
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewPrompt('');
    setNewAssertionTarget('');
  };

  const exportResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenarios, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `systemone_harness_results_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d1424] border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios by ID, title, keyword..."
              className="pl-9 bg-[#080d1a] border-slate-800 text-xs font-mono focus:border-cyan-500 rounded-xl h-9"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create custom scenario dialog */}
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs h-9 rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0c1222] border-slate-800 text-slate-100 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base text-cyan-300 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Define New Harness Scenario
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateScenario} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Scenario Title</label>
                  <Input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Distributed Lock Consensus Test"
                    className="bg-slate-900 border-slate-800 text-xs text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Scenario['category'])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500"
                    >
                      <option value="Agentic Tooling">Agentic Tooling</option>
                      <option value="Reasoning & Logic">Reasoning & Logic</option>
                      <option value="Router Fallback">Router Fallback</option>
                      <option value="Guardrails">Guardrails</option>
                      <option value="Latency Benchmark">Latency Benchmark</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Target Route</label>
                    <select
                      value={newExpectedRoute}
                      onChange={(e) => setNewExpectedRoute(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500"
                    >
                      <option value="Claude 3.5 Sonnet (v2)">Claude 3.5 Sonnet</option>
                      <option value="GPT-4o Omni (2024-11)">GPT-4o Omni</option>
                      <option value="DeepSeek-V3 MoE">DeepSeek-V3 MoE</option>
                      <option value="Llama 3.3 70B Instruct">Llama 3.3 70B</option>
                      <option value="Local vLLM / Qwen 2.5 Coder">Local vLLM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Input Prompt</label>
                  <textarea
                    required
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Input prompt to feed into the harness runner..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Assertion Requirement (Contains string in output)
                  </label>
                  <Input
                    value={newAssertionTarget}
                    onChange={(e) => setNewAssertionTarget(e.target.value)}
                    placeholder="e.g. algorithm, success, token"
                    className="bg-slate-900 border-slate-800 text-xs text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsNewDialogOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs">
                    Save Scenario
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={exportResults}
            className="border-slate-800 hover:border-slate-700 text-slate-300 text-xs h-9 rounded-xl"
            title="Export full benchmark results to JSON"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Split View: Scenario List on Left, Active Scenario Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-mono">
            <span>{filteredScenarios.length} Scenarios Loaded</span>
            <span>Pass Rate: {Math.round((scenarios.filter(s => s.status === 'passed').length / (scenarios.filter(s => s.status !== 'idle').length || 1)) * 100)}%</span>
          </div>

          {filteredScenarios.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            const isRunning = runningId === scenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => setActiveScenarioId(scenario.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500/60 glow-cyan-sm'
                    : 'bg-[#0c1322]/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{scenario.id}</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300 px-1.5 py-0">
                      {scenario.category}
                    </Badge>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    {isRunning ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
                        <RotateCw className="w-3 h-3 animate-spin" /> Running
                      </span>
                    ) : scenario.status === 'passed' ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                      </span>
                    ) : scenario.status === 'failed' ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400">
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">Idle</span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunScenario(scenario);
                      }}
                      disabled={isRunning}
                      className="h-7 w-7 p-0 rounded-lg hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300"
                      title="Run scenario"
                    >
                      <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : 'fill-cyan-400'}`} />
                    </Button>
                  </div>
                </div>

                <h4 className="font-semibold text-sm text-slate-200 mb-1 line-clamp-1">
                  {scenario.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {scenario.description}
                </p>

                {scenario.lastResult && (
                  <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {scenario.lastResult.durationMs}ms
                    </span>
                    <span>•</span>
                    <span className="text-cyan-300 truncate max-w-[140px]">
                      {scenario.lastResult.selectedRoute}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Scenario Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {activeScenario ? (
            <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800 shadow-xl space-y-5">
              {/* Scenario Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                      {activeScenario.id}
                    </span>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                      {activeScenario.category}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{activeScenario.title}</h3>
                </div>

                <Button
                  onClick={() => onRunScenario(activeScenario)}
                  disabled={runningId === activeScenario.id}
                  className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950 font-bold px-4 h-9 rounded-xl shadow glow-cyan-sm"
                >
                  <Play className={`w-3.5 h-3.5 mr-1.5 fill-slate-950 ${runningId === activeScenario.id ? 'animate-spin' : ''}`} />
                  {runningId === activeScenario.id ? 'Running Harness...' : 'Execute Test'}
                </Button>
              </div>

              {/* Scenario Prompt Box */}
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1.5">Scenario Ingress Prompt</span>
                <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                  {activeScenario.prompt}
                </div>
              </div>

              {/* Assertions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    Harness Assertion Rules ({activeScenario.assertions.length})
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Expected Route: <span className="text-cyan-300">{activeScenario.expectedRoute}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {activeScenario.assertions.map((rule) => {
                    return (
                      <div
                        key={rule.id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {rule.passed === true ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : rule.passed === false ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-400">?</span>
                          )}
                          <div className="font-mono">
                            <span className="text-slate-400 uppercase text-[10px] mr-2">[{rule.type}]</span>
                            <span className="text-slate-200 font-semibold">{rule.target}</span>
                          </div>
                        </div>

                        {rule.actual && (
                          <span className={`font-mono text-[11px] ${rule.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {rule.actual}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Last Run Results & Traces */}
              {activeScenario.lastResult ? (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      Execution Telemetry (Run {activeScenario.lastResult.runId})
                    </span>
                    <Badge 
                      className={`font-mono text-xs ${
                        activeScenario.lastResult.allPassed 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                          : 'bg-rose-950/80 text-rose-300 border-rose-800'
                      }`}
                    >
                      {activeScenario.lastResult.allPassed ? 'ALL ASSERTIONS PASSED' : 'ASSERTIONS FAILED'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                      <span className="text-cyan-300 font-bold">{activeScenario.lastResult.durationMs}ms</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Selected Route</span>
                      <span className="text-cyan-300 font-bold truncate block">{activeScenario.lastResult.selectedRoute}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Tokens</span>
                      <span className="text-slate-200 font-bold">{activeScenario.lastResult.tokens.total}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Cost</span>
                      <span className="text-slate-200 font-bold">${activeScenario.lastResult.estimatedCost}</span>
                    </div>
                  </div>

                  {/* Output summary */}
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">Harness Captured Output</span>
                    <div className="p-3 rounded-lg bg-[#080d1a] border border-slate-800/80 text-xs font-mono text-slate-200 max-h-40 overflow-y-auto">
                      {activeScenario.lastResult.responseText}
                    </div>
                  </div>

                  {/* Traces */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 block">Execution Lifecycle Trace</span>
                    <div className="space-y-1.5 font-mono text-xs">
                      {activeScenario.lastResult.traces.map((trace) => (
                        <div key={trace.step} className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800/60 text-[11px]">
                          <span className="text-cyan-300 font-semibold">{trace.event}</span>
                          <span className="text-slate-400 truncate max-w-[280px] sm:max-w-md mx-2">{trace.detail}</span>
                          <span className="text-slate-500 shrink-0">{trace.durationMs}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                  <Info className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400 font-mono">
                    This scenario has not been executed yet. Click "Execute Test" to run the harness assertion suite.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
