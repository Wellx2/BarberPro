import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Plus, ChevronLeft, ChevronRight, 
  UserCheck, Phone, BellRing, ToggleLeft, ToggleRight, XCircle, AlertCircle, Scissors, ShoppingBag,
  CheckCircle, MoreHorizontal
} from 'lucide-react';
import { useBarberSchedule } from '../../hooks/useAppointments';
import { 
  appointmentService, 
  barberService, 
  serviceOrderService 
} from '../../services';
import { Barber } from '../../types';
import { useShop } from '../../context/ShopContext';

interface BarberScheduleViewProps {
  barberId: string;
  userName: string;
}

export const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({ barberId, userName }) => {
  const { shop } = useShop();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { schedule, loading, error, refresh } = useBarberSchedule(barberId, selectedDate);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [barberDetail, setBarberDetail] = useState<Barber | null>(null);

  const fetchBarberInfo = useCallback(() => {
    if (barberId) {
      barberService.getById(barberId)
        .then(data => setBarberDetail(data as any))
        .catch(console.error);
    }
  }, [barberId]);

  useEffect(() => {
    fetchBarberInfo();
  }, [fetchBarberInfo, selectedDate]);

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const safeFormatTime = (dateValue: any) => {
    if (!dateValue) return '--:--';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Funções de Ação Rápidas (Portadas do BarberDashboard)
  const handleMarkArrived = async (appointment: any) => {
    setActionLoading(appointment.id);
    try {
      await serviceOrderService.create({
        clientId: appointment.client?.id || appointment.clientId || '',
        barberId: appointment.barberId,
        appointmentId: appointment.id,
        items: appointment.services?.map((s: any) => ({
          type: 'SERVICE',
          serviceId: s.serviceId || s.id || '',
          name: s.service?.name || s.name || 'Serviço',
          quantity: 1,
          unitPrice: s.service?.price || s.price || 0,
        })) || [],
      });
      refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao registrar chegada.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectCancel = async (appointment: any) => {
    const reason = prompt('Motivo do cancelamento (opcional):', 'Cliente não compareceu');
    if (reason === null) return;
    
    setActionLoading(appointment.id);
    try {
      await appointmentService.cancelByBarber(appointment.id, reason);
      refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar agendamento');
    } finally {
      setActionLoading(null);
    }
  };

  // Resumo do dia
  const summary = {
    scheduled: schedule.filter(apt => apt.status === 'SCHEDULED').length,
    completed: schedule.filter(apt => apt.status === 'COMPLETED').length,
    totalCommission: schedule
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => {
        const rate = barberDetail?.commissionRate || 40;
        return sum + ((apt.totalPrice || 0) * (rate / 100));
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header da Agenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Minha Agenda</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <div className="px-4 text-xs font-black text-gray-600 dark:text-gray-400 uppercase">Hoje</div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
              <Clock size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agendados</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{summary.scheduled}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600">
              <CheckCircle size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concluídos</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{summary.completed}</p>
        </div>
        <div className="hidden sm:block bg-tenant-primary/5 dark:bg-tenant-primary/10 p-5 rounded-3xl border border-tenant-primary/10 dark:border-tenant-primary/20 shadow-sm shadow-tenant-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-tenant-primary/10 rounded-xl text-tenant-primary">
              <Scissors size={16} />
            </div>
            <span className="text-[10px] font-black text-tenant-primary uppercase tracking-widest">Minha comissão</span>
          </div>
          <p className="text-2xl font-black text-tenant-primary">{formatCurrency(summary.totalCommission)}</p>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="space-y-3">
        {loading ? (
          <div className="h-40 flex items-center justify-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tenant-primary"></div>
          </div>
        ) : schedule.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
            <Calendar className="w-10 h-10 text-gray-200 dark:text-gray-800 mb-2" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          schedule.map(appt => (
            <div 
              key={appt.id} 
              className={`group flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${appt.status === 'COMPLETED' ? 'opacity-60' : 'hover:border-tenant-primary/30'}`}
            >
              {/* Horário */}
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-tenant-primary/5">
                <span className="text-sm font-black text-gray-900 dark:text-white leading-none">
                  {safeFormatTime(appt.date || appt.scheduledFor)}
                </span>
                <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Horário</span>
              </div>

              {/* Info Cliente */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate mb-1">
                  {appt.client?.name || appt.clientName || 'Cliente'}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[150px]">
                    {appt.services?.map((s: any) => s.service?.name || s.name).join(', ')}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] font-black text-tenant-primary">{formatCurrency(appt.totalPrice)}</span>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="flex items-center gap-2">
                {appt.status === 'SCHEDULED' && (
                  <>
                    <button 
                      onClick={() => handleMarkArrived(appt)}
                      disabled={!!actionLoading}
                      className="p-3 bg-tenant-primary text-white rounded-2xl shadow-lg shadow-tenant-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
                      title="Chegou"
                    >
                      <UserCheck size={18} />
                    </button>
                    <button 
                      onClick={() => handleDirectCancel(appt)}
                      disabled={!!actionLoading}
                      className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                      title="Cancelar"
                    >
                      <XCircle size={18} />
                    </button>
                  </>
                )}
                {appt.status === 'COMPLETED' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
