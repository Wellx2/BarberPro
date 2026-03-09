import React from 'react';
import { Calendar } from 'lucide-react';

interface PrimaryButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
    children, 
    onClick, 
    icon,
    fullWidth = false,
    className = ''
}) => {
    return (
        <button
            onClick={onClick}
            className={`${fullWidth ? 'w-full' : ''} px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black uppercase tracking-widest text-sm rounded-[20px] flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/50 ${className}`}
        >
            {icon || <Calendar size={22} />}
            {children}
        </button>
    );
};
