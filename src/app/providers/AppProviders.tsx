import React, { memo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { router } from "../router/router";
import { ThemeProvider } from "./ThemeProvider";
import { AccessibilityProvider } from "./AccessibilityProvider";
import { errorTracker } from "../../infrastructure/monitoring/error-tracker";
import { healthCheck } from "../../infrastructure/monitoring/health-check";
import { dataRetention } from "../../infrastructure/caching/data-retention";
import { textExtractor } from "../../infrastructure/extraction/text-extractor";

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Memoized providers to prevent unnecessary re-renders
const AppProvidersComponent: React.FC = () => {
  useEffect(() => {
    // Initialize error tracking
    errorTracker.init();

    // Start periodic health checks
    healthCheck.startPeriodicChecks(60000); // Every minute

    // Perform initial cleanup check
    dataRetention.shouldCleanup().then((shouldCleanup) => {
      if (shouldCleanup) {
        dataRetention.cleanup().then((stats) => {
          if (stats.deletedCount > 0 && import.meta.env.DEV) {
            console.log(
              `Data cleanup: removed ${stats.deletedCount} old analyses`,
            );
          }
        });
      }
    });

    // Cleanup on app unmount (mainly for development hot reload)
    return () => {
      errorTracker.destroy();
      healthCheck.stopPeriodicChecks();
      textExtractor.destroy();
    };
  }, []);

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--toast-bg, #fff)",
                color: "var(--toast-color, #000)",
                border: "1px solid var(--toast-border, #e5e7eb)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </QueryClientProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

export const AppProviders = memo(AppProvidersComponent);
