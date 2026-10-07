import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Hash, 
  Sparkles,
  ArrowRightLeft,
  FileSpreadsheet,
  FileCode,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RagDocument } from '@/types/rag';

interface DocumentViewerProps {
  documents: RagDocument[];
  activeDocumentId: string;
  onSelectDocument: (docId: string) => void;
  onRemoveDocument: (docId: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onRemoveDocument
}) => {
  const [viewMode, setViewMode] = useState<'cleaned' | 'raw' | 'diff'>('cleaned');

  const activeDoc = documents.find(d => d.id === activeDocumentId) || documents[0];

  if (!activeDoc) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No documents ingested yet</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Document Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {documents.map(doc => {
          const isSelected = doc.id === activeDoc.id;
          return (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="max-w-[150px] truncate">{doc.name}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-mono bg-slate-800">
                {doc.extension}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Document Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate max-w-md">
              {activeDoc.name}
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase font-mono text-cyan-300 border-cyan-800/50">
              {activeDoc.type}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
            <span>Size: {formatBytes(activeDoc.size)}</span>
            <span>•</span>
            <span>Words: {activeDoc.metadata.wordCount || 0}</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-medium">
              ~{activeDoc.metadata.estimatedTokens || 0} tokens
            </span>
            {activeDoc.pages && (
              <>
                <span>•</span>
                <span className="text-cyan-400 font-medium">{activeDoc.pages.length} Pages</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('cleaned')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'cleaned' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cleaned RAG
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'raw' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Extracted
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemoveDocument(activeDoc.id)}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 h-8 px-2"
            title="Remove document"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content text pane */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 max-h-[460px] overflow-y-auto">
        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-normal">
          {viewMode === 'cleaned' ? activeDoc.cleanedContent : activeDoc.rawContent}
        </pre>
      </div>
    </div>
  );
};
