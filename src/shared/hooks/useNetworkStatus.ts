/**
 * Network Status Hook
 *
 * Tracks online/offline status and provides network information.
 */

import { useState, useEffect } from "react";

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

function getNetworkInfo(): NetworkStatus {
  const connection = (
    navigator as typeof navigator & {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      };
    }
  ).connection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getNetworkInfo);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, online: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, online: false }));
    };

    const handleConnectionChange = () => {
      setStatus(getNetworkInfo());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection changes (if available)
    const connection = (
      navigator as typeof navigator & {
        connection?: {
          addEventListener: (event: string, handler: () => void) => void;
          removeEventListener: (event: string, handler: () => void) => void;
        };
      }
    ).connection;

    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  return status;
}
