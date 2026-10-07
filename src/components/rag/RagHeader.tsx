import React from 'react';
import { 
  Database, 
  Sparkles, 
  Download, 
  Trash2, 
  Layers, 
  FileText, 
  Hash, 
  Coins,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RagDocument, RagChunk } from '@/types/rag';

interface RagHeaderProps {
  documents: RagDocument[];
  chunks: RagChunk[];
  onOpenExport: () => void;
  onClearAll: () => void;
}

export const RagHeader: React.FC<RagHeaderProps> = ({
  documents,
  chunks,
  onOpenExport,
  onClearAll
}) => {
  const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);
  const avgChunkTokens = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;
  // Estimate embedding cost for OpenAI text-embedding-3-small ($0.02 per 1M tokens)
  const estCost = ((totalTokens / 1_000_000) * 0.02).toFixed(5);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Database className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              RAG Data Prep Studio
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
              Vector Ready v2.5
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Convert PDFs, Docs, Markdown, CSV & Code into clean, contextual, vector-indexed chunks
          </p>
        </div>
      </div>

      {/* Real-time stats bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Docs:</span>
          <span className="font-semibold text-slate-100">{documents.length}</span>
          <span className="text-slate-700">|</span>
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Chunks:</span>
          <span className="font-semibold text-slate-100">{chunks.length}</span>
          <span className="text-slate-700">|</span>
          <Hash className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Tokens:</span>
          <span className="font-semibold text-emerald-300 font-mono">{totalTokens.toLocaleString()}</span>
          {chunks.length > 0 && (
            <>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">Avg:</span>
              <span className="font-mono text-cyan-300 hidden sm:inline">{avgChunkTokens} tok</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-xs h-8 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}

          <Button
            size="sm"
            onClick={onOpenExport}
            disabled={chunks.length === 0}
            className="text-xs h-8 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Vector Data ({chunks.length})
          </Button>
        </div>
      </div>
    </header>
  );
};
