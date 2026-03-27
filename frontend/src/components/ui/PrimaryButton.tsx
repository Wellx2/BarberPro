import React from 'react';
import { Calendar } from 'lucide-react';

interface PrimaryButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
    onClick, 
    children, 
    className = '', 
    icon,
    fullWidth = false
}) => {
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
        <button
            onClick={onClick}
            className={`px-8 py-5 rounded-[22px] bg-tenant-primary text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 ${widthClass} ${className}`}
        >
            {icon || <Calendar size={20} />}
            {children}
        </button>
    );
};
