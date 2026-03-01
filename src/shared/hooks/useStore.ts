import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AnalysisResult, EngineConfig } from '../types/domain.types';

type AnalysisMode = 'full' | 'spell' | 'grammar' | 'readability' | 'compliance' | 'confidence';

interface AppState {
  engineConfigs: Record<string, EngineConfig>;
  setEngineConfig: (name: string, config: EngineConfig) => void;
  toggleEngine: (name: string) => void;
  
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  clearCurrentAnalysis: () => void;
  
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  analysisProgress: number;
  setAnalysisProgress: (progress: number) => void;
  analysisProgressMessage: string;
  setAnalysisProgressMessage: (message: string) => void;
  
  documentIds: string[];
  addDocumentId: (id: string) => void;
  clearDocumentIds: () => void;
}

// Custom storage wrapper with error handling
const customStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      engineConfigs: {
        spell: { name: 'Spell Engine', version: '1.0.0', enabled: true },
        grammar: { name: 'Grammar Engine', version: '1.0.0', enabled: true },
        readability: { name: 'Readability Engine', version: '1.0.0', enabled: true },
        compliance: { name: 'Compliance Engine', version: '1.0.0', enabled: true },
        confidence: { name: 'Confidence Engine', version: '1.0.0', enabled: true }
      },
      setEngineConfig: (name, config) =>
        set((state) => ({
          engineConfigs: { ...state.engineConfigs, [name]: config }
        })),
      toggleEngine: (name) =>
        set((state) => ({
          engineConfigs: {
            ...state.engineConfigs,
            [name]: { ...state.engineConfigs[name], enabled: !state.engineConfigs[name].enabled }
          }
        })),
      
      analysisMode: 'full',
      setAnalysisMode: (mode) => set({ analysisMode: mode }),
      
      currentAnalysis: null,
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      clearCurrentAnalysis: () => set({ currentAnalysis: null }),
      
      isAnalyzing: false,
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      analysisProgress: 0,
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      analysisProgressMessage: '',
      setAnalysisProgressMessage: (message) => set({ analysisProgressMessage: message }),
      
      documentIds: [],
      addDocumentId: (id) =>
        set((state) => ({
          documentIds: state.documentIds.includes(id) 
            ? state.documentIds 
            : [...state.documentIds, id]
        })),
      clearDocumentIds: () => set({ documentIds: [] })
    }),
    {
      name: 'docuintel-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        engineConfigs: state.engineConfigs,
        analysisMode: state.analysisMode,
        documentIds: state.documentIds.slice(0, 100),
      }),
    }
  )
);

// Selector hooks for better performance
export const useEngineConfigs = () => useStore((state) => state.engineConfigs);
export const useAnalysisMode = () => useStore((state) => state.analysisMode);
export const useCurrentAnalysis = () => useStore((state) => state.currentAnalysis);
export const useAnalysisStatus = () => useStore((state) => ({
  isAnalyzing: state.isAnalyzing,
  progress: state.analysisProgress,
  message: state.analysisProgressMessage,
}));
