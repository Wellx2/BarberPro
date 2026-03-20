import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Appointment } from '../types';

interface QuickRescheduleProps {
  shopId: string;
  className?: string;
}

export const QuickReschedule: React.FC<QuickRescheduleProps> = ({ shopId, className }) => {
  const { isAuthenticated, user } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [lastAppointment, setLastAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT' || !shopId || shopId.startsWith('shop-')) {
      return;
    }

    const loadIntelligence = async () => {
      setLoading(true);
      try {
        const appointments = await appointmentService.list({ status: 'COMPLETED' });
        if (appointments && appointments.length > 0) {
          // Ordenar por data (mais recente primeiro)
          const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Inteligência MVP: Pegar os últimos 5 para detectar padrões
          const lastFive = sorted.slice(0, 5);
          
          // 1. Barbeiro mais frequente (ou o último se empatar)
          const barberFreq: Record<string, number> = {};
          lastFive.forEach(a => barberFreq[a.barberId] = (barberFreq[a.barberId] || 0) + 1);
          const topBarberId = Object.entries(barberFreq).sort((a, b) => b[1] - a[1])[0][0];
          
          // 2. Serviços do último agendamento
          const lastServiceIds = sorted[0].serviceIds;
          
          // 3. Padrão de Dia da Semana (0-6)
          const dayFreq: Record<number, number> = {};
          lastFive.forEach(a => {
            const d = new Date(a.date).getDay();
            dayFreq[d] = (dayFreq[d] || 0) + 1;
          });
          const topDay = Number(Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0][0]);
          
          // 4. Padrão de Horário (HH:mm)
          const timeFreq: Record<string, number> = {};
          lastFive.forEach(a => {
            const t = new Date(a.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            timeFreq[t] = (timeFreq[t] || 0) + 1;
          });
          const topTime = Object.entries(timeFreq).sort((a, b) => b[1] - a[1])[0][0];

          // 5. Calcular a próxima data sugerida baseada no topDay
          const today = new Date();
          let nextDate = new Date();
          const currentDay = today.getDay();
          let daysUntilNext = (topDay - currentDay + 7) % 7;
          
          const [h, m] = topTime.split(':').map(Number);
          const patternTimeToday = new Date();
          patternTimeToday.setHours(h, m, 0, 0);
          
          if (daysUntilNext === 0 && patternTimeToday <= today) {
            daysUntilNext = 7;
          }
          
          nextDate.setDate(today.getDate() + daysUntilNext);
          const suggestedDateString = nextDate.toISOString().split('T')[0];

          setLastAppointment({
            barberId: topBarberId,
            serviceIds: lastServiceIds,
            date: suggestedDateString,
            timeSuggested: topTime
          });
        }
      } catch (err) {
        console.error('QuickReschedule: Erro ao buscar histórico', err);
      } finally {
        setLoading(false);
      }
    };

    loadIntelligence();
  }, [isAuthenticated, user?.role, shopId]);

  if (!lastAppointment || loading) return null;

  const handleReschedule = () => {
    const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const shopSlug = slugify(shop.name);

    navigate(`/${shopSlug}/agendar`, {
      state: {
        preSelectedBarberId: lastAppointment.barberId,
        preSelectedServiceId: lastAppointment.serviceIds,
        preSelectedDate: lastAppointment.date,
        preSelectedTime: lastAppointment.timeSuggested
      }
    });
  };

  return (
    <button
      onClick={handleReschedule}
      className={className || "w-full sm:w-auto px-8 py-5 rounded-[22px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"}
    >
      Refazer Último Corte
    </button>
  );
};
