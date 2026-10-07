export type SupportedFileType = 
  | 'pdf' 
  | 'docx' 
  | 'markdown' 
  | 'text' 
  | 'csv' 
  | 'json' 
  | 'code' 
  | 'transcript';

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface RagDocument {
  id: string;
  name: string;
  type: SupportedFileType;
  extension: string;
  size: number;
  rawContent: string;
  cleanedContent: string;
  pages?: DocumentPage[];
  metadata: {
    author?: string;
    title?: string;
    creationDate?: string;
    linesCount?: number;
    wordCount?: number;
    charCount?: number;
    estimatedTokens?: number;
    customTags?: string[];
    [key: string]: any;
  };
  createdAt: number;
}

export interface RagChunk {
  id: string;
  documentId: string;
  documentName: string;
  index: number;
  totalChunks: number;
  content: string; // The ready-to-embed chunk text (including contextual prefix if enabled)
  originalSlice: string; // Clean content slice without prefix
  contextualPrefix?: string;
  charCount: number;
  tokenCount: number;
  startChar: number;
  endChar: number;
  startLine: number;
  endLine: number;
  pageNumber?: number;
  sectionBreadcrumbs?: string[]; // e.g. ["Getting Started", "Authentication", "Bearer Token"]
  keywords: string[];
  overlapWithPrev?: string;
  overlapWithNext?: string;
  metadata: {
    source: string;
    doc_id: string;
    chunk_index: number;
    total_chunks: number;
    char_count: number;
    token_count: number;
    section?: string;
    page?: number;
    keywords?: string[];
    created_at?: string;
    [key: string]: any;
  };
}

export type ChunkingStrategy = 
  | 'recursive' 
  | 'fixed_token' 
  | 'markdown_header' 
  | 'semantic_sentence' 
  | 'tabular_record' 
  | 'code_ast';

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize: number; // In characters or estimated tokens
  chunkOverlap: number; // Overlap size
  separators: string[];
  minChunkSize: number;
  addContextualPrefix: boolean;
  prefixTemplate: string; // e.g. "[Doc: {docName} | Section: {section}]"
  includeMetadataInExport: boolean;
}

export interface PreprocessingConfig {
  normalizeWhitespace: boolean;
  stripHtml: boolean;
  maskPII: boolean;
  piiOptions: {
    emails: boolean;
    phones: boolean;
    ips: boolean;
    creditCards: boolean;
  };
  fixHyphenation: boolean;
  removeBoilerplate: boolean;
  removeUrls: boolean;
}

export interface RetrievalResult {
  chunk: RagChunk;
  score: number; // 0.0 - 1.0 similarity score
  rank: number;
  matchedTerms: string[];
  snippet: string;
  explanation: string;
}

export type VectorStoreTarget = 
  | 'jsonl' 
  | 'json' 
  | 'csv' 
  | 'pinecone' 
  | 'chroma' 
  | 'qdrant' 
  | 'supabase' 
  | 'langchain' 
  | 'llamaindex';
