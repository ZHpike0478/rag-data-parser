import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  Copy, 
  Check, 
  ExternalLink, 
  Tag, 
  Hash, 
  FileText, 
  ArrowRight, 
  SlidersHorizontal,
  Eye,
  Code2,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { RagChunk, RagDocument } from '@/types/rag';
import { toast } from 'sonner';

interface ChunkVisualizerProps {
  chunks: RagChunk[];
  documents: RagDocument[];
  activeDocumentId: string | 'all';
  onSelectDocumentFilter: (docId: string | 'all') => void;
}

export const ChunkVisualizer: React.FC<ChunkVisualizerProps> = ({
  chunks,
  documents,
  activeDocumentId,
  onSelectDocumentFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedChunk, setInspectedChunk] = useState<RagChunk | null>(null);
  const [showOverlapHighlights, setShowOverlapHighlights] = useState(true);

  // Filter chunks by document and search query
  const filteredChunks = useMemo(() => {
    return chunks.filter(c => {
      const matchesDoc = activeDocumentId === 'all' || c.documentId === activeDocumentId;
      const matchesSearch = !searchQuery.trim() || 
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.documentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDoc && matchesSearch;
    });
  }, [chunks, activeDocumentId, searchQuery]);

  const handleCopyChunk = (chunk: RagChunk) => {
    navigator.clipboard.writeText(chunk.content);
    setCopiedId(chunk.id);
    toast.success(`Copied chunk ${chunk.id} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chunks by keywords, phrases, or doc name..."
            className="pl-9 bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Document filter dropdown */}
          <select
            value={activeDocumentId}
            onChange={(e) => onSelectDocumentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs h-9 rounded-md px-2.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[200px] truncate"
          >
            <option value="all">All Documents ({documents.length})</option>
            {documents.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Toggle Overlap Highlighter */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowOverlapHighlights(!showOverlapHighlights)}
            className={`text-xs h-9 border-slate-800 ${
              showOverlapHighlights ? 'text-indigo-300 bg-indigo-950/30 border-indigo-700/40' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            Overlaps: {showOverlapHighlights ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <span className="font-semibold text-cyan-300">{filteredChunks.length}</span> of {chunks.length} chunks
        </span>
        <span className="text-[11px] text-slate-500">
          Click any chunk card to inspect vector payload & metadata
        </span>
      </div>

      {/* Chunks Stream List */}
      {filteredChunks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No chunks match your current filter</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing the search query or adjusting document selection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredChunks.map((chunk, idx) => {
            const isCopied = copiedId === chunk.id;

            return (
              <div
                key={chunk.id}
                onClick={() => setInspectedChunk(chunk)}
                className="group bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-950/30 cursor-pointer relative"
              >
                {/* Chunk Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono bg-cyan-950/50 border-cyan-800/40 text-cyan-300">
                      Chunk #{chunk.index} / {chunk.totalChunks}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
                      {chunk.documentName}
                    </span>
                    {chunk.pageNumber && (
                      <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                        Page {chunk.pageNumber}
                      </Badge>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">
                      Lines {chunk.startLine}–{chunk.endLine}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                      {chunk.tokenCount} tokens
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {chunk.charCount} chars
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyChunk(chunk);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-1"
                      title="Copy chunk text"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Section Breadcrumb if available */}
                {chunk.sectionBreadcrumbs && chunk.sectionBreadcrumbs.length > 0 && (
                  <div className="text-[11px] text-cyan-400/90 font-medium mb-2 flex items-center gap-1">
                    <span className="text-slate-500">Section:</span>
                    <span>{chunk.sectionBreadcrumbs.join(' → ')}</span>
                  </div>
                )}

                {/* Contextual Prefix Pill (Anthropic style) */}
                {chunk.contextualPrefix && (
                  <div className="mb-2 text-[11px] font-mono bg-cyan-950/30 border border-cyan-800/30 text-cyan-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{chunk.contextualPrefix}</span>
                  </div>
                )}

                {/* Chunk Body Content */}
                <div className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-900 max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                  {showOverlapHighlights && chunk.overlapWithPrev ? (
                    <>
                      <span 
                        className="bg-indigo-950/80 text-indigo-200 border-b border-indigo-500/60 px-0.5 rounded"
                        title="Overlap carried from previous chunk"
                      >
                        {chunk.overlapWithPrev}
                      </span>
                      {chunk.originalSlice.slice(chunk.overlapWithPrev.length)}
                    </>
                  ) : (
                    chunk.originalSlice
                  )}
                </div>

                {/* Footer: Keywords tags & Overlap Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {chunk.keywords.map(kw => (
                      <span
                        key={kw}
                        className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded font-mono"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {chunk.overlapWithPrev && (
                    <span className="text-[10px] text-indigo-400/90 font-mono">
                      ↔ {chunk.overlapWithPrev.length} chars overlap
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chunk Inspection Dialog */}
      {inspectedChunk && (
        <Dialog open={!!inspectedChunk} onOpenChange={() => setInspectedChunk(null)}>
          <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 text-slate-100 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Chunk Inspector: {inspectedChunk.id}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-mono border-cyan-800 text-cyan-300">
                  {inspectedChunk.tokenCount} tokens
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-400">
                Detailed RAG metadata payload ready for vector indexing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Ready to embed full content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">
                    Vector Embedding Payload (Full Text)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyChunk(inspectedChunk)}
                    className="text-xs h-7 border-slate-800 text-slate-300"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Payload
                  </Button>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {inspectedChunk.content}
                </div>
              </div>

              {/* Metadata JSON */}
              <div>
                <span className="text-xs font-semibold text-slate-200 block mb-1.5">
                  Structured Metadata (JSON)
                </span>
                <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
                  {JSON.stringify(inspectedChunk.metadata, null, 2)}
                </pre>
              </div>

              {/* Character boundary metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Char Range</span>
                  <span className="font-mono text-slate-200">{inspectedChunk.startChar} - {inspectedChunk.endChar}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Line Range</span>
                  <span className="font-mono text-slate-200">{inspectedChunk.startLine} - {inspectedChunk.endLine}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Source Page</span>
                  <span className="font-mono text-slate-200">{inspectedChunk.pageNumber || 'N/A'}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Est. Cost ($0.02/1M)</span>
                  <span className="font-mono text-emerald-400">
                    ${((inspectedChunk.tokenCount / 1_000_000) * 0.02).toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
