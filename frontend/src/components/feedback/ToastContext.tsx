/**
 * Toast Context e Hook para notificações
 */

import React, { createContext, useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook para usar toasts
 */
export const useToast = (): Omit<ToastContextType, 'toasts'> => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return {
    addToast: context.addToast,
    removeToast: context.removeToast,
    clearToasts: context.clearToasts,
  };
};

/**
 * Hook com shortcuts para cada tipo
 */
export const useToastShortcuts = () => {
  const { addToast } = useToast();

  return {
    success: (message: string, title?: string) =>
      addToast({ type: 'success', title, message }),
    error: (message: string, title?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (message: string, title?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (message: string, title?: string) =>
      addToast({ type: 'info', title, message }),
  };
};
