import { useMemo } from 'react';
import type { AnalysisResult, ValidationIssue } from '../types/domain.types';

interface IssueStats {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byEngine: Record<string, number>;
  total: number;
}

interface TrendData {
  date: string;
  score: number;
  issues: number;
}

export function useAnalysisStats(analysis: AnalysisResult | null, history: AnalysisResult[] = []) {
  return useMemo(() => {
    if (!analysis) {
      return {
        issueStats: { byType: {}, bySeverity: {}, byEngine: {}, total: 0 },
        scoreBreakdown: null,
        trends: [],
        topIssues: [],
        improvement: null
      };
    }

    const issueStats = analysis.issues.reduce<IssueStats>(
      (acc, issue) => ({
        byType: { ...acc.byType, [issue.type]: (acc.byType[issue.type] || 0) + 1 },
        bySeverity: { ...acc.bySeverity, [issue.severity]: (acc.bySeverity[issue.severity] || 0) + 1 },
        byEngine: { ...acc.byEngine, [issue.engine]: (acc.byEngine[issue.engine] || 0) + 1 },
        total: acc.total + 1
      }),
      { byType: {}, bySeverity: {}, byEngine: {}, total: 0 }
    );

    const scoreBreakdown = {
      overall: analysis.score.overallScore,
      clarity: analysis.score.clarityScore,
      correctness: analysis.score.correctnessScore,
      compliance: analysis.score.complianceScore,
      confidence: analysis.score.confidenceScore
    };

    const trends: TrendData[] = history.map(h => ({
      date: new Date(h.analyzedAt).toLocaleDateString(),
      score: h.score.overallScore,
      issues: h.issues.length
    }));

    const messageCounts = analysis.issues.reduce<Record<string, ValidationIssue & { count: number }>>(
      (acc, issue) => {
        if (!acc[issue.message]) {
          acc[issue.message] = { ...issue, count: 0 };
        }
        acc[issue.message].count++;
        return acc;
      },
      {}
    );
    
    const topIssues = Object.values(messageCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let improvement = null;
    if (history.length > 1) {
      const prev = history[history.length - 2];
      const curr = history[history.length - 1];
      improvement = {
        scoreDelta: curr.score.overallScore - prev.score.overallScore,
        issuesDelta: prev.issues.length - curr.issues.length
      };
    }

    return { issueStats, scoreBreakdown, trends, topIssues, improvement };
  }, [analysis, history]);
}
