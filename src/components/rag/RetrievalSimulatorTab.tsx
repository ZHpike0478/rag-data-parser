import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Cpu,
  CheckCircle,
  Zap,
  Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RetrievalSimulator } from '@/services/retrievalSimulator';
import { RagChunk, RetrievalResult } from '@/types/rag';

interface RetrievalSimulatorTabProps {
  chunks: RagChunk[];
}

const SAMPLE_QUERIES = [
  'What is the guaranteed monthly uptime percentage SLA?',
  'How do I authenticate API calls with Bearer token?',
  'How to reset Apex wireless headphones with flashing purple LED?',
  'What is the rate limit and 429 Retry-After response?',
  'Why does contextual prefix injection improve retrieval recall?'
];

export const RetrievalSimulatorTab: React.FC<RetrievalSimulatorTabProps> = ({
  chunks
}) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);

  // Compute retrieval results in real-time
  const searchResults: RetrievalResult[] = useMemo(() => {
    if (!query.trim() || chunks.length === 0) return [];
    return RetrievalSimulator.search(query, chunks, topK);
  }, [query, chunks, topK]);

  // Total tokens that will be injected into LLM context window
  const retrievedTokens = searchResults.reduce((acc, r) => acc + r.chunk.tokenCount, 0);

  return (
    <div className="space-y-6">
      {/* Sandbox Header Box */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            RAG Vector Retrieval Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Test real vector & BM25 hybrid semantic search against your generated chunks. Verify whether your chunk size and overlap boundaries retrieve the exact passages needed to answer user questions.
        </p>

        {/* Search Query Input */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question or enter query keywords to test retrieval..."
              className="pl-10 pr-4 bg-slate-950 border-cyan-800/50 focus:border-cyan-400 text-sm h-11 text-slate-100 rounded-xl font-medium shadow-inner"
            />
          </div>

          {/* Quick query chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Try sample query:
            </span>
            {SAMPLE_QUERIES.map((sampleQuery, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(sampleQuery)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700/50 text-slate-300 hover:text-cyan-200 transition-colors text-left truncate max-w-[280px]"
              >
                {sampleQuery}
              </button>
            ))}
          </div>

          {/* Top-K Slider */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Top-K retrieved chunks:</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                K = {topK}
              </span>
              <div className="w-32">
                <Slider
                  value={[topK]}
                  min={1}
                  max={8}
                  step={1}
                  onValueChange={([val]) => setTopK(val)}
                />
              </div>
            </div>

            {/* Context window stats */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Context Load:</span>
                <span className="text-emerald-400 font-bold">{retrievedTokens} tokens</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">~{((retrievedTokens / 128000) * 100).toFixed(2)}% of 128k</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retrieval Results List */}
      <div>
        {!query.trim() ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">Enter a query above to test chunk retrieval</p>
            <p className="text-xs text-slate-500 mt-1">See which chunks rank highest and test context accuracy</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            <Zap className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No chunks matched your query</p>
            <p className="text-xs text-slate-500 mt-1">Try broader terms or verify that your documents have been chunked</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Found <span className="font-semibold text-cyan-300">{searchResults.length}</span> top matching candidates
              </span>
              <span className="text-slate-500">Sorted by hybrid relevance score</span>
            </div>

            {searchResults.map((result) => {
              const scorePct = Math.round(result.score * 100);

              return (
                <div
                  key={result.chunk.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-4 transition-all shadow-md"
                >
                  {/* Result Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-mono text-xs px-2">
                        Rank #{result.rank}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-200">
                        {result.chunk.documentName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({result.chunk.id})
                      </span>
                    </div>

                    {/* Similarity Score Indicator */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                        <span className="text-[11px] text-slate-400">Score:</span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {(result.score).toFixed(3)}
                        </span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border-emerald-800/40">
                        {result.chunk.tokenCount} tokens
                      </Badge>
                    </div>
                  </div>

                  {/* Explanation of match */}
                  <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{result.explanation}</span>
                  </div>

                  {/* Contextual Prefix Pill if present */}
                  {result.chunk.contextualPrefix && (
                    <div className="mb-2 text-[11px] font-mono bg-cyan-950/40 border border-cyan-800/30 text-cyan-300 px-2.5 py-1 rounded-md">
                      {result.chunk.contextualPrefix}
                    </div>
                  )}

                  {/* Full Chunk Content */}
                  <div className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-900 max-h-40 overflow-y-auto whitespace-pre-wrap select-text">
                    {result.chunk.originalSlice}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
