/**
 * Alert Component - Sistema de Design BarberPro
 * Alertas informativos com 4 variantes
 */

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  {
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: <CheckCircle size={24} />,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500 dark:border-green-600',
    textColor: 'text-green-800 dark:text-green-300',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: <AlertCircle size={24} />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-500 dark:border-red-600',
    textColor: 'text-red-800 dark:text-red-300',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: <AlertTriangle size={24} />,
    bgColor: 'bg-tenant-primary/5 dark:bg-tenant-primary/10',
    borderColor: 'border-tenant-primary dark:border-tenant-primary',
    textColor: 'text-tenant-primary dark:text-tenant-primary/80',
    iconColor: 'text-tenant-primary dark:text-tenant-primary',
  },
  info: {
    icon: <Info size={24} />,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500 dark:border-blue-600',
    textColor: 'text-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  children,
  onClose,
  className = '',
}) => {
  const config = variantConfig[variant];

  return (
    <div
      className={`
        ${config.bgColor}
        ${config.borderColor}
        border-l-4
        rounded-2xl
        p-4
        flex gap-4
        ${className}
      `}
      role="alert"
    >
      <div className={`${config.iconColor} flex-shrink-0`}>{config.icon}</div>

      <div className="flex-1">
        {title && (
          <h4 className={`font-bold text-sm uppercase tracking-wide mb-1 ${config.textColor}`}>
            {title}
          </h4>
        )}
        {message && (
          <p className={`text-sm ${config.textColor}`}>{message}</p>
        )}
        {children && <div className={`text-sm ${config.textColor}`}>{children}</div>}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`
            ${config.iconColor}
            hover:opacity-70
            transition-opacity
            flex-shrink-0
            p-1
            focus:outline-none focus:ring-2 focus:ring-amber-500 rounded
          `}
          aria-label="Fechar alerta"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};
