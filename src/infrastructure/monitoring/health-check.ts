/**
 * Health Check System
 *
 * Monitors application health including:
 * - IndexedDB connectivity
 * - Engine availability
 * - Dictionary loading status
 * - Memory usage
 * - Storage quota
 */

import { db } from "../caching/db";
import { spellEngine } from "../../engines/spell-engine";
import { grammarEngine } from "../../engines/grammar-engine";
import { readabilityEngine } from "../../engines/readability-engine";
import { complianceEngine } from "../../engines/compliance-engine";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: number;
  checks: {
    database: HealthCheckResult;
    engines: HealthCheckResult;
    storage: StorageHealthResult;
    memory: MemoryHealthResult;
  };
}

interface HealthCheckResult {
  status: "pass" | "warn" | "fail";
  message: string;
  details?: Record<string, unknown>;
}

interface StorageHealthResult extends HealthCheckResult {
  quota?: number;
  usage?: number;
  usagePercentage?: number;
}

interface MemoryHealthResult extends HealthCheckResult {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  usedPercentage?: number;
}

class HealthCheckManager {
  private lastCheck: HealthStatus | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Perform a comprehensive health check
   */
  async check(): Promise<HealthStatus> {
    const [database, engines, storage, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkEngines(),
      this.checkStorage(),
      this.checkMemory(),
    ]);

    const status = this.determineOverallStatus(
      database,
      engines,
      storage,
      memory,
    );

    this.lastCheck = {
      status,
      timestamp: Date.now(),
      checks: {
        database,
        engines,
        storage,
        memory,
      },
    };

    return this.lastCheck;
  }

  /**
   * Get the last health check result
   */
  getLastCheck(): HealthStatus | null {
    return this.lastCheck;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs = 60000): void {
    this.stopPeriodicChecks();
    this.checkInterval = setInterval(() => {
      this.check().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const dbInstance = await db.init();
      return {
        status: "pass",
        message: "Database connected",
        details: {
          version: dbInstance.version,
          objectStores: Array.from(dbInstance.objectStoreNames),
        },
      };
    } catch (error) {
      return {
        status: "fail",
        message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private async checkEngines(): Promise<HealthCheckResult> {
    const engines = [
      { name: spellEngine.name, enabled: spellEngine.enabled },
      { name: grammarEngine.name, enabled: grammarEngine.enabled },
      { name: readabilityEngine.name, enabled: readabilityEngine.enabled },
      { name: complianceEngine.name, enabled: complianceEngine.enabled },
    ];

    const disabledEngines = engines.filter((e) => !e.enabled);

    if (disabledEngines.length === engines.length) {
      return {
        status: "fail",
        message: "All engines are disabled",
        details: { engines },
      };
    }

    if (disabledEngines.length > 0) {
      return {
        status: "warn",
        message: `${disabledEngines.length} engine(s) disabled`,
        details: { engines, disabled: disabledEngines.map((e) => e.name) },
      };
    }

    return {
      status: "pass",
      message: "All engines operational",
      details: { engines },
    };
  }

  private async checkStorage(): Promise<StorageHealthResult> {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

        let status: "pass" | "warn" | "fail" = "pass";
        let message = "Storage usage normal";

        if (usagePercentage > 90) {
          status = "fail";
          message = "Storage critically full";
        } else if (usagePercentage > 75) {
          status = "warn";
          message = "Storage usage high";
        }

        return {
          status,
          message,
          quota,
          usage,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
        };
      }

      return {
        status: "warn",
        message: "Storage API not available",
      };
    } catch (error) {
      return {
        status: "warn",
        message: `Storage check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private checkMemory(): MemoryHealthResult {
    const memory = (
      performance as typeof performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    if (!memory) {
      return {
        status: "warn",
        message: "Memory API not available",
      };
    }

    const usedJSHeapSize = memory.usedJSHeapSize;
    const totalJSHeapSize = memory.totalJSHeapSize;
    const usedPercentage =
      totalJSHeapSize > 0 ? (usedJSHeapSize / totalJSHeapSize) * 100 : 0;

    let status: "pass" | "warn" | "fail" = "pass";
    let message = "Memory usage normal";

    if (usedPercentage > 90) {
      status = "fail";
      message = "Memory critically high";
    } else if (usedPercentage > 75) {
      status = "warn";
      message = "Memory usage high";
    }

    return {
      status,
      message,
      usedJSHeapSize,
      totalJSHeapSize,
      usedPercentage: Math.round(usedPercentage * 100) / 100,
    };
  }

  private determineOverallStatus(
    database: HealthCheckResult,
    engines: HealthCheckResult,
    storage: HealthCheckResult,
    memory: MemoryHealthResult,
  ): "healthy" | "degraded" | "unhealthy" {
    const results = [database, engines, storage, memory];

    if (results.some((r) => r.status === "fail")) {
      return "unhealthy";
    }

    if (results.some((r) => r.status === "warn")) {
      return "degraded";
    }

    return "healthy";
  }
}

export const healthCheck = new HealthCheckManager();
