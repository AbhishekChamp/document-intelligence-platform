export type Severity = "low" | "medium" | "high";
export type IssueType =
  | "spell"
  | "grammar"
  | "readability"
  | "compliance"
  | "confidence";

export interface Token {
  text: string;
  startIndex: number;
  endIndex: number;
  type: "word" | "punctuation" | "whitespace" | "number" | "symbol";
}

export interface DocumentMetadata {
  sourceType: "html" | "svg" | "pdf" | "image" | "text";
  extractedAt: number;
  ocrConfidence?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface NormalizedDocument {
  id: string;
  rawText: string;
  tokens: Token[];
  metadata: DocumentMetadata;
}

export interface ValidationIssue {
  id: string;
  type: IssueType;
  severity: Severity;
  message: string;
  suggestions: string[];
  startIndex: number;
  endIndex: number;
  confidence: number;
  engine: string;
  rule?: string;
}

export interface DocumentScore {
  overallScore: number;
  clarityScore: number;
  correctnessScore: number;
  complianceScore: number;
  confidenceScore: number;
}

export interface AnalysisResult {
  documentId: string;
  document: NormalizedDocument;
  issues: ValidationIssue[];
  score: DocumentScore;
  metrics: ReadabilityMetrics;
  analyzedAt: number;
  enginesUsed: string[];
}

export interface ReadabilityMetrics {
  averageSentenceLength: number;
  averageWordLength: number;
  syllableCount: number;
  fleschReadingScore: number;
  fleschGradeLevel: string;
  passiveVoicePercentage: number;
  paragraphCount: number;
  sentenceCount: number;
  wordCount: number;
  complexWordCount: number;
  complexWordPercentage: number;
}

export interface ValidationEngine {
  name: string;
  version: string;
  enabled: boolean;
  analyze(document: NormalizedDocument): Promise<ValidationIssue[]>;
}

export interface MetricsEngine {
  name: string;
  version: string;
  enabled: boolean;
  analyze(document: NormalizedDocument): Promise<void>;
  getMetrics(): ReadabilityMetrics | null;
}

export interface EngineConfig {
  name: string;
  version: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface ComplianceRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  severity: Severity;
  message: string;
  category: string;
}

export interface GrammarRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Severity;
  message: string;
  suggestion?: string;
}

export interface ExtractedContent {
  text: string;
  confidence?: number;
  mimeType?: string;
}

export interface DocumentHistory {
  id: string;
  analysisResults: AnalysisResult[];
  createdAt: number;
  updatedAt: number;
}
