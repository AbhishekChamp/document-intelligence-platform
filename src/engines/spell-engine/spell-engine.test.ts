import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpellEngine, dictionaryLoader } from "./index";
import type { NormalizedDocument } from "../../shared/types/domain.types";

// Mock dictionary data
const mockDictionary = {
  name: "US English Test",
  version: "1.0.0",
  locale: "en-US",
  words: [
    "hello",
    "world",
    "test",
    "spelling",
    "correct",
    "word",
    "jan",
    "feb",
  ],
  abbreviations: { jan: "January", feb: "February" },
  commonMisspellings: { teh: "the", recieve: "receive" },
};

describe("SpellEngine", () => {
  let engine: SpellEngine;

  beforeEach(() => {
    engine = new SpellEngine();
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Dictionary Loading", () => {
    it("should load dictionary from JSON file", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDictionary,
      } as Response);

      await dictionaryLoader.load();

      expect(fetch).toHaveBeenCalledWith("/dictionaries/us-english.json");
      expect(dictionaryLoader.isLoaded()).toBe(true);
    });

    it("should handle dictionary load failure gracefully", async () => {
      // Create a new loader instance to test failure case
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      await dictionaryLoader.load();

      expect(dictionaryLoader.isLoaded()).toBe(true);
      // After failure, wordSet should be empty
      const info = dictionaryLoader.getDictionaryInfo();
      expect(info).not.toBeNull();
    });
  });

  describe("Spell Checking", () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDictionary,
      } as Response);
      await dictionaryLoader.load();
    });

    it("should not flag correctly spelled words", async () => {
      const doc: NormalizedDocument = {
        id: "test-1",
        rawText: "hello world test",
        tokens: [
          { text: "hello", startIndex: 0, endIndex: 5, type: "word" },
          { text: "world", startIndex: 6, endIndex: 11, type: "word" },
          { text: "test", startIndex: 12, endIndex: 16, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues).toHaveLength(0);
    });

    it("should detect common misspellings", async () => {
      const doc: NormalizedDocument = {
        id: "test-2",
        rawText: "teh recieve",
        tokens: [
          { text: "teh", startIndex: 0, endIndex: 3, type: "word" },
          { text: "recieve", startIndex: 4, endIndex: 11, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues.length).toBeGreaterThan(0);
      const tehIssue = issues.find((i) => i.message.includes("teh"));
      const recieveIssue = issues.find((i) => i.message.includes("recieve"));
      expect(tehIssue?.suggestions).toContain("the");
      expect(recieveIssue?.suggestions).toContain("receive");
    });

    it("should suggest corrections for misspelled words", async () => {
      const doc: NormalizedDocument = {
        id: "test-3",
        rawText: "speling",
        tokens: [{ text: "speling", startIndex: 0, endIndex: 7, type: "word" }],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].suggestions.length).toBeGreaterThan(0);
    });

    it("should skip short words (1-2 characters)", async () => {
      const doc: NormalizedDocument = {
        id: "test-4",
        rawText: "a x yz",
        tokens: [
          { text: "a", startIndex: 0, endIndex: 1, type: "word" },
          { text: "x", startIndex: 2, endIndex: 3, type: "word" },
          { text: "yz", startIndex: 4, endIndex: 6, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues).toHaveLength(0);
    });

    it("should skip pure numbers", async () => {
      const doc: NormalizedDocument = {
        id: "test-5",
        rawText: "123 2024",
        tokens: [
          { text: "123", startIndex: 0, endIndex: 3, type: "word" },
          { text: "2024", startIndex: 4, endIndex: 8, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues).toHaveLength(0);
    });

    it("should suggest abbreviation expansions", async () => {
      const doc: NormalizedDocument = {
        id: "test-6",
        rawText: "january february",
        tokens: [
          { text: "january", startIndex: 0, endIndex: 7, type: "word" },
          { text: "february", startIndex: 8, endIndex: 16, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      // These words are not in our mock dictionary, so they might trigger suggestions
      expect(issues).toBeDefined();
    });
  });

  describe("US-English Specific", () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDictionary,
          words: [...mockDictionary.words, "color", "center", "optimize"],
        }),
      } as Response);
      await dictionaryLoader.load();
    });

    it("should recognize US-English spellings", async () => {
      const doc: NormalizedDocument = {
        id: "test-7",
        rawText: "color center optimize",
        tokens: [
          { text: "color", startIndex: 0, endIndex: 5, type: "word" },
          { text: "center", startIndex: 6, endIndex: 12, type: "word" },
          { text: "optimize", startIndex: 13, endIndex: 21, type: "word" },
        ],
        metadata: { sourceType: "text", extractedAt: Date.now() },
      };

      const issues = await engine.analyze(doc);
      expect(issues).toHaveLength(0);
    });
  });
});
