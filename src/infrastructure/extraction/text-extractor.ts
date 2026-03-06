import * as pdfjs from "pdfjs-dist";
import { createWorker, type Worker } from "tesseract.js";
import DOMPurify from "dompurify";
import type { ExtractedContent } from "../../shared/types/domain.types";
import { stripHtml, normalizeWhitespace } from "../../shared/utils/text";
import { preprocessImage, preprocessPdfPage } from "./image-preprocessor";

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
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly WORKER_IDLE_TIMEOUT = 120000; // 2 minutes for OCR operations
  private isDestroyed = false;
  private pendingOperations = 0;

  async extractFromFile(file: File): Promise<ExtractedContent> {
    if (this.isDestroyed) {
      throw new Error("TextExtractor has been destroyed");
    }

    this.pendingOperations++;
    try {
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
          return await this.extractFromText(file);
        case "text/html":
          return await this.extractFromHtml(file);
        default:
          return await this.extractFromText(file);
      }
    } finally {
      this.pendingOperations--;
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

          // Calculate optimal size for OCR (target ~1800px width)
          const targetWidth = 1800;
          const scale = Math.max(1, targetWidth / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          // White background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, "image/png"),
          );

          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Failed to convert canvas to blob"));
            return;
          }

          // Try preprocessing for better OCR - conservative settings
          try {
            blob = await preprocessImage(blob, {
              targetWidth: 1800,
              enhanceContrast: false,
              denoise: false,
            });
          } catch (preprocessErr) {
            console.warn(
              "SVG preprocessing failed, using original:",
              preprocessErr,
            );
          }

          const result = await this.performOcr(blob);

          resolve({
            text: this.sanitizeText(normalizeWhitespace(result.text)),
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
      let hasTextContent = false;
      const pageTexts: string[] = [];
      let totalConfidence = 0;
      let ocrPageCount = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Properly reconstruct text with positional awareness
        let pageText = this.reconstructPdfText(content.items as TextItem[]);

        // Clean up the page text
        pageText = this.cleanPdfText(pageText);

        // Check if we got meaningful text
        if (pageText.trim().length > 50) {
          hasTextContent = true;
          if (pageText.trim()) {
            pageTexts.push(pageText);
          }
        } else {
          // Low text content - try OCR on the page
          try {
            const ocrText = await this.extractPageWithOcr(page);
            if (ocrText.text.trim()) {
              pageTexts.push(ocrText.text);
              totalConfidence += ocrText.confidence;
              ocrPageCount++;
            }
          } catch (ocrError) {
            console.warn(`OCR failed for page ${i}:`, ocrError);
            // Use whatever text we got from PDF.js
            if (pageText.trim()) {
              pageTexts.push(pageText);
            }
          }
        }

        // Clean up page resources
        page.cleanup();
      }

      fullText = pageTexts.join("\n\n");

      // Calculate overall confidence
      let confidence: number | undefined;
      if (ocrPageCount > 0) {
        confidence = totalConfidence / ocrPageCount;
      } else if (hasTextContent) {
        confidence = 95; // High confidence for native PDF text
      }

      return {
        text: fullText,
        mimeType: file.type,
        confidence,
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
   * Extract text from a PDF page using OCR (for scanned/image-based PDFs)
   */
  private async extractPageWithOcr(
    page: pdfjs.PDFPageProxy,
  ): Promise<{ text: string; confidence: number }> {
    // Render page to canvas at high resolution
    const scale = 2.5; // Higher scale for better OCR
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // White background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page.render as any)({
      canvasContext: context,
      viewport: viewport,
      background: "white",
    }).promise;

    // Preprocess the image
    const processedBlob = await preprocessPdfPage(canvas);

    // Perform OCR
    return this.performOcr(processedBlob);
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
    let objectUrl: string | null = null;

    try {
      // First try with the original image
      const originalUrl = URL.createObjectURL(file);
      objectUrl = originalUrl;

      let result;
      try {
        // Try preprocessing first - conservative settings
        const processedBlob = await preprocessImage(file, {
          targetWidth: 1800,
          enhanceContrast: false,
          denoise: false,
        });

        // Use processed image for OCR
        URL.revokeObjectURL(originalUrl);
        objectUrl = URL.createObjectURL(processedBlob);

        result = await this.performOcr(objectUrl);
      } catch (preprocessError) {
        console.warn(
          "Preprocessing failed, falling back to original image:",
          preprocessError,
        );
        // Fall back to original image
        result = await this.performOcr(objectUrl);
      }

      return {
        text: this.sanitizeText(normalizeWhitespace(result.text)),
        confidence: result.confidence,
        mimeType: file.type,
      };
    } catch (error) {
      console.error("OCR extraction error:", error);
      throw new Error(
        `Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }

  private async getWorker(): Promise<Worker> {
    // Cancel any pending idle timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

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
    }).catch(() => {
      this.workerPromise = null;
      throw new Error("OCR engine failed to initialize. Please try again.");
    });

    this.worker = await this.workerPromise;

    // Configure Tesseract for optimal accuracy
    await this.configureWorker();

    return this.worker;
  }

  /**
   * Configure Tesseract worker for optimal text recognition
   */
  private async configureWorker(): Promise<void> {
    if (!this.worker) return;

    // Set parameters for better accuracy
    // Using minimal config - let Tesseract use its defaults for most things
    await this.worker.setParameters({
      // Preserve interword spaces - this helps with document layout
      preserve_interword_spaces: "1",

      // Debug level - 0 means no debug output
      debug_file: "/dev/null",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  /**
   * Schedule worker termination after idle period
   */
  private scheduleWorkerTermination(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    this.idleTimeout = setTimeout(() => {
      this.terminateWorker();
    }, this.WORKER_IDLE_TIMEOUT);
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

      // Schedule worker termination after use
      this.scheduleWorkerTermination();

      let extractedText = result.data.text?.trim() || "";
      const confidence = result.data.confidence || 0;

      // Post-processing for US-English text
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

    // Fix common OCR character confusions for US-English
    const ocrCorrections: [RegExp, string][] = [
      // Common character swaps
      [/[\u2018\u2019]/g, "'"], // Smart quotes to straight
      [/[\u201C\u201D]/g, '"'], // Smart double quotes
      [/\u2014/g, "--"], // Em dash
      [/\u2013/g, "-"], // En dash

      // Common OCR errors
      [/\|/g, "I"], // Pipe to capital I
      [/0(?=\s|$)/g, "O"], // Isolated 0 to O
      [/([A-Z])1([A-Z])/g, "$1I$2"], // 1 between capitals to I
      [/([a-z])1([a-z])/g, "$1l$2"], // 1 between lowercase to l

      // Fix common word errors - spaces before contractions
      [/\s+'(?=ll|re|ve|s|d|m)\b/g, "'"], // Fix spacing with contractions

      // Normalize multiple spaces
      [/  +/g, " "],

      // Fix hyphenation at line breaks (common in documents)
      [/([a-zA-Z])-\s*\n\s*([a-zA-Z])/g, "$1$2"],
    ];

    for (const [pattern, replacement] of ocrCorrections) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    // Normalize paragraph breaks (max 2)
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
  }

  /**
   * Terminate the worker to free resources
   */
  async terminateWorker(): Promise<void> {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (error) {
        console.warn("Error terminating worker:", error);
      }
      this.worker = null;
      this.workerPromise = null;
    }
  }

  /**
   * Destroy the extractor and cleanup all resources
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    // Force terminate worker even if operations are pending
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // Ignore termination errors during destroy
      }
      this.worker = null;
      this.workerPromise = null;
    }
  }

  /**
   * Check if there are pending operations
   */
  hasPendingOperations(): boolean {
    return this.pendingOperations > 0;
  }

  /**
   * Sanitize extracted text to prevent XSS
   */
  private sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
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
