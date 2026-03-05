import type {
  MetricsEngine,
  ValidationIssue,
  NormalizedDocument,
  ReadabilityMetrics,
} from "../../shared/types/domain.types";
import { generateId } from "../../shared/utils/id";
import {
  getSentences,
  getWords,
  getParagraphs,
  countSyllables,
  isComplexWord,
} from "../../shared/utils/text";

export class ReadabilityEngine implements MetricsEngine {
  name = "Readability Engine";
  version = "1.0.0";
  enabled = true;
  private metrics: ReadabilityMetrics | null = null;
  private issues: ValidationIssue[] = [];

  async analyze(document: NormalizedDocument): Promise<void> {
    const issues: ValidationIssue[] = [];
    const text = document.rawText;

    this.metrics = this.calculateMetrics(text);

    const sentences = getSentences(text);
    for (const sentence of sentences) {
      const words = getWords(sentence);
      if (words.length > 25) {
        const startIndex = text.indexOf(sentence);
        issues.push({
          id: generateId(),
          type: "readability",
          severity: words.length > 40 ? "high" : "medium",
          message: `Long sentence (${words.length} words)`,
          suggestions: ["Break this sentence into shorter sentences"],
          startIndex: Math.max(0, startIndex),
          endIndex: startIndex + sentence.length,
          confidence: 0.8,
          engine: this.name,
          rule: "long-sentence",
        });
      }
    }

    const paragraphs = getParagraphs(text);
    for (const paragraph of paragraphs) {
      const words = getWords(paragraph);
      if (words.length > 150) {
        const startIndex = text.indexOf(paragraph);
        issues.push({
          id: generateId(),
          type: "readability",
          severity: "medium",
          message: `Long paragraph (${words.length} words)`,
          suggestions: ["Split this paragraph into smaller paragraphs"],
          startIndex: Math.max(0, startIndex),
          endIndex: startIndex + paragraph.length,
          confidence: 0.75,
          engine: this.name,
          rule: "long-paragraph",
        });
      }
    }

    const allWords = getWords(text);
    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      if (isComplexWord(word) && word.length > 6) {
        const wordIndex = this.findWordIndex(text, word, i);
        if (wordIndex >= 0) {
          issues.push({
            id: generateId(),
            type: "readability",
            severity: "low",
            message: `Complex word: "${word}"`,
            suggestions: this.getSimplerAlternatives(word),
            startIndex: wordIndex,
            endIndex: wordIndex + word.length,
            confidence: 0.7,
            engine: this.name,
            rule: "complex-word",
          });
        }
      }
    }

    const passivePatterns = [
      /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi,
      /\b(has|have|had)\s+been\s+\w+ed\b/gi,
      /\b(was|were)\s+\w+ed\b/gi,
    ];

    for (const pattern of passivePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const startIndex = match.index || 0;
        issues.push({
          id: generateId(),
          type: "readability",
          severity: "low",
          message: "Possible passive voice detected",
          suggestions: ["Rewrite in active voice for clarity"],
          startIndex,
          endIndex: startIndex + match[0].length,
          confidence: 0.65,
          engine: this.name,
          rule: "passive-voice",
        });
      }
    }

    if (this.metrics.fleschReadingScore < 30) {
      issues.push({
        id: generateId(),
        type: "readability",
        severity: "medium",
        message: `Document is very difficult to read`,
        suggestions: [
          "Simplify vocabulary",
          "Use shorter sentences",
          "Break up long paragraphs",
        ],
        startIndex: 0,
        endIndex: text.length,
        confidence: 0.85,
        engine: this.name,
        rule: "low-readability",
      });
    }

    this.issues = issues;
  }

  getMetrics(): ReadabilityMetrics | null {
    return this.metrics;
  }

  getIssues(): ValidationIssue[] {
    return this.issues;
  }

  private calculateMetrics(text: string): ReadabilityMetrics {
    const sentences = getSentences(text);
    const words = getWords(text);
    const paragraphs = getParagraphs(text);

    // Guard against empty text
    const sentenceCount = Math.max(1, sentences.length);
    const wordCount = Math.max(1, words.length);
    const paragraphCount = Math.max(1, paragraphs.length);

    // Calculate averages safely
    const averageSentenceLength = wordCount / sentenceCount;
    const averageWordLength =
      words.length > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
        : 0;

    const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const complexWordCount = words.filter(isComplexWord).length;

    const averageSyllablesPerWord = syllableCount / wordCount;
    const fleschReadingScore =
      206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord;

    let passiveCount = 0;
    const passivePatterns = [
      /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi,
      /\b(has|have|had)\s+been\s+\w+ed\b/gi,
    ];
    for (const pattern of passivePatterns) {
      const matches = text.match(pattern);
      if (matches) passiveCount += matches.length;
    }
    const passiveVoicePercentage = (passiveCount / sentenceCount) * 100;

    let fleschGradeLevel: string;
    if (fleschReadingScore >= 90) fleschGradeLevel = "5th grade";
    else if (fleschReadingScore >= 80) fleschGradeLevel = "6th grade";
    else if (fleschReadingScore >= 70) fleschGradeLevel = "7th grade";
    else if (fleschReadingScore >= 60) fleschGradeLevel = "8th-9th grade";
    else if (fleschReadingScore >= 50) fleschGradeLevel = "10th-12th grade";
    else if (fleschReadingScore >= 30) fleschGradeLevel = "College";
    else fleschGradeLevel = "College graduate";

    return {
      averageSentenceLength,
      averageWordLength,
      syllableCount,
      fleschReadingScore: Math.max(0, Math.min(100, fleschReadingScore)),
      fleschGradeLevel,
      passiveVoicePercentage: Math.min(100, passiveVoicePercentage),
      paragraphCount,
      sentenceCount,
      wordCount,
      complexWordCount,
      complexWordPercentage:
        wordCount > 0 ? (complexWordCount / wordCount) * 100 : 0,
    };
  }

  private findWordIndex(
    text: string,
    word: string,
    occurrence: number,
  ): number {
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();
    let index = -1;

    for (let i = 0; i <= occurrence; i++) {
      index = lowerText.indexOf(lowerWord, index + 1);
      if (index === -1) break;
    }

    return index;
  }

  private getSimplerAlternatives(word: string): string[] {
    const alternatives: Record<string, string[]> = {
      utilize: ["use"],
      utilizes: ["uses"],
      utilizing: ["using"],
      facilitate: ["help", "make easier"],
      facilitates: ["helps"],
      facilitating: ["helping"],
      substantial: ["large", "considerable"],
      substantially: ["greatly", "considerably"],
      necessitate: ["require", "need"],
      necessitates: ["requires"],
      demonstrate: ["show", "prove"],
      demonstrates: ["shows"],
      demonstrating: ["showing"],
      subsequently: ["later", "afterward"],
      consequently: ["so", "therefore"],
      nevertheless: ["however", "still"],
      notwithstanding: ["despite", "although"],
      accomplish: ["achieve", "do"],
      accomplishes: ["achieves"],
      accomplishing: ["achieving"],
      implementation: ["use", "application"],
      functionality: ["features", "functions"],
      optimization: ["improvement"],
      configuration: ["setup", "settings"],
      infrastructure: ["structure", "foundation"],
      methodology: ["method", "approach"],
      perspective: ["view", "outlook"],
      initiative: ["project", "plan"],
      collaboration: ["cooperation", "teamwork"],
      integration: ["combination", "merging"],
      transformation: ["change", "conversion"],
      sustainability: ["endurance", "viability"],
    };

    return (
      alternatives[word.toLowerCase()] || ["Consider using a simpler word"]
    );
  }
}

export const readabilityEngine = new ReadabilityEngine();
