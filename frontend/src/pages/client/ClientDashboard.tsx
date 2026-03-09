import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, X } from 'lucide-react';
import { useClientAppointments } from '../../hooks/useAppointments';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const {
    upcoming,
    past,
    loading,
    refresh
  } = useClientAppointments(user?.id || null);

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

  const formatDateTime = (dateValue?: string) => {
    if (!dateValue) {
      return 'Data não informada';
    }

    let parsedDate = new Date(dateValue);

    // Fallback para datas salvas incorretamente como texto no banco (ex: "04/03/2026 Às 09:30")
    if (Number.isNaN(parsedDate.getTime()) && typeof dateValue === 'string') {
      const match = dateValue.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
      if (match) {
        const [_, d, m, y, h, min] = match;
        parsedDate = new Date(`${y}-${m}-${d}T${h}:${min}:00.000Z`);
      }
    }

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Data inválida';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsedDate);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      CANCELLED_BY_BARBER: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return badges[status as keyof typeof badges] || badges.SCHEDULED;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Meus Agendamentos
      </h1>

      {/* Próximos Agendamentos */}
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
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
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
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Clock size={16} />
                      <span>{formatDateTime(appointment.date || appointment.scheduledFor)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {appointment.barber?.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {/* Serviços */}
                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Serviços:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {service.service?.name || service.name} - {formatCurrency(service.service?.price ?? service.price ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produtos */}
                {appointment.products && appointment.products.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Produtos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.products.map((product) => (
                        <span
                          key={product.id}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {product.name} - {formatCurrency(product.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {formatCurrency(appointment.totalPrice ?? 0)}
                  </span>
                  {appointment.status === 'SCHEDULED' && (
                    <button
                      onClick={() => setCancelModalId(appointment.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Histórico */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Histórico
        </h2>

        {past.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum agendamento anterior
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {past.map((appointment) => (
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
                      {appointment.barber?.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {/* Serviços */}
                {appointment.services && appointment.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Serviços:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {service.service?.name || service.name} - {formatCurrency(service.service?.price ?? service.price ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produtos */}
                {appointment.products && appointment.products.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Produtos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.products.map((product) => (
                        <span
                          key={product.id}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {product.name} - {formatCurrency(product.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {formatCurrency(appointment.totalPrice ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Cancelamento */}
      {cancelModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Cancelar Agendamento
              </h3>
              <button
                onClick={() => {
                  setCancelModalId(null);
                  setCancelReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Por favor, informe o motivo do cancelamento:
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              rows={4}
              placeholder="Digite o motivo do cancelamento..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelModalId(null);
                  setCancelReason('');
                }}
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
      )}
    </div>
  );
};

