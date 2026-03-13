/**
 * SectionHeader Component
 * Cabeçalho padrãonizado para seções da aplicação
 */

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string; // Para descrições mais longas
  icon?: React.ReactNode;
  centered?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  centered = true,
  className = '',
}) => {
  return (
    <div className={`${centered ? 'text-center' : ''} mb-16 ${className}`}>
      {icon && (
        <div className="inline-block p-4 bg-tenant-primary/10 text-tenant-primary rounded-2xl mb-8">
          {icon}
        </div>
      )}
      <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">
          {subtitle}
        </p>
      )}
      {description && (
        <p className="text-gray-400 max-w-2xl mx-auto text-sm font-medium mt-4">
          {description}
        </p>
      )}
    </div>
  );
};
