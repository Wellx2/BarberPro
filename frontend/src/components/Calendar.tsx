import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    isDateDisabled?: (date: Date) => boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, isDateDisabled }) => {
    // Initialize viewDate based on selectedDate or today
    const [viewDate, setViewDate] = useState(() => {
        if (selectedDate) {
            const d = new Date(selectedDate + 'T00:00:00');
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    });

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateClick = (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        onDateSelect(dateStr);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDayDate = new Date(year, month, day);
        const isToday = currentDayDate.getTime() === today.getTime();
        const isPast = currentDayDate < today;
        const isSunday = currentDayDate.getDay() === 0;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;

        // External disabled check (e.g. blocked schedule)
        const isDisabledByProp = isDateDisabled ? isDateDisabled(currentDayDate) : false;
        const isDisabled = isPast || isSunday || isDisabledByProp;

        // Base classes
        // Ajustado: h-9 w-9 para reduzir tamanho
        // Adicionado: relative para z-index funcionar
        let buttonClass = "h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative ";

        if (isSelected) {
            // Ajustado: z-10 para garantir que o item selecionado fique SOBRE os vizinhos
            // Ajustado: scale-110 para dar destaque sem cortar
            buttonClass += "bg-[#f59e0b] bg-tenant-primary text-white shadow-md transform scale-110 font-bold z-10 ";
        } else if (isDisabled) {
            buttonClass += "text-gray-300 dark:text-gray-600 cursor-not-allowed z-0 ";
            if (isSunday) buttonClass += "bg-red-50/50 dark:bg-red-900/10 text-red-300 dark:text-red-800 ";
        } else {
            // Ajustado: z-0 para itens nãormais
            buttonClass += "text-gray-700 dark:text-gray-200 hover:bg-tenant-primary/10 dark:hover:bg-tenant-primary/20/30 hover:text-tenant-primary dark:hover:text-tenant-primary cursor-pointer z-0 ";
            if (isToday) buttonClass += "border border-[#f59e0b] border-tenant-primary font-bold ";
        }

        days.push(
            <button
                type="button"
                key={day}
                disabled={isDisabled}
                onClick={() => handleDateClick(day)}
                className={buttonClass}
            >
                {day}
                {isSelected && <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>}
            </button>
        );
    }

    return (
        <div className="select-nãone bg-white dark:bg-gray-800 rounded-xl transition-colors duration-300 p-4"> {/* Adicionado p-4 para evitar cortes nas bordas */}
            <div className="flex items-center justify-between mb-6 px-2"> {/* Aumentado mb-4 para mb-6 */}
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"><ChevronLeft size={20} /></button>
                <span className="font-bold text-gray-900 dark:text-white text-lg capitalize">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 mb-4 text-center"> {/* Aumentado mb-2 para mb-4 */}
                {weekDays.map(d => <div key={d} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-3 justify-items-center">{days}</div> {/* Aumentado gap-y-2 para gap-y-3 */}
        </div>
    );
};