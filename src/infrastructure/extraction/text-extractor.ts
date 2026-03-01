import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import type { ExtractedContent } from '../../shared/types/domain.types';
import { stripHtml, normalizeWhitespace } from '../../shared/utils/text';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export class TextExtractor {
  async extractFromFile(file: File): Promise<ExtractedContent> {
    const mimeType = file.type;

    switch (mimeType) {
      case 'text/plain':
        return this.extractFromText(file);
      case 'text/html':
      case 'image/svg+xml':
        return this.extractFromHtml(file);
      case 'application/pdf':
        return this.extractFromPdf(file);
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
        return this.extractFromImage(file);
      default:
        return this.extractFromText(file);
    }
  }

  private async extractFromText(file: File): Promise<ExtractedContent> {
    const text = await file.text();
    return {
      text: normalizeWhitespace(text),
      mimeType: file.type
    };
  }

  private async extractFromHtml(file: File): Promise<ExtractedContent> {
    const html = await file.text();
    return {
      text: normalizeWhitespace(stripHtml(html)),
      mimeType: file.type
    };
  }

  private async extractFromPdf(file: File): Promise<ExtractedContent> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: unknown) => {
        const textItem = item as { str: string };
        return textItem.str;
      }).join(' ') + '\n';
    }

    return {
      text: normalizeWhitespace(text),
      mimeType: file.type
    };
  }

  private async extractFromImage(file: File): Promise<ExtractedContent> {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: () => {}
    });

    return {
      text: normalizeWhitespace(result.data.text),
      confidence: result.data.confidence,
      mimeType: file.type
    };
  }

  async extractFromUrl(url: string): Promise<ExtractedContent> {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
      const html = await response.text();
      return {
        text: normalizeWhitespace(stripHtml(html)),
        mimeType: contentType
      };
    }

    const blob = await response.blob();
    const file = new File([blob], 'downloaded', { type: contentType });
    return this.extractFromFile(file);
  }
}

export const textExtractor = new TextExtractor();
