/**
 * Data Retention Manager
 *
 * Manages cleanup of old analysis data to prevent storage quota issues.
 * Implements configurable retention policies with user control.
 */

import { db } from "./db";
import type { AnalysisResult } from "../../shared/types/domain.types";

export interface RetentionPolicy {
  maxAgeDays: number;
  maxTotalItems: number;
  enabled: boolean;
}

const DEFAULT_POLICY: RetentionPolicy = {
  maxAgeDays: 90, // Keep analyses for 90 days
  maxTotalItems: 500, // Maximum 500 analyses
  enabled: true,
};

const POLICY_KEY = "data-retention-policy";
const LAST_CLEANUP_KEY = "last-data-cleanup";

class DataRetentionManager {
  private policy: RetentionPolicy;

  constructor() {
    this.policy = this.loadPolicy();
  }

  /**
   * Get current retention policy
   */
  getPolicy(): RetentionPolicy {
    return { ...this.policy };
  }

  /**
   * Update retention policy
   */
  setPolicy(policy: Partial<RetentionPolicy>): void {
    this.policy = { ...this.policy, ...policy };
    this.savePolicy();
  }

  /**
   * Check if cleanup is needed based on last cleanup time
   */
  async shouldCleanup(): Promise<boolean> {
    const lastCleanup = await db.getSetting<number>(LAST_CLEANUP_KEY);
    if (!lastCleanup) return true;

    // Cleanup if it's been more than 24 hours
    const hoursSinceLastCleanup = (Date.now() - lastCleanup) / (1000 * 60 * 60);
    return hoursSinceLastCleanup >= 24;
  }

  /**
   * Perform data cleanup based on retention policy
   * Returns statistics about the cleanup
   */
  async cleanup(): Promise<{
    deletedCount: number;
    remainingCount: number;
    freedBytes: number;
    errors: string[];
  }> {
    const stats = {
      deletedCount: 0,
      remainingCount: 0,
      freedBytes: 0,
      errors: [] as string[],
    };

    if (!this.policy.enabled) {
      return stats;
    }

    try {
      const allAnalyses = await db.getAllAnalyses();
      const cutoffTime =
        Date.now() - this.policy.maxAgeDays * 24 * 60 * 60 * 1000;

      // Sort by date (oldest first)
      const sortedAnalyses = allAnalyses.sort(
        (a, b) => a.analyzedAt - b.analyzedAt,
      );

      const analysesToDelete: AnalysisResult[] = [];
      const analysesToKeep: AnalysisResult[] = [];

      for (const analysis of sortedAnalyses) {
        // Check age-based retention
        if (analysis.analyzedAt < cutoffTime) {
          analysesToDelete.push(analysis);
          continue;
        }

        analysesToKeep.push(analysis);
      }

      // Check count-based retention
      if (analysesToKeep.length > this.policy.maxTotalItems) {
        const excessCount = analysesToKeep.length - this.policy.maxTotalItems;
        analysesToDelete.push(...analysesToKeep.slice(0, excessCount));
      }

      // Calculate freed bytes (approximate)
      for (const analysis of analysesToDelete) {
        stats.freedBytes += JSON.stringify(analysis).length * 2; // UTF-16
      }

      // Delete analyses
      // Note: We need to implement deleteAnalysis in db.ts
      for (const analysis of analysesToDelete) {
        try {
          await this.deleteAnalysis(analysis.documentId, analysis.analyzedAt);
          stats.deletedCount++;
        } catch (error) {
          stats.errors.push(
            `Failed to delete ${analysis.documentId}: ${error instanceof Error ? error.message : "Unknown"}`,
          );
        }
      }

      stats.remainingCount = sortedAnalyses.length - stats.deletedCount;

      // Record cleanup time
      await db.saveSetting(LAST_CLEANUP_KEY, Date.now());
    } catch (error) {
      stats.errors.push(
        `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return stats;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalAnalyses: number;
    oldestAnalysis: number | null;
    newestAnalysis: number | null;
    estimatedSizeBytes: number;
  }> {
    const analyses = await db.getAllAnalyses();

    let estimatedSizeBytes = 0;
    let oldestAnalysis: number | null = null;
    let newestAnalysis: number | null = null;

    for (const analysis of analyses) {
      estimatedSizeBytes += JSON.stringify(analysis).length * 2;

      if (oldestAnalysis === null || analysis.analyzedAt < oldestAnalysis) {
        oldestAnalysis = analysis.analyzedAt;
      }

      if (newestAnalysis === null || analysis.analyzedAt > newestAnalysis) {
        newestAnalysis = analysis.analyzedAt;
      }
    }

    return {
      totalAnalyses: analyses.length,
      oldestAnalysis,
      newestAnalysis,
      estimatedSizeBytes,
    };
  }

  /**
   * Export all data for backup
   */
  async exportAllData(): Promise<{
    analyses: AnalysisResult[];
    settings: Record<string, unknown>;
    exportedAt: number;
  }> {
    const analyses = await db.getAllAnalyses();
    // Note: We would need to implement getAllSettings in db.ts

    return {
      analyses,
      settings: {},
      exportedAt: Date.now(),
    };
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    analyses: AnalysisResult[];
    settings?: Record<string, unknown>;
  }): Promise<{ imported: number; errors: string[] }> {
    const result = { imported: 0, errors: [] as string[] };

    for (const analysis of data.analyses) {
      try {
        await db.saveAnalysis(analysis);
        result.imported++;
      } catch (error) {
        result.errors.push(
          `Failed to import ${analysis.documentId}: ${error instanceof Error ? error.message : "Unknown"}`,
        );
      }
    }

    return result;
  }

  private loadPolicy(): RetentionPolicy {
    if (typeof window === "undefined") return DEFAULT_POLICY;

    try {
      const stored = localStorage.getItem(POLICY_KEY);
      if (stored) {
        return { ...DEFAULT_POLICY, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parsing errors
    }

    return DEFAULT_POLICY;
  }

  private savePolicy(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(POLICY_KEY, JSON.stringify(this.policy));
    } catch {
      // Ignore storage errors
    }
  }

  private async deleteAnalysis(
    documentId: string,
    analyzedAt: number,
  ): Promise<void> {
    const dbInstance = await db.init();

    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(["analyses"], "readwrite");
      const store = transaction.objectStore("analyses");
      const id = `${documentId}-${analyzedAt}`;
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dataRetention = new DataRetentionManager();
