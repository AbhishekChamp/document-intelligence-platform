import React, { useCallback, useState, useRef } from "react";
import { cn } from "../utils/cn";
import {
  Upload,
  FileText,
  Image,
  FileCode,
  AlertCircle,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onTextPaste?: (text: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

// File types categorized by accuracy
const RECOMMENDED_TYPES = [
  {
    ext: "TXT",
    icon: FileText,
    color: "text-green-600",
    bg: "bg-green-100",
    badge: "Best",
  },
  {
    ext: "HTML",
    icon: FileCode,
    color: "text-green-600",
    bg: "bg-green-100",
    badge: "Best",
  },
];

const GOOD_TYPES = [
  {
    ext: "PDF",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-100",
    badge: "Good",
  },
];

const LIMITED_TYPES = [
  {
    ext: "PNG",
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-100",
    badge: "Limited",
  },
  {
    ext: "JPG",
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-100",
    badge: "Limited",
  },
  {
    ext: "WEBP",
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-100",
    badge: "Limited",
  },
  {
    ext: "SVG",
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-100",
    badge: "Limited",
  },
];

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onTextPaste,
  accept = ".txt,.html,.svg,.pdf,.png,.jpg,.jpeg,.webp",
  maxSize = 10 * 1024 * 1024,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      return null;
    },
    [maxSize],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile],
  );

  const handleTextSubmit = () => {
    if (pastedText.trim()) {
      onTextPaste?.(pastedText);
      setPastedText("");
      setShowTextInput(false);
    }
  };

  if (showTextInput) {
    return (
      <div className={cn("relative", className)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="paste-text-title"
          className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-violet-200 dark:border-violet-800 p-8 shadow-xl shadow-violet-500/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="paste-text-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Paste Your Text
            </h3>
            <button
              onClick={() => setShowTextInput(false)}
              aria-label="Close text input dialog"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Type or paste your text here for analysis..."
            aria-label="Text to analyze"
            aria-describedby="text-input-help"
            className="w-full h-56 p-5 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
          />
          <p id="text-input-help" className="sr-only">
            Enter the text you want to analyze for spelling, grammar, and
            readability issues.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowTextInput(false)}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTextSubmit}
              disabled={!pastedText.trim()}
              aria-disabled={!pastedText.trim()}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/25"
            >
              Analyze Text
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Drop zone for file upload. Click or drag and drop a file here."
        aria-describedby="file-types-help"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          isDragOver
            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 scale-[1.02]"
            : "border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-800",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Choose file to upload"
        />

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-600/5 transition-opacity duration-300",
            isDragOver ? "opacity-100" : "opacity-0",
          )}
        />

        <div className="relative z-0">
          <div
            className={cn(
              "w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-300",
              isDragOver
                ? "bg-violet-500 scale-110 shadow-xl shadow-violet-500/30"
                : "bg-violet-100 dark:bg-violet-900/30",
            )}
          >
            <Upload
              className={cn(
                "w-10 h-10 transition-colors duration-300",
                isDragOver ? "text-white" : "text-violet-500",
              )}
            />
          </div>

          <h3
            className={cn(
              "text-2xl font-bold mb-2 transition-colors",
              isDragOver
                ? "text-violet-700 dark:text-violet-300"
                : "text-gray-900 dark:text-white",
            )}
          >
            Drop your document here
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            or click to browse from your computer
          </p>

          {/* File type indicators */}
          <div className="space-y-3">
            {/* Recommended formats */}
            <div className="flex flex-wrap justify-center gap-2">
              {RECOMMENDED_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.ext}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
                    title={`${type.ext} - Recommended format`}
                  >
                    <CheckCircle
                      className="w-3 h-3 text-green-600"
                      aria-hidden="true"
                    />
                    <Icon
                      className={cn("w-3.5 h-3.5", type.color)}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-green-800 dark:text-green-300">
                      {type.ext}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Good formats */}
            <div className="flex flex-wrap justify-center gap-2">
              {GOOD_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.ext}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
                    title={`${type.ext} - Good accuracy`}
                  >
                    <Icon
                      className={cn("w-3.5 h-3.5", type.color)}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {type.ext}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Limited accuracy formats */}
            <div className="flex flex-wrap justify-center gap-2">
              {LIMITED_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.ext}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800"
                    title={`${type.ext} - Limited accuracy (OCR-based)`}
                  >
                    <AlertTriangle
                      className="w-3 h-3 text-amber-600"
                      aria-hidden="true"
                    />
                    <Icon
                      className={cn("w-3.5 h-3.5", type.color)}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      {type.ext}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Important: Format Accuracy Notice
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              <span className="font-medium text-green-700 dark:text-green-400">
                TXT and HTML files work perfectly
              </span>{" "}
              — these are the recommended formats for best results.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              <span className="font-medium">PDF files work well</span> for
              text-based documents.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              <span className="font-medium text-red-700 dark:text-red-400">
                Image files (PNG, JPG, WEBP, SVG) have poor accuracy
              </span>{" "}
              — OCR technology is limited and may produce unreliable results.
              Consider converting images to text before uploading for accurate
              analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-500">
            or
          </span>
        </div>
      </div>

      <button
        onClick={() => setShowTextInput(true)}
        className="w-full py-4 border-2 border-dashed border-green-400 dark:border-green-600 rounded-2xl text-green-700 dark:text-green-400 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all duration-300 font-medium flex items-center justify-center gap-2"
      >
        <FileText className="w-5 h-5" />
        Type or paste text directly (Recommended)
      </button>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};
