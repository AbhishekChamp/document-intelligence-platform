import React, { useCallback, useState } from 'react';
import { cn } from '../utils/cn';
import { Upload, FileText, Image, FileCode, AlertCircle, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onTextPaste?: (text: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

const FILE_TYPES = [
  { ext: 'TXT', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  { ext: 'HTML', icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-100' },
  { ext: 'SVG', icon: Image, color: 'text-blue-500', bg: 'bg-blue-100' },
  { ext: 'PDF', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-100' },
  { ext: 'PNG', icon: Image, color: 'text-purple-500', bg: 'bg-purple-100' },
  { ext: 'JPG', icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { ext: 'WEBP', icon: Image, color: 'text-amber-500', bg: 'bg-amber-100' },
];

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onTextPaste,
  accept = '.txt,.html,.svg,.pdf,.png,.jpg,.jpeg,.webp',
  maxSize = 10 * 1024 * 1024,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, [onFileSelect, maxSize]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [onFileSelect, maxSize]);

  const handleTextSubmit = () => {
    if (pastedText.trim()) {
      onTextPaste?.(pastedText);
      setPastedText('');
      setShowTextInput(false);
    }
  };

  if (showTextInput) {
    return (
      <div className={cn('relative', className)}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-violet-200 dark:border-violet-800 p-8 shadow-xl shadow-violet-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paste Your Text</h3>
            <button 
              onClick={() => setShowTextInput(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Type or paste your text here for analysis..."
            className="w-full h-56 p-5 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
          />
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
    <div className={cn('space-y-6', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer overflow-hidden',
          isDragOver 
            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-800'
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-600/5 transition-opacity duration-300',
          isDragOver ? 'opacity-100' : 'opacity-0'
        )} />
        
        <div className="relative z-0">
          <div className={cn(
            'w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-300',
            isDragOver ? 'bg-violet-500 scale-110 shadow-xl shadow-violet-500/30' : 'bg-violet-100 dark:bg-violet-900/30'
          )}>
            <Upload className={cn(
              'w-10 h-10 transition-colors duration-300',
              isDragOver ? 'text-white' : 'text-violet-500'
            )} />
          </div>
          
          <h3 className={cn(
            'text-2xl font-bold mb-2 transition-colors',
            isDragOver ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'
          )}>
            Drop your document here
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            or click to browse from your computer
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {FILE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div 
                  key={type.ext}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <Icon className={cn('w-3.5 h-3.5', type.color)} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{type.ext}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-500">or</span>
        </div>
      </div>

      <button
        onClick={() => setShowTextInput(true)}
        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-600 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all duration-300 font-medium"
      >
        Type or paste text directly
      </button>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};
