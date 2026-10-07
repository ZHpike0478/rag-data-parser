import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { SupportedFileType, DocumentPage } from '../types/rag';

// Configure PDF.js worker safely
if (typeof window !== 'undefined') {
  try {
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    }
  } catch (err) {
    console.warn('PDF worker config note:', err);
  }
}

export interface ParseResult {
  text: string;
  type: SupportedFileType;
  extension: string;
  pages?: DocumentPage[];
  metadata: Record<string, any>;
}

export class FileParser {
  /**
   * Determine file type based on extension and mime
   */
  static detectFileType(filename: string, mimeType?: string): { type: SupportedFileType; extension: string } {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return { type: 'pdf', extension: ext };
    }
    if (ext === 'docx' || ext === 'doc' || mimeType?.includes('wordprocessingml')) {
      return { type: 'docx', extension: ext };
    }
    if (['md', 'markdown', 'mdown'].includes(ext)) {
      return { type: 'markdown', extension: ext };
    }
    if (['csv', 'tsv'].includes(ext) || mimeType?.includes('csv')) {
      return { type: 'csv', extension: ext };
    }
    if (['json', 'jsonl'].includes(ext) || mimeType?.includes('json')) {
      return { type: 'json', extension: ext };
    }
    if (['srt', 'vtt', 'sub'].includes(ext)) {
      return { type: 'transcript', extension: ext };
    }
    if (['py', 'ts', 'tsx', 'js', 'jsx', 'html', 'css', 'sql', 'yaml', 'yml', 'sh', 'rs', 'go', 'java', 'cpp', 'c', 'php', 'rb'].includes(ext)) {
      return { type: 'code', extension: ext };
    }
    return { type: 'text', extension: ext || 'txt' };
  }

  /**
   * Parse any supported file into structured text
   */
  static async parseFile(file: File): Promise<ParseResult> {
    const { type, extension } = this.detectFileType(file.name, file.type);
    
    switch (type) {
      case 'pdf':
        return await this.parsePdf(file, extension);
      case 'docx':
        return await this.parseDocx(file, extension);
      case 'csv':
        return await this.parseCsv(file, extension);
      case 'transcript':
        return await this.parseTranscript(file, extension);
      case 'json':
        return await this.parseJson(file, extension);
      default:
        // text, markdown, code
        return await this.parsePlainText(file, type, extension);
    }
  }

  /**
   * Extract text and pages from PDF file using PDF.js
   */
  private static async parsePdf(file: File, extension: string): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      const pages: DocumentPage[] = [];
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items) {
          if ('str' in item) {
            // Check for new line based on vertical position
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
              pageText += '\n';
            } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
          }
        }

        const trimmedPage = pageText.trim();
        pages.push({ pageNumber: i, text: trimmedPage });
        fullText += (i > 1 ? '\n\n--- Page ' + i + ' ---\n\n' : '') + trimmedPage;
      }

      return {
        text: fullText,
        type: 'pdf',
        extension,
        pages,
        metadata: {
          totalPages: numPages,
          fileSize: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        }
      };
    } catch (err: any) {
      console.warn('PDF.js parse fallback:', err);
      // Fallback: try raw text decode if PDF contains uncompressed streams or partial text
      const rawText = await file.text();
      return {
        text: `[PDF Extraction Error: ${err.message || 'Corrupt or protected PDF'}]\n\nFallback content sample:\n${rawText.slice(0, 1000)}`,
        type: 'pdf',
        extension,
        metadata: { error: err.message, fileSize: file.size }
      };
    }
  }

  /**
   * Parse Microsoft Word (.docx) files natively using JSZip & DOMParser
   */
  private static async parseDocx(file: File, extension: string): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      if (!documentXml) {
        throw new Error('word/document.xml not found in .docx archive');
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
      const paragraphs = xmlDoc.getElementsByTagName('w:p');

      const extractedLines: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const texts = p.getElementsByTagName('w:t');
        let line = '';
        for (let j = 0; j < texts.length; j++) {
          line += texts[j].textContent || '';
        }
        if (line.trim().length > 0) {
          extractedLines.push(line.trim());
        }
      }

      const text = extractedLines.join('\n\n');

      return {
        text,
        type: 'docx',
        extension,
        metadata: {
          paragraphsCount: extractedLines.length,
          fileSize: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        }
      };
    } catch (err: any) {
      console.error('Docx parse error:', err);
      throw new Error(`Failed to parse DOCX file: ${err.message}`);
    }
  }

  /**
   * Parse CSV/TSV data and convert into RAG-optimized tabular string
   */
  private static async parseCsv(file: File, extension: string): Promise<ParseResult> {
    const raw = await file.text();
    const delimiter = extension === 'tsv' ? '\t' : ',';
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length === 0) {
      return { text: '', type: 'csv', extension, metadata: { rowCount: 0 } };
    }

    // Parse simple CSV/TSV headers
    const headers = this.parseCsvRow(lines[0], delimiter);
    const rowCount = lines.length - 1;

    // Build structured contextual representation for RAG:
    // Header summary + structured row items
    let structuredText = `# Dataset: ${file.name}\nColumns: ${headers.join(', ')}\nTotal Records: ${rowCount}\n\n`;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvRow(lines[i], delimiter);
      if (values.length === 0 || values.every(v => v === '')) continue;
      
      const recordParts = headers.map((header, idx) => {
        const val = values[idx] || '';
        return `${header}: ${val}`;
      });

      structuredText += `[Record #${i}]\n` + recordParts.join(' | ') + '\n\n';
    }

    return {
      text: structuredText.trim(),
      type: 'csv',
      extension,
      metadata: {
        columns: headers,
        rowCount,
        fileSize: file.size
      }
    };
  }

  /**
   * Helper to parse quotes in CSV lines
   */
  private static parseCsvRow(row: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (insideQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Parse Subtitle/Transcript formats (.srt, .vtt)
   */
  private static async parseTranscript(file: File, extension: string): Promise<ParseResult> {
    const raw = await file.text();
    const lines = raw.split(/\r?\n/);
    const cleanedParagraphs: string[] = [];
    let currentCueText: string[] = [];

    const timestampRegex = /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip numeric IDs or WEBVTT header
      if (/^\d+$/.test(trimmed) || trimmed === 'WEBVTT') {
        continue;
      }
      if (timestampRegex.test(trimmed)) {
        if (currentCueText.length > 0) {
          cleanedParagraphs.push(currentCueText.join(' '));
          currentCueText = [];
        }
        continue;
      }
      if (trimmed.length > 0) {
        currentCueText.push(trimmed);
      }
    }

    if (currentCueText.length > 0) {
      cleanedParagraphs.push(currentCueText.join(' '));
    }

    const text = cleanedParagraphs.join('\n\n');

    return {
      text,
      type: 'transcript',
      extension,
      metadata: {
        cueCount: cleanedParagraphs.length,
        fileSize: file.size
      }
    };
  }

  /**
   * Parse JSON and JSONL
   */
  private static async parseJson(file: File, extension: string): Promise<ParseResult> {
    const raw = await file.text();
    try {
      if (extension === 'jsonl') {
        const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
        const parsed = lines.map((l, idx) => {
          try {
            const obj = JSON.parse(l);
            return `[Entry ${idx + 1}]\n` + Object.entries(obj).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
          } catch {
            return l;
          }
        });
        return {
          text: parsed.join('\n\n'),
          type: 'json',
          extension,
          metadata: { entriesCount: lines.length, fileSize: file.size }
        };
      } else {
        const parsed = JSON.parse(raw);
        const pretty = JSON.stringify(parsed, null, 2);
        return {
          text: pretty,
          type: 'json',
          extension,
          metadata: {
            isJsonArray: Array.isArray(parsed),
            keysCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0,
            fileSize: file.size
          }
        };
      }
    } catch {
      return {
        text: raw,
        type: 'json',
        extension,
        metadata: { parseWarning: 'Invalid JSON format, treated as plain text' }
      };
    }
  }

  /**
   * Parse plain text, markdown, or code
   */
  private static async parsePlainText(file: File, type: SupportedFileType, extension: string): Promise<ParseResult> {
    const text = await file.text();
    return {
      text,
      type,
      extension,
      metadata: {
        fileSize: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      }
    };
  }
}
