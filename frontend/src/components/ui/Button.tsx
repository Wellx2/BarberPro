/**
 * Button Component - Sistema de Design Klypbarber
 * Mobile-first, acessível e com suporte a white label
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
}

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
    // Base classes
    const baseClasses = "font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900";

    // Variant styles
    let variantClass = "";
    if (variant === 'primary') variantClass = "bg-tenant-primary text-white hover:opacity-90 shadow-md";
    else if (variant === 'secondary') variantClass = "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700";
    else if (variant === 'outline') variantClass = "border-2 border-tenant-primary text-tenant-primary hover:bg-tenant-primary/5";
    else if (variant === 'danger') variantClass = "bg-red-500 text-white hover:bg-red-600";
    else if (variant === 'success') variantClass = "bg-green-500 text-white hover:bg-green-600";
    else if (variant === 'ghost') variantClass = "text-gray-700 hover:bg-gray-100 dark:text-gray-300";

    // Size styles
    let sizeClass = "";
    if (size === 'sm') sizeClass = "px-3 py-1.5 text-xs rounded-lg";
    else if (size === 'md') sizeClass = "px-5 py-2.5 text-sm rounded-xl";
    else if (size === 'lg') sizeClass = "px-6 py-3.5 text-base rounded-2xl";

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="nãone" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
