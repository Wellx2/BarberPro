
import React, { useState, useEffect } from 'react';
// Fix: Split react-router-dom imports to resolve export errors in some environments
import { useParams, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { BARBERS, MOCK_APPOINTMENTS } from '../constants';
import { Appointment, BlockedPeriod, Review, Barber } from '../types';
import { Star, Scissors, Calendar as CalendarIcon, ChevronLeft, MapPin, Award, Lock, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Calendar } from '../components/Calendar';

export const BarberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { generateTimeSlots } = useShop();
  
  const [barbersList] = useState<Barber[]>(() => {
      const stored = localStorage.getItem('barbers');
      return stored ? JSON.parse(stored) : BARBERS;
  });

  const barber = barbersList.find(b => b.id === id);
  
  const [appointments] = useState<Appointment[]>(() => {
    const stored = localStorage.getItem('appointments');
    return stored ? JSON.parse(stored) : MOCK_APPOINTMENTS;
  });

  const [blockedPeriods] = useState<BlockedPeriod[]>(() => {
      const stored = localStorage.getItem('blocked_periods');
      return stored ? JSON.parse(stored) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
      const stored = localStorage.getItem('reviews');
      return stored ? JSON.parse(stored) : [];
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!barber) {
    return <div className="p-8 text-center dark:text-white">Barbeiro não encontrado.</div>;
  }

  const timeSlots = generateTimeSlots();

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.some(apt => {
        if (apt.barberId !== barber.id) return false;
        if (apt.status === 'CANCELLED' || apt.status === 'CANCELLED_BY_BARBER') return false;
        const aptDate = new Date(apt.date);
        const aptDateStr = aptDate.toISOString().split('T')[0];
        const aptTime = aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return aptDateStr === dateStr && aptTime === time;
    });
  };

  const isSlotBlocked = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedPeriods.some(block => {
        if (block.barberId !== barber.id) return false;
        const isDateInRange = block.type === 'RANGE' && block.endDate 
            ? (dateStr >= block.date && dateStr <= block.endDate) 
            : block.date === dateStr;
        if (!isDateInRange) return false;
        if (block.type === 'DAY' || block.type === 'RANGE') return true;
        if (block.type === 'TIME' && block.startTime && block.endTime) {
            return time >= block.startTime && time < block.endTime;
        }
        return false;
    });
  };
  
  const isDayBlocked = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return blockedPeriods.some(block => {
          if (block.barberId !== barber.id) return false;
          if (block.type === 'RANGE' && block.endDate) {
              return dateStr >= block.date && dateStr <= block.endDate;
          }
          return block.date === dateStr && block.type === 'DAY';
      });
  };

  const handleBookClick = (date?: Date, time?: string) => {
      const state: any = { preSelectedBarberId: barber.id };
      if (date && time) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          state.preSelectedDate = `${year}-${month}-${day}`;
          state.preSelectedTime = time;
      }
      navigate('/book', { state });
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isSunday = selectedDateObj.getDay() === 0;
  const isCurrentDayBlocked = isDayBlocked(selectedDateObj);
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="bg-[#111827] min-h-screen pb-12 transition-colors duration-300">
      {/* Header / Cover */}
      <div className="bg-gray-900 h-48 md:h-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1350&auto=format&fit=crop&q=80" 
            alt="Barbershop Background" 
            className="w-full h-full object-cover opacity-30"
        />
        <Link to="/" className="absolute top-6 left-6 z-20 text-white flex items-center gap-2 bg-gray-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-amber-500 hover:text-white transition-all shadow-lg active:scale-95 group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-bold text-sm uppercase tracking-tight">Voltar</span>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-[#1f2937] rounded-[50px] shadow-2xl overflow-hidden border border-gray-700/50">
            <div className="p-10 flex flex-col items-center text-center">
                <div className="mb-8 relative">
                    <img 
                        src={barber.avatar} 
                        alt={barber.name} 
                        className="w-40 h-40 rounded-[45px] border-4 border-[#1f2937] shadow-2xl object-cover relative z-10"
                    />
                    <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-[46px] blur-sm opacity-30"></div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">{barber.name}</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 mb-6">
                    <Scissors size={14} className="text-amber-500" />
                    Profissional de Elite
                </p>

                <div className="bg-[#2d1e16] border border-[#3d2b1f] px-6 py-3 rounded-full flex items-center justify-center gap-3 mb-8 shadow-inner">
                    <Star size={18} className="text-amber-500 fill-current" />
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-xl font-black text-white">{barber.rating}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ 5.0</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {barber.specialties.map((spec, index) => (
                        <div key={index} className="flex items-center px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-900/50 text-gray-400 border border-gray-700 shadow-sm">
                            <Scissors size={12} className="mr-2 text-amber-500" />
                            {spec}
                        </div>
                    ))}
                </div>

                <p className="text-gray-400 mb-10 max-w-sm text-sm leading-relaxed font-medium">
                    {barber.description || "Especialista em transformar visual com técnica e precisão."}
                </p>

                <div className="w-full max-w-md">
                    <button 
                        onClick={() => handleBookClick()} 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] text-center shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <CalendarIcon size={18} />
                        Agendar com {barber.name.split(' ')[0]}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-700/50 divide-y sm:divide-y-0 sm:divide-x divide-gray-700/50 bg-[#111827]/50">
                <div className="p-8 text-center group">
                    <div className="text-3xl font-black text-white leading-none">{barber.totalCuts ? `${barber.totalCuts}+` : '1k+'}</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Cortes Realizados</div>
                </div>
                <div className="p-8 text-center group">
                    <div className="text-3xl font-black text-white leading-none">{barber.experience || '5 Anos'}</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Experiência</div>
                </div>
                <div className="p-8 text-center group">
                    <div className="text-3xl font-black text-white leading-none truncate px-2">{barber.unit || 'BarberPro'}</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Unidade Sede</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
