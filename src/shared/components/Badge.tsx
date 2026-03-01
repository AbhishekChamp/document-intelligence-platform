import React from 'react';
import { cn } from '../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-1 text-sm': size === 'md',
          },
          {
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': variant === 'default',
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'error',
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
            'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400': variant === 'neutral',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export const SeverityBadge = React.forwardRef<HTMLSpanElement, { severity: 'low' | 'medium' | 'high' } & Omit<BadgeProps, 'variant'>>(
  ({ severity, className, ...props }, ref) => {
    const variantMap: Record<string, BadgeVariant> = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    
    return (
      <Badge
        ref={ref}
        variant={variantMap[severity]}
        className={cn('uppercase text-xs tracking-wide', className)}
        {...props}
      >
        {severity}
      </Badge>
    );
  }
);

SeverityBadge.displayName = 'SeverityBadge';
