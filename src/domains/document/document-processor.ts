import type { AnalysisResult as AnalysisResultType } from '../../shared/types/domain.types';
import type { AnalysisMode, ProgressStep } from '../analysis/analysis-orchestrator';
import { textExtractor } from '../../infrastructure/extraction/text-extractor';
import { analysisOrchestrator } from '../analysis/analysis-orchestrator';

export interface ProcessingOptions {
  skipOCR?: boolean;
  maxFileSize?: number;
}

export class DocumentProcessor {
  async processFile(
    file: File,
    mode: AnalysisMode = 'full',
    onProgress?: (step: ProgressStep) => void
  ): Promise<AnalysisResultType> {
    onProgress?.({ percentage: 0, message: 'Reading file...' });
    
    const extracted = await textExtractor.extractFromFile(file);
    const sourceType = this.getSourceType(file.type);

    onProgress?.({ percentage: 5, message: 'File loaded, starting analysis...' });

    return analysisOrchestrator.analyze(
      extracted.text,
      mode,
      sourceType,
      file.name,
      extracted.confidence,
      onProgress
    );
  }

  async processText(
    text: string,
    fileName?: string,
    mode: AnalysisMode = 'full',
    onProgress?: (step: ProgressStep) => void
  ): Promise<AnalysisResultType> {
    onProgress?.({ percentage: 0, message: 'Processing text...' });
    return analysisOrchestrator.analyze(text, mode, 'text', fileName, undefined, onProgress);
  }

  async processUrl(url: string, mode: AnalysisMode = 'full'): Promise<AnalysisResultType> {
    const extracted = await textExtractor.extractFromUrl(url);
    const sourceType = this.getSourceType(extracted.mimeType || '');

    return analysisOrchestrator.analyze(
      extracted.text,
      mode,
      sourceType,
      url,
      extracted.confidence
    );
  }

  private getSourceType(mimeType: string): AnalysisResultType['document']['metadata']['sourceType'] {
    if (mimeType.includes('html')) return 'html';
    if (mimeType.includes('svg')) return 'svg';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'text';
  }
}

export const documentProcessor = new DocumentProcessor();
