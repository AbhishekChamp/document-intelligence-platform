import React from 'react';
import { cn } from '../utils/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, size = 'md', variant = 'default', showValue = false, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const getVariantColor = () => {
      switch (variant) {
        case 'success': return 'bg-green-500';
        case 'warning': return 'bg-yellow-500';
        case 'error': return 'bg-red-500';
        default: return 'bg-blue-500';
      }
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className="flex items-center justify-between mb-1">
          {showValue && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>
          )}
        </div>
        <div 
          className={cn(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
            {
              'h-1.5': size === 'sm',
              'h-2.5': size === 'md',
              'h-4': size === 'lg',
            }
          )}
        >
          <div
            className={cn('transition-all duration-500 ease-out rounded-full', getVariantColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export const ScoreGauge = React.forwardRef<HTMLDivElement, { score: number; size?: 'sm' | 'md' | 'lg' } & React.HTMLAttributes<HTMLDivElement>>(
  ({ score, size = 'md', className, ...props }, ref) => {
    const getColor = (s: number) => {
      if (s >= 80) return 'text-green-500';
      if (s >= 60) return 'text-yellow-500';
      return 'text-red-500';
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'sm': return 'w-16 h-16 text-2xl';
        case 'lg': return 'w-32 h-32 text-5xl';
        default: return 'w-24 h-24 text-4xl';
      }
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div ref={ref} className={cn('relative flex items-center justify-center', className)} {...props}>
        <svg className={cn('transform -rotate-90', getSizeClasses())} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000 ease-out', getColor(score))}
          />
        </svg>
        <span className={cn('absolute font-bold', getColor(score), size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-3xl')}>
          {score}
        </span>
      </div>
    );
  }
);

ScoreGauge.displayName = 'ScoreGauge';
