/**
 * Button Component - Sistema de Design BarberPro
 * Mobile-first, acessível e com suporte a dark mode
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-md hover:shadow-lg disabled:bg-amber-300 dark:disabled:bg-amber-800',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 shadow-md hover:shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-800',
  outline: 'border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-amber-500 dark:hover:bg-amber-900/20 disabled:border-gray-200 dark:disabled:border-gray-700',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 shadow-md hover:shadow-lg disabled:bg-red-300 dark:disabled:bg-red-800',
  success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 shadow-md hover:shadow-lg disabled:bg-green-300 dark:disabled:bg-green-800',
  ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          font-bold uppercase tracking-wide
          transition-all duration-200
          flex items-center justify-center
          disabled:cursor-not-allowed disabled:opacity-50
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && icon}
        {children && <span className={icon && !loading ? 'ml-2' : ''}>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
