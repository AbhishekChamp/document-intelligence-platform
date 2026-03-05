import type { AnalysisResult as AnalysisResultType } from "../../shared/types/domain.types";
import type {
  AnalysisMode,
  ProgressStep,
} from "../analysis/analysis-orchestrator";
import { textExtractor } from "../../infrastructure/extraction/text-extractor";
import { analysisOrchestrator } from "../analysis/analysis-orchestrator";

export interface ProcessingOptions {
  skipOCR?: boolean;
  maxFileSize?: number;
}

export class DocumentProcessor {
  private isProcessing = false;

  async processFile(
    file: File,
    mode: AnalysisMode = "full",
    onProgress?: (step: ProgressStep) => void,
  ): Promise<AnalysisResultType> {
    if (this.isProcessing) {
      throw new Error(
        "Another document is being processed. Please wait for it to complete.",
      );
    }
    this.isProcessing = true;
    onProgress?.({ percentage: 0, message: "Reading file..." });

    const extracted = await textExtractor.extractFromFile(file);
    const sourceType = this.getSourceType(file.type);

    onProgress?.({
      percentage: 5,
      message: "File loaded, starting analysis...",
    });

    try {
      return await analysisOrchestrator.analyze(
        extracted.text,
        mode,
        sourceType,
        file.name,
        extracted.confidence,
        onProgress,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  async processText(
    text: string,
    fileName?: string,
    mode: AnalysisMode = "full",
    onProgress?: (step: ProgressStep) => void,
  ): Promise<AnalysisResultType> {
    if (this.isProcessing) {
      throw new Error(
        "Another document is being processed. Please wait for it to complete.",
      );
    }
    this.isProcessing = true;
    onProgress?.({ percentage: 0, message: "Processing text..." });
    try {
      return await analysisOrchestrator.analyze(
        text,
        mode,
        "text",
        fileName,
        undefined,
        onProgress,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  async processUrl(
    url: string,
    mode: AnalysisMode = "full",
  ): Promise<AnalysisResultType> {
    if (this.isProcessing) {
      throw new Error(
        "Another document is being processed. Please wait for it to complete.",
      );
    }
    this.isProcessing = true;
    try {
      const extracted = await textExtractor.extractFromUrl(url);
      const sourceType = this.getSourceType(extracted.mimeType || "");

      return await analysisOrchestrator.analyze(
        extracted.text,
        mode,
        sourceType,
        url,
        extracted.confidence,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private getSourceType(
    mimeType: string,
  ): AnalysisResultType["document"]["metadata"]["sourceType"] {
    if (mimeType.includes("html")) return "html";
    if (mimeType.includes("svg")) return "svg";
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.startsWith("image/")) return "image";
    return "text";
  }
}

export const documentProcessor = new DocumentProcessor();
