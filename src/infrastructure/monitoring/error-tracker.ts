/**
 * Error Tracking System
 *
 * Captures and reports errors for debugging and monitoring.
 * Privacy-first: Only collects error information, no user data.
 */

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: "error" | "unhandledrejection" | "promise" | "runtime" | "console";
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  url: string;
  userAgent: string;
  appVersion: string;
}

interface ErrorTrackerConfig {
  maxErrors: number;
  enableConsoleCapture: boolean;
  enableUnhandledCapture: boolean;
  onError?: (report: ErrorReport) => void;
}

const DEFAULT_CONFIG: ErrorTrackerConfig = {
  maxErrors: 50,
  enableConsoleCapture: true,
  enableUnhandledCapture: true,
};

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private config: ErrorTrackerConfig;
  private isInitialized = false;
  private originalConsoleError: typeof console.error;

  constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.originalConsoleError = console.error;
  }

  /**
   * Initialize error tracking
   */
  init(): void {
    if (this.isInitialized) return;
    if (typeof window === "undefined") return;

    this.isInitialized = true;

    if (this.config.enableUnhandledCapture) {
      this.setupGlobalHandlers();
    }

    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }
  }

  /**
   * Cleanup error tracking
   */
  destroy(): void {
    if (!this.isInitialized) return;

    window.removeEventListener("error", this.handleGlobalError);
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );
    console.error = this.originalConsoleError;

    this.isInitialized = false;
  }

  /**
   * Track an error manually
   */
  track(
    error: Error | string,
    context?: Record<string, unknown>,
    componentStack?: string,
  ): ErrorReport | null {
    const report = this.createReport(
      typeof error === "string" ? new Error(error) : error,
      "error",
      context,
      componentStack,
    );

    this.addReport(report);
    return report;
  }

  /**
   * Get all captured errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Export errors for debugging
   */
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  private setupGlobalHandlers(): void {
    window.addEventListener("error", this.handleGlobalError);
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );
  }

  private setupConsoleCapture(): void {
    console.error = (...args: unknown[]) => {
      this.originalConsoleError.apply(console, args);

      // Don't capture React's warning about defaultProps (noise)
      const firstArg = args[0];
      if (typeof firstArg === "string" && firstArg.includes("defaultProps")) {
        return;
      }

      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg),
        )
        .join(" ");

      const report = this.createReport(new Error(message), "console", {
        consoleArgs: args,
      });

      this.addReport(report);
    };
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    event.preventDefault();

    const report = this.createReport(
      event.error || new Error(event.message),
      "runtime",
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    );

    this.addReport(report);
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    event.preventDefault();

    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));

    const report = this.createReport(error, "unhandledrejection", {
      reason: reason instanceof Error ? undefined : reason,
    });

    this.addReport(report);
  };

  private createReport(
    error: Error,
    type: ErrorReport["type"],
    context?: Record<string, unknown>,
    componentStack?: string,
  ): ErrorReport {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      message: error.message,
      stack: error.stack,
      componentStack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
    };
  }

  private addReport(report: ErrorReport): void {
    this.errors.push(report);

    // Keep only recent errors
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }

    // Call custom handler if provided
    this.config.onError?.(report);

    // Log to console in development
    if (import.meta.env.DEV) {
      this.originalConsoleError("[ErrorTracker]", report);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// React error boundary helper
export function captureReactError(
  error: Error,
  errorInfo: { componentStack?: string },
): void {
  errorTracker.track(error, undefined, errorInfo.componentStack);
}
