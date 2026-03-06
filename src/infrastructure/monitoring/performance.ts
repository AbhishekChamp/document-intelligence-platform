/**
 * Performance Monitoring
 *
 * Tracks Core Web Vitals and custom performance metrics.
 * Privacy-first: No user identification, only aggregated metrics.
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  inp?: number; // Interaction to Next Paint

  // Custom metrics
  analysisDuration?: number;
  ocrDuration?: number;
  dictionaryLoadTime?: number;
}

interface MetricEntry {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: MetricEntry[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized) return;
    if (typeof window === "undefined") return;

    this.isInitialized = true;

    // Observe Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }

  /**
   * Record a custom metric
   */
  record(name: string, value: number, context?: Record<string, unknown>): void {
    const entry: MetricEntry = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(entry);

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value}`, context);
    }
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, { ...context, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, { ...context, success: false, error: true });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): MetricEntry[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average metric value
   */
  getAverage(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for debugging
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: this.getSummary(),
        exportedAt: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): Record<
    string,
    { count: number; average: number; min: number; max: number }
  > {
    const summary: Record<
      string,
      { count: number; average: number; min: number; max: number }
    > = {};

    const grouped = this.groupByName();
    for (const [name, metrics] of grouped) {
      const values = metrics.map((m) => m.value);
      summary[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    return summary;
  }

  private groupByName(): Map<string, MetricEntry[]> {
    const grouped = new Map<string, MetricEntry[]>();
    for (const metric of this.metrics) {
      const existing = grouped.get(metric.name) || [];
      existing.push(metric);
      grouped.set(metric.name, existing);
    }
    return grouped;
  }

  private observeLCP(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number;
        };
        this.record("LCP", lastEntry.startTime);
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] as const });
      this.observers.set("lcp", observer);
    } catch {
      // LCP not supported
    }
  }

  private observeFID(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & {
            processingStart: number;
            startTime: number;
          };
          this.record("FID", fidEntry.processingStart - fidEntry.startTime);
        }
      });

      observer.observe({ entryTypes: ["first-input"] as const });
      this.observers.set("fid", observer);
    } catch {
      // FID not supported
    }
  }

  private observeCLS(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        }
        this.record("CLS", clsValue);
      });

      observer.observe({ entryTypes: ["layout-shift"] as const });
      this.observers.set("cls", observer);
    } catch {
      // CLS not supported
    }
  }

  private observeFCP(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.record("FCP", entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ["paint"] as const });
      this.observers.set("fcp", observer);
    } catch {
      // FCP not supported
    }
  }

  private observeTTFB(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.record("TTFB", navigation.responseStart - navigation.startTime);
      }
    });
  }

  private observeINP(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEntry & {
            duration: number;
            interactionId: number;
          };
          if (eventEntry.interactionId > 0) {
            this.record("INP", eventEntry.duration);
          }
        }
      });

      observer.observe({ type: "event", buffered: true } as const);
      this.observers.set("inp", observer);
    } catch {
      // INP not supported
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper for measuring component render time
export function usePerformanceMeasure(componentName: string) {
  const startTime = performance.now();

  return {
    end: () => {
      const duration = performance.now() - startTime;
      performanceMonitor.record("component-render", duration, {
        component: componentName,
      });
    },
  };
}
