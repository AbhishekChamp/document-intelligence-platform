import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/Card';
import { ScoreGauge } from '../../../shared/components/Progress';
import { Badge } from '../../../shared/components/Badge';
import { useStore } from '../../../shared/hooks/useStore';
import { useAnalysisStats } from '../../../shared/hooks/useAnalysisStats';
import { ISSUE_TYPE_COLORS, SEVERITY_COLORS } from '../../../shared/constants';
import { db } from '../../../infrastructure/caching/db';
import type { AnalysisResult } from '../../../shared/types/domain.types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle, BarChart3, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentAnalysis, documentIds } = useStore();
  const [dbAnalyses, setDbAnalyses] = useState<AnalysisResult[]>([]);
  
  useEffect(() => {
    loadAnalyses();
  }, [documentIds]);

  const loadAnalyses = async () => {
    try {
      const analyses = await db.getAllAnalyses();
      setDbAnalyses(analyses.sort((a, b) => b.analyzedAt - a.analyzedAt));
    } catch (error) {
      console.error('Failed to load analyses:', error);
    }
  };
  
  const allAnalyses = dbAnalyses;
  const { issueStats, scoreBreakdown, trends, topIssues, improvement } = useAnalysisStats(
    currentAnalysis, 
    allAnalyses
  );

  const issueTypeData = Object.entries(issueStats.byType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: ISSUE_TYPE_COLORS[type as keyof typeof ISSUE_TYPE_COLORS]
  }));

  const severityData = Object.entries(issueStats.bySeverity).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
  }));

  const scoreData = scoreBreakdown ? [
    { name: 'Overall', score: scoreBreakdown.overall, fullMark: 100 },
    { name: 'Clarity', score: scoreBreakdown.clarity, fullMark: 100 },
    { name: 'Correctness', score: scoreBreakdown.correctness, fullMark: 100 },
    { name: 'Compliance', score: scoreBreakdown.compliance, fullMark: 100 },
    { name: 'Confidence', score: scoreBreakdown.confidence, fullMark: 100 }
  ] : [];

  const avgScore = allAnalyses.length > 0 
    ? Math.round(allAnalyses.reduce((sum, a) => sum + a.score.overallScore, 0) / allAnalyses.length)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Insights and trends from your document analyses
          </p>
        </div>
        {currentAnalysis && (
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium text-violet-900 dark:text-violet-300">
              Last analyzed: {new Date(currentAnalysis.analyzedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Total Analyses</p>
                <p className="text-4xl font-bold mt-1">{allAnalyses.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Average Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgScore}</p>
                  <span className="text-sm text-gray-400">/100</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                avgScore >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <BarChart3 className={`w-7 h-7 ${
                  avgScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Issues</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">{issueStats.total}</p>
              </div>
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Documents</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
                  {new Set(allAnalyses.map(a => a.documentId)).size}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentAnalysis ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border-violet-100 dark:border-violet-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center py-6">
                  <ScoreGauge score={currentAnalysis.score.overallScore} size="lg" />
                  <div className="mt-6 text-center">
                    <Badge 
                      variant={currentAnalysis.score.overallScore >= 70 ? 'success' : 'warning'}
                      className="text-sm px-4 py-1 rounded-full"
                    >
                      {currentAnalysis.score.overallScore >= 80 ? 'Excellent' : 
                       currentAnalysis.score.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  {improvement && (
                    <div className="flex items-center justify-center gap-4 mt-6 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl">
                      <div className={`flex items-center gap-1 ${improvement.scoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {improvement.scoreDelta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-semibold">{improvement.scoreDelta > 0 ? '+' : ''}{improvement.scoreDelta.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400">vs previous</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                      {scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.score >= 80 ? '#10b981' : 
                          entry.score >= 60 ? '#f59e0b' : '#ef4444'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie 
                      data={issueTypeData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {issueTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {issueTypeData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issues by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie 
                      data={severityData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {severityData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {trends.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {topIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Most Frequent Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topIssues.map((issue, index) => (
                    <div key={issue.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                        <span className="font-bold text-violet-600 dark:text-violet-400">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{issue.message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{issue.count} occurrences</p>
                      </div>
                      <Badge 
                        variant={issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'success'}
                        className="rounded-lg"
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="py-20">
          <CardContent className="text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analysis Data</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Analyze a document to see detailed insights and trends on your dashboard
            </p>
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
            >
              Start Analyzing
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
