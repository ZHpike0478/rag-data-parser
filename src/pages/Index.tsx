import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Database, 
  Layers, 
  Sliders, 
  Target, 
  FileText, 
  Sparkles, 
  Download, 
  RefreshCw,
  Plus,
  Zap,
  Info
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RagHeader } from '@/components/rag/RagHeader';
import { FileUploadZone } from '@/components/rag/FileUploadZone';
import { ChunkingControls } from '@/components/rag/ChunkingControls';
import { ChunkVisualizer } from '@/components/rag/ChunkVisualizer';
import { DocumentViewer } from '@/components/rag/DocumentViewer';
import { RetrievalSimulatorTab } from '@/components/rag/RetrievalSimulatorTab';
import { ExportDialog } from '@/components/rag/ExportDialog';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { 
  RagDocument, 
  RagChunk, 
  ChunkingConfig, 
  PreprocessingConfig 
} from '@/types/rag';
import { RagPreprocessor, DEFAULT_PREPROCESSING_CONFIG } from '@/services/preprocessor';
import { RagChunker, DEFAULT_CHUNKING_CONFIG } from '@/services/chunker';
import { SAMPLE_DOCUMENTS } from '@/services/sampleDocuments';
import { toast } from 'sonner';

const Index: React.FC = () => {
  // Config state
  const [chunkConfig, setChunkConfig] = useState<ChunkingConfig>(DEFAULT_CHUNKING_CONFIG);
  const [prepConfig, setPrepConfig] = useState<PreprocessingConfig>(DEFAULT_PREPROCESSING_CONFIG);

  // Documents state - initialize with default sample API guide
  const [documents, setDocuments] = useState<RagDocument[]>(() => {
    const defaultSample = SAMPLE_DOCUMENTS[0]; // Developer API spec
    const cleaned = RagPreprocessor.cleanText(defaultSample.rawContent, DEFAULT_PREPROCESSING_CONFIG);
    return [{
      id: 'doc_default_sample',
      name: defaultSample.name,
      type: defaultSample.type,
      extension: defaultSample.extension,
      size: new Blob([defaultSample.rawContent]).size,
      rawContent: defaultSample.rawContent,
      cleanedContent: cleaned,
      metadata: {
        isSample: true,
        description: defaultSample.description,
        charCount: defaultSample.rawContent.length,
        wordCount: defaultSample.rawContent.split(/\s+/).filter(Boolean).length,
        estimatedTokens: RagChunker.estimateTokenCount(cleaned)
      },
      createdAt: Date.now()
    }];
  });

  const [activeDocumentId, setActiveDocumentId] = useState<string>(() => documents[0]?.id || '');
  const [documentFilterId, setDocumentFilterId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<string>('chunks');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Update activeDocumentId when documents change
  useEffect(() => {
    if (documents.length > 0 && !documents.some(d => d.id === activeDocumentId)) {
      setActiveDocumentId(documents[0].id);
    }
  }, [documents, activeDocumentId]);

  // Generate chunks across all documents whenever documents or configs change
  const chunks: RagChunk[] = useMemo(() => {
    const allChunks: RagChunk[] = [];
    for (const doc of documents) {
      // Re-clean doc content according to active prepConfig
      const cleaned = RagPreprocessor.cleanText(doc.rawContent, prepConfig);
      const updatedDoc: RagDocument = { ...doc, cleanedContent: cleaned };
      const docChunks = RagChunker.chunkDocument(updatedDoc, chunkConfig);
      allChunks.push(...docChunks);
    }
    return allChunks;
  }, [documents, chunkConfig, prepConfig]);

  // Handler to add a single document
  const handleAddDocument = useCallback((doc: RagDocument) => {
    setDocuments(prev => [doc, ...prev]);
    setActiveDocumentId(doc.id);
  }, []);

  // Handler to add multiple documents
  const handleAddMultipleDocuments = useCallback((newDocs: RagDocument[]) => {
    setDocuments(prev => [...newDocs, ...prev]);
    if (newDocs[0]) {
      setActiveDocumentId(newDocs[0].id);
    }
  }, []);

  // Handler to remove a document
  const handleRemoveDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.info('Document removed');
  }, []);

  // Handler to clear all documents
  const handleClearAll = () => {
    setDocuments([]);
    toast.info('Cleared all documents');
  };

  const handleUpdateChunkConfig = (partial: Partial<ChunkingConfig>) => {
    setChunkConfig(prev => ({ ...prev, ...partial }));
  };

  const handleUpdatePrepConfig = (partial: Partial<PreprocessingConfig>) => {
    setPrepConfig(prev => ({ ...prev, ...partial }));
  };

  const handleRechunk = () => {
    toast.success('RAG Pipeline re-executed with updated parameters!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080d1a] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header with live stats and export triggers */}
      <RagHeader
        documents={documents}
        chunks={chunks}
        onOpenExport={() => setIsExportOpen(true)}
        onClearAll={handleClearAll}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Upload Zone & Quick Samples */}
        <FileUploadZone
          onAddDocument={handleAddDocument}
          onAddMultipleDocuments={handleAddMultipleDocuments}
        />

        {/* Primary Workspace Navigation Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <TabsList className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl h-10">
                <TabsTrigger 
                  value="chunks" 
                  className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chunk Inspector</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1 ml-1 bg-slate-800 text-slate-300">
                    {chunks.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger 
                  value="simulator" 
                  className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Retrieval Sandbox</span>
                </TabsTrigger>

                <TabsTrigger 
                  value="pipeline" 
                  className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Chunking Config</span>
                </TabsTrigger>

                <TabsTrigger 
                  value="source_docs" 
                  className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documents & Cleaning</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1 ml-1 bg-slate-800 text-slate-300">
                    {documents.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Status information pill */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">{chunkConfig.strategy.replace('_', ' ')}</span>
                <span>•</span>
                <span>{chunkConfig.chunkSize} chars</span>
                <span>•</span>
                <span className="text-indigo-400">{chunkConfig.chunkOverlap} overlap</span>
              </div>
            </div>

            {/* Tab 1: Chunk Visualizer */}
            <TabsContent value="chunks" className="mt-4">
              <ChunkVisualizer
                chunks={chunks}
                documents={documents}
                activeDocumentId={documentFilterId}
                onSelectDocumentFilter={setDocumentFilterId}
              />
            </TabsContent>

            {/* Tab 2: Retrieval Simulator */}
            <TabsContent value="simulator" className="mt-4">
              <RetrievalSimulatorTab chunks={chunks} />
            </TabsContent>

            {/* Tab 3: Chunking & Preprocessing Pipeline Controls */}
            <TabsContent value="pipeline" className="mt-4">
              <ChunkingControls
                chunkConfig={chunkConfig}
                onUpdateChunkConfig={handleUpdateChunkConfig}
                prepConfig={prepConfig}
                onUpdatePrepConfig={handleUpdatePrepConfig}
                onRechunk={handleRechunk}
                totalChunks={chunks.length}
              />
            </TabsContent>

            {/* Tab 4: Raw vs Cleaned Documents */}
            <TabsContent value="source_docs" className="mt-4">
              <DocumentViewer
                documents={documents}
                activeDocumentId={activeDocumentId}
                onSelectDocument={setActiveDocumentId}
                onRemoveDocument={handleRemoveDocument}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Export Vector Dataset Modal */}
      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        chunks={chunks}
      />

      {/* Floating Made with Dyad Badge */}
      <div className="fixed bottom-2 right-4 z-50 pointer-events-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;
