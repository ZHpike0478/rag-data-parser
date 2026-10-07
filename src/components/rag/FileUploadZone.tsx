import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  Plus,
  FileCode,
  Loader2,
  FileSpreadsheet,
  Globe,
  Link2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileParser } from '@/services/fileParser';
import { UrlParser } from '@/services/urlParser';
import { RagPreprocessor, DEFAULT_PREPROCESSING_CONFIG } from '@/services/preprocessor';
import { RagChunker } from '@/services/chunker';
import { SAMPLE_DOCUMENTS, SampleDocDef } from '@/services/sampleDocuments';
import { RagDocument, SupportedFileType } from '@/types/rag';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onAddDocument: (doc: RagDocument) => void;
  onAddMultipleDocuments: (docs: RagDocument[]) => void;
}

const SAMPLE_URLS = [
  {
    name: 'Wikipedia: Retrieval-Augmented Generation',
    url: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
    desc: 'Foundational concepts, dense vs sparse models, and architectures'
  },
  {
    name: 'LangChain GitHub Readme',
    url: 'https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md',
    desc: 'Production framework documentation & vector components'
  },
  {
    name: 'W3C Web Standards Summary',
    url: 'https://www.w3.org/standards/',
    desc: 'HTML5, accessibility & architectural principles'
  }
];

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onAddDocument,
  onAddMultipleDocuments
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL parser state
  const [inputUrl, setInputUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Manual paste state
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState<SupportedFileType>('markdown');
  const [manualText, setManualText] = useState('');

  const processFileList = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const parsedDocs: RagDocument[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      setCurrentProcessingFile(file.name);
      try {
        const parsed = await FileParser.parseFile(file);
        const cleaned = RagPreprocessor.cleanText(parsed.text, DEFAULT_PREPROCESSING_CONFIG);

        const newDoc: RagDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: parsed.type,
          extension: parsed.extension,
          size: file.size,
          rawContent: parsed.text,
          cleanedContent: cleaned,
          pages: parsed.pages,
          metadata: {
            ...parsed.metadata,
            charCount: parsed.text.length,
            wordCount: parsed.text.split(/\s+/).filter(Boolean).length,
            estimatedTokens: RagChunker.estimateTokenCount(cleaned)
          },
          createdAt: Date.now()
        };

        parsedDocs.push(newDoc);
      } catch (err: any) {
        toast.error(`Failed to parse ${file.name}: ${err.message}`);
      }
    }

    if (parsedDocs.length > 0) {
      onAddMultipleDocuments(parsedDocs);
      toast.success(`Successfully ingested & parsed ${parsedDocs.length} file${parsedDocs.length > 1 ? 's' : ''}!`);
    }

    setIsProcessing(false);
    setCurrentProcessingFile('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleLoadSample = (sample: SampleDocDef) => {
    const cleaned = RagPreprocessor.cleanText(sample.rawContent, DEFAULT_PREPROCESSING_CONFIG);
    const newDoc: RagDocument = {
      id: `doc_sample_${sample.id}_${Date.now()}`,
      name: sample.name,
      type: sample.type,
      extension: sample.extension,
      size: new Blob([sample.rawContent]).size,
      rawContent: sample.rawContent,
      cleanedContent: cleaned,
      metadata: {
        isSample: true,
        description: sample.description,
        charCount: sample.rawContent.length,
        wordCount: sample.rawContent.split(/\s+/).filter(Boolean).length,
        estimatedTokens: RagChunker.estimateTokenCount(cleaned)
      },
      createdAt: Date.now()
    };
    onAddDocument(newDoc);
    toast.success(`Loaded sample: ${sample.name}`);
  };

  const handleFetchUrl = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || inputUrl).trim();
    if (!urlToFetch) {
      toast.error('Please enter a web URL to parse');
      return;
    }

    setIsFetchingUrl(true);
    try {
      const parsed = await UrlParser.parseUrl(urlToFetch);
      const cleaned = RagPreprocessor.cleanText(parsed.content, DEFAULT_PREPROCESSING_CONFIG);

      const filename = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) + '.md';

      const newDoc: RagDocument = {
        id: `doc_web_${Date.now()}`,
        name: filename,
        type: 'markdown',
        extension: 'md',
        size: new Blob([parsed.content]).size,
        rawContent: parsed.content,
        cleanedContent: cleaned,
        metadata: {
          ...parsed.metadata,
          sourceUrl: parsed.url,
          domain: parsed.domain,
          title: parsed.title,
          description: parsed.description,
          charCount: parsed.content.length,
          wordCount: parsed.content.split(/\s+/).filter(Boolean).length,
          estimatedTokens: RagChunker.estimateTokenCount(cleaned)
        },
        createdAt: Date.now()
      };

      onAddDocument(newDoc);
      setInputUrl('');
      toast.success(`Successfully parsed URL: ${parsed.title}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch and parse URL');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) {
      toast.error('Please enter content before adding');
      return;
    }

    const title = manualTitle.trim() || `manual_document_${Date.now()}.${manualType === 'markdown' ? 'md' : 'txt'}`;
    const cleaned = RagPreprocessor.cleanText(manualText, DEFAULT_PREPROCESSING_CONFIG);

    const newDoc: RagDocument = {
      id: `doc_manual_${Date.now()}`,
      name: title,
      type: manualType,
      extension: manualType === 'markdown' ? 'md' : manualType === 'code' ? 'ts' : 'txt',
      size: new Blob([manualText]).size,
      rawContent: manualText,
      cleanedContent: cleaned,
      metadata: {
        source: 'manual_input',
        charCount: manualText.length,
        wordCount: manualText.split(/\s+/).filter(Boolean).length,
        estimatedTokens: RagChunker.estimateTokenCount(cleaned)
      },
      createdAt: Date.now()
    };

    onAddDocument(newDoc);
    setManualTitle('');
    setManualText('');
    toast.success(`Added document: ${title}`);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <Tabs defaultValue="upload" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="upload" 
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger 
              value="url" 
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Web / URL Scraper
            </TabsTrigger>
            <TabsTrigger 
              value="paste" 
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Paste Text / Code
            </TabsTrigger>
          </TabsList>

          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            Supports PDF, DOCX, MD, CSV, JSON, URLs, Code
          </span>
        </div>

        {/* Tab 1: File Drag & Drop */}
        <TabsContent value="upload" className="mt-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 scale-[1.005]' 
                : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.tsv,.json,.jsonl,.py,.ts,.tsx,.js,.jsx,.html,.css,.sql,.yaml,.yml,.srt,.vtt"
              className="hidden"
              onChange={(e) => e.target.files && processFileList(e.target.files)}
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-sm font-medium text-slate-200">
                  Parsing & structuring {currentProcessingFile}...
                </p>
                <p className="text-xs text-slate-400">
                  Extracting pages, repairing hyphenations & structuring tables
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Click to browse or drop your documents here
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Direct in-browser parsing with page awareness, table restructuring, and metadata extraction
                  </p>
                </div>

                {/* Formats badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  <Badge variant="secondary" className="text-[10px] bg-rose-950/50 text-rose-300 border-rose-800/40">PDF</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-blue-950/50 text-blue-300 border-blue-800/40">DOCX</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-950/50 text-emerald-300 border-emerald-800/40">CSV / TSV</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-purple-950/50 text-purple-300 border-purple-800/40">Markdown</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-amber-950/50 text-amber-300 border-amber-800/40">JSON / JSONL</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-cyan-950/50 text-cyan-300 border-cyan-800/40">Code (Py/TS/SQL)</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">Subtitles / SRT</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Quick sample documents bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Or test with pre-built RAG test datasets:
              </span>
              <span className="text-[10px] text-slate-400">Click to instantly load</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 text-left transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 shrink-0">
                    {sample.type === 'pdf' ? <FileText className="w-4 h-4 text-rose-400" /> :
                     sample.type === 'csv' ? <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> :
                     sample.type === 'markdown' ? <FileCode className="w-4 h-4 text-purple-400" /> :
                     <BookOpen className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-200">
                      {sample.name}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {sample.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: URL Scraper & Webpage Ingestion */}
        <TabsContent value="url" className="mt-0 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4 text-cyan-400" />
                Web Page / Documentation URL
              </label>
              <p className="text-xs text-slate-400">
                Extracts articles, guides, and docs into clean Markdown, automatically stripping ads, navigation bars, and cookie banners.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://en.wikipedia.org/wiki/Retrieval-augmented_generation"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isFetchingUrl) {
                    handleFetchUrl();
                  }
                }}
                className="bg-slate-950 border-slate-800 text-xs h-10 font-mono text-cyan-200 flex-1"
              />

              <Button
                onClick={() => handleFetchUrl()}
                disabled={isFetchingUrl}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs h-10 px-5 shrink-0"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Fetching & Cleaning...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 mr-2" />
                    Ingest &amp; Structure URL
                  </>
                )}
              </Button>
            </div>

            {/* Quick URL presets */}
            <div className="pt-2 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                Try a pre-tested public URL:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_URLS.map((sampleUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputUrl(sampleUrl.url);
                      handleFetchUrl(sampleUrl.url);
                    }}
                    disabled={isFetchingUrl}
                    className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      <span className="truncate">{sampleUrl.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-1" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {sampleUrl.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Manual Paste */}
        <TabsContent value="paste" className="mt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Document Title / Filename</label>
              <Input
                placeholder="e.g. system_architecture_doc.md"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Content Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value as SupportedFileType)}
                className="w-full bg-slate-950 border border-slate-800 text-xs h-9 rounded-md px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="text">Plain Text (.txt)</option>
                <option value="code">Source Code (.ts / .py)</option>
                <option value="json">JSON / JSONL</option>
                <option value="csv">CSV Table</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Document Content</label>
            <Textarea
              rows={6}
              placeholder="Paste raw text, documentation, logs, or structured records here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs font-mono resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleManualSubmit}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ingest & Chunk Text
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
