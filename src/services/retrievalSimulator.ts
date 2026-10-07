import { RagChunk, RetrievalResult } from '../types/rag';

export class RetrievalSimulator {
  /**
   * Run hybrid retrieval on chunks given a search query
   */
  static search(query: string, chunks: RagChunk[], topK: number = 4): RetrievalResult[] {
    if (!query.trim() || chunks.length === 0) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    // 1. Build document frequency (DF) for tokens across all chunks
    const totalDocs = chunks.length;
    const docFrequency: Record<string, number> = {};

    const chunkTokensList = chunks.map(chunk => {
      const tokens = this.tokenize(chunk.content);
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(t => {
        docFrequency[t] = (docFrequency[t] || 0) + 1;
      });
      return { chunk, tokens, uniqueTokens };
    });

    // 2. Score each chunk using BM25-inspired TF-IDF similarity + exact phrase bonus
    const queryLower = query.toLowerCase().trim();
    const results: RetrievalResult[] = [];

    const avgDocLength = chunkTokensList.reduce((acc, c) => acc + c.tokens.length, 0) / (totalDocs || 1);
    const k1 = 1.2; // BM25 term saturation parameter
    const b = 0.75; // BM25 length normalization parameter

    chunkTokensList.forEach(({ chunk, tokens, uniqueTokens }) => {
      let score = 0;
      const matchedTerms: string[] = [];
      const docLen = tokens.length;

      // Frequency map in chunk
      const tfMap: Record<string, number> = {};
      tokens.forEach(t => {
        tfMap[t] = (tfMap[t] || 0) + 1;
      });

      queryTokens.forEach(qt => {
        if (tfMap[qt]) {
          matchedTerms.push(qt);
          const tf = tfMap[qt];
          const df = docFrequency[qt] || 1;
          const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
          
          // BM25 component
          const termScore = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / (avgDocLength || 1)))));
          score += termScore;
        }
      });

      // Bonus 1: Exact phrase match
      if (chunk.content.toLowerCase().includes(queryLower)) {
        score += 3.5;
      }

      // Bonus 2: Keyword match in chunk metadata
      if (chunk.keywords) {
        chunk.keywords.forEach(kw => {
          if (queryTokens.includes(kw.toLowerCase())) {
            score += 1.0;
          }
        });
      }

      // Bonus 3: Breadcrumb / title match
      if (chunk.sectionBreadcrumbs) {
        const breadcrumbStr = chunk.sectionBreadcrumbs.join(' ').toLowerCase();
        queryTokens.forEach(qt => {
          if (breadcrumbStr.includes(qt)) {
            score += 1.2;
          }
        });
      }

      if (matchedTerms.length > 0 || score > 0) {
        // Normalize score between 0.0 and 0.99
        const normalizedScore = Math.min(0.99, Number((score / (score + 5)).toFixed(3)));
        
        // Generate highlighted snippet around best match
        const snippet = this.generateSnippet(chunk.content, queryTokens);

        const explanation = `Matched ${matchedTerms.length} query term${matchedTerms.length > 1 ? 's' : ''} (${matchedTerms.slice(0, 3).join(', ')})${
          chunk.content.toLowerCase().includes(queryLower) ? ' • Exact phrase hit' : ''
        }`;

        results.push({
          chunk,
          score: normalizedScore,
          rank: 0,
          matchedTerms,
          snippet,
          explanation
        });
      }
    });

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Assign rank and take topK
    return results.slice(0, topK).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }

  /**
   * Tokenizer removing punctuation
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  /**
   * Generate contextual snippet focused around matched query words
   */
  private static generateSnippet(text: string, queryTokens: string[], windowChars: number = 220): string {
    const textLower = text.toLowerCase();
    let bestPos = 0;

    for (const qt of queryTokens) {
      const pos = textLower.indexOf(qt);
      if (pos !== -1) {
        bestPos = pos;
        break;
      }
    }

    const start = Math.max(0, bestPos - 40);
    const end = Math.min(text.length, start + windowChars);
    let snippet = text.slice(start, end).replace(/\n+/g, ' ');

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}
