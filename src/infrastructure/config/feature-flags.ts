/**
 * Feature Flags System
 *
 * Controls feature availability without code deployments.
 * Supports localStorage overrides for development/testing.
 */

export interface FeatureFlags {
  // Analysis features
  spellCheck: boolean;
  grammarCheck: boolean;
  readabilityMetrics: boolean;
  complianceCheck: boolean;

  // UI features
  darkMode: boolean;
  exportJson: boolean;
  historyView: boolean;
  dashboardView: boolean;

  // Experimental features
  ocrPreprocessing: boolean;
  advancedMetrics: boolean;
  batchAnalysis: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  spellCheck: true,
  grammarCheck: true,
  readabilityMetrics: true,
  complianceCheck: true,
  darkMode: true,
  exportJson: true,
  historyView: true,
  dashboardView: true,
  ocrPreprocessing: false,
  advancedMetrics: false,
  batchAnalysis: false,
};

const STORAGE_KEY = "feature-flags";
const OVERRIDE_PREFIX = "ff-";

class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.flags = this.loadFlags();
    this.applyOverrides();
  }

  /**
   * Get all feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: keyof FeatureFlags): boolean {
    return this.flags[key];
  }

  /**
   * Enable a feature
   */
  enable(key: keyof FeatureFlags): void {
    this.setFlag(key, true);
  }

  /**
   * Disable a feature
   */
  disable(key: keyof FeatureFlags): void {
    this.setFlag(key, false);
  }

  /**
   * Toggle a feature
   */
  toggle(key: keyof FeatureFlags): void {
    this.setFlag(key, !this.flags[key]);
  }

  /**
   * Set a feature flag value
   */
  setFlag(key: keyof FeatureFlags, value: boolean): void {
    this.flags = { ...this.flags, [key]: value };
    this.saveFlags();
    this.notifyListeners();
  }

  /**
   * Reset all flags to defaults
   */
  reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveFlags();
    this.clearOverrides();
    this.notifyListeners();
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Set a temporary override (for development/testing)
   * Overrides persist in localStorage with ff- prefix
   */
  setOverride(key: keyof FeatureFlags, value: boolean): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(`${OVERRIDE_PREFIX}${key}`, JSON.stringify(value));
      this.applyOverrides();
      this.notifyListeners();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Clear a specific override
   */
  clearOverride(key: keyof FeatureFlags): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(`${OVERRIDE_PREFIX}${key}`);
      this.applyOverrides();
      this.notifyListeners();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    if (typeof window === "undefined") return;

    try {
      for (const key of Object.keys(DEFAULT_FLAGS)) {
        localStorage.removeItem(`${OVERRIDE_PREFIX}${key}`);
      }
      this.applyOverrides();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get enabled features as an array
   */
  getEnabledFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }

  /**
   * Get disabled features as an array
   */
  getDisabledFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([, enabled]) => !enabled)
      .map(([key]) => key);
  }

  private loadFlags(): FeatureFlags {
    if (typeof window === "undefined") return DEFAULT_FLAGS;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parsing errors
    }

    return DEFAULT_FLAGS;
  }

  private saveFlags(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
    } catch {
      // Ignore storage errors
    }
  }

  private applyOverrides(): void {
    if (typeof window === "undefined") return;

    try {
      for (const key of Object.keys(DEFAULT_FLAGS)) {
        const override = localStorage.getItem(`${OVERRIDE_PREFIX}${key}`);
        if (override !== null) {
          try {
            const value = JSON.parse(override);
            if (typeof value === "boolean") {
              this.flags = { ...this.flags, [key]: value };
            }
          } catch {
            // Ignore invalid override
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private notifyListeners(): void {
    const flags = this.getFlags();
    this.listeners.forEach((callback) => callback(flags));
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export function useFeatureFlag(key: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(key);
}
