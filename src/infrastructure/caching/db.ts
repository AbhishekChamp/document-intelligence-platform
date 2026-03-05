import { DB_NAME, DB_VERSION, STORE_NAMES } from "../../shared/constants";
import type { AnalysisResult } from "../../shared/types/domain.types";

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Migration from version 0 to 1 (initial setup)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_NAMES.documents)) {
            db.createObjectStore(STORE_NAMES.documents, { keyPath: "id" });
          }

          if (!db.objectStoreNames.contains(STORE_NAMES.analyses)) {
            const analysisStore = db.createObjectStore(STORE_NAMES.analyses, {
              keyPath: "id",
            });
            analysisStore.createIndex("documentId", "documentId", {
              unique: false,
            });
            analysisStore.createIndex("analyzedAt", "analyzedAt", {
              unique: false,
            });
          }

          if (!db.objectStoreNames.contains(STORE_NAMES.settings)) {
            db.createObjectStore(STORE_NAMES.settings, { keyPath: "key" });
          }
        }

        // Future migrations go here:
        // if (oldVersion < 2) { ... }
      };
    });
  }

  async saveAnalysis(result: AnalysisResult): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.analyses], "readwrite");
      const store = transaction.objectStore(STORE_NAMES.analyses);
      const request = store.put({
        ...result,
        id: `${result.documentId}-${result.analyzedAt}`,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalysesByDocumentId(documentId: string): Promise<AnalysisResult[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.analyses], "readonly");
      const store = transaction.objectStore(STORE_NAMES.analyses);
      const index = store.index("documentId");
      const request = index.getAll(documentId);

      request.onsuccess = () => resolve(request.result as AnalysisResult[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAnalyses(): Promise<AnalysisResult[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.analyses], "readonly");
      const store = transaction.objectStore(STORE_NAMES.analyses);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as AnalysisResult[]);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAnalyses(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.analyses], "readwrite");
      const store = transaction.objectStore(STORE_NAMES.analyses);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.settings], "readwrite");
      const store = transaction.objectStore(STORE_NAMES.settings);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.settings], "readonly");
      const store = transaction.objectStore(STORE_NAMES.settings);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseManager();
