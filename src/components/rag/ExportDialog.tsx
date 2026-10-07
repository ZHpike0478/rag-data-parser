import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileArchive,
  Database,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RagExporter } from '@/services/exporter';
import { RagChunk, VectorStoreTarget } from '@/types/rag';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunks: RagChunk[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  chunks
}) => {
  const [selectedFormat, setSelectedFormat] = useState<VectorStoreTarget>('jsonl');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const formattedOutput = RagExporter.formatChunks(chunks, selectedFormat);
  const codeSnippet = RagExporter.generateCodeSnippet(selectedFormat, `rag_dataset.${selectedFormat === 'csv' ? 'csv' : 'jsonl'}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    toast.success('Formatted data copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    toast.success('Ingestion script copied to clipboard');
  };

  const handleDownloadSingle = () => {
    let filename = `rag_dataset.${selectedFormat}`;
    let mimeType = 'application/json';

    if (selectedFormat === 'jsonl') {
      filename = 'rag_dataset.jsonl';
      mimeType = 'application/x-jsonlines';
    } else if (selectedFormat === 'csv') {
      filename = 'rag_dataset.csv';
      mimeType = 'text/csv';
    } else if (selectedFormat === 'supabase') {
      filename = 'supabase_pgvector_seed.sql';
      mimeType = 'text/plain';
    }

    RagExporter.downloadFile(formattedOutput, filename, mimeType);
    toast.success(`Downloaded ${filename}!`);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await RagExporter.downloadZipBundle(chunks);
      toast.success('Downloaded complete RAG Vector bundle (.zip)!');
    } catch (err: any) {
      toast.error('Failed to create ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <DialogTitle className="text-lg font-bold text-white">
                Export Vector Ready Dataset
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Export {chunks.length} processed chunks with metadata into standard vector database formats or client ingestion pipelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Target Format Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setSelectedFormat('jsonl')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'jsonl' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSONL (Standard)
            </button>
            <button
              onClick={() => setSelectedFormat('json')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'json' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON Array
            </button>
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'csv' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CSV Table
            </button>
            <button
              onClick={() => setSelectedFormat('pinecone')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'pinecone' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pinecone
            </button>
            <button
              onClick={() => setSelectedFormat('chroma')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'chroma' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ChromaDB
            </button>
            <button
              onClick={() => setSelectedFormat('supabase')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'supabase' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Supabase pgvector
            </button>
            <button
              onClick={() => setSelectedFormat('langchain')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'langchain' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LangChain Python
            </button>
            <button
              onClick={() => setSelectedFormat('llamaindex')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedFormat === 'llamaindex' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LlamaIndex Python
            </button>
          </div>

          <Tabs defaultValue="payload" className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg h-8">
                <TabsTrigger value="payload" className="text-xs px-2.5 h-7">
                  Data Payload Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-2.5 h-7">
                  Ingestion Code Snippet
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-xs h-8 border-slate-800 text-slate-300 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Data
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadSingle}
                  className="text-xs h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download File
                </Button>
              </div>
            </div>

            {/* Tab 1: Formatted Data Preview */}
            <TabsContent value="payload" className="mt-0">
              <pre className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs font-mono text-cyan-200/90 overflow-x-auto max-h-[380px] whitespace-pre select-text">
                {formattedOutput.slice(0, 50000)}
                {formattedOutput.length > 50000 && '\n\n... [truncated preview for browser performance]'}
              </pre>
            </TabsContent>

            {/* Tab 2: Python / TypeScript Ingestion snippet */}
            <TabsContent value="code" className="mt-0">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCode}
                    className="text-xs h-7 border-slate-800 text-slate-300"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Code Snippet
                  </Button>
                </div>
                <pre className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[360px] whitespace-pre select-text">
                  {codeSnippet}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready for OpenAI embeddings, Claude Contextual Search, and vector databases.</span>
          </div>

          <Button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs h-9 shadow-md shadow-indigo-500/20"
          >
            <FileArchive className="w-4 h-4 mr-1.5" />
            {isZipping ? 'Packaging ZIP Archive...' : 'Download Complete Bundle (.ZIP)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
