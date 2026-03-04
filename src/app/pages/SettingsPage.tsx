import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { ConfirmDialog } from "../../shared/components/Dialog";
import { useStore } from "../../shared/hooks/useStore";
import { useTheme } from "../providers/ThemeProvider";
import { analysisOrchestrator } from "../../domains/analysis/analysis-orchestrator";
import { db } from "../../infrastructure/caching/db";
import {
  CheckCircle,
  BookOpen,
  ShieldAlert,
  BarChart3,
  Gauge,
  ToggleLeft,
  ToggleRight,
  Sun,
  Moon,
  Trash2,
  Info,
  Sparkles,
  FileText,
  Zap,
  FileCode,
  Image as ImageIcon,
  FileType2,
} from "lucide-react";

const ENGINE_INFO = [
  {
    key: "spell",
    name: "Spell Engine",
    description:
      "Detects spelling errors and suggests corrections using a comprehensive dictionary.",
    icon: CheckCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    key: "grammar",
    name: "Grammar Engine",
    description:
      "Analyzes grammar patterns including repeated words, punctuation errors, and sentence structure.",
    icon: BookOpen,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    key: "readability",
    name: "Readability Engine",
    description:
      "Calculates readability metrics including Flesch score and provides improvement suggestions.",
    icon: BarChart3,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    key: "compliance",
    name: "Compliance Engine",
    description:
      "Checks for enterprise compliance including tone, prohibited words, and sensitive content.",
    icon: ShieldAlert,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    key: "confidence",
    name: "Confidence Engine",
    description:
      "Aggregates results from all engines to produce overall quality scores and confidence ratings.",
    icon: Gauge,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    gradient: "from-violet-500 to-purple-500",
  },
];

const FILE_FORMATS = [
  {
    name: "Plain Text",
    ext: ".txt",
    icon: FileType2,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    name: "HTML",
    ext: ".html",
    icon: FileCode,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  {
    name: "SVG",
    ext: ".svg",
    icon: ImageIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    name: "PDF",
    ext: ".pdf",
    icon: FileText,
    color: "text-rose-500",
    bgColor: "bg-rose-100",
  },
  {
    name: "PNG",
    ext: ".png",
    icon: ImageIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    name: "JPEG",
    ext: ".jpg",
    icon: ImageIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
  },
  {
    name: "WebP",
    ext: ".webp",
    icon: ImageIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
];

export const SettingsPage: React.FC = () => {
  const { engineConfigs, toggleEngine, clearDocumentIds, setCurrentAnalysis } =
    useStore();
  const { theme, setTheme } = useTheme();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleToggle = (key: string) => {
    toggleEngine(key);
    analysisOrchestrator.setEngineEnabled(key, !engineConfigs[key]?.enabled);
    toast.success(
      `${ENGINE_INFO.find((e) => e.key === key)?.name} ${engineConfigs[key]?.enabled ? "disabled" : "enabled"}`,
    );
  };

  const handleClearAllData = async () => {
    try {
      await db.clearAnalyses();
      clearDocumentIds();
      setCurrentAnalysis(null);
      toast.success("All data cleared successfully");
    } catch {
      toast.error("Failed to clear data");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure your analysis preferences and appearance
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-violet-500" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`
                flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300
                ${
                  theme === "light"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg shadow-violet-500/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  theme === "light"
                    ? "bg-violet-500"
                    : "bg-amber-100 dark:bg-amber-900/30"
                }`}
              >
                <Sun
                  className={`w-7 h-7 ${theme === "light" ? "text-white" : "text-amber-600"}`}
                />
              </div>
              <div className="text-left">
                <p
                  className={`font-semibold ${theme === "light" ? "text-violet-900" : "text-gray-900 dark:text-white"}`}
                >
                  Light Mode
                </p>
                <p
                  className={`text-sm ${theme === "light" ? "text-violet-600" : "text-gray-500"}`}
                >
                  Clean and bright interface
                </p>
              </div>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`
                flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300
                ${
                  theme === "dark"
                    ? "border-violet-500 bg-violet-900/20 shadow-lg shadow-violet-500/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  theme === "dark"
                    ? "bg-violet-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Moon
                  className={`w-7 h-7 ${theme === "dark" ? "text-white" : "text-slate-600"}`}
                />
              </div>
              <div className="text-left">
                <p
                  className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900 dark:text-white"}`}
                >
                  Dark Mode
                </p>
                <p
                  className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                >
                  Easy on the eyes
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            Analysis Engines
          </CardTitle>
          <CardDescription>
            Enable or disable individual validation engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ENGINE_INFO.map((engine) => {
            const config = engineConfigs[engine.key];
            const Icon = engine.icon;
            const isEnabled = config?.enabled ?? true;

            return (
              <div
                key={engine.key}
                className={`
                  flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300
                  ${
                    isEnabled
                      ? "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                      : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-75"
                  }
                `}
              >
                <div
                  className={`w-14 h-14 ${engine.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-7 h-7 ${engine.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {engine.name}
                    </h3>
                    <button
                      onClick={() => handleToggle(engine.key)}
                      className="transition-transform duration-200 hover:scale-110"
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-10 h-10 text-violet-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {engine.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                      v{config?.version || "1.0.0"}
                    </span>
                    {isEnabled && (
                      <span className="text-xs px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your stored analysis data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
            <div>
              <h4 className="font-semibold text-rose-900 dark:text-rose-400">
                Clear All Data
              </h4>
              <p className="text-sm text-rose-700 dark:text-rose-300">
                This will permanently delete all analysis history and reset the
                dashboard
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowClearDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Supported Document Formats
          </CardTitle>
          <CardDescription>
            Upload and analyze documents in these formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            {FILE_FORMATS.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.ext}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all"
                >
                  <div
                    className={`w-12 h-12 ${format.bgColor} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${format.color}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {format.ext}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border-violet-100 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-violet-500" />
            About DocuIntel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Version
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                1.0.0
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                License
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                MIT License
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 rounded-xl">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Privacy First
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All document processing happens locally in your browser. No data
                is sent to external servers, ensuring your documents remain
                private and secure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data"
        description="Are you sure you want to delete all analysis history? This will also reset the dashboard. This action cannot be undone."
        confirmText="Clear All Data"
        variant="danger"
      />
    </div>
  );
};
