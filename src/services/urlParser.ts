export interface UrlParseResult {
  title: string;
  url: string;
  domain: string;
  content: string;
  description?: string;
  sourceType: 'article' | 'api' | 'documentation';
  metadata: Record<string, any>;
}

export class UrlParser {
  /**
   * Normalize input URL
   */
  static normalizeUrl(rawUrl: string): string {
    let trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }

  /**
   * Fetch and extract structured RAG content from a given web URL
   */
  static async parseUrl(inputUrl: string): Promise<UrlParseResult> {
    const url = this.normalizeUrl(inputUrl);
    const domain = new URL(url).hostname;

    // Strategy 1: Try Jina Reader API (specialized LLM/RAG reader that converts web pages to clean markdown with CORS enabled)
    try {
      const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown'
        }
      });

      if (jinaResponse.ok) {
        const markdown = await jinaResponse.text();
        if (markdown.trim().length > 100) {
          // Extract title if present in first line
          const firstLine = markdown.split('\n')[0].replace(/^#+\s*/, '').trim();
          const title = firstLine || `Web Document: ${domain}`;

          return {
            title: title.slice(0, 100),
            url,
            domain,
            content: markdown.trim(),
            sourceType: 'article',
            metadata: {
              extractedVia: 'jina_reader',
              originalUrl: url,
              domain,
              fetchedAt: new Date().toISOString()
            }
          };
        }
      }
    } catch (jinaErr) {
      console.warn('Jina reader fallback, attempting secondary method:', jinaErr);
    }

    // Strategy 2: Direct Fetch (for CORS-enabled endpoints like raw github, json apis, etc.)
    try {
      const directResponse = await fetch(url, { headers: { 'Accept': 'text/html,application/json,text/plain' } });
      if (directResponse.ok) {
        const contentType = directResponse.headers.get('content-type') || '';
        const bodyText = await directResponse.text();

        if (contentType.includes('application/json')) {
          return {
            title: `API JSON Data: ${domain}`,
            url,
            domain,
            content: bodyText,
            sourceType: 'api',
            metadata: { contentType, originalUrl: url }
          };
        }

        // HTML parsing
        return this.parseHtmlContent(bodyText, url, domain);
      }
    } catch (directErr) {
      console.warn('Direct fetch failed (likely CORS), attempting proxy reader:', directErr);
    }

    // Strategy 3: Open CORS Proxy (AllOrigins)
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyResponse = await fetch(proxyUrl);
      if (proxyResponse.ok) {
        const html = await proxyResponse.text();
        return this.parseHtmlContent(html, url, domain);
      }
    } catch (proxyErr: any) {
      console.error('All fetch strategies failed:', proxyErr);
    }

    throw new Error(
      `Could not retrieve content from "${url}". The website may restrict automated access or CORS. You can paste its HTML or text directly in the "Paste Text / Code" tab.`
    );
  }

  /**
   * Parse HTML string into clean, structured Markdown suitable for RAG chunking
   */
  static parseHtmlContent(htmlString: string, url: string, domain: string): UrlParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 1. Extract metadata
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('h1')?.textContent?.trim() || 
                  `Webpage: ${domain}`;
    
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

    // 2. Remove unwanted tags (scripts, ads, navigation, headers, footers)
    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'header', 
      'aside', '.ad', '.ads', '.cookie-banner', '.modal', '.popup', '#cookie-notice'
    ];
    unwantedSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });

    // 3. Target main content container if available
    const mainContainer = doc.querySelector('article') || 
                          doc.querySelector('main') || 
                          doc.querySelector('[role="main"]') || 
                          doc.querySelector('.content') || 
                          doc.querySelector('#content') || 
                          doc.body;

    if (!mainContainer) {
      return {
        title,
        url,
        domain,
        content: `# ${title}\n\n${description}`,
        sourceType: 'article',
        metadata: { originalUrl: url, domain }
      };
    }

    // 4. Convert DOM nodes into clean markdown representation
    const markdownLines: string[] = [];
    markdownLines.push(`# ${title}\n`);
    if (description) {
      markdownLines.push(`> **Summary**: ${description}\n`);
    }
    markdownLines.push(`**Source URL**: [${url}](${url})\n\n---\n`);

    this.walkDomNodes(mainContainer, markdownLines);

    const cleanContent = markdownLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    return {
      title,
      url,
      domain,
      description,
      content: cleanContent,
      sourceType: 'article',
      metadata: {
        originalUrl: url,
        domain,
        title,
        description,
        extractedVia: 'dom_parser'
      }
    };
  }

  /**
   * Recursive DOM node traversal converting headers, paragraphs, lists, and tables to Markdown
   */
  private static walkDomNodes(element: Element, output: string[]): void {
    for (const child of Array.from(element.children)) {
      const tag = child.tagName.toLowerCase();

      switch (tag) {
        case 'h1':
          output.push(`\n# ${child.textContent?.trim()}\n`);
          break;
        case 'h2':
          output.push(`\n## ${child.textContent?.trim()}\n`);
          break;
        case 'h3':
          output.push(`\n### ${child.textContent?.trim()}\n`);
          break;
        case 'h4':
        case 'h5':
        case 'h6':
          output.push(`\n#### ${child.textContent?.trim()}\n`);
          break;
        case 'p': {
          const text = child.textContent?.trim();
          if (text) output.push(`\n${text}\n`);
          break;
        }
        case 'ul':
        case 'ol': {
          const items = Array.from(child.querySelectorAll('li'));
          if (items.length > 0) {
            output.push('\n' + items.map(li => `- ${li.textContent?.trim()}`).join('\n') + '\n');
          }
          break;
        }
        case 'pre':
        case 'code': {
          const codeText = child.textContent?.trim();
          if (codeText) output.push(`\n\`\`\`\n${codeText}\n\`\`\`\n`);
          break;
        }
        case 'table': {
          const rows = Array.from(child.querySelectorAll('tr'));
          if (rows.length > 0) {
            const tableLines = rows.map(tr => {
              const cells = Array.from(tr.querySelectorAll('th, td')).map(td => td.textContent?.trim() || '');
              return `| ${cells.join(' | ')} |`;
            });
            output.push('\n' + tableLines.join('\n') + '\n');
          }
          break;
        }
        case 'blockquote': {
          output.push(`\n> ${child.textContent?.trim()}\n`);
          break;
        }
        default:
          if (child.children.length > 0) {
            this.walkDomNodes(child, output);
          } else {
            const text = child.textContent?.trim();
            if (text && text.length > 20) {
              output.push(`\n${text}\n`);
            }
          }
      }
    }
  }
}
