import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'default'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={cn(
        'relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl',
        'transform transition-all scale-100',
        'border border-gray-200 dark:border-gray-700'
      )}>
        <div className="flex items-start gap-4 p-6">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmText}
          </Button>
        </>
      }
    />
  );
};
