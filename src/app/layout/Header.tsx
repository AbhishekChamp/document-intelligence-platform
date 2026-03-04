import React, { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "../../shared/utils/cn";
import { useStore } from "../../shared/hooks/useStore";
import { useTheme } from "../providers/ThemeProvider";
import { Sun, Moon, Info } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
}

const HeaderComponent: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const {
    currentAnalysis,
    isAnalyzing,
    analysisProgress,
    analysisProgressMessage,
  } = useStore();
  const { theme, toggleTheme } = useTheme();

  const lastAnalyzedText = useMemo(() => {
    if (!currentAnalysis) return null;
    return new Date(currentAnalysis.analyzedAt).toLocaleString();
  }, [currentAnalysis]);

  return (
    <header
      className={cn(
        "h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 transition-all duration-300 sticky top-0 z-30",
        sidebarCollapsed ? "ml-20" : "ml-72",
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {isAnalyzing && (
          <div className="flex items-center gap-3 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl shrink-0">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">
                {analysisProgressMessage || "Processing..."}
              </span>
              <span className="text-xs text-violet-500">
                {Math.round(analysisProgress)}%
              </span>
            </div>
          </div>
        )}
        {!isAnalyzing && lastAnalyzedText && (
          <div className="flex items-center gap-2 text-sm truncate">
            <span className="text-gray-500 dark:text-gray-400 shrink-0">
              Last analyzed:
            </span>
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {lastAnalyzedText}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/about"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
        >
          <Info className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">About</span>
        </Link>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
