/**
 * Modal Component - Sistema de Design Klypbarber
 * Modal acessível com backdrop e animações
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-md sm:max-w-2xl',
  lg: 'max-w-lg sm:max-w-4xl',
  xl: 'max-w-xl sm:max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  // Bloquear scroll quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeOnBackdropClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`
          relative w-full ${sizeStyles[size]}
          bg-white dark:bg-gray-800
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl
          max-h-[95vh] sm:max-h-[90vh]
          overflow-hidden
          flex flex-col
          animate-slide-up sm:animate-scale-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-gray-100 dark:border-gray-700 shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  ml-auto p-2 rounded-xl
                  text-gray-400 hover:text-gray-600 hover:bg-gray-100
                  dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700
                  transition-all duration-200
                  focus:outline-nãone focus:ring-2 focus:ring-tenant-primary
                  touch-manipulation
                "
                aria-label="Fechar modal"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">{children}</div>
      </div>
    </div>
  );
};
