import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, X, Star, Edit2, AlertCircle, Scissors, User as UserIcon } from 'lucide-react';
import { useClientAppointments } from '../../hooks/useAppointments';
import { appointmentService } from '../../services/appointmentService';
import { barberService } from '../../services/barberService';
import { useAuth } from '../../context/AuthContext';
import { Barber } from '../../types';
import { api } from '../../services/api';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const {
    upcoming,
    past,
    loading,
    refresh
  } = useClientAppointments(user?.id || null);

  React.useEffect(() => {
    const loadBarbers = async () => {
      try {
        setLoadingBarbers(true);
        const data = await barberService.list();
        setBarbers(data.filter(b => b.active));
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
      } finally {
        setLoadingBarbers(false);
      }
    };
    loadBarbers();
  }, []);

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
    if (!dateValue) return 'Data no informada';
    if (typeof dateValue === 'object' && !(dateValue instanceof Date) && Object.keys(dateValue || {}).length === 0) {
      return 'Data no informada';
    }
    let parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime()) && typeof dateValue === 'string') {
      const match = dateValue.match(/(\d{2})\/(\d{2})\/(\d{4})(?:.*?(\d{2}):(\d{2}))?/);
      if (match) {
        const [_, d, m, y, h, min] = match;
        parsedDate = new Date(Number(y), Number(m) - 1, Number(d), Number(h || '0'), Number(min || '0'));
      } else if (/^\d+$/.test(dateValue)) {
        parsedDate = new Date(Number(dateValue));
      }
    }
    if (Number.isNaN(parsedDate.getTime())) return 'Data inválida';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(parsedDate);
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
    <div className="container mx-auto px-4 py-8">
      {/* Header with booking button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meus Agendamentos
        </h1>
        <button
          onClick={() => navigate('/book')}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold transition-colors shadow-md"
        >
          <Calendar size={18} />
          Novo Agendamento
        </button>
      </div>

      {/* Upcoming Appointments */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Próximos Agendamentos
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Você não tem agendamentos futuros
            </p>
            <button
              onClick={() => navigate('/book')}
              className="mt-4 px-6 py-2 bg-tenant-primary text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Fazer Agendamento
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-60:0 dark:text-gray-400 mb-2">
                      <Clock size={16} />
                      <span>{formatDateTime(appointment.date || appointment.scheduledFor)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(appointment as any).barber?.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {/* Services */}
                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serviços:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service: any) => (
                        <span key={service.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {service.service?.name || service.name} - {formatCurrency(service.service?.price ?? service.price ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.status === 'SCHEDULED' && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Lembrete de Agendamento</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {appointment.reminderEnabled !== false ? 'Lembrete ativo para este horário' : 'Silenciado para este agendamento'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={appointment.reminderEnabled !== false}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          try {
                            // Optimistic UI update
                            appointment.reminderEnabled = newVal;
                            await api.patch(`/appointments/${appointment.id}`, { reminderEnabled: newVal });
                          } catch (err) {
                            console.error('Erro ao atualizar preferência de lembrete:', err);
                            appointment.reminderEnabled = !newVal; // revert
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-nãone rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-tenant-primary"></div>
                    </label>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {formatCurrency(appointment.totalPrice ?? 0)}
                  </span>
                  {appointment.status === 'SCHEDULED' && (
                    <div className="flex gap-2">
                      {canEdit(appointment) ? (
                        <button
                          onClick={() => openReschedule(appointment)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-tenant-primary text-tenant-primary rounded-lg hover:bg-tenant-primary/10 transition-colors text-sm font-semibold"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic self-center">Edição não disponivel</span>
                      )}
                      <button
                        onClick={() => setCancelModalId(appointment.id)}
                        className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-semibold"
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
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Histórico
        </h2>

        {past.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento anterior</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {(showAllPast ? past : past.slice(0, 4)).map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 opacity-75"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Clock size={16} />
                      <span>{formatDateTime(appointment.date || appointment.scheduledFor)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(appointment as any).barber?.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serviços:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service: any) => (
                        <span key={service.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {service.service?.name || service.name} - {formatCurrency(service.service?.price ?? service.price ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.products && appointment.products.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Produtos:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.products.map((product: any) => (
                        <span key={product.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {product.name} - {formatCurrency(product.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {formatCurrency(appointment.totalPrice ?? 0)}
                  </span>
                  {appointment.status === 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setReviewModalId(appointment.id);
                        setReviewBarberId(appointment.barberId);
                        setRating(5);
                        setReviewComment('');
                      }}
                      className="px-4 py-2 bg-tenant-primary hover:opacity-90 text-white rounded-lg transition-colors font-semibold text-sm flex items-center gap-2"
                    >
                      <Star size={16} className="fill-current" /> Avaliar
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!showAllPast && past.length > 4 && (
              <button
                onClick={() => setShowAllPast(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors"
              >
                Ver Mais Histórico ({past.length - 4} itens)
              </button>
            )}
          </div>
        )}
      </section>

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
                  Você pode editar o horário até <strong>2 horas antes</strong> do agendamento. Para alterar o serviço, fale diretamente com o barbeiro.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Data</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary focus:outline-nãone"
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
