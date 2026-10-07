import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  Sparkles, 
  FileCode, 
  Cpu, 
  Layers, 
  HelpCircle,
  ShieldAlert,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RagChunk } from '@/types/rag';
import { RetrievalSimulator } from '@/services/retrievalSimulator';
import { RagChunker } from '@/services/chunker';
import { toast } from 'sonner';

interface PromptAssemblyTabProps {
  chunks: RagChunk[];
}

export const PromptAssemblyTab: React.FC<PromptAssemblyTabProps> = ({
  chunks
}) => {
  const [userQuery, setUserQuery] = useState('What are the SLA service credit percentage tiers?');
  const [promptTemplateStyle, setPromptTemplateStyle] = useState<'claude_xml' | 'openai_standard' | 'json_context'>('claude_xml');
  const [systemInstruction, setSystemInstruction] = useState(
    'You are a precise, truthful enterprise AI assistant. Answer the user query strictly using the provided context chunks. If the answer cannot be deduced from the context, state that you do not have sufficient information.'
  );
  const [topK, setTopK] = useState(3);
  const [copied, setCopied] = useState(false);

  // Retrieve top chunks for current query
  const retrievedResults = useMemo(() => {
    if (!userQuery.trim() || chunks.length === 0) return [];
    return RetrievalSimulator.search(userQuery, chunks, topK);
  }, [userQuery, chunks, topK]);

  // Assemble full LLM Prompt based on selected style
  const assembledPrompt = useMemo(() => {
    const retrievedChunks = retrievedResults.map(r => r.chunk);

    if (promptTemplateStyle === 'claude_xml') {
      const xmlChunks = retrievedChunks
        .map(c => `  <document id="${c.id}" source="${c.documentName}" section="${c.sectionBreadcrumbs?.join(' > ') || 'General'}">\n${c.content}\n  </document>`)
        .join('\n\n');

      return `[SYSTEM INSTRUCTION]
${systemInstruction}

[DOCUMENTS CONTEXT]
<context>
${xmlChunks || '  <!-- No relevant chunks found -->'}
</context>

[USER QUESTION]
${userQuery}

[INSTRUCTIONS]
Provide a concise, direct answer citing the document ID or source where relevant.`;
    }

    if (promptTemplateStyle === 'openai_standard') {
      const contextBlocks = retrievedChunks
        .map((c, idx) => `[Source ${idx + 1}: ${c.documentName} | Chunk ID: ${c.id}]\n${c.content}`)
        .join('\n\n---\n\n');

      return `System:
${systemInstruction}

Relevant Context:
${contextBlocks || '(No context retrieved)'}

User:
${userQuery}`;
    }

    // json_context
    const jsonPayload = JSON.stringify(
      retrievedChunks.map(c => ({
        id: c.id,
        source: c.documentName,
        text: c.content
      })),
      null,
      2
    );

    return `System:
${systemInstruction}

Context Data (JSON):
${jsonPayload}

User Query:
${userQuery}`;
  }, [userQuery, retrievedResults, promptTemplateStyle, systemInstruction]);

  const estimatedPromptTokens = useMemo(() => {
    return RagChunker.estimateTokenCount(assembledPrompt);
  }, [assembledPrompt]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    toast.success('Complete RAG prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            RAG Prompt Assembly & Context Synthesizer
          </h3>
          <p className="text-xs text-slate-400">
            Preview how your retrieved chunks are dynamically injected into frontier LLM prompt templates (Claude 3.5, GPT-4o, Llama 3)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono border-emerald-800 text-emerald-300">
            ~{estimatedPromptTokens} prompt tokens
          </Badge>
          <Button
            size="sm"
            onClick={handleCopyPrompt}
            className="text-xs h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copy Assembled Prompt
          </Button>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Query Input */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">
            Test Query / User Question
          </label>
          <Input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Type query to retrieve chunks..."
            className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
          />
        </div>

        {/* Template Style Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">
            LLM Prompt Template Pattern
          </label>
          <select
            value={promptTemplateStyle}
            onChange={(e) => setPromptTemplateStyle(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 text-xs h-9 rounded-md px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="claude_xml">Anthropic Claude (&lt;context&gt; XML tags)</option>
            <option value="openai_standard">OpenAI GPT-4o Markdown format</option>
            <option value="json_context">Structured JSON Context payload</option>
          </select>
        </div>
      </div>

      {/* System Prompt Customization */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
          <span>System Directive / Grounding Instruction</span>
          <span className="text-[10px] text-slate-500 font-mono">Enforces truthful context citation</span>
        </label>
        <Input
          value={systemInstruction}
          onChange={(e) => setSystemInstruction(e.target.value)}
          className="bg-slate-950 border-slate-800 text-xs h-8 text-slate-300 font-sans"
        />
      </div>

      {/* Assembled Prompt Live Preview Box */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-semibold text-slate-300">
            Complete Prompt Injected to Model ({retrievedResults.length} chunks included)
          </span>
          <span className="font-mono text-cyan-400">
            Context budget: {((estimatedPromptTokens / 128000) * 100).toFixed(2)}% of 128k
          </span>
        </div>

        <pre className="bg-[#050811] border border-slate-800/90 rounded-xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto select-text shadow-inner">
          {assembledPrompt}
        </pre>
      </div>
    </div>
  );
};
