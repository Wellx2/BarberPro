/**
 * Toast Container - Exibe toasts na tela
 */

import React from 'react';
import { ToastContext } from './ToastContext';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const toastIcons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const toastStyles = {
  success:
    'bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-500',
  error:
    'bg-red-500 dark:bg-red-600 text-white border-red-600 dark:border-red-500',
  warning:
    'bg-amber-500 dark:bg-amber-600 text-white border-amber-600 dark:border-amber-500',
  info: 'bg-blue-500 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-500',
};

export const ToastContainer: React.FC = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${toastStyles[toast.type]}
            rounded-2xl shadow-2xl
            px-5 py-4
            flex items-start gap-3
            border-l-4
            animate-slide-in-right
            pointer-events-auto
            min-w-[300px] max-w-md
          `}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{toastIcons[toast.type]}</div>

          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-black text-sm uppercase tracking-wide mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm font-medium break-words">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity p-1 focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
            aria-label="Fechar notificação"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
