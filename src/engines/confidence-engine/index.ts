import type {
  ValidationEngine,
  ValidationIssue,
  NormalizedDocument,
  DocumentScore,
  ReadabilityMetrics,
} from "../../shared/types/domain.types";
import type { ValidationEngine as IValidationEngine } from "../../shared/types/domain.types";

interface EngineResult {
  engine: string;
  issues: ValidationIssue[];
  confidence: number;
}

export class ConfidenceEngine implements ValidationEngine {
  name = "Confidence Engine";
  version = "1.0.0";
  enabled = true;

  private engines: IValidationEngine[] = [];
  private scores: DocumentScore | null = null;

  registerEngine(engine: IValidationEngine): void {
    this.engines.push(engine);
  }

  async analyze(): Promise<ValidationIssue[]> {
    return [];
  }

  async analyzeWithEngines(
    document: NormalizedDocument,
    metrics: ReadabilityMetrics | null,
    ocrConfidence?: number,
  ): Promise<{ issues: ValidationIssue[]; score: DocumentScore }> {
    const engineResults: EngineResult[] = [];
    const allIssues: ValidationIssue[] = [];

    for (const engine of this.engines) {
      if (!engine.enabled) continue;

      try {
        const engineIssues = await engine.analyze(document);
        const avgIssueConfidence =
          engineIssues.length > 0
            ? engineIssues.reduce((sum, i) => sum + i.confidence, 0) /
              engineIssues.length
            : 1;

        const confidence = 0.7 + avgIssueConfidence * 0.3;

        engineResults.push({
          engine: engine.name,
          issues: engineIssues,
          confidence: Math.min(1, confidence),
        });

        allIssues.push(...engineIssues);
      } catch (error) {
        console.error(`Engine ${engine.name} failed:`, error);
      }
    }

    this.scores = this.calculateScores(engineResults, metrics, ocrConfidence);

    return { issues: allIssues, score: this.scores };
  }

  private calculateScores(
    results: EngineResult[],
    metrics: ReadabilityMetrics | null,
    ocrConfidence?: number,
  ): DocumentScore {
    let clarityScore = 75;
    if (metrics) {
      const fleschContribution = metrics.fleschReadingScore * 0.3;
      const sentencePenalty = Math.min(
        30,
        Math.max(0, metrics.averageSentenceLength - 15) * 2,
      );
      const paragraphDensity =
        metrics.wordCount / Math.max(1, metrics.paragraphCount);
      const paragraphPenalty = Math.min(
        20,
        Math.max(0, paragraphDensity - 50) * 0.2,
      );
      const complexPenalty = metrics.complexWordPercentage * 0.3;
      const passivePenalty = metrics.passiveVoicePercentage * 0.5;

      clarityScore = Math.max(
        0,
        Math.min(
          100,
          50 +
            fleschContribution * 0.4 -
            sentencePenalty -
            paragraphPenalty -
            complexPenalty -
            passivePenalty,
        ),
      );
    }

    const spellIssues =
      results.find((r) => r.engine.includes("Spell"))?.issues.length || 0;
    const grammarIssues =
      results.find((r) => r.engine.includes("Grammar"))?.issues.length || 0;

    const totalWords = metrics?.wordCount || 100;
    const errorRate = (spellIssues + grammarIssues) / Math.max(1, totalWords);
    const correctnessScore = Math.max(0, Math.min(100, 100 - errorRate * 500));

    const complianceIssues =
      results.find((r) => r.engine.includes("Compliance"))?.issues || [];
    const highSeverityCompliance = complianceIssues.filter(
      (i) => i.severity === "high",
    ).length;
    const mediumSeverityCompliance = complianceIssues.filter(
      (i) => i.severity === "medium",
    ).length;

    const compliancePenalty =
      highSeverityCompliance * 15 + mediumSeverityCompliance * 5;
    const complianceScore = Math.max(0, Math.min(100, 100 - compliancePenalty));

    let confidenceScore =
      results.length > 0
        ? (results.reduce((sum, r) => sum + r.confidence, 0) / results.length) *
          100
        : 50;

    if (ocrConfidence !== undefined) {
      confidenceScore = confidenceScore * 0.6 + ocrConfidence * 0.4;
    }

    const overallScore = Math.round(
      clarityScore * 0.25 +
        correctnessScore * 0.35 +
        complianceScore * 0.25 +
        confidenceScore * 0.15,
    );

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      clarityScore: Math.round(clarityScore),
      correctnessScore: Math.round(correctnessScore),
      complianceScore: Math.round(complianceScore),
      confidenceScore: Math.round(confidenceScore),
    };
  }

  getScores(): DocumentScore | null {
    return this.scores;
  }

  getQualityGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    if (score >= 40) return "D";
    return "F";
  }

  getQualityLabel(score: number): string {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  }
}

export const confidenceEngine = new ConfidenceEngine();
