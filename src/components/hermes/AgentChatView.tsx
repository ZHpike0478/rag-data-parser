import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  Shield, 
  Cpu, 
  Play, 
  RotateCcw,
  Zap,
  Code2,
  FolderTree,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentMessage, ToolCall, HermesModelConfig } from '@/types/hermes';
import { PRESET_SCENARIOS } from '@/services/hermesAgentSimulator';
import { toast } from 'sonner';

interface AgentChatViewProps {
  messages: AgentMessage[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onClearChat: () => void;
  currentModel: HermesModelConfig;
}

export const AgentChatView: React.FC<AgentChatViewProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  onClearChat,
  currentModel,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({
    'msg-2': true, // default open the initial sample
  });
  const [expandedToolOutputs, setExpandedToolOutputs] = useState<Record<string, boolean>>({
    'tc-1': true,
    'tc-2': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleToolOutput = (toolId: string) => {
    setExpandedToolOutputs(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 relative">
      {/* Top Banner / Context Bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-slate-300 font-medium">Hermes Agent Session</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-cyan-400/90">{currentModel.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400/90 font-mono">Tokio Sandboxed PID #8192</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearChat}
            className="h-6 px-2 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Session
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="max-w-4xl mx-auto space-y-3">
            {/* User message */}
            {msg.role === 'user' && (
              <div className="flex items-start justify-end gap-3">
                <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-slate-100 max-w-[85%] shadow-lg shadow-cyan-950/20">
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div className="mt-1 flex items-center justify-end text-[10px] text-cyan-300/70 font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            )}

            {/* Assistant message */}
            {msg.role === 'assistant' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                  <Terminal className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </div>

                <div className="flex-1 space-y-3 max-w-[90%]">
                  {/* Thought / Scratchpad Accordion */}
                  {msg.thought && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
                      <button
                        onClick={() => toggleThought(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="font-semibold text-slate-300">Hermes Scratchpad & Reasoning</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            &lt;scratchpad&gt;
                          </span>
                        </div>
                        {expandedThoughts[msg.id] ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedThoughts[msg.id] && (
                        <div className="px-3 py-2.5 border-t border-slate-800/60 bg-slate-950/50 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed border-l-2 border-l-amber-500/70">
                          {msg.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool Calls Execution Chain */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      {msg.toolCalls.map((tool) => (
                        <div
                          key={tool.id}
                          className="rounded-xl border border-slate-800/90 bg-slate-900/80 overflow-hidden text-xs shadow-md"
                        >
                          <div className="px-3 py-2 flex items-center justify-between bg-slate-950/80 border-b border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="font-mono font-bold text-cyan-400">
                                {tool.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 px-1.5 font-mono ${
                                  tool.engine === 'rust_sandbox'
                                    ? 'bg-orange-950/40 text-orange-400 border-orange-800/50'
                                    : 'bg-blue-950/40 text-blue-300 border-blue-800/50'
                                }`}
                              >
                                {tool.engine === 'rust_sandbox' ? 'Rust Sandbox' : 'C++ Native FFI'}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                              {tool.executionTimeMs && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {tool.executionTimeMs}ms
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleToolOutput(tool.id)}
                                className="h-6 px-1.5 text-slate-400 hover:text-slate-200"
                              >
                                {expandedToolOutputs[tool.id] ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Arguments JSON */}
                          <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/40 font-mono text-[11px] text-slate-300 overflow-x-auto">
                            <span className="text-slate-500 select-none mr-2">Args:</span>
                            <code>{JSON.stringify(tool.arguments, null, 2)}</code>
                          </div>

                          {/* Output Terminal */}
                          {expandedToolOutputs[tool.id] && tool.result && (
                            <div className="p-3 bg-black/90 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap leading-tight max-h-56 overflow-y-auto border-t border-slate-800/40">
                              <div className="text-[10px] text-slate-500 select-none mb-1 font-sans flex items-center gap-1">
                                <Terminal className="w-3 h-3" /> Tool Output Stream:
                              </div>
                              {tool.result}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Assistant Answer Body */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 space-y-3 shadow-lg relative group">
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-2 leading-relaxed">
                      {msg.content.split('\n\n').map((paragraph, i) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h3 key={i} className="text-base font-bold text-cyan-300 mt-2 mb-1 flex items-center gap-2">
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('#### ')) {
                          return (
                            <h4 key={i} className="text-sm font-semibold text-slate-200 mt-2 mb-1">
                              {paragraph.replace('#### ', '')}
                            </h4>
                          );
                        }
                        if (paragraph.startsWith('```')) {
                          const lines = paragraph.split('\n');
                          const lang = lines[0].replace('```', '');
                          const code = lines.slice(1, -1).join('\n');
                          return (
                            <div key={i} className="my-2 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                              <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>{lang || 'code'}</span>
                                <button
                                  onClick={() => handleCopy(code, `code-${i}`)}
                                  className="hover:text-slate-200 flex items-center gap-1"
                                >
                                  {copiedId === `code-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === `code-${i}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <pre className="p-3 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                                <code>{code}</code>
                              </pre>
                            </div>
                          );
                        }
                        return <p key={i} className="leading-relaxed whitespace-pre-wrap">{paragraph}</p>;
                      })}
                    </div>

                    {/* Metadata footer */}
                    <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        {msg.engineUsed && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Cpu className="w-3 h-3" /> C++ Native Core
                          </span>
                        )}
                        {msg.tokens && (
                          <span>• {msg.tokens} tokens</span>
                        )}
                        {msg.durationMs && (
                          <span>• {(msg.durationMs / 1000).toFixed(2)}s</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-200 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shrink-0 animate-pulse">
              <Terminal className="w-4 h-4 text-slate-950" />
            </div>
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Hermes C++ inference streaming & Tokio sandbox evaluating...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Scenario Quick-Chips */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Quick Tests:
        </span>
        {PRESET_SCENARIOS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(s.prompt)}
            disabled={isGenerating}
            className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all flex items-center gap-1.5"
          >
            <span>{s.title}</span>
            <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300">{s.badge}</span>
          </button>
        ))}
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex flex-col gap-2">
          <div className="relative rounded-xl border border-slate-800 focus-within:border-cyan-500/70 bg-slate-900/90 shadow-inner transition-colors">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Hermes to inspect system performance, run sandboxed C++ kernels, or refactor code..."
              className="w-full bg-transparent border-none text-slate-100 text-sm focus-visible:ring-0 resize-none min-h-[64px] max-h-[140px] pr-20 py-3"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                disabled={!inputText.trim() || isGenerating}
                className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-3 text-xs gap-1.5 transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Dispatch</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> Sandbox Isolation: Active
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" /> CXX Zero-Copy FFI: Enabled
              </span>
            </div>
            <span>Press Enter to send, Shift+Enter for newline</span>
          </div>
        </form>
      </div>
    </div>
  );
};
