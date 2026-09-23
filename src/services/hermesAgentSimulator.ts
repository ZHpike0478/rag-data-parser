import { 
  AgentMessage, 
  ToolCall, 
  HermesModelConfig, 
  EngineTelemetry, 
  HermesSkill 
} from '../types/hermes';

export const DEFAULT_MODELS: HermesModelConfig[] = [
  {
    id: 'zeus-3-8b',
    name: 'Zeus 3 (Llama 3.1 8B Instruct)',
    quantization: 'Q4_K_M (4.92 GB GGUF)',
    contextLength: 131072,
    gpuLayers: 33,
    threads: 8,
    backend: 'llama.cpp (C++)',
    temperature: 0.2,
    topP: 0.95,
  },
  {
    id: 'zeus-3-70b',
    name: 'Zeus 3 (Llama 3.1 70B Enterprise)',
    quantization: 'Q4_K_S (39.8 GB GGUF)',
    contextLength: 65536,
    gpuLayers: 80,
    threads: 16,
    backend: 'ggml-cuda (C++)',
    temperature: 0.15,
    topP: 0.9,
  },
  {
    id: 'zeus-2-pro-7b',
    name: 'Zeus 2 Pro (Mistral 7B)',
    quantization: 'Q5_K_M (5.13 GB GGUF)',
    contextLength: 32768,
    gpuLayers: 32,
    threads: 6,
    backend: 'ggml-metal (C++)',
    temperature: 0.3,
    topP: 0.95,
  },
];

export const DEFAULT_SKILLS: HermesSkill[] = [
  {
    id: 'skill-bash',
    name: 'execute_bash',
    description: 'Execute shell commands inside isolated Rust sandbox with hard timeout and output capture.',
    category: 'system',
    implementedIn: 'Rust',
    enabled: true,
    parameters: [
      { name: 'command', type: 'string', description: 'The bash or shell command to execute', required: true },
      { name: 'timeout_secs', type: 'number', description: 'Timeout SLA in seconds (default: 30)', required: false },
    ],
  },
  {
    id: 'skill-file',
    name: 'filesystem_ops',
    description: 'Safely read, write, patch, and inspect files within project workspace bounds.',
    category: 'code',
    implementedIn: 'Rust',
    enabled: true,
    parameters: [
      { name: 'action', type: 'string', description: 'read | write | patch | diff | list', required: true },
      { name: 'path', type: 'string', description: 'Target file path relative to workspace root', required: true },
      { name: 'content', type: 'string', description: 'Content payload for write or patch', required: false },
    ],
  },
  {
    id: 'skill-cxx',
    name: 'cxx_eval_kernel',
    description: 'Compile and evaluate C++20 snippets via Cling / GCC JIT directly into the native tensor runtime.',
    category: 'code',
    implementedIn: 'C++',
    enabled: true,
    parameters: [
      { name: 'code', type: 'string', description: 'C++20 source code or SIMD kernel to compile and execute', required: true },
      { name: 'flags', type: 'string', description: 'Compiler optimization flags (e.g. -O3 -mavx2)', required: false },
    ],
  },
  {
    id: 'skill-vector',
    name: 'vector_memory_search',
    description: 'Perform cosine similarity retrieval across Zeus long-term episodic memory SQLite database.',
    category: 'memory',
    implementedIn: 'Rust',
    enabled: true,
    parameters: [
      { name: 'query', type: 'string', description: 'Semantic search query string', required: true },
      { name: 'top_k', type: 'number', description: 'Number of nearest memory embeddings to return', required: false },
    ],
  },
  {
    id: 'skill-web',
    name: 'web_extract',
    description: 'Fetch, clean, and extract structured markdown content from any HTTP/HTTPS endpoint.',
    category: 'web',
    implementedIn: 'Rust',
    enabled: true,
    parameters: [
      { name: 'url', type: 'string', description: 'Target URL to fetch', required: true },
      { name: 'css_selector', type: 'string', description: 'Optional CSS query selector for scoped extraction', required: false },
    ],
  },
];

export const INITIAL_CONVERSATION: AgentMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Inspect the C++ inference engine memory safety bounds and verify CXX FFI latency.',
    timestamp: '10:42:15 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `I've inspected both the **C++ LlamaEngine** native layer and the **Rust CXX bridge**. 

### Diagnostic Findings:
1. **CXX FFI Call Overhead:** Measured at **0.018 milliseconds (18 microseconds)** per zero-copy token boundary.
2. **Memory Safety Bounds:** The C++ \`NativeLlamaEngine\` is encapsulated inside a Rust \`cxx::UniquePtr<NativeLlamaEngine>\`. Safe lifetime guarantees and thread safety are enforced by Rust's \`Send\` / \`Sync\` marker types.
3. **KV Cache Paging:** Context window allocated at 131k tokens with 256 MB buffer pinned in unified memory.

The system is operating at peak native performance.`,
    thought: `The user wants to verify the C++ inference engine memory safety bounds and CXX FFI overhead.
Step 1: Check C++ native inference engine stats via FFI bridge.
Step 2: Run a zero-copy microbenchmark using \`cxx_eval_kernel\` to measure token callback latency.
Step 3: Verify Rust Tokio thread pool isolation.`,
    toolCalls: [
      {
        id: 'tc-1',
        name: 'cxx_eval_kernel',
        arguments: {
          code: `#include <chrono>
#include "zeus/bridge.hpp"

auto start = std::chrono::high_resolution_clock::now();
auto engine = zeus::bridge::create_native_engine();
auto end = std::chrono::high_resolution_clock::now();
double latency_us = std::chrono::duration<double, std::micro>(end - start).count();
printf("Engine instantiation latency: %.3f us\\n", latency_us);`,
          flags: '-O3 -mavx2'
        },
        result: `[C++ Native JIT Output]
Engine instantiation latency: 18.420 us
Native memory allocated: 256 MB (KV Paging Buffer)
SIMD BPE Tokenizer initialized: AVX-512 target active.
Exit code: 0`,
        status: 'completed',
        executionTimeMs: 24,
        engine: 'cpp_native',
      },
      {
        id: 'tc-2',
        name: 'execute_bash',
        arguments: {
          command: 'cargo check --workspace --release && valgrind --version || echo "Native binary verified"',
          timeout_secs: 15,
        },
        result: `[Rust Sandbox Execution]
$ cargo check --workspace --release
    Checking zeus-desktop v0.2.0 (/workspace)
    Finished \`release\` profile [optimized] target(s) in 0.82s
Native binary verified. 0 warnings, 0 lifetime leaks.`,
        status: 'completed',
        executionTimeMs: 840,
        engine: 'rust_sandbox',
      }
    ],
    timestamp: '10:42:18 AM',
    tokens: 382,
    durationMs: 864,
    engineUsed: 'cpp_llama',
  }
];

export const PRESET_SCENARIOS = [
  {
    title: 'C++ SIMD Tokenizer Benchmark',
    prompt: 'Benchmark the C++ AVX2 SIMD tokenizer against scalar string parsing and report throughput.',
    badge: 'C++ / AVX-512',
  },
  {
    title: 'Rust Sandboxed Process Execution',
    prompt: 'Run an isolated Rust command to inspect network interfaces and workspace storage limits.',
    badge: 'Rust Tokio',
  },
  {
    title: 'Zeus Autonomous Function Calling',
    prompt: 'Search the local vector memory for recent C++ build flags and update the CMake configuration.',
    badge: 'Agent Loop',
  },
  {
    title: 'Patch C++ Memory Boundary Bug',
    prompt: 'Analyze a hypothetical buffer overflow in the KV cache ring-buffer and generate the C++20 patch.',
    badge: 'C++ Safety',
  },
];

export function generateTelemetry(): EngineTelemetry {
  const tps = +(34 + Math.sin(Date.now() / 3000) * 8).toFixed(1);
  const promptTps = +(145 + Math.cos(Date.now() / 4000) * 20).toFixed(1);
  const ffiUs = +(16 + Math.random() * 5).toFixed(2);
  const memoryMb = +(412 + Math.random() * 15).toFixed(1);

  return {
    rust: {
      tokioWorkers: 8,
      activeAsyncTasks: 14,
      sandboxedProcesses: 1,
      memoryMb: memoryMb,
      ipcThroughputMb: 84.5,
      status: 'healthy',
    },
    cpp: {
      inferenceSpeedTps: tps,
      promptEvalTps: promptTps,
      kvCacheUsagePercent: 28.4,
      gpuVramMb: 4320,
      activeKernels: 'AVX2 + Metal/MPS GEMM',
      ffiCallLatencyUs: ffiUs,
      status: 'ready',
    },
    totalTokensProcessed: 184520,
    totalToolCallsExecuted: 67,
  };
}

export function simulateHermesAgentResponse(
  userPrompt: string,
  model: HermesModelConfig
): AgentMessage {
  const lower = userPrompt.toLowerCase();
  
  if (lower.includes('simd') || lower.includes('benchmark')) {
    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: `### C++ SIMD Tokenizer Benchmark Results

I dispatched an isolated C++ AVX-512 vector kernel via the CXX FFI bridge to process a 100,000-token corpus.

| Metric | Scalar Implementation | C++ SIMD (AVX-512) | Speedup |
| :--- | :--- | :--- | :--- |
| **Tokenization Rate** | 1.84 MB/s | **42.10 MB/s** | **22.8x faster** |
| **BPE Lookup Latency** | 210 ns/token | **9.2 ns/token** | **95.6% reduction** |
| **FFI Bridge Overhead** | N/A | **0.017 ms** | Zero-copy slice |

The Rust async supervisor maintains an zero-copy slice of the input string across the FFI barrier without allocation.`,
      thought: `User requested a SIMD tokenizer benchmark.
Plan:
1. Dispatch native C++ microbenchmark via \`cxx_eval_kernel\`.
2. Measure vectorized Byte-Pair Encoding throughput across SIMD registers.
3. Formulate comparative benchmark report.`,
      toolCalls: [
        {
          id: 'tc-' + Date.now(),
          name: 'cxx_eval_kernel',
          arguments: {
            code: `// AVX-512 vectorized BPE token matching
#include <immintrin.h>
#include <vector>
#include <chrono>

void benchmark_simd_bpe() {
    // 512-bit vector register comparison
    __m512i mask = _mm512_set1_epi8(0x20); // space delimiter
    // Streaming batch execution...
}`,
            flags: '-O3 -mavx512f -march=native',
          },
          result: `[C++ SIMD Kernel Result]
Tokens processed: 100,000
Total execution time: 2.37 ms
Throughput: 42.10 MB/s (10.8M tokens/sec)
Memory bounds check: PASS (0 out-of-bound reads)`,
          status: 'completed',
          executionTimeMs: 38,
          engine: 'cpp_native',
        },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tokens: 410,
      durationMs: 910,
      engineUsed: 'cpp_llama',
    };
  }

  if (lower.includes('patch') || lower.includes('memory') || lower.includes('buffer')) {
    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: `### C++ KV Cache Ring-Buffer Analysis & Patch

I've audited \`src-cpp/kv_cache_manager.cpp\` using both static analysis and our Rust sandbox.

#### Vulnerability Discovered:
The previous index calculation lacked a modulo guard on wrap-around:
\`\`\`cpp
// Vulnerable:
cache_buffer_[head_pos_++] = new_token_embedding;
\`\`\`

#### Applied Patch:
\`\`\`cpp
// Patched with atomic ring-buffer bounds:
size_t current_idx = head_pos_.fetch_add(1, std::memory_order_acq_rel) % MAX_KV_SLOTS;
std::memcpy(&cache_buffer_[current_idx * EMBED_DIM], token_ptr, EMBED_DIM * sizeof(float));
\`\`\`

All test assertions passed with zero memory leaks verified under AddressSanitizer (ASan).`,
      thought: `The user requested analysis of a memory boundary bug.
1. Inspect \`src-cpp/kv_cache_manager.cpp\` via \`filesystem_ops\`.
2. Generate memory-safe ring-buffer patch with atomic fetch-and-modulo.
3. Validate through Rust sandbox command runner.`,
      toolCalls: [
        {
          id: 'tc-' + Date.now() + '1',
          name: 'filesystem_ops',
          arguments: {
            action: 'read',
            path: 'src-cpp/kv_cache_manager.cpp',
          },
          result: `[filesystem_ops] Loaded 148 lines from src-cpp/kv_cache_manager.cpp. Identified potential boundary overflow on line 78.`,
          status: 'completed',
          executionTimeMs: 12,
          engine: 'rust_sandbox',
        },
        {
          id: 'tc-' + Date.now() + '2',
          name: 'execute_bash',
          arguments: {
            command: 'g++ -fsanitize=address -std=c++20 -O2 src-cpp/kv_cache_manager.cpp -o test_kv && ./test_kv',
            timeout_secs: 20,
          },
          result: `[Rust Sandbox Execution]
ASAN: AddressSanitizer clean. All 10,000 concurrent ring-buffer insertions completed with 0 errors.`,
          status: 'completed',
          executionTimeMs: 620,
          engine: 'rust_sandbox',
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tokens: 380,
      durationMs: 780,
      engineUsed: 'cpp_llama',
    };
  }

  // Generic intelligent Zeus Agent response with tool call simulation
  return {
    id: 'msg-' + Date.now(),
    role: 'assistant',
    content: `I've processed your instruction: **"${userPrompt}"** through the Zeus dual-engine runtime.

### Execution Summary:
- **Rust Supervisor:** Spawned worker thread on Tokio runtime (PID 8192) with strict sandbox constraints.
- **C++ Inference Engine:** Generated structured agent actions using **${model.name}** at **${model.backend}**.
- **Action Performed:** The agent executed the requested operation and verified system state.

The environment is synchronized and ready for the next command.`,
    thought: `User prompted: "${userPrompt}".
1. Analyze user intention against active Zeus toolset.
2. Formulate tool call sequence.
3. Verify output integrity in Rust sandbox.`,
    toolCalls: [
      {
        id: 'tc-' + Date.now(),
        name: 'execute_bash',
        arguments: {
          command: `echo "Processing: ${userPrompt.replace(/"/g, '\\"')}" && date -u`,
          timeout_secs: 10,
        },
        result: `[Rust Sandbox Output]
Processing: ${userPrompt}
UTC Timestamp: ${new Date().toISOString()}
Process exited with code 0.`,
        status: 'completed',
        executionTimeMs: 140,
        engine: 'rust_sandbox',
      }
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    tokens: 295,
    durationMs: 640,
    engineUsed: 'cpp_llama',
  };
}
