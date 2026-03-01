import React, { useMemo } from 'react';
import type { ValidationIssue } from '../types/domain.types';
import { ISSUE_TYPE_COLORS, SEVERITY_COLORS } from '../constants';
import { cn } from '../utils/cn';
import { AlertCircle, CheckCircle, BookOpen, ShieldAlert, Gauge, Lightbulb } from 'lucide-react';

interface IssueListProps {
  issues: ValidationIssue[];
  selectedIssueId?: string | null;
  onIssueSelect?: (issue: ValidationIssue) => void;
  onIssueHover?: (issue: ValidationIssue | null) => void;
  filterType?: string | null;
  filterSeverity?: string | null;
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  spell: <CheckCircle className="w-4 h-4" />,
  grammar: <BookOpen className="w-4 h-4" />,
  readability: <BookOpen className="w-4 h-4" />,
  compliance: <ShieldAlert className="w-4 h-4" />,
  confidence: <Gauge className="w-4 h-4" />
};

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  selectedIssueId,
  onIssueSelect,
  onIssueHover,
  filterType,
  filterSeverity,
  className
}) => {
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filterType && issue.type !== filterType) return false;
      if (filterSeverity && issue.severity !== filterSeverity) return false;
      return true;
    });
  }, [issues, filterType, filterSeverity]);

  const groupedIssues = useMemo(() => {
    return filteredIssues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, ValidationIssue[]>);
  }, [filteredIssues]);

  const getIssuePreview = (issue: ValidationIssue) => {
    return issue.message.length > 60 ? issue.message.slice(0, 60) + '...' : issue.message;
  };

  if (filteredIssues.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400', className)}>
        <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
        <p className="text-lg font-medium">No issues found</p>
        <p className="text-sm">Great job! Your document looks good.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(groupedIssues).map(([type, typeIssues]) => (
        <div key={type} className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <span style={{ color: ISSUE_TYPE_COLORS[type as keyof typeof ISSUE_TYPE_COLORS] }}>
              {typeIcons[type]}
            </span>
            {type} ({typeIssues.length})
          </h4>
          <div className="space-y-1">
            {typeIssues.map(issue => (
              <div
                key={issue.id}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4 hover:shadow-sm',
                  selectedIssueId === issue.id 
                    ? 'bg-gray-50 dark:bg-gray-700/50 shadow-sm' 
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
                style={{ 
                  borderLeftColor: SEVERITY_COLORS[issue.severity],
                  boxShadow: selectedIssueId === issue.id ? `0 0 0 1px ${SEVERITY_COLORS[issue.severity]}40` : undefined
                }}
                onClick={() => onIssueSelect?.(issue)}
                onMouseEnter={() => onIssueHover?.(issue)}
                onMouseLeave={() => onIssueHover?.(null)}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle 
                    className="w-4 h-4 mt-0.5 flex-shrink-0" 
                    style={{ color: SEVERITY_COLORS[issue.severity] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getIssuePreview(issue)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${SEVERITY_COLORS[issue.severity]}20`,
                          color: SEVERITY_COLORS[issue.severity]
                        }}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(issue.confidence * 100)}% confidence
                      </span>
                    </div>
                    {issue.suggestions.length > 0 && (
                      <div className="mt-2 flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{issue.suggestions[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
