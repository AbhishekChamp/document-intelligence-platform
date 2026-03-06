import { describe, it, expect } from "vitest";
import {
  tokenize,
  getWords,
  getSentences,
  getParagraphs,
  countSyllables,
  isComplexWord,
  stripHtml,
  normalizeWhitespace,
} from "./text";

describe("Text Utilities", () => {
  describe("tokenize", () => {
    it("should tokenize simple text", () => {
      const tokens = tokenize("Hello world");
      expect(tokens).toHaveLength(3); // Hello, space, world
      expect(tokens[0].text).toBe("Hello");
      expect(tokens[0].type).toBe("word");
    });

    it("should handle numbers", () => {
      const tokens = tokenize("Item 1 costs $5.99");
      const numberTokens = tokens.filter((t) => t.type === "number");
      expect(numberTokens.length).toBeGreaterThan(0);
    });

    it("should handle punctuation", () => {
      const tokens = tokenize("Hello, world!");
      const punctuationTokens = tokens.filter((t) => t.type === "punctuation");
      expect(punctuationTokens).toHaveLength(2); // comma and exclamation
    });
  });

  describe("getWords", () => {
    it("should extract words from text", () => {
      const words = getWords("The quick brown fox");
      expect(words).toEqual(["the", "quick", "brown", "fox"]);
    });

    it("should handle contractions", () => {
      const words = getWords("It's a nice day");
      expect(words).toContain("it's");
    });
  });

  describe("getSentences", () => {
    it("should split text into sentences", () => {
      const sentences = getSentences("First sentence. Second sentence! Third?");
      expect(sentences).toHaveLength(3);
    });

    it("should handle empty input", () => {
      const sentences = getSentences("");
      expect(sentences).toHaveLength(0);
    });
  });

  describe("getParagraphs", () => {
    it("should split text into paragraphs", () => {
      const paragraphs = getParagraphs("Para 1\n\nPara 2\n\nPara 3");
      expect(paragraphs).toHaveLength(3);
    });
  });

  describe("countSyllables", () => {
    it("should count syllables correctly", () => {
      expect(countSyllables("hello")).toBe(2);
      expect(countSyllables("world")).toBe(1);
      expect(countSyllables("beautiful")).toBe(3);
    });

    it("should handle short words", () => {
      expect(countSyllables("the")).toBe(1);
      expect(countSyllables("a")).toBe(1);
    });
  });

  describe("isComplexWord", () => {
    it("should identify complex words", () => {
      expect(isComplexWord("beautiful")).toBe(true);
      expect(isComplexWord("extraordinary")).toBe(true);
    });

    it("should identify simple words", () => {
      expect(isComplexWord("the")).toBe(false);
      expect(isComplexWord("cat")).toBe(false);
    });
  });

  describe("stripHtml", () => {
    it("should remove HTML tags", () => {
      const text = stripHtml("<p>Hello <strong>world</strong></p>");
      expect(text).toBe("Hello world");
    });

    it("should handle HTML entities", () => {
      const text = stripHtml("&lt;div&gt;Test&lt;/div&gt;");
      expect(text).toBe("<div>Test</div>");
    });
  });

  describe("normalizeWhitespace", () => {
    it("should normalize multiple spaces", () => {
      const text = normalizeWhitespace("Too   many    spaces");
      expect(text).toBe("Too many spaces");
    });

    it("should trim leading and trailing whitespace", () => {
      const text = normalizeWhitespace("  hello world  ");
      expect(text).toBe("hello world");
    });
  });
});
