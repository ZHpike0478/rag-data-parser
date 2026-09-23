export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executionTimeMs?: number;
  engine: 'rust_sandbox' | 'cpp_native' | 'system_ffi';
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  toolCalls?: ToolCall[];
  timestamp: string;
  tokens?: number;
  durationMs?: number;
  engineUsed?: 'cpp_llama' | 'rust_core';
}

export interface HermesModelConfig {
  id: string;
  name: string;
  quantization: string;
  contextLength: number;
  gpuLayers: number;
  threads: number;
  backend: 'llama.cpp (C++)' | 'ggml-cuda (C++)' | 'ggml-metal (C++)' | 'tokio-simd (Rust)';
  temperature: number;
  topP: number;
}

export interface EngineTelemetry {
  rust: {
    tokioWorkers: number;
    activeAsyncTasks: number;
    sandboxedProcesses: number;
    memoryMb: number;
    ipcThroughputMb: number;
    status: 'healthy' | 'busy' | 'idle';
  };
  cpp: {
    inferenceSpeedTps: number;
    promptEvalTps: number;
    kvCacheUsagePercent: number;
    gpuVramMb: number;
    activeKernels: string;
    ffiCallLatencyUs: number;
    status: 'ready' | 'evaluating' | 'generating';
  };
  totalTokensProcessed: number;
  totalToolCallsExecuted: number;
}

export interface HermesSkill {
  id: string;
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  category: 'system' | 'code' | 'web' | 'memory';
  implementedIn: 'Rust' | 'C++';
  enabled: boolean;
}

export interface ProjectFile {
  path: string;
  filename: string;
  language: 'rust' | 'cpp' | 'cmake' | 'toml' | 'bash' | 'markdown' | 'json';
  content: string;
  description: string;
}
