import { PreprocessingConfig } from '../types/rag';

export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  normalizeWhitespace: true,
  stripHtml: true,
  maskPII: false,
  piiOptions: {
    emails: true,
    phones: true,
    ips: true,
    creditCards: true
  },
  fixHyphenation: true,
  removeBoilerplate: true,
  removeUrls: false
};

export class RagPreprocessor {
  /**
   * Run full cleaning pipeline on text
   */
  static cleanText(text: string, config: PreprocessingConfig = DEFAULT_PREPROCESSING_CONFIG): string {
    if (!text) return '';
    let result = text;

    // 1. Strip HTML tags if enabled
    if (config.stripHtml) {
      result = this.stripHtmlTags(result);
    }

    // 2. Fix hyphenation broken across lines (very common in PDFs and scanned docs)
    if (config.fixHyphenation) {
      result = this.fixHyphenation(result);
    }

    // 3. Remove repetitive decorative boilerplate (e.g., "---------------", "================")
    if (config.removeBoilerplate) {
      result = this.removeBoilerplateNoise(result);
    }

    // 4. Mask PII if enabled
    if (config.maskPII) {
      result = this.maskPiiData(result, config.piiOptions);
    }

    // 5. Remove or replace URLs if enabled
    if (config.removeUrls) {
      result = result.replace(/https?:\/\/[^\s]+/gi, '[URL_REMOVED]');
    }

    // 6. Normalize Whitespace
    if (config.normalizeWhitespace) {
      result = this.normalizeWhitespace(result);
    }

    return result.trim();
  }

  /**
   * Strip HTML tags but preserve clean spacing
   */
  private static stripHtmlTags(text: string): string {
    // Replace <br>, <p>, </div>, </tr> with newline
    let stripped = text
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    // Decode common HTML entities
    stripped = stripped
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return stripped;
  }

  /**
   * Fix hyphenated words broken across line wraps: e.g. "commer- \n cial" -> "commercial"
   */
  private static fixHyphenation(text: string): string {
    return text.replace(/(\b[a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,}\b)/g, '$1$2');
  }

  /**
   * Remove ASCII banners, page dividers, and decorative lines
   */
  private static removeBoilerplateNoise(text: string): string {
    return text
      .replace(/^[\-_=\*\#~]{4,}\s*$/gm, '') // Long horizontal rule lines
      .replace(/\x00/g, '') // Null bytes
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // Non-printable control chars
  }

  /**
   * PII Masking with granular pattern matchers
   */
  private static maskPiiData(text: string, options: PreprocessingConfig['piiOptions']): string {
    let masked = text;

    if (options.emails) {
      masked = masked.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[EMAIL_REDACTED]');
    }

    if (options.phones) {
      // Matches standard US/Intl phone formats: +1 (555) 123-4567, 555-123-4567, 555.123.4567
      masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REDACTED]');
    }

    if (options.ips) {
      // IPv4 match
      masked = masked.replace(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, '[IP_REDACTED]');
    }

    if (options.creditCards) {
      // 16-digit credit cards with optional spaces or dashes
      masked = masked.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]');
    }

    return masked;
  }

  /**
   * Normalize spaces, tabs, and multiple excessive newlines
   */
  private static normalizeWhitespace(text: string): string {
    return text
      // Replace non-breaking spaces with standard space
      .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
      // Normalize tabs to spaces
      .replace(/\t+/g, ' ')
      // Multiple spaces within lines -> single space
      .replace(/[ ]{2,}/g, ' ')
      // Remove trailing space before line breaks
      .replace(/ +$/gm, '')
      // Max 2 consecutive linebreaks
      .replace(/\n{3,}/g, '\n\n');
  }
}
