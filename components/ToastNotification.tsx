import React, { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [toasts, onDismiss]);

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500',
          icon: (
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          textColor: 'text-green-600 dark:text-green-400'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500',
          icon: (
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          textColor: 'text-red-600 dark:text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500',
          icon: (
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          textColor: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500',
          icon: (
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          textColor: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {toasts.map(toast => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`${styles.bg} border-l-4 rounded-lg shadow-lg p-4 animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm ${styles.textColor}`}>
                  {toast.title}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotification;