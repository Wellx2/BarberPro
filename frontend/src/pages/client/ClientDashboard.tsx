import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, X, Star, Edit2, AlertCircle, Scissors, User as UserIcon, Check } from 'lucide-react';
import { useClientAppointments } from '../../hooks/useAppointments';
import { appointmentService } from '../../services/appointmentService';
import { barberService } from '../../services/barberService';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { Barber } from '../../types';
import { api } from '../../services/api';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useShop();

  const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const shopSlug = shop.slug || slugify(shop.name);

  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showAllPast, setShowAllPast] = useState(false);

  // Review modal state
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [reviewBarberId, setReviewBarberId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Reschedule modal state
  const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Team state
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  // 🚀 Estado local para toggles de lembrete (Evita reload e mutação direta)
  const [reminderState, setReminderState] = useState<Record<string, boolean>>({});

  const {
    upcoming,
    past,
    loading,
    refresh
  } = useClientAppointments(user?.id || null);

  React.useEffect(() => {
    if (upcoming.length > 0) {
      const newStates: Record<string, boolean> = {};
      upcoming.forEach(apt => {
        newStates[apt.id] = apt.reminderEnabled !== false;
      });
      setReminderState(prev => ({ ...prev, ...newStates }));
    }
  }, [upcoming]);

  React.useEffect(() => {
    const loadBarbers = async () => {
      if (!shop?.id) return;

      try {
        setLoadingBarbers(true);
        const data = await barberService.listPublic(shop.id);
        setBarbers(data);
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
      } finally {
        setLoadingBarbers(false);
      }
    };
    loadBarbers();
  }, [shop?.id]);

  // --- Helpers ----------------------------------------------------------------

  const canEdit = (appointment: any): boolean => {
    const rawDate = appointment.date || appointment.scheduledFor;
    if (!rawDate) return false;
    const apptDate = new Date(rawDate);
    if (isNaN(apptDate.getTime())) return false;
    const twoHoursBefore = new Date(apptDate.getTime() - 2 * 60 * 60 * 1000);
    return new Date() < twoHoursBefore;
  };

  const formatDateTime = (dateValue?: any) => {
    if (!dateValue || (typeof dateValue === 'object' && Object.keys(dateValue).length === 0)) return 'Data não informada';
    
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return 'Data inválida';

    // 🇧🇷 Forçamos a exibição no fuso de Brasília para garantir consistência
    // Dica Sênior: Usar Intl.DateTimeFormat com timeZone fixo é a forma mais segura de exibir horários em PWAs brasileiros
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      CANCELLED_BY_BARBER: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return badges[status] || badges.SCHEDULED;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      CANCELLED_BY_BARBER: 'Cancelado pelo barbeiro',
    };
    return labels[status] ?? status;
  };

  // --- Handlers ----------------------------------------------------------------

  const handleCancel = async () => {
    if (!cancelModalId || !cancelReason.trim()) return;
    try {
      await appointmentService.cancel(cancelModalId, cancelReason);
      setCancelModalId(null);
      setCancelReason('');
      refresh();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const handleReview = async () => {
    if (!reviewModalId || !reviewBarberId || rating < 1 || rating > 5) return;
    try {
      await api.post('/reviews', {
        appointmentId: reviewModalId,
        barberId: reviewBarberId,
        rating,
        comment: reviewComment || 'Sem comentário'
      });
      setReviewModalId(null);
      setReviewBarberId(null);
      setRating(5);
      setReviewComment('');
      refresh();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Erro ao enviar avaliação';
      alert(Array.isArray(msg) ? msg.join(' | ') : msg);
    }
  };

  const openReschedule = (appointment: any) => {
    setRescheduleAppt(appointment);
    const raw = appointment.date || appointment.scheduledFor;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        setRescheduleDate(d.toISOString().split('T')[0]);
        setRescheduleTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    }
    setRescheduleError('');
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !rescheduleDate || !rescheduleTime) return;

    const newDate = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    if (isNaN(newDate.getTime())) {
      setRescheduleError('Data ou horário inválido.');
      return;
    }
    if (newDate <= new Date()) {
      setRescheduleError('Selecione uma data e horário não futuro.');
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      await api.patch(`/appointments/${rescheduleAppt.id}/reschedule`, {
        date: newDate.toISOString()
      });
      setRescheduleAppt(null);
      refresh();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Erro ao reagendar';
      setRescheduleError(Array.isArray(msg) ? msg.join(' | ') : msg);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // --- Time slots --------------------------------------------------------------

  const timeSlots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // --- Loading ------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tenant-primary"></div>
      </div>
    );
  }

  // --- Render -------------------------------------------------------------------

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">


      {/* Header with booking button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meus Agendamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Acompanhe seus horários e histórico de visitas na barbearia
          </p>
        </div>
        <button
          onClick={() => navigate(`/${shopSlug}/agendar`)}
          className="hidden md:flex items-center gap-2 px-6 py-3 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:opacity-90"
          style={{ backgroundColor: 'var(--tenant-primary, #f59e0b)' }}
        >
          <Calendar size={20} />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Upcoming Appointments */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: 'var(--tenant-primary, #f59e0b)' }}>
            <Clock size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Próximos Agendamentos
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-800 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-tenant-primary/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-tenant-primary/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="max-w-xl text-center md:text-left">
                <span className="inline-block px-4 py-1.5 bg-tenant-primary/20 text-tenant-primary text-xs font-black uppercase tracking-widest rounded-full mb-4">Agenda Livre</span>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                  Pronto para <span className="text-tenant-primary">Cuidar do Visual?</span>
                </h3>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  Você não tem nenhum horário marcado no momento. Que tal aproveitar para agendar seu próximo serviço agora e garantir seu lugar?
                </p>
                <div className="flex justify-center md:justify-start">
                  <button
                    onClick={() => navigate(`/${shopSlug}/agendar`)}
                    className="px-8 py-4 bg-tenant-primary text-white font-black rounded-2xl shadow-lg shadow-tenant-primary/20 hover:scale-105 transition-transform flex items-center gap-3"
                  >
                    <Calendar size={20} />
                    Fazer Agendamento
                  </button>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center p-4 relative">
                  <div className="absolute inset-0 rounded-full border border-tenant-primary/30 animate-ping opacity-20"></div>
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-tenant-primary/50 relative z-10">
                    <Calendar size={80} strokeWidth={1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-tenant-primary/50 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-tenant-primary/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-tenant-primary/10 transition-colors"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-tenant-primary mb-3 bg-tenant-primary/10 px-4 py-1.5 rounded-full w-fit border border-tenant-primary/20">
                      <Clock size={14} className="animate-pulse" />
                      <span className="font-black text-xs tracking-widest uppercase">{formatDateTime(appointment.date || appointment.scheduledFor)}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">
                        <UserIcon size={20} />
                      </div>
                      {user?.name || 'Cliente'}
                    </h3>
                    <div className="mt-3 ml-[52px] flex items-center gap-2 text-gray-400 text-sm font-medium">
                      <Scissors size={16} className="text-tenant-primary" />
                      <span>Barbeiro: <span className="text-white">{(appointment as any).barber?.name || 'Não informado'}</span></span>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-current ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {/* Services */}
                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-6 relative z-10">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Serviços Selecionados</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service: any) => (
                        <span key={service.id} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-bold rounded-xl border border-gray-700">
                          {service.service?.name || service.name} <span className="text-gray-500 font-normal ml-1">• {formatCurrency(service.service?.price ?? service.price ?? 0)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.status === 'SCHEDULED' && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800/50 relative z-10 transition-all">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                        Lembrete Inteligente
                        {reminderState[appointment.id] && (
                            <span className="w-1.5 h-1.5 rounded-full bg-tenant-primary animate-pulse" />
                        )}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                        {reminderState[appointment.id] ? 'Notificações ativadas • 2h antes' : 'Notificações silenciadas'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group/toggle">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={reminderState[appointment.id] ?? true}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          // 🔥 Atualização Otimista: Muda na hora sem reload!
                          setReminderState(prev => ({ ...prev, [appointment.id]: newVal }));
                          
                          try {
                            await api.patch(`/appointments/${appointment.id}`, { reminderEnabled: newVal });
                          } catch (err) {
                            console.error('Erro ao atualizar preferência:', err);
                            // Reverte apenas se falhar
                            setReminderState(prev => ({ ...prev, [appointment.id]: !newVal }));
                          }
                        }}
                      />
                      <div className="w-14 h-7 bg-gray-800/80 peer-focus:outline-none rounded-2xl peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-gray-700/50 peer-checked:bg-tenant-primary shadow-inner group-hover/toggle:border-tenant-primary/30"></div>
                    </label>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 relative z-10">
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Total</p>
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(appointment.totalPrice ?? 0)}
                    </span>
                  </div>
                  {appointment.status === 'SCHEDULED' && (
                    <div className="flex gap-3">
                      {canEdit(appointment) ? (
                        <button
                          onClick={() => openReschedule(appointment)}
                          className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl transition-all text-sm font-bold shadow-lg"
                        >
                          <Edit2 size={16} /> Reagendar
                        </button>
                      ) : (
                        <span className="text-xs text-orange-500/80 font-bold bg-orange-500/10 px-3 py-2 rounded-lg self-center border border-orange-500/20">Edição bloqueada (&lt; 2h)</span>
                      )}
                      <button
                        onClick={() => setCancelModalId(appointment.id)}
                        className="px-5 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl transition-all text-sm font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
            <Calendar size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Histórico de Visitas
          </h2>
        </div>

        {past.length === 0 ? (
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 relative p-8 md:p-12 text-center shadow-lg">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tenant-primary/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto bg-gray-800/80 rounded-2xl flex items-center justify-center text-gray-500 mb-6 border border-gray-700/50 rotate-3 shadow-inner">
                <Clock size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                Histórico em Branco
              </h3>
              <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
                Você ainda não realizou nenhum serviço em nossa barbearia. Seus atendimentos passados aparecerão aqui!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {(showAllPast ? past : past.slice(0, 4)).map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl opacity-90 hover:opacity-100 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800/50 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-tenant-primary/5 transition-colors"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-3 bg-gray-800 px-4 py-1.5 rounded-full w-fit border border-gray-700">
                      <Clock size={14} />
                      <span className="font-black text-xs tracking-widest uppercase">{formatDateTime(appointment.date || appointment.scheduledFor)}</span>
                    </div>
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-500">
                        <UserIcon size={16} />
                      </div>
                      {user?.name || 'Cliente'}
                    </h3>
                    <div className="mt-2 ml-[44px] flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                      <Scissors size={14} className="text-tenant-primary" />
                      <span>Barbeiro: <span className="text-white">{(appointment as any).barber?.name || 'Não informado'}</span></span>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-current shadow-sm ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-4 relative z-10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Serviços</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service: any) => (
                        <span key={service.id} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-gray-700">
                          {service.service?.name || service.name} <span className="text-gray-500 font-normal ml-1">• {formatCurrency(service.service?.price ?? service.price ?? 0)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.products && appointment.products.length > 0 && (
                  <div className="mb-4 relative z-10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Produtos</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.products.map((product: any) => (
                        <span key={product.id} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-gray-700">
                          {product.name} <span className="text-gray-500 font-normal ml-1">• {formatCurrency(product.price)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total</p>
                    <span className="text-2xl font-black text-white">
                      {formatCurrency(appointment.totalPrice ?? 0)}
                    </span>
                  </div>
                  {appointment.status === 'COMPLETED' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const barber = (appointment as any).barber;
                          const barberId = barber?.id || appointment.barberId;
                          // Redireciona para o booking com o barbeiro pré-selecionado
                          navigate(`/book?barberId=${barberId}`);
                        }}
                        className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl transition-all font-black text-sm flex items-center gap-2 shadow-sm"
                      >
                        <Scissors size={16} className="text-tenant-primary" /> Agendar Novamente
                      </button>
                      <button
                        onClick={() => {
                          setReviewModalId(appointment.id);
                          setReviewBarberId((appointment as any).barberId || appointment.barberId);
                          setRating(5);
                          setReviewComment('');
                        }}
                        className="px-5 py-3 bg-tenant-primary/10 hover:bg-tenant-primary text-tenant-primary hover:text-white border border-tenant-primary/30 rounded-xl transition-all font-black text-sm flex items-center gap-2 shadow-sm"
                      >
                        <Star size={16} className="fill-current" /> Avaliar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!showAllPast && past.length > 4 && (
              <button
                onClick={() => setShowAllPast(true)}
                className="w-full py-5 mt-4 border border-dashed border-gray-700 hover:border-tenant-primary rounded-2xl text-gray-500 hover:text-tenant-primary font-black uppercase tracking-widest text-xs transition-all bg-gray-900/50 hover:bg-tenant-primary/5"
              >
                Ver Mais Histórico ({past.length - 4} itens)
              </button>
            )}
          </div>
        )}
      </section>

      {/* Member Get Member Banner for Clients */}
      {!user?.shopId && user?.role === 'CLIENT' && (
        <section className="mt-12 mb-6">
          <div className="overflow-hidden rounded-3xl bg-gray-900 border border-gray-800 shadow-xl relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-tenant-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-tenant-primary/10 transition-colors duration-700"></div>
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">
                  Conhece uma barbearia incrível?
                </h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
                  Indique barbearias para usar o KlypBarber e ganhe serviços gratuitos, descontos ou vantagens exclusivas na sua próxima visita!
                </p>
              </div>
              <div className="flex-shrink-0 flex justify-center md:justify-end">
                <button
                  onClick={() => alert('Programa de indicação em breve!')}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 shadow-md transition-all flex items-center gap-2"
                >
                  <Star size={18} className="text-tenant-primary" />
                  Indicar e Ganhar
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* -- Cancel Modal --------------------------------------------------- */}
      {
        cancelModalId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancelar Agendamento</h3>
                <button onClick={() => { setCancelModalId(null); setCancelReason(''); }} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Informe o motivo do cancelamento:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                rows={3}
                placeholder="Digite o motivo do cancelamento..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModalId(null); setCancelReason(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* -- Review Modal --------------------------------------------------- */}
      {
        reviewModalId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Avaliar Atendimento</h3>
                <button onClick={() => { setReviewModalId(null); setReviewBarberId(null); }} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X size={22} />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">Como foi sua experiência?</p>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    onClick={() => setRating(starValue)}
                    className={`p-1 transition-colors ${rating >= starValue ? 'text-tenant-primary' : 'text-gray-300 hover:text-tenant-primary/80'}`}
                  >
                    <Star size={28} className={rating >= starValue ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 text-sm"
                rows={3}
                placeholder="Deixe um comentário (opcional)..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setReviewModalId(null); setReviewBarberId(null); }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReview}
                  className="flex-1 px-3 py-2 bg-tenant-primary hover:opacity-90 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  Enviar Avaliação
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* -- Reschedule Modal ----------------------------------------------- */}
      {
        rescheduleAppt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reagendar Horário</h3>
                <button onClick={() => setRescheduleAppt(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X size={22} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-tenant-primary/10 border border-tenant-primary/20 rounded-lg">
                <p className="text-xs text-tenant-primary flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  Você pode editar o horário até 2 horas antes do agendamento. Para alterar o serviço, fale diretamente com o barbeiro.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Data</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Novo Horário</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setRescheduleTime(time)}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${rescheduleTime === time
                        ? 'bg-tenant-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-tenant-primary/10'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {rescheduleError && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 flex items-center gap-1">
                  <AlertCircle size={14} /> {rescheduleError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduleAppt(null)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!rescheduleDate || !rescheduleTime || rescheduleLoading}
                  className="flex-1 px-3 py-2 bg-tenant-primary hover:opacity-90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
                >
                  {rescheduleLoading ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
