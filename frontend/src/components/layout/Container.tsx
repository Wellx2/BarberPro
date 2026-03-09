/**
 * Container Component - Sistema de Design BarberPro
 * Container responsivo com max-width
 */

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeStyles = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'lg',
}) => {
  return (
    <div
      className={`
        ${sizeStyles[size]}
        mx-auto
        px-4 sm:px-6 lg:px-8
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
};
