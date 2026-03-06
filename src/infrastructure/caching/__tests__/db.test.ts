import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../db";
import type { AnalysisResult } from "../../../shared/types/domain.types";

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
};

Object.defineProperty(globalThis, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

describe("DatabaseManager", () => {
  let mockDB: {
    version: number;
    objectStoreNames: {
      contains: ReturnType<typeof vi.fn>;
      [Symbol.iterator]: () => IterableIterator<string>;
    };
    createObjectStore: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  let mockTransaction: {
    objectStore: ReturnType<typeof vi.fn>;
  };

  let mockStore: {
    put: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    index: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset db internal state
    (db as unknown as { db: null }).db = null;

    mockStore = {
      put: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      index: vi.fn(),
    };

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    };

    mockDB = {
      version: 1,
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
        [Symbol.iterator]: function* () {
          yield "analyses";
          yield "documents";
          yield "settings";
        },
      },
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn(),
      }),
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };
  });

  describe("init", () => {
    it("should open database successfully", async () => {
      const mockRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onupgradeneeded: null as ((event: Event) => void) | null,
        result: mockDB,
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      const initPromise = db.init();

      // Simulate successful open
      setTimeout(() => {
        mockRequest.onsuccess?.({ target: mockRequest } as unknown as Event);
      }, 0);

      const result = await initPromise;
      expect(result).toBe(mockDB);
    });

    it("should handle database open error", async () => {
      const mockError = new Error("Database open failed");
      const mockRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        error: mockError,
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      const initPromise = db.init();

      setTimeout(() => {
        mockRequest.onerror?.({ target: mockRequest } as unknown as Event);
      }, 0);

      await expect(initPromise).rejects.toBe(mockError);
    });
  });

  describe("saveAnalysis", () => {
    const mockAnalysis: AnalysisResult = {
      documentId: "test-doc",
      document: {
        id: "test-doc",
        rawText: "Test text",
        tokens: [],
        metadata: {
          sourceType: "text",
          extractedAt: Date.now(),
        },
      },
      issues: [],
      score: {
        overallScore: 100,
        clarityScore: 100,
        correctnessScore: 100,
        complianceScore: 100,
        confidenceScore: 100,
      },
      metrics: {
        averageSentenceLength: 10,
        averageWordLength: 5,
        syllableCount: 10,
        fleschReadingScore: 80,
        fleschGradeLevel: "8th grade",
        passiveVoicePercentage: 0,
        paragraphCount: 1,
        sentenceCount: 1,
        wordCount: 10,
        complexWordCount: 0,
        complexWordPercentage: 0,
      },
      analyzedAt: Date.now(),
      enginesUsed: ["Spell Engine"],
    };

    it("should save analysis successfully", async () => {
      const mockRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        result: mockDB,
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      // Initialize db first
      const initPromise = db.init();
      setTimeout(() => {
        mockRequest.onsuccess?.({ target: mockRequest } as unknown as Event);
      }, 0);
      await initPromise;

      // Mock the put request
      const mockPutRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };

      mockStore.put.mockReturnValue(mockPutRequest);

      const savePromise = db.saveAnalysis(mockAnalysis);

      setTimeout(() => {
        mockPutRequest.onsuccess?.({
          target: mockPutRequest,
        } as unknown as Event);
      }, 0);

      await expect(savePromise).resolves.toBeUndefined();
    });

    it("should handle quota exceeded error", async () => {
      const mockRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        result: mockDB,
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      // Initialize db first
      const initPromise = db.init();
      setTimeout(() => {
        mockRequest.onsuccess?.({ target: mockRequest } as unknown as Event);
      }, 0);
      await initPromise;

      // Mock the put request with quota error
      const quotaError = new Error("Quota exceeded");
      (quotaError as Error & { name: string }).name = "QuotaExceededError";

      const mockPutRequest = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        error: quotaError,
      };

      mockStore.put.mockReturnValue(mockPutRequest);

      const savePromise = db.saveAnalysis(mockAnalysis);

      setTimeout(() => {
        mockPutRequest.onerror?.({
          target: mockPutRequest,
        } as unknown as Event);
      }, 0);

      await expect(savePromise).rejects.toThrow("Storage quota exceeded");
    });
  });
});
