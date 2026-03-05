import type {
  ValidationEngine,
  ValidationIssue,
  NormalizedDocument,
} from "../../shared/types/domain.types";
import { generateId } from "../../shared/utils/id";

interface DictionaryData {
  name: string;
  version: string;
  locale: string;
  words: string[];
  abbreviations: Record<string, string>;
  commonMisspellings: Record<string, string>;
}

// Web Worker for spell checking
class SpellWorker {
  private worker: Worker | null = null;
  private pendingRequests: Map<
    string,
    { resolve: (value: string[]) => void; reject: (error: Error) => void }
  > = new Map();
  private requestId = 0;
  private isWorkerAvailable = typeof Worker !== "undefined";

  async init(): Promise<void> {
    if (this.worker || !this.isWorkerAvailable) return;

    try {
      this.worker = new Worker("/workers/spell-worker.js");
    } catch {
      this.isWorkerAvailable = false;
      return;
    }

    this.worker.onmessage = (event) => {
      const { type, id, payload } = event.data;

      if (type === "RESULT") {
        const request = this.pendingRequests.get(id);
        if (request) {
          this.pendingRequests.delete(id);
          request.resolve(payload);
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error("Spell worker error:", error);
    };
  }

  async findSimilarWords(
    word: string,
    wordList: string[],
    maxDistance: number = 1,
  ): Promise<string[]> {
    await this.init();

    // If Worker is not available (e.g., in tests), use synchronous fallback
    if (!this.isWorkerAvailable || !this.worker) {
      return this.findSimilarWordsSync(word, wordList, maxDistance);
    }

    return new Promise((resolve, reject) => {
      const id = `req-${++this.requestId}`;
      this.pendingRequests.set(id, { resolve, reject });

      // For smaller lists, do it directly without worker
      if (wordList.length < 1000) {
        const suggestions = this.findSimilarWordsSync(
          word,
          wordList,
          maxDistance,
        );
        resolve(suggestions);
        return;
      }
      this.worker!.postMessage({
        type: "FIND_SIMILAR",
        id,
        payload: { word, wordList, maxDistance },
      });
    });
  }

  private findSimilarWordsSync(
    word: string,
    wordList: string[],
    maxDistance: number = 1,
  ): string[] {
    const lowerWord = word.toLowerCase();
    const scoredSuggestions: Array<{ word: string; score: number }> = [];

    const minLength = Math.max(2, lowerWord.length - 1);
    const maxLength = lowerWord.length + 1;

    for (const dictWord of wordList) {
      if (dictWord.length < minLength || dictWord.length > maxLength) continue;
      if (dictWord.length <= 3 && lowerWord.length > 4) continue;

      const distance = this.levenshteinDistance(lowerWord, dictWord);
      if (distance <= maxDistance && distance > 0) {
        const lengthDiff = Math.abs(dictWord.length - lowerWord.length);
        const score = distance + lengthDiff * 0.5;
        scoredSuggestions.push({ word: dictWord, score });
      }
    }

    scoredSuggestions.sort((a, b) => a.score - b.score);
    return scoredSuggestions.slice(0, 3).map((s) => s.word);
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

const spellWorker = new SpellWorker();

class DictionaryLoader {
  private dictionary: DictionaryData | null = null;
  private wordSet: Set<string> = new Set();
  private loadingPromise: Promise<void> | null = null;

  async load(): Promise<void> {
    if (this.dictionary) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.fetchDictionary();
    return this.loadingPromise;
  }

  private async fetchDictionary(): Promise<void> {
    try {
      const response = await fetch("/dictionaries/us-english.json");
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.status}`);
      }

      this.dictionary = (await response.json()) as DictionaryData;
      this.wordSet = new Set(this.dictionary.words.map((w) => w.toLowerCase()));
    } catch (error) {
      console.error("Failed to load US-English dictionary:", error);
      // Fallback: initialize with minimal word set
      this.dictionary = {
        name: "US English",
        version: "1.0.0",
        locale: "en-US",
        words: [],
        abbreviations: {},
        commonMisspellings: {},
      };
      this.wordSet = new Set();
    }
  }

  isLoaded(): boolean {
    return this.dictionary !== null;
  }

  isValidWord(word: string): boolean {
    const lowerWord = word.toLowerCase();

    // Check loaded dictionary
    if (this.wordSet.has(lowerWord)) return true;

    // Check for numbers (dates, years, etc.)
    if (/^\d+(st|nd|rd|th)?$/.test(lowerWord)) return true;

    // Check for year ranges
    if (/^\d{4}$/.test(lowerWord)) return true;

    // Check for numbers like "202" (partial year from OCR)
    if (/^\d{3}$/.test(lowerWord)) return true;

    // Check for common US abbreviations
    if (this.dictionary?.abbreviations[lowerWord]) return true;

    return false;
  }

  getCorrection(word: string): string | null {
    return this.dictionary?.commonMisspellings[word.toLowerCase()] || null;
  }

  getAbbreviationExpansion(word: string): string | null {
    return this.dictionary?.abbreviations[word.toLowerCase()] || null;
  }

  async findSimilarWords(
    word: string,
    maxDistance: number = 1,
  ): Promise<string[]> {
    const wordList = Array.from(this.wordSet);
    return spellWorker.findSimilarWords(word, wordList, maxDistance);
  }

  getDictionaryInfo(): {
    name: string;
    version: string;
    locale: string;
    wordCount: number;
  } | null {
    if (!this.dictionary) return null;
    return {
      name: this.dictionary.name,
      version: this.dictionary.version,
      locale: this.dictionary.locale,
      wordCount: this.wordSet.size,
    };
  }

  levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}

// Singleton dictionary loader
const dictionaryLoader = new DictionaryLoader();

export { dictionaryLoader };

export class SpellEngine implements ValidationEngine {
  name = "Spell Engine";
  version = "1.0.0";
  enabled = true;
  locale = "en-US";

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    // Ensure dictionary is loaded
    await dictionaryLoader.load();

    const issues: ValidationIssue[] = [];
    const words = document.tokens.filter((t) => t.type === "word");

    for (const token of words) {
      const word = token.text.toLowerCase();
      const originalWord = token.text;

      // Skip short words (1-2 characters)
      if (word.length <= 2) continue;

      // Skip pure numbers
      if (/^\d+$/.test(word)) continue;

      // Skip valid words
      if (dictionaryLoader.isValidWord(word)) continue;

      // Skip words that look like OCR artifacts (mixed alphanumeric that's not a known pattern)
      if (
        /^[a-z]+\d+[a-z]+$/.test(word) &&
        !/^(css|html|js|ts|jsx|tsx|api|url|uri|json|xml|yaml|sql|db|ui|ux|os|cpu|gpu|ram|rom|ssd|hdd|pdf|png|jpg|jpeg|gif|svg|mp3|mp4|avi|mov|npm)$/i.test(
          word,
        )
      ) {
        continue;
      }

      // Check for common misspellings
      const correction = dictionaryLoader.getCorrection(word);
      if (correction) {
        issues.push({
          id: generateId(),
          type: "spell",
          severity: "medium",
          message: `Possible misspelling: "${originalWord}"`,
          suggestions: [correction],
          startIndex: token.startIndex,
          endIndex: token.endIndex,
          confidence: 0.95,
          engine: this.name,
          rule: "common-misspelling",
        });
        continue;
      }

      // Find similar words for suggestions
      const suggestions = await dictionaryLoader.findSimilarWords(word);

      if (suggestions.length > 0) {
        // Check if this is an abbreviation that could be expanded
        const expansion = dictionaryLoader.getAbbreviationExpansion(word);
        if (expansion) {
          // Don't flag as error, but suggest expansion
          issues.push({
            id: generateId(),
            type: "grammar",
            severity: "low",
            message: `Abbreviation: "${originalWord}"`,
            suggestions: [expansion],
            startIndex: token.startIndex,
            endIndex: token.endIndex,
            confidence: 0.85,
            engine: this.name,
            rule: "abbreviation-expansion",
          });
        } else {
          const confidence = Math.max(0.5, 0.85 - suggestions.length * 0.1);
          const distance = dictionaryLoader.levenshteinDistance(
            word,
            suggestions[0],
          );
          issues.push({
            id: generateId(),
            type: "spell",
            severity:
              suggestions.length === 1 && distance === 1 ? "medium" : "low",
            message: `Possible misspelling: "${originalWord}"`,
            suggestions: suggestions.slice(0, 3),
            startIndex: token.startIndex,
            endIndex: token.endIndex,
            confidence,
            engine: this.name,
            rule: "dictionary-check",
          });
        }
      }
    }

    return issues;
  }

  getDictionaryInfo() {
    return dictionaryLoader.getDictionaryInfo();
  }
}

export const spellEngine = new SpellEngine();
