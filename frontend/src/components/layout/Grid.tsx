/**
 * Grid Component - Sistema de Design BarberPro
 * Grid responsivo com auto-fit e customização de colunas
 */

import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  md?: 1 | 2 | 3 | 4 | 5 | 6;
  lg?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const colsStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

const gapStyles = {
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

export const Grid: React.FC<GridProps> = ({
  children,
  className = '',
  cols = 3,
  md,
  lg,
  gap = 'md',
  responsive = true,
}) => {
  // Construir classes responsivas customizadas se md ou lg foram fornecidos
  const getResponsiveClasses = () => {
    if (md || lg) {
      let classes = `grid-cols-${cols}`;
      if (md) classes += ` md:grid-cols-${md}`;
      if (lg) classes += ` lg:grid-cols-${lg}`;
      return classes;
    }
    return responsive ? colsStyles[cols] : `grid-cols-${cols}`;
  };

  return (
    <div
      className={`
        grid
        ${getResponsiveClasses()}
        ${gapStyles[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
