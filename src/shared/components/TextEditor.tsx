import React, { useMemo, useCallback, useRef, useEffect } from "react";
import type { ValidationIssue } from "../types/domain.types";
import { SEVERITY_COLORS } from "../constants";

interface TextEditorProps {
  text: string;
  issues: ValidationIssue[];
  selectedIssueId?: string | null;
  onIssueClick?: (issue: ValidationIssue) => void;
  readOnly?: boolean;
  onChange?: (text: string) => void;
  filterType?: string | null;
  filterSeverity?: string | null;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  issues,
  selectedIssueId,
  onIssueClick,
  readOnly = false,
  onChange,
  filterType,
  filterSeverity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIssueRef = useRef<HTMLSpanElement>(null);
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterType && issue.type !== filterType) return false;
      if (filterSeverity && issue.severity !== filterSeverity) return false;
      return true;
    });
  }, [issues, filterType, filterSeverity]);

  const segments = useMemo(() => {
    const result: Array<{
      text: string;
      issue?: ValidationIssue;
      isIssue: boolean;
    }> = [];
    let lastIndex = 0;

    const sortedIssues = [...filteredIssues].sort(
      (a, b) => a.startIndex - b.startIndex,
    );

    for (const issue of sortedIssues) {
      if (issue.startIndex > lastIndex) {
        result.push({
          text: text.slice(lastIndex, issue.startIndex),
          isIssue: false,
        });
      }

      result.push({
        text: text.slice(issue.startIndex, issue.endIndex),
        issue,
        isIssue: true,
      });

      lastIndex = issue.endIndex;
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), isIssue: false });
    }

    return result.length > 0 ? result : [{ text, isIssue: false }];
  }, [text, filteredIssues]);

  const handleIssueClick = useCallback(
    (issue: ValidationIssue) => {
      onIssueClick?.(issue);
    },
    [onIssueClick],
  );

  // Scroll to selected issue when it changes
  useEffect(() => {
    if (selectedIssueId && selectedIssueRef.current && containerRef.current) {
      const element = selectedIssueRef.current;
      const container = containerRef.current;

      // Calculate the element's position relative to the container
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if element is outside the visible area
      const isAbove = elementRect.top < containerRect.top;
      const isBelow = elementRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [selectedIssueId]);

  if (readOnly) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="prose prose-lg max-w-none whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
          {segments.map((segment, index) =>
            segment.isIssue && segment.issue ? (
              <span
                key={index}
                ref={
                  segment.issue.id === selectedIssueId
                    ? selectedIssueRef
                    : undefined
                }
                className="cursor-pointer transition-all duration-200 border-b-2 hover:bg-opacity-20"
                style={{
                  backgroundColor: `${SEVERITY_COLORS[segment.issue.severity]}20`,
                  borderBottomColor: SEVERITY_COLORS[segment.issue.severity],
                  boxShadow:
                    segment.issue.id === selectedIssueId
                      ? `0 0 0 3px ${SEVERITY_COLORS[segment.issue.severity]}60, 0 0 0 6px ${SEVERITY_COLORS[segment.issue.severity]}20`
                      : "none",
                }}
                onClick={() => handleIssueClick(segment.issue!)}
                title={`${segment.issue.message} (${segment.issue.severity})`}
              >
                {segment.text}
              </span>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <textarea
      value={text}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-full p-6 font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Enter or paste your text here..."
    />
  );
};
