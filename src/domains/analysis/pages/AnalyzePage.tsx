import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { performanceMonitor } from "../../../infrastructure/monitoring/performance";
import { FileUpload } from "../../../shared/components/FileUpload";
import { TextEditor } from "../../../shared/components/TextEditor";
import { IssueList } from "../../../shared/components/IssueList";
import { ScoreGauge } from "../../../shared/components/Progress";
import { ProgressBar } from "../../../shared/components/ProgressBar";
import { Card, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { useStore } from "../../../shared/hooks/useStore";
import { documentProcessor } from "../../document/document-processor";
import { db } from "../../../infrastructure/caching/db";
import type { ValidationIssue } from "../../../shared/types/domain.types";
import type { AnalysisMode } from "../analysis-orchestrator";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Download,
  Sparkles,
  Zap,
  CheckCircle,
  BookOpen,
  ShieldAlert,
  BarChart3,
  ArrowLeft,
  Filter,
  Globe,
} from "lucide-react";

const ANALYSIS_MODES: {
  id: AnalysisMode;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}[] = [
  {
    id: "full",
    label: "Full Analysis",
    icon: Zap,
    description: "Complete document check",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "spell",
    label: "Spell Check",
    icon: CheckCircle,
    description: "Spelling only",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "grammar",
    label: "Grammar",
    icon: BookOpen,
    description: "Grammar rules only",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "readability",
    label: "Readability",
    icon: BarChart3,
    description: "Readability metrics",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ShieldAlert,
    description: "Policy check only",
    color: "from-rose-500 to-pink-500",
  },
];

export const AnalyzePage: React.FC = () => {
  const {
    currentAnalysis,
    setCurrentAnalysis,
    setIsAnalyzing,
    addDocumentId,
    analysisMode,
    setAnalysisMode,
    isAnalyzing,
    analysisProgress,
    setAnalysisProgress,
    analysisProgressMessage,
    setAnalysisProgressMessage,
  } = useStore();

  const [showUpload, setShowUpload] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(
    null,
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const handleProgress = useCallback(
    (progress: number, message: string) => {
      setAnalysisProgress(progress);
      setAnalysisProgressMessage(message);
    },
    [setAnalysisProgress, setAnalysisProgressMessage],
  );

  const analysisAbortController = useRef<AbortController | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisAbortController.current) {
        analysisAbortController.current.abort();
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Cancel any existing analysis
      if (analysisAbortController.current) {
        analysisAbortController.current.abort();
      }
      analysisAbortController.current = new AbortController();
      const signal = analysisAbortController.current.signal;

      setIsAnalyzing(true);
      handleProgress(0, "Starting analysis...");

      // Set a timeout for the analysis (5 minutes max)
      const TIMEOUT_MS = 5 * 60 * 1000;
      analysisTimeoutRef.current = setTimeout(() => {
        if (analysisAbortController.current) {
          analysisAbortController.current.abort();
        }
        toast.error(
          "Analysis timed out. The file may be too large or complex.",
        );
        setIsAnalyzing(false);
      }, TIMEOUT_MS);

      try {
        const result = await performanceMonitor.measure(
          "file-analysis",
          () =>
            documentProcessor.processFile(
              file,
              analysisMode,
              ({ percentage, message }) => {
                if (!signal.aborted) {
                  handleProgress(percentage, message);
                }
              },
            ),
          { mode: analysisMode, fileType: file.type, fileSize: file.size },
        );

        if (signal.aborted) {
          throw new Error("Analysis was cancelled");
        }

        setCurrentAnalysis(result);
        addDocumentId(result.documentId);

        // Save to history - non-critical operation, don't fail if it errors
        try {
          await db.saveAnalysis(result);
        } catch (dbError) {
          console.warn("Failed to save analysis to history:", dbError);
          if ((dbError as Error).message?.includes("quota")) {
            toast.error("Storage full. Please clear some history.", {
              icon: "💾",
            });
          }
        }

        setShowUpload(false);
        toast.success(
          `Analysis complete! Found ${result.issues.length} issues.`,
        );
      } catch (error) {
        if (
          (error as Error).name === "AbortError" ||
          (error as Error).message?.includes("cancelled")
        ) {
          toast.error("Analysis was cancelled");
        } else {
          console.error("Analysis failed:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(`Analysis failed: ${errorMessage}`);
        }
      } finally {
        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = null;
        }
        setIsAnalyzing(false);
        setAnalysisProgressMessage("");
        analysisAbortController.current = null;
      }
    },
    [
      analysisMode,
      setIsAnalyzing,
      handleProgress,
      setCurrentAnalysis,
      addDocumentId,
      setShowUpload,
      setAnalysisProgressMessage,
    ],
  );

  const handleTextPaste = useCallback(
    async (text: string) => {
      setIsAnalyzing(true);
      handleProgress(0, "Starting analysis...");

      try {
        const result = await documentProcessor.processText(
          text,
          "pasted-text.txt",
          analysisMode,
          ({ percentage, message }) => handleProgress(percentage, message),
        );

        setCurrentAnalysis(result);
        addDocumentId(result.documentId);
        // Save to history - non-critical operation
        try {
          await db.saveAnalysis(result);
        } catch (dbError) {
          console.warn("Failed to save analysis to history:", dbError);
        }
        setShowUpload(false);
        toast.success(
          `Analysis complete! Found ${result.issues.length} issues.`,
        );
      } catch (error) {
        console.error("Analysis failed:", error);
        toast.error("Failed to analyze text. Please try again.");
      } finally {
        setIsAnalyzing(false);
        setAnalysisProgressMessage("");
      }
    },
    [
      analysisMode,
      setIsAnalyzing,
      handleProgress,
      setCurrentAnalysis,
      addDocumentId,
      setShowUpload,
      setAnalysisProgressMessage,
    ],
  );

  const handleIssueClick = useCallback((issue: ValidationIssue) => {
    setSelectedIssueId(issue.id);
    setSelectedIssue(issue);
  }, []);

  const handleExport = useCallback(() => {
    if (!currentAnalysis) return;

    const dataStr = JSON.stringify(currentAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-${currentAnalysis.documentId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Analysis exported successfully!");
  }, [currentAnalysis]);

  const counts = useMemo(() => {
    if (!currentAnalysis) return { high: 0, medium: 0, low: 0, total: 0 };
    return currentAnalysis.issues.reduce(
      (acc, issue) => {
        acc[issue.severity]++;
        acc.total++;
        return acc;
      },
      { high: 0, medium: 0, low: 0, total: 0 },
    );
  }, [currentAnalysis]);

  if (showUpload) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent mb-4">
            Document Intelligence
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select an analysis mode and upload your document for instant
            insights
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Choose Analysis Mode
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ANALYSIS_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = analysisMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setAnalysisMode(mode.id)}
                  className={`
                    relative p-4 rounded-2xl border-2 transition-all duration-300 text-left
                    ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${mode.color} text-white shadow-lg`
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                >
                  <Icon
                    className={`w-6 h-6 mb-3 ${isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                  />
                  <p
                    className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-900 dark:text-white"}`}
                  >
                    {mode.label}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Format Recommendations */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                Recommended File Formats
              </p>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-green-800 dark:text-green-400">
                  <span className="font-bold">✓ Best:</span> TXT, HTML — Perfect
                  accuracy
                </p>
                <p className="text-xs text-green-800 dark:text-green-400">
                  <span className="font-bold">✓ Good:</span> PDF — Works well
                  for text-based documents
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-bold">⚠ Limited:</span> PNG, JPG, WEBP,
                  SVG — OCR accuracy is unreliable. Results may be poor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* US-English Disclaimer */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Optimized for US-English
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                This application is specifically designed and optimized for
                United States English text. Spelling, grammar rules, and text
                recognition accuracy are calibrated for US-English conventions.
                Results may vary for other languages or regional English
                variants.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <FileUpload
            onFileSelect={handleFileSelect}
            onTextPaste={handleTextPaste}
          />

          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10">
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full" />
                <div
                  className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: "1s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-violet-600">
                    {Math.round(analysisProgress)}%
                  </span>
                </div>
              </div>

              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {ANALYSIS_MODES.find((m) => m.id === analysisMode)?.label}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                {analysisProgressMessage || "Processing..."}
              </p>

              <div className="w-80">
                <ProgressBar progress={analysisProgress} />
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span>This may take a moment for large documents</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setShowUpload(true)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analysis Results
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ANALYSIS_MODES.find((m) => m.id === analysisMode)?.label} •{" "}
              {currentAnalysis?.document.metadata.fileName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            New Document
          </Button>
          {currentAnalysis && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {currentAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 border-violet-200 dark:border-violet-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ScoreGauge
                  score={currentAnalysis.score.overallScore}
                  size="sm"
                />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentAnalysis.score.overallScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Words
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentAnalysis.metrics.wordCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Reading Level
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentAnalysis.metrics.fleschGradeLevel}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Issues
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {counts.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Engines
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentAnalysis.enginesUsed.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {currentAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[600px] shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Document Preview
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={filterType || ""}
                    onChange={(e) => setFilterType(e.target.value || null)}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Types</option>
                    <option value="spell">Spelling</option>
                    <option value="grammar">Grammar</option>
                    <option value="readability">Readability</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
              </div>
              <div className="h-[calc(100%-65px)]">
                <TextEditor
                  text={currentAnalysis.document.rawText}
                  issues={currentAnalysis.issues}
                  selectedIssueId={selectedIssueId}
                  onIssueClick={handleIssueClick}
                  readOnly
                  filterType={filterType}
                  filterSeverity={filterSeverity}
                />
              </div>
            </Card>
          </div>

          <div>
            <Card className="h-[600px] shadow-lg flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Issues ({counts.total})
                  </h3>
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  {["high", "medium", "low"].map((sev) => (
                    <button
                      key={sev}
                      onClick={() =>
                        setFilterSeverity(filterSeverity === sev ? null : sev)
                      }
                      className={`
                        px-2 py-1 rounded-lg text-xs font-medium transition-colors
                        ${
                          filterSeverity === sev
                            ? sev === "high"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : sev === "medium"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      {sev} ({counts[sev as keyof typeof counts]})
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <IssueList
                  issues={currentAnalysis.issues}
                  selectedIssueId={selectedIssueId}
                  onIssueSelect={handleIssueClick}
                  filterType={filterType}
                  filterSeverity={filterSeverity}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {selectedIssue && (
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {selectedIssue.message}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{selectedIssue.type}</span>
                  <span>•</span>
                  <span>{selectedIssue.engine}</span>
                  <span>•</span>
                  <span>
                    {Math.round(selectedIssue.confidence * 100)}% confidence
                  </span>
                </div>
                {selectedIssue.suggestions.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-400 mb-2">
                      Suggestions:
                    </p>
                    <ul className="space-y-1">
                      {selectedIssue.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Badge
                variant={
                  selectedIssue.severity === "high"
                    ? "error"
                    : selectedIssue.severity === "medium"
                      ? "warning"
                      : "success"
                }
                className="text-xs uppercase"
              >
                {selectedIssue.severity}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
