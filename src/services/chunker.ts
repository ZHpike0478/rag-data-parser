import { 
  RagChunk, 
  RagDocument, 
  ChunkingConfig, 
  ChunkingStrategy 
} from '../types/rag';

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  strategy: 'recursive',
  chunkSize: 600,
  chunkOverlap: 120,
  separators: ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
  minChunkSize: 50,
  addContextualPrefix: true,
  prefixTemplate: '[Document: {docName}{section}]',
  includeMetadataInExport: true
};

export class RagChunker {
  /**
   * Estimate token count accurately (roughly 1 token ≈ 4 characters or 0.75 words)
   */
  static estimateTokenCount(text: string): number {
    if (!text) return 0;
    // Hybrid token estimator: weighted average of words and character count
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const estWords = words * 1.33;
    const estChars = chars / 4;
    return Math.max(1, Math.round((estWords + estChars) / 2));
  }

  /**
   * Extract top salient keywords for a chunk using TF-IDF style term frequency
   */
  static extractKeywords(text: string, maxKeywords: number = 5): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'that', 'to', 'for', 'it', 'with', 
      'as', 'by', 'this', 'be', 'are', 'from', 'or', 'you', 'your', 'we', 'our', 'all', 'can', 'has',
      'have', 'had', 'been', 'will', 'would', 'could', 'should', 'more', 'about', 'such', 'into',
      'than', 'them', 'these', 'those', 'also', 'other', 'only', 'new', 'some', 'any', 'each'
    ]);

    const words = text.toLowerCase().match(/\b[a-zA-Z]{3,20}\b/g) || [];
    const freqMap: Record<string, number> = {};

    for (const w of words) {
      if (!stopWords.has(w)) {
        freqMap[w] = (freqMap[w] || 0) + 1;
      }
    }

    return Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Chunk an entire document based on configuration
   */
  static chunkDocument(doc: RagDocument, config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG): RagChunk[] {
    const content = doc.cleanedContent || doc.rawContent;
    if (!content.trim()) return [];

    let rawSlices: {
      text: string;
      startChar: number;
      endChar: number;
      breadcrumbs?: string[];
      pageNumber?: number;
    }[] = [];

    switch (config.strategy) {
      case 'markdown_header':
        rawSlices = this.chunkByMarkdownHeaders(content, config);
        break;
      case 'semantic_sentence':
        rawSlices = this.chunkBySentences(content, config);
        break;
      case 'fixed_token':
        rawSlices = this.chunkByFixedTokens(content, config);
        break;
      case 'code_ast':
        rawSlices = this.chunkByCodeBlocks(content, config);
        break;
      case 'tabular_record':
        rawSlices = this.chunkByTabularRecords(content, config);
        break;
      case 'recursive':
      default:
        rawSlices = this.chunkRecursively(content, config);
        break;
    }

    // Filter out chunks that are too tiny
    const validSlices = rawSlices.filter(s => s.text.trim().length >= config.minChunkSize);
    const finalSlices = validSlices.length > 0 ? validSlices : rawSlices;
    const totalChunks = finalSlices.length;

    // Convert slices into enriched RagChunk objects
    return finalSlices.map((slice, idx) => {
      const cleanSlice = slice.text.trim();
      
      // Determine breadcrumbs / section string
      const sectionStr = slice.breadcrumbs && slice.breadcrumbs.length > 0
        ? ` | Section: ${slice.breadcrumbs.join(' > ')}`
        : '';

      // Create contextual prefix if enabled
      let contextualPrefix = '';
      if (config.addContextualPrefix) {
        contextualPrefix = config.prefixTemplate
          .replace('{docName}', doc.name)
          .replace('{section}', sectionStr);
      }

      const fullContent = contextualPrefix 
        ? `${contextualPrefix}\n\n${cleanSlice}`
        : cleanSlice;

      // Calculate line numbers
      const linesUpToStart = content.slice(0, slice.startChar).split('\n').length;
      const chunkLines = cleanSlice.split('\n').length;
      const startLine = linesUpToStart;
      const endLine = linesUpToStart + chunkLines - 1;

      // Calculate overlaps
      let overlapWithPrev: string | undefined;
      let overlapWithNext: string | undefined;

      if (idx > 0) {
        const prevText = finalSlices[idx - 1].text;
        overlapWithPrev = this.findOverlap(prevText, cleanSlice);
      }
      if (idx < totalChunks - 1) {
        const nextText = finalSlices[idx + 1].text;
        overlapWithNext = this.findOverlap(cleanSlice, nextText);
      }

      // Infer page number from doc pages if available
      let inferredPage: number | undefined = slice.pageNumber;
      if (!inferredPage && doc.pages && doc.pages.length > 0) {
        let accumulatedChar = 0;
        for (const p of doc.pages) {
          accumulatedChar += p.text.length;
          if (slice.startChar <= accumulatedChar) {
            inferredPage = p.pageNumber;
            break;
          }
        }
      }

      const chunkId = `${doc.id}_chk_${String(idx + 1).padStart(3, '0')}`;
      const tokenCount = this.estimateTokenCount(fullContent);
      const keywords = this.extractKeywords(cleanSlice, 4);

      return {
        id: chunkId,
        documentId: doc.id,
        documentName: doc.name,
        index: idx + 1,
        totalChunks,
        content: fullContent,
        originalSlice: cleanSlice,
        contextualPrefix: contextualPrefix || undefined,
        charCount: fullContent.length,
        tokenCount,
        startChar: slice.startChar,
        endChar: slice.endChar,
        startLine,
        endLine,
        pageNumber: inferredPage,
        sectionBreadcrumbs: slice.breadcrumbs,
        keywords,
        overlapWithPrev,
        overlapWithNext,
        metadata: {
          source: doc.name,
          doc_id: doc.id,
          chunk_index: idx + 1,
          total_chunks: totalChunks,
          char_count: fullContent.length,
          token_count: tokenCount,
          section: slice.breadcrumbs?.join(' > ') || 'General',
          page: inferredPage,
          keywords,
          created_at: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Recursive Character Splitting (LangChain style)
   */
  private static chunkRecursively(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number; breadcrumbs?: string[] }[] {
    const { chunkSize, chunkOverlap, separators } = config;
    const pieces = this.splitRecursiveHelper(text, chunkSize, separators);
    const chunks: { text: string; startChar: number; endChar: number }[] = [];

    let currentAccum: string[] = [];
    let currentLength = 0;
    let charOffset = 0;

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const pieceLen = piece.length;

      if (currentLength + pieceLen > chunkSize && currentAccum.length > 0) {
        const combined = currentAccum.join('');
        const start = text.indexOf(combined, charOffset);
        const actualStart = start !== -1 ? start : charOffset;
        
        chunks.push({
          text: combined,
          startChar: actualStart,
          endChar: actualStart + combined.length
        });

        // Compute overlap window from the end of currentAccum
        const overlapTarget = chunkOverlap;
        let overlapAccum: string[] = [];
        let overlapLen = 0;

        for (let j = currentAccum.length - 1; j >= 0; j--) {
          overlapAccum.unshift(currentAccum[j]);
          overlapLen += currentAccum[j].length;
          if (overlapLen >= overlapTarget) break;
        }

        currentAccum = [...overlapAccum, piece];
        currentLength = overlapLen + pieceLen;
        charOffset = actualStart + combined.length - overlapLen;
      } else {
        currentAccum.push(piece);
        currentLength += pieceLen;
      }
    }

    if (currentAccum.length > 0) {
      const combined = currentAccum.join('');
      const start = text.indexOf(combined, charOffset);
      const actualStart = start !== -1 ? start : charOffset;
      chunks.push({
        text: combined,
        startChar: actualStart,
        endChar: actualStart + combined.length
      });
    }

    return chunks;
  }

  private static splitRecursiveHelper(text: string, chunkSize: number, separators: string[]): string[] {
    if (text.length <= chunkSize || separators.length === 0) {
      return [text];
    }

    const separator = separators[0];
    const remainingSeparators = separators.slice(1);
    const splits = text.split(separator);
    const result: string[] = [];

    for (let i = 0; i < splits.length; i++) {
      let segment = splits[i];
      // Append separator back if not last item
      if (i < splits.length - 1 && separator) {
        segment += separator;
      }

      if (segment.length > chunkSize && remainingSeparators.length > 0) {
        result.push(...this.splitRecursiveHelper(segment, chunkSize, remainingSeparators));
      } else if (segment.length > 0) {
        result.push(segment);
      }
    }

    return result;
  }

  /**
   * Markdown Header Hierarchy Aware Chunking
   */
  private static chunkByMarkdownHeaders(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number; breadcrumbs?: string[] }[] {
    const lines = text.split('\n');
    const sections: {
      title: string;
      level: number;
      lines: string[];
      breadcrumbs: string[];
      startChar: number;
    }[] = [];

    const breadcrumbsStack: { level: number; title: string }[] = [];
    let currentLines: string[] = [];
    let currentBreadcrumbs: string[] = ['Overview'];
    let runningCharIndex = 0;
    let sectionStartChar = 0;

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        if (currentLines.length > 0) {
          sections.push({
            title: breadcrumbsStack[breadcrumbsStack.length - 1]?.title || 'Overview',
            level: breadcrumbsStack[breadcrumbsStack.length - 1]?.level || 1,
            lines: [...currentLines],
            breadcrumbs: [...currentBreadcrumbs],
            startChar: sectionStartChar
          });
          currentLines = [];
        }

        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        // Pop until we find parent level
        while (breadcrumbsStack.length > 0 && breadcrumbsStack[breadcrumbsStack.length - 1].level >= level) {
          breadcrumbsStack.pop();
        }
        breadcrumbsStack.push({ level, title });
        currentBreadcrumbs = breadcrumbsStack.map(b => b.title);
        sectionStartChar = runningCharIndex;
      }

      currentLines.push(line);
      runningCharIndex += line.length + 1; // +1 for \n
    }

    if (currentLines.length > 0) {
      sections.push({
        title: breadcrumbsStack[breadcrumbsStack.length - 1]?.title || 'Overview',
        level: breadcrumbsStack[breadcrumbsStack.length - 1]?.level || 1,
        lines: currentLines,
        breadcrumbs: currentBreadcrumbs,
        startChar: sectionStartChar
      });
    }

    // Now convert each header section: if larger than chunkSize, sub-split it recursively
    const finalChunks: { text: string; startChar: number; endChar: number; breadcrumbs: string[] }[] = [];

    for (const sec of sections) {
      const secText = sec.lines.join('\n');
      if (secText.length <= config.chunkSize) {
        finalChunks.push({
          text: secText,
          startChar: sec.startChar,
          endChar: sec.startChar + secText.length,
          breadcrumbs: sec.breadcrumbs
        });
      } else {
        // Sub-chunk large section
        const subChunks = this.chunkRecursively(secText, config);
        for (const sub of subChunks) {
          finalChunks.push({
            text: sub.text,
            startChar: sec.startChar + sub.startChar,
            endChar: sec.startChar + sub.endChar,
            breadcrumbs: sec.breadcrumbs
          });
        }
      }
    }

    return finalChunks;
  }

  /**
   * Semantic Sentence Splitter (keeps complete sentences together)
   */
  private static chunkBySentences(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number }[] {
    // Sentence boundary regex matching periods, question marks, exclamation marks followed by whitespace or quote
    const sentenceRegex = /([^\.!\?]+[\.!\?]+(?:\s+|$)|[^\.!\?]+$)/g;
    const matches = text.match(sentenceRegex) || [text];
    const sentences = matches.filter(s => s.trim().length > 0);

    const chunks: { text: string; startChar: number; endChar: number }[] = [];
    let currentChunkSentences: string[] = [];
    let currentLength = 0;
    let charOffset = 0;

    for (const sentence of sentences) {
      if (currentLength + sentence.length > config.chunkSize && currentChunkSentences.length > 0) {
        const chunkText = currentChunkSentences.join('');
        const start = text.indexOf(chunkText, charOffset);
        const actualStart = start !== -1 ? start : charOffset;

        chunks.push({
          text: chunkText,
          startChar: actualStart,
          endChar: actualStart + chunkText.length
        });

        // Overlap: retain last sentence if possible
        const lastSentence = currentChunkSentences[currentChunkSentences.length - 1];
        if (lastSentence && lastSentence.length < config.chunkOverlap) {
          currentChunkSentences = [lastSentence, sentence];
          currentLength = lastSentence.length + sentence.length;
        } else {
          currentChunkSentences = [sentence];
          currentLength = sentence.length;
        }
        charOffset = actualStart + chunkText.length;
      } else {
        currentChunkSentences.push(sentence);
        currentLength += sentence.length;
      }
    }

    if (currentChunkSentences.length > 0) {
      const chunkText = currentChunkSentences.join('');
      const start = text.indexOf(chunkText, charOffset);
      const actualStart = start !== -1 ? start : charOffset;
      chunks.push({
        text: chunkText,
        startChar: actualStart,
        endChar: actualStart + chunkText.length
      });
    }

    return chunks;
  }

  /**
   * Fixed Token / Sliding Window Splitter
   */
  private static chunkByFixedTokens(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number }[] {
    const words = text.split(/(\s+)/); // Keep whitespace delimiters
    const targetWordCount = Math.max(10, Math.round(config.chunkSize / 4.5));
    const overlapWordCount = Math.max(2, Math.round(config.chunkOverlap / 4.5));

    const chunks: { text: string; startChar: number; endChar: number }[] = [];
    let i = 0;
    let currentOffset = 0;

    while (i < words.length) {
      let wordAccum: string[] = [];
      let actualWordsCount = 0;
      let startWordIndex = i;

      while (i < words.length && actualWordsCount < targetWordCount) {
        const item = words[i];
        wordAccum.push(item);
        if (!/^\s+$/.test(item)) {
          actualWordsCount++;
        }
        i++;
      }

      const chunkText = wordAccum.join('');
      const start = text.indexOf(chunkText, currentOffset);
      const actualStart = start !== -1 ? start : currentOffset;

      chunks.push({
        text: chunkText,
        startChar: actualStart,
        endChar: actualStart + chunkText.length
      });

      currentOffset = actualStart + chunkText.length;

      // Rewind for overlap
      if (i < words.length) {
        let rewind = 0;
        let rewindWords = 0;
        while (i - rewind > startWordIndex && rewindWords < overlapWordCount) {
          rewind++;
          if (!/^\s+$/.test(words[i - rewind])) {
            rewindWords++;
          }
        }
        i = i - rewind;
      }
    }

    return chunks;
  }

  /**
   * Code AST / Function Block Splitter
   */
  private static chunkByCodeBlocks(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number; breadcrumbs?: string[] }[] {
    const lines = text.split('\n');
    const blocks: { text: string; startChar: number; endChar: number; breadcrumbs: string[] }[] = [];
    let currentBlock: string[] = [];
    let blockStartChar = 0;
    let runningChar = 0;
    let currentSymbol = 'Global Scope';

    const functionRegex = /^(?:export\s+)?(?:async\s+)?(?:function|def|class|const\s+[a-zA-Z0-9_]+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|type|interface)\s+([a-zA-Z0-9_]+)/;

    for (const line of lines) {
      const match = line.match(functionRegex);
      if (match) {
        if (currentBlock.length > 0) {
          const blockText = currentBlock.join('\n');
          blocks.push({
            text: blockText,
            startChar: blockStartChar,
            endChar: blockStartChar + blockText.length,
            breadcrumbs: [currentSymbol]
          });
          currentBlock = [];
        }
        currentSymbol = match[1];
        blockStartChar = runningChar;
      }

      currentBlock.push(line);
      runningChar += line.length + 1;
    }

    if (currentBlock.length > 0) {
      const blockText = currentBlock.join('\n');
      blocks.push({
        text: blockText,
        startChar: blockStartChar,
        endChar: blockStartChar + blockText.length,
        breadcrumbs: [currentSymbol]
      });
    }

    // Fallback to recursive if no code blocks detected
    return blocks.length > 1 ? blocks : this.chunkRecursively(text, config);
  }

  /**
   * Tabular Record Splitter (CSV / Structured data rows)
   */
  private static chunkByTabularRecords(
    text: string, 
    config: ChunkingConfig
  ): { text: string; startChar: number; endChar: number; breadcrumbs?: string[] }[] {
    const records = text.split(/\n\s*\n/).filter(r => r.trim().length > 0);
    const chunks: { text: string; startChar: number; endChar: number; breadcrumbs?: string[] }[] = [];
    
    let currentBatch: string[] = [];
    let currentLen = 0;
    let charOffset = 0;

    for (const rec of records) {
      if (currentLen + rec.length > config.chunkSize && currentBatch.length > 0) {
        const chunkText = currentBatch.join('\n\n');
        chunks.push({
          text: chunkText,
          startChar: charOffset,
          endChar: charOffset + chunkText.length,
          breadcrumbs: ['Tabular Records']
        });
        charOffset += chunkText.length;
        currentBatch = [rec];
        currentLen = rec.length;
      } else {
        currentBatch.push(rec);
        currentLen += rec.length;
      }
    }

    if (currentBatch.length > 0) {
      const chunkText = currentBatch.join('\n\n');
      chunks.push({
        text: chunkText,
        startChar: charOffset,
        endChar: charOffset + chunkText.length,
        breadcrumbs: ['Tabular Records']
      });
    }

    return chunks;
  }

  /**
   * Helper to find overlap string between two consecutive chunks
   */
  private static findOverlap(prev: string, curr: string): string {
    const maxLookback = Math.min(prev.length, curr.length, 300);
    for (let len = maxLookback; len >= 15; len--) {
      const tail = prev.slice(-len);
      if (curr.startsWith(tail)) {
        return tail;
      }
    }
    return '';
  }
}
