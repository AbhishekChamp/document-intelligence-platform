import React from 'react';
import { cn } from '../utils/cn';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = true,
  size = 'md',
  variant = 'gradient'
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between mb-1.5">
        {showPercentage && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Processing...
          </span>
        )}
        {showPercentage && (
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className={cn(
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variant === 'gradient' 
              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
              : 'bg-blue-500'
          )}
          style={{ width: `${clampedProgress}%` }}
        >
          {clampedProgress > 0 && (
            <div className="w-full h-full bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};
