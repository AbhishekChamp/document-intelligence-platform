/**
 * Typo.js Spell Engine
 *
 * Uses typo-js, a pure JavaScript spell checker (no WASM).
 * Compatible with Hunspell dictionaries.
 *
 * Features:
 * - Pure JavaScript (no WASM compilation issues)
 * - Uses standard Hunspell dictionaries
 * - Morphological analysis via affix rules
 * - Suggestion generation
 * - 100% client-side, works in all browsers
 */

import type {
  ValidationEngine,
  ValidationIssue,
  NormalizedDocument,
} from "../../shared/types/domain.types";
import { generateId } from "../../shared/utils/id";

// Typo.js instance type (no types available, using any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypoInstance = any;

let typoInstance: TypoInstance | null = null;
let dictionaryLoaded = false;
let loadPromise: Promise<void> | null = null;
let loadError: Error | null = null;

/**
 * Load the Typo.js dictionary
 */
async function loadTypo(): Promise<void> {
  if (dictionaryLoaded) return;
  if (loadError) throw loadError;
  if (loadPromise) return loadPromise;

  loadPromise = initializeTypo();
  return loadPromise;
}

async function initializeTypo(): Promise<void> {
  try {
    // Dynamic import of typo-js
    const TypoModule = await import("typo-js");
    const Typo = TypoModule.default || TypoModule;

    if (!Typo) {
      throw new Error("Typo-js failed to load");
    }

    // Fetch dictionary files
    const [affResponse, dicResponse] = await Promise.all([
      fetch("/dictionaries/en_US.aff"),
      fetch("/dictionaries/en_US.dic"),
    ]);

    if (!affResponse.ok || !dicResponse.ok) {
      throw new Error("Failed to load dictionary files");
    }

    const [affData, dicData] = await Promise.all([
      affResponse.text(),
      dicResponse.text(),
    ]);

    // Create Typo instance with loaded dictionary data
    // Typo constructor: (dictionary, affixData, dictionaryData)
    typoInstance = new Typo("en_US", affData, dicData);

    dictionaryLoaded = true;
    loadError = null;
    console.log("[Typo.js] Dictionary loaded successfully");
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    dictionaryLoaded = false;
    typoInstance = null;
    console.error("[Typo.js] Failed to load:", error);
    // Don't throw - let the engine fall back
  }
}

/**
 * Check if a word is valid
 */
function isValidWord(word: string): boolean {
  if (!typoInstance) return true; // Allow all if not loaded

  // Skip checking for:
  // - Numbers
  if (/^\d+$/.test(word)) return true;

  // - Mixed alphanumeric (OCR artifacts)
  if (/^\d+[a-z]+\d*$/i.test(word) || /^[a-z]+\d+[a-z]*$/i.test(word)) {
    // But allow known technical patterns
    if (
      /^(css|html|js|ts|jsx|tsx|api|url|json|xml|yaml|sql|db|ui|ux|os|cpu|gpu|ram|rom|ssd|hdd|pdf|png|jpg|jpeg|gif|svg|mp3|mp4|avi|mov|npm|pip|git|cmd|exe|dll|app|io|ai|ps|id|ae|pr|lr|xd|figma|sketch)$/i.test(
        word,
      )
    ) {
      return true;
    }
    return false; // Flag as potential OCR error
  }

  // - Single characters
  if (word.length === 1) return true;

  // - URLs and emails
  if (word.includes("@") || word.includes("://") || word.startsWith("www.")) {
    return true;
  }

  // Check with Typo.js
  try {
    return typoInstance.check(word);
  } catch (e) {
    console.warn("[Typo.js] check() error:", e);
    return true; // Allow on error
  }
}

/**
 * Get suggestions for a misspelled word
 */
function getSuggestions(word: string): string[] {
  if (!typoInstance) return [];

  try {
    const suggestions: string[] = typoInstance.suggest(word);

    // Filter out suggestions that are too different in length
    return suggestions
      .filter((s: string) => {
        const lenDiff = Math.abs(s.length - word.length);
        return lenDiff <= 4; // Max 4 characters difference
      })
      .slice(0, 5);
  } catch (e) {
    console.warn("[Typo.js] suggest() error:", e);
    return [];
  }
}

/**
 * Spell Engine using Typo.js
 */
export class TypoEngine implements ValidationEngine {
  name = "Typo.js Engine";
  version = "1.3.0";
  enabled = true;
  locale = "en-US";

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    try {
      await loadTypo();
    } catch {
      console.warn("[Typo.js] Could not load, skipping spell check");
      return [];
    }

    // If Typo failed to load, don't report spell errors
    if (!typoInstance) {
      return [];
    }

    const issues: ValidationIssue[] = [];
    const words = document.tokens.filter((t) => t.type === "word");

    // Track checked words to avoid duplicates
    const checkedWords = new Map<string, boolean>();

    for (const token of words) {
      const word = token.text;
      const lowerWord = word.toLowerCase();

      // Skip short words
      if (lowerWord.length <= 2) continue;

      // Skip if already checked
      if (checkedWords.has(lowerWord)) continue;
      checkedWords.set(lowerWord, true);

      // Check if valid
      if (isValidWord(word)) continue;

      // Word is misspelled - get suggestions
      const suggestions = getSuggestions(word);

      if (suggestions.length > 0) {
        // Calculate confidence based on suggestion quality
        const bestSuggestion = suggestions[0];
        const distance = this.levenshteinDistance(
          lowerWord,
          bestSuggestion.toLowerCase(),
        );
        const confidence = Math.max(0.5, 1 - distance * 0.15);

        issues.push({
          id: generateId(),
          type: "spell",
          severity: distance === 1 ? "medium" : "low",
          message: `Possible misspelling: "${word}"`,
          suggestions: suggestions.slice(0, 3),
          startIndex: token.startIndex,
          endIndex: token.endIndex,
          confidence,
          engine: this.name,
          rule: "typo-check",
        });
      }
    }

    return issues;
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

  /**
   * Get dictionary info for debugging
   */
  getDictionaryInfo() {
    return {
      name: "Typo.js US English",
      version: this.version,
      locale: this.locale,
      loaded: dictionaryLoaded,
      error: loadError?.message,
    };
  }
}

// Cleanup function
export function cleanupTypo(): void {
  typoInstance = null;
  dictionaryLoaded = false;
  loadPromise = null;
  loadError = null;
}

// Export singleton instance
export const typoEngine = new TypoEngine();
