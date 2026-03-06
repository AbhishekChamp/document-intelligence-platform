/**
 * Network Status Indicator
 *
 * Shows online/offline status and network quality.
 */

import React from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { cn } from "../utils/cn";

export const NetworkStatusIndicator: React.FC = () => {
  const network = useNetworkStatus();

  // Determine what to show based on network state
  const isOffline = !network.online;
  const isSlow =
    network.online &&
    (network.effectiveType === "2g" ||
      (network.effectiveType === "3g" && (network.downlink || 0) < 0.5));

  // Only show indicator when there's an issue
  if (!isOffline && !isSlow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300",
        isOffline ? "bg-red-600 text-white" : "bg-amber-500 text-white",
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Offline</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Slow connection</span>
        </>
      )}
    </div>
  );
};
