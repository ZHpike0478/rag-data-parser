export type RoutingStrategy = 
  | 'latency_first' 
  | 'cost_optimized' 
  | 'accuracy_cascade' 
  | 'failover_redundancy';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'ROUTE' | 'TRACE';

export interface ModelRoute {
  id: string;
  name: string;
  provider: 'Anthropic' | 'OpenAI' | 'DeepSeek' | 'Meta' | 'Local / vLLM';
  latencyMsAvg: number;
  costPer1kTokens: number;
  qualityScore: number; // 0 - 100
  status: 'online' | 'degraded' | 'offline';
  capabilities: string[];
}

export interface HarnessConfig {
  backendMode: 'mock' | 'custom';
  backendUrl: string;
  apiKey: string;
  timeoutMs: number;
  defaultStrategy: RoutingStrategy;
  temperature: number;
  maxTokens: number;
  failoverEnabled: boolean;
}

export interface AssertionRule {
  id: string;
  type: 'contains' | 'latency_under' | 'cost_under' | 'json_schema' | 'tool_invoked';
  target: string;
  passed?: boolean;
  actual?: string;
  details?: string;
}

export interface ExecutionTrace {
  step: number;
  timestamp: string;
  event: string;
  durationMs: number;
  status: 'ok' | 'fallback' | 'retry' | 'warn';
  detail: string;
}

export interface ScenarioResult {
  scenarioId: string;
  runId: string;
  timestamp: string;
  durationMs: number;
  selectedRoute: string;
  routeConfidence: number;
  routerDecisionReason: string;
  fallbackTriggered: boolean;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCost: number;
  responseText: string;
  traces: ExecutionTrace[];
  assertions: AssertionRule[];
  allPassed: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  category: 'Agentic Tooling' | 'Reasoning & Logic' | 'Router Fallback' | 'Context Window' | 'Guardrails' | 'Latency Benchmark';
  description: string;
  prompt: string;
  systemPrompt?: string;
  expectedRoute?: string;
  maxLatencyMs?: number;
  assertions: AssertionRule[];
  status: 'idle' | 'running' | 'passed' | 'failed';
  lastResult?: ScenarioResult;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface HarnessTelemetry {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  avgLatencyMs: number;
  totalTokens: number;
  costSavingsPct: number;
  activeEndpoints: number;
  routeDistribution: { route: string; count: number; percentage: number; color: string }[];
}
