import * as pdfjs from "pdfjs-dist";
import { createWorker, type Worker } from "tesseract.js";
import type { ExtractedContent } from "../../shared/types/domain.types";
import { stripHtml, normalizeWhitespace } from "../../shared/utils/text";

// PDF.js TextItem interface for proper typing
interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL?: boolean;
}

// Configure PDF.js worker - use local worker in production, CDN in development
const isDev = import.meta.env.DEV;
if (isDev) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} else {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

export class TextExtractor {
  private worker: Worker | null = null;
  private workerPromise: Promise<Worker> | null = null;

  async extractFromFile(file: File): Promise<ExtractedContent> {
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    // Determine file type by extension if MIME type is generic
    if (fileName.endsWith(".svg") || mimeType === "image/svg+xml") {
      return this.extractFromSvg(file);
    }
    if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      return this.extractFromPdf(file);
    }
    if (
      fileName.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/) ||
      mimeType.startsWith("image/")
    ) {
      return this.extractFromImage(file);
    }

    switch (mimeType) {
      case "text/plain":
        return this.extractFromText(file);
      case "text/html":
        return this.extractFromHtml(file);
      default:
        return this.extractFromText(file);
    }
  }

  private async extractFromText(file: File): Promise<ExtractedContent> {
    const text = await file.text();
    return {
      text: normalizeWhitespace(text),
      mimeType: file.type,
    };
  }

  private async extractFromHtml(file: File): Promise<ExtractedContent> {
    const html = await file.text();
    return {
      text: normalizeWhitespace(stripHtml(html)),
      mimeType: file.type,
    };
  }

  private async extractFromSvg(file: File): Promise<ExtractedContent> {
    try {
      const svgText = await file.text();

      // First, try to extract text elements from SVG
      const textElements = this.extractTextFromSvg(svgText);

      if (textElements.length > 0) {
        const combinedText = textElements.join("\n");
        return {
          text: normalizeWhitespace(combinedText),
          mimeType: file.type,
          confidence: 100,
        };
      }

      // No text elements - render to canvas and OCR
      return this.extractFromSvgViaOcr(svgText, file.type);
    } catch (error) {
      console.error("SVG extraction error:", error);
      throw new Error(
        `Failed to extract text from SVG: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private extractTextFromSvg(svgContent: string): string[] {
    const texts: string[] = [];

    // Parse SVG in a DOM parser for better handling
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, "image/svg+xml");
      const parserError = doc.querySelector("parsererror");

      if (parserError) {
        // Fallback to regex if DOM parsing fails
        return this.extractTextFromSvgRegex(svgContent);
      }

      // Extract from various text-containing elements
      const textSelectors = ["text", "tspan", "title", "desc", "textPath"];

      for (const selector of textSelectors) {
        const elements = doc.querySelectorAll(selector);
        elements.forEach((el) => {
          // Get text content, excluding nested element content to avoid duplication
          const text = this.getTextContentRecursive(el);
          if (text.trim()) {
            texts.push(text.trim());
          }
        });
      }

      // Also check for aria-label attributes which often contain text
      const labeledElements = doc.querySelectorAll("[aria-label]");
      labeledElements.forEach((el) => {
        const label = el.getAttribute("aria-label");
        if (label && label.trim()) {
          texts.push(label.trim());
        }
      });
    } catch (error) {
      console.warn("DOM parsing failed for SVG, using regex fallback:", error);
      return this.extractTextFromSvgRegex(svgContent);
    }

    return texts;
  }

  /**
   * Get text content from an element, handling nested elements properly
   * to avoid duplicate text extraction
   */
  private getTextContentRecursive(element: Element): string {
    let text = "";

    // Check for display:none or visibility:hidden
    const computedDisplay = element.getAttribute("display");
    const computedVisibility = element.getAttribute("visibility");

    if (computedDisplay === "none" || computedVisibility === "hidden") {
      return "";
    }

    // Process child nodes
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        // Skip script and style elements
        if (tagName === "script" || tagName === "style") {
          continue;
        }

        // For tspan and similar, get their content recursively
        if (["tspan", "textPath", "a"].includes(tagName)) {
          text += this.getTextContentRecursive(el);
        }
      }
    }

    return text;
  }

  /**
   * Fallback regex-based SVG text extraction
   */
  private extractTextFromSvgRegex(svgContent: string): string[] {
    const texts: string[] = [];

    // Extract text from <text> elements - handle nested tspans
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
    let match;
    while ((match = textRegex.exec(svgContent)) !== null) {
      let textContent = match[1];
      // Replace tspans with their content
      textContent = textContent.replace(
        /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi,
        "$1",
      );
      // Remove any remaining tags
      textContent = textContent.replace(/<[^>]+>/g, "");
      textContent = this.decodeHtmlEntities(textContent);
      if (textContent.trim()) {
        texts.push(textContent.trim());
      }
    }

    // Extract from title elements
    const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/gi;
    while ((match = titleRegex.exec(svgContent)) !== null) {
      const title = this.decodeHtmlEntities(
        match[1].replace(/<[^>]+>/g, "").trim(),
      );
      if (title) texts.push(title);
    }

    // Extract from desc elements
    const descRegex = /<desc[^>]*>([\s\S]*?)<\/desc>/gi;
    while ((match = descRegex.exec(svgContent)) !== null) {
      const desc = this.decodeHtmlEntities(
        match[1].replace(/<[^>]+>/g, "").trim(),
      );
      if (desc) texts.push(desc);
    }

    return texts;
  }

  private decodeHtmlEntities(text: string): string {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  private async extractFromSvgViaOcr(
    svgContent: string,
    mimeType: string,
  ): Promise<ExtractedContent> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgContent], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Use 4x scale for SVG to ensure crisp text
          const scale = 4;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, "image/png"),
          );

          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Failed to convert canvas to blob"));
            return;
          }

          const result = await this.performOcr(blob);

          resolve({
            text: normalizeWhitespace(result.text),
            confidence: result.confidence,
            mimeType: mimeType,
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = url;
    });
  }

  private async extractFromPdf(file: File): Promise<ExtractedContent> {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document with proper typing
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/",
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;

      let fullText = "";
      const pageTexts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Properly reconstruct text with positional awareness
        let pageText = this.reconstructPdfText(content.items as TextItem[]);

        // Clean up the page text
        pageText = this.cleanPdfText(pageText);

        if (pageText.trim()) {
          pageTexts.push(pageText);
        }

        // Clean up page resources
        page.cleanup();
      }

      fullText = pageTexts.join("\n\n");

      return {
        text: fullText,
        mimeType: file.type,
      };
    } catch (error) {
      console.error("PDF extraction error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Invalid PDF")) {
          throw new Error(
            "The file appears to be corrupted or is not a valid PDF.",
          );
        } else if (error.message.includes("password")) {
          throw new Error(
            "This PDF is password protected and cannot be processed.",
          );
        } else if (error.message.includes("Missing")) {
          throw new Error(
            "PDF.js worker failed to load. Please check your internet connection and try again.",
          );
        }
      }

      throw new Error(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Reconstruct PDF text preserving structure based on item positions
   */
  private reconstructPdfText(items: TextItem[]): string {
    if (!items.length) return "";

    // Sort items by vertical position (top to bottom), then horizontal (left to right)
    const sortedItems = [...items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    let result = "";
    let lastY: number | null = null;
    let lastX: number | null = null;

    for (const item of sortedItems) {
      const text = item.str;
      if (!text.trim()) continue;

      const x = item.transform[4];
      const y = item.transform[5];
      const width = item.width || 0;

      // Detect line breaks (significant y change)
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        result += "\n";
        lastX = null;
      }
      // Detect word breaks (significant x gap)
      else if (lastX !== null && x - lastX > width * 0.3) {
        result += " ";
      }

      result += text;
      lastY = y;
      lastX = x + width;
    }

    return result;
  }

  /**
   * Clean up common PDF extraction artifacts
   */
  private cleanPdfText(text: string): string {
    if (!text) return "";

    let cleaned = text;

    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Remove form feed characters
    cleaned = cleaned.replace(/\f/g, "\n");

    // Normalize multiple spaces (but not at line starts - preserve indentation)
    cleaned = cleaned.replace(/([^\n])[ \t]+/g, "$1 ");

    // Remove lines that are just whitespace
    cleaned = cleaned
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");

    // Normalize multiple blank lines to max 2
    cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");

    return cleaned.trim();
  }

  private async extractFromImage(file: File): Promise<ExtractedContent> {
    let imageUrl: string | null = null;

    try {
      // Read file as data URL directly
      imageUrl = await this.fileToDataUrl(file);

      // Perform OCR - Tesseract works best with original images
      // Heavy preprocessing often hurts accuracy more than helps
      const result = await this.performOcr(imageUrl);

      return {
        text: normalizeWhitespace(result.text),
        confidence: result.confidence,
        mimeType: file.type,
      };
    } catch (error) {
      console.error("OCR extraction error:", error);
      throw new Error(
        `Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Cleanup
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    }
  }

  private async getWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    if (this.workerPromise) {
      return this.workerPromise;
    }

    const workerPath = isDev ? undefined : "/tesseract/worker.min.js";

    this.workerPromise = createWorker("eng", 1, {
      logger: () => {},
      errorHandler: (err) => {
        console.error("Tesseract error:", err);
      },
      ...(workerPath ? { workerPath } : {}),
    }).catch((err) => {
      console.error("Failed to create Tesseract worker:", err);
      this.workerPromise = null;
      throw new Error("OCR engine failed to initialize. Please try again.");
    });

    this.worker = await this.workerPromise;

    return this.worker;
  }

  private async performOcr(
    imageSource: string | Blob,
  ): Promise<{ text: string; confidence: number }> {
    let imageUrl: string;

    if (typeof imageSource === "string") {
      // It's already a data URL
      imageUrl = imageSource;
    } else {
      // It's a blob, create object URL
      imageUrl = URL.createObjectURL(imageSource);
    }

    try {
      const worker = await this.getWorker();

      // Run OCR with optimized settings for US-English text
      const result = await worker.recognize(imageUrl);

      let extractedText = result.data.text?.trim() || "";
      const confidence = result.data.confidence || 0;

      // Light post-processing for US-English text
      extractedText = this.postProcessEnglishText(extractedText);

      return { text: extractedText, confidence };
    } catch (error) {
      console.error("OCR failed:", error);
      throw new Error(
        `OCR failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Only revoke if we created the URL from a blob
      if (typeof imageSource !== "string") {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  /**
   * Post-process OCR text to improve US-English accuracy
   */
  private postProcessEnglishText(text: string): string {
    if (!text) return "";

    let cleaned = text;

    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Fix common OCR character confusions (be conservative)
    // Only fix obvious errors that are clearly wrong
    const ocrCorrections: [RegExp, string][] = [
      [/\b0(?=\d{3,4}\b)/g, "O"], // 0 followed by 3-4 digits is likely O (year codes)
    ];

    for (const [pattern, replacement] of ocrCorrections) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    // Normalize multiple spaces to single space
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    // Normalize paragraph breaks (max 2)
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
  }

  /**
   * Terminate the worker to free resources
   */
  async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.workerPromise = null;
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("FileReader did not return a string"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async extractFromUrl(url: string): Promise<ExtractedContent> {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      return {
        text: normalizeWhitespace(stripHtml(html)),
        mimeType: contentType,
      };
    }

    const blob = await response.blob();
    const file = new File([blob], "downloaded", { type: contentType });
    return this.extractFromFile(file);
  }
}

export const textExtractor = new TextExtractor();
