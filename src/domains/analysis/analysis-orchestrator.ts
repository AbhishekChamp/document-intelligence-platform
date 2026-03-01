import type { NormalizedDocument, AnalysisResult, ReadabilityMetrics, ValidationEngine } from '../../shared/types/domain.types';
import { generateId } from '../../shared/utils/id';
import { tokenize } from '../../shared/utils/text';
import { spellEngine } from '../../engines/spell-engine';
import { grammarEngine } from '../../engines/grammar-engine';
import { readabilityEngine } from '../../engines/readability-engine';
import { complianceEngine } from '../../engines/compliance-engine';
import { confidenceEngine } from '../../engines/confidence-engine';

export type AnalysisMode = 'full' | 'spell' | 'grammar' | 'readability' | 'compliance' | 'confidence';

export interface ProgressStep {
  percentage: number;
  message: string;
}

export class AnalysisOrchestrator {
  private engines: Record<string, ValidationEngine> = {
    spell: spellEngine,
    grammar: grammarEngine,
    readability: readabilityEngine,
    compliance: complianceEngine
  };

  private confidenceEngine = confidenceEngine;

  constructor() {
    Object.values(this.engines).forEach(engine => {
      this.confidenceEngine.registerEngine(engine);
    });
  }

  async analyze(
    text: string,
    mode: AnalysisMode = 'full',
    sourceType: NormalizedDocument['metadata']['sourceType'] = 'text',
    fileName?: string,
    ocrConfidence?: number,
    onProgress?: (step: ProgressStep) => void
  ): Promise<AnalysisResult> {
    const updateProgress = (percentage: number, message: string) => {
      onProgress?.({ percentage, message });
    };

    updateProgress(5, 'Initializing document processing...');

    const document: NormalizedDocument = {
      id: generateId(),
      rawText: text,
      tokens: tokenize(text),
      metadata: {
        sourceType,
        extractedAt: Date.now(),
        ocrConfidence,
        fileName
      }
    };

    updateProgress(15, 'Tokenizing document content...');

    let readabilityMetrics: ReadabilityMetrics | null = null;
    
    if (mode === 'full' || mode === 'readability') {
      if (readabilityEngine.enabled) {
        updateProgress(25, 'Analyzing readability metrics...');
        await readabilityEngine.analyze(document);
        readabilityMetrics = readabilityEngine.getMetrics();
      }
    }

    updateProgress(40, 'Running validation engines...');

    const { issues, score } = await this.analyzeWithMode(document, mode, readabilityMetrics, ocrConfidence, updateProgress);

    updateProgress(90, 'Finalizing analysis results...');

    const result: AnalysisResult = {
      documentId: document.id,
      document,
      issues: issues.sort((a: any, b: any) => {
        const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      score,
      metrics: readabilityMetrics || this.getDefaultMetrics(),
      analyzedAt: Date.now(),
      enginesUsed: this.getEnginesUsed(mode)
    };

    updateProgress(100, 'Analysis complete!');
    return result;
  }

  private async analyzeWithMode(
    document: NormalizedDocument,
    mode: AnalysisMode,
    metrics: ReadabilityMetrics | null,
    ocrConfidence?: number,
    updateProgress?: (percentage: number, message: string) => void
  ): Promise<{ issues: any[]; score: any }> {
    const allIssues: any[] = [];

    if (mode === 'full') {
      updateProgress?.(50, 'Checking spelling...');
      updateProgress?.(60, 'Analyzing grammar...');
      updateProgress?.(70, 'Checking compliance...');
      return this.confidenceEngine.analyzeWithEngines(document, metrics, ocrConfidence);
    }

    if (mode === 'spell') {
      updateProgress?.(50, 'Running spell check...');
      if (spellEngine.enabled) {
        const spellIssues = await spellEngine.analyze(document);
        allIssues.push(...spellIssues);
      }
    } else if (mode === 'grammar') {
      updateProgress?.(50, 'Analyzing grammar rules...');
      if (grammarEngine.enabled) {
        const grammarIssues = await grammarEngine.analyze(document);
        allIssues.push(...grammarIssues);
      }
    } else if (mode === 'readability') {
      updateProgress?.(50, 'Calculating readability metrics...');
      if (readabilityEngine.enabled) {
        const readabilityIssues = await readabilityEngine.analyze(document);
        allIssues.push(...readabilityIssues);
      }
    } else if (mode === 'compliance') {
      updateProgress?.(50, 'Checking compliance rules...');
      if (complianceEngine.enabled) {
        const complianceIssues = await complianceEngine.analyze(document);
        allIssues.push(...complianceIssues);
      }
    }

    const score = this.calculateSimpleScore(allIssues, metrics);
    return { issues: allIssues, score };
  }

  private calculateSimpleScore(issues: any[], metrics: ReadabilityMetrics | null) {
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;
    
    const penalty = (highCount * 15) + (mediumCount * 5) + (lowCount * 1);
    const baseScore = metrics ? Math.min(100, 100 - penalty) : Math.max(0, 100 - penalty);
    
    return {
      overallScore: Math.round(baseScore),
      clarityScore: metrics?.fleschReadingScore ? Math.round(metrics.fleschReadingScore) : 0,
      correctnessScore: 0,
      complianceScore: 0,
      confidenceScore: 0
    };
  }

  private getEnginesUsed(mode: AnalysisMode): string[] {
    if (mode === 'full') {
      return Object.values(this.engines)
        .filter(e => e.enabled)
        .map(e => e.name);
    }
    const engineMap: Record<string, string> = {
      spell: 'Spell Engine',
      grammar: 'Grammar Engine',
      readability: 'Readability Engine',
      compliance: 'Compliance Engine'
    };
    return [engineMap[mode] || 'Unknown Engine'];
  }

  getEngines() {
    return Object.values(this.engines);
  }

  toggleEngine(name: string): void {
    const engine = Object.values(this.engines).find(e => 
      e.name.toLowerCase().includes(name.toLowerCase())
    );
    if (engine) {
      engine.enabled = !engine.enabled;
    }
  }

  setEngineEnabled(name: string, enabled: boolean): void {
    const engine = Object.values(this.engines).find(e => 
      e.name.toLowerCase().includes(name.toLowerCase())
    );
    if (engine) {
      engine.enabled = enabled;
    }
  }

  private getDefaultMetrics(): ReadabilityMetrics {
    return {
      averageSentenceLength: 0,
      averageWordLength: 0,
      syllableCount: 0,
      fleschReadingScore: 50,
      fleschGradeLevel: 'Unknown',
      passiveVoicePercentage: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      wordCount: 0,
      complexWordCount: 0,
      complexWordPercentage: 0
    };
  }
}

export const analysisOrchestrator = new AnalysisOrchestrator();
