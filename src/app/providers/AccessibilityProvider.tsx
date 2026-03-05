import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";

interface Announcement {
  id: string;
  message: string;
  priority: "polite" | "assertive";
}

interface AccessibilityContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
  announcements: Announcement[];
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Accessibility Provider
 *
 * Provides screen reader announcements and accessibility utilities.
 * Includes aria-live regions for dynamic content updates.
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newAnnouncement: Announcement = { id, message, priority };

      setAnnouncements((prev) => [...prev, newAnnouncement]);

      // Remove announcement after it's been read
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }, 1000);
    },
    [],
  );

  // Announce page changes
  useEffect(() => {
    const handleRouteChange = () => {
      const pageTitle = document.title;
      announce(`Navigated to ${pageTitle}`, "polite");
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [announce]);

  const value: AccessibilityContextValue = {
    announce,
    announcements,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Screen reader only live regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements
          .filter((a) => a.priority === "polite")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {announcements
          .filter((a) => a.priority === "assertive")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>

      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {children}
    </AccessibilityContext.Provider>
  );
};

// Add sr-only utility styles to CSS
const style = document.createElement("style");
style.textContent = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(style);
}
