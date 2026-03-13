/**
 * Card Component - Sistema de Design BarberPro
 * Componente de cartão com variantes e suporte a composição
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 
        border-2 border-gray-100 dark:border-gray-700
        rounded-3xl 
        shadow-sm
        transition-all duration-200
        ${hover ? 'hover:shadow-xl hover:border-tenant-primary cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => {
  return (
    <div
      className={`
        px-6 py-4 
        border-b-2 border-gray-100 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  );
};

Card.Body = ({ children, className = '' }) => {
  return <div className={`px-6 py-6 ${className}`}>{children}</div>;
};

Card.Footer = ({ children, className = '' }) => {
  return (
    <div
      className={`
        px-6 py-4 
        border-t-2 border-gray-100 dark:border-gray-700
        bg-gray-50 dark:bg-gray-900/30
        rounded-b-3xl
        ${className}
      `}
    >
      {children}
    </div>
  );
};

Card.Header.displayName = 'Card.Header';
Card.Body.displayName = 'Card.Body';
Card.Footer.displayName = 'Card.Footer';
