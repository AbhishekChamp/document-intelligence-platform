import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/Dialog';
import { useStore } from '../../../shared/hooks/useStore';
import { db } from '../../../infrastructure/caching/db';
import type { AnalysisResult } from '../../../shared/types/domain.types';
import { Trash2, Download, FileText, Calendar, Clock, ChevronRight, BarChart3, Clock as ClockIcon } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { setCurrentAnalysis, clearDocumentIds } = useStore();
  const [dbAnalyses, setDbAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const analyses = await db.getAllAnalyses();
      setDbAnalyses(analyses.sort((a, b) => b.analyzedAt - a.analyzedAt));
    } catch (error) {
      console.error('Failed to load analyses:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await db.clearAnalyses();
      clearDocumentIds();
      setDbAnalyses([]);
      toast.success('History cleared successfully');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleExport = (analysis: AnalysisResult) => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${analysis.documentId}-${analysis.analyzedAt}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analysis exported successfully');
  };

  const handleLoadAnalysis = (analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    window.location.href = '/';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-rose-50 dark:bg-rose-900/20';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Analysis History
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage your past document analyses
          </p>
        </div>
        {dbAnalyses.length > 0 && (
          <Button variant="danger" size="sm" onClick={() => setShowClearDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/5 to-purple-600/5 border-violet-100 dark:border-violet-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{dbAnalyses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {dbAnalyses.length > 0 
                  ? Math.round(dbAnalyses.reduce((sum, a) => sum + a.score.overallScore, 0) / dbAnalyses.length)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Documents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {new Set(dbAnalyses.map(a => a.documentId)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {dbAnalyses.length === 0 ? (
        <Card className="py-20">
          <CardContent className="text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No History Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Analyze your first document to start building your analysis history
            </p>
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
            >
              Start Analyzing
              <ChevronRight className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dbAnalyses.map((analysis) => (
            <Card 
              key={`${analysis.documentId}-${analysis.analyzedAt}`} 
              className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${getScoreBg(analysis.score.overallScore)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.score.overallScore)}`}>
                        {analysis.score.overallScore}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {analysis.document.metadata.fileName || `Document ${analysis.documentId.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(analysis.analyzedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(analysis.analyzedAt).toLocaleTimeString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {analysis.metrics.wordCount.toLocaleString()} words
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={analysis.score.overallScore >= 70 ? 'success' : 'warning'} size="sm">
                          {analysis.score.overallScore >= 80 ? 'Excellent' : 
                           analysis.score.overallScore >= 60 ? 'Good' : 'Needs Work'}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {analysis.document.metadata.sourceType.toUpperCase()}
                        </Badge>
                        {analysis.enginesUsed.map(engine => (
                          <Badge key={engine} variant="info" size="sm">
                            {engine.split(' ')[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleExport(analysis)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleLoadAnalysis(analysis)}
                    >
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearHistory}
        title="Clear Analysis History"
        description="Are you sure you want to delete all analysis history? This action cannot be undone and will also reset the dashboard."
        confirmText="Clear History"
        variant="danger"
      />
    </div>
  );
};
