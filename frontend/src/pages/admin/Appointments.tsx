import React, { useState } from 'react';
import { Calendar, Plus, User, Scissors, DollarSign, X } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { Button } from '../../components/ui';

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const {
    appointments,
    loading,
    error,
    cancelAppointment,
    markAsCompleted
  } = useAppointments({
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
    barberId: selectedBarber || undefined,
    status: selectedStatus as any
  });

  const [showNewModal, setShowNewModal] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async (id: string) => {
    if (!cancelReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento');
      return;
    }

    const success = await cancelAppointment(id, cancelReason);
    if (success) {
      setCancelModalId(null);
      setCancelReason('');
    }
  };

  const handleComplete = async (id: string) => {
    if (window.confirm('Marcar este agendamento como concluído?')) {
      await markAsCompleted(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      CANCELLED_BY_BARBER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };

    const labels = {
      SCHEDULED: 'Agendado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      CANCELLED_BY_BARBER: 'Cancelado pelo Barbeiro'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateStr: string) => {
    let date = new Date(dateStr);

    // Fallback para datas salvas incorretamente como texto no banco (ex: "04/03/2026 Às 09:30")
    if (Number.isNaN(date.getTime()) && typeof dateStr === 'string') {
      const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
      if (match) {
        const [_, d, m, y, h, min] = match;
        date = new Date(`${y}-${m}-${d}T${h}:${min}:00.000Z`);
      }
    }

    if (Number.isNaN(date.getTime())) {
      return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Agendamentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os agendamentos da barbearia
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos os Status</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="CANCELLED_BY_BARBER">Cancelado pelo Barbeiro</option>
          </select>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando agendamentos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Calendar className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Nenhum agendamento encontrado</p>
          <Button onClick={() => setShowNewModal(true)} className="mt-4">
            Criar Primeiro Agendamento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {getStatusBadge(appointment.status)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(appointment.date || appointment.scheduledFor || '')}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {appointment.client?.name || appointment.client?.user?.name || appointment.clientName || '—'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {appointment.client?.phone || appointment.client?.user?.phone || appointment.clientPhone || ''}
                    </span>
                  </div>

                  {/* Barbeiro */}
                  <div className="flex items-center gap-2 mb-3">
                    <Scissors className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {appointment.barber?.name || appointment.barber?.user?.name || '—'}
                    </span>
                  </div>

                  {/* Serviços */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Serviços:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services?.map((svc: any) => (
                        <span
                          key={svc.id}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white"
                        >
                          {svc.service.name} - {formatCurrency(svc.service.price)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Produtos (se houver) */}
                  {appointment.products && appointment.products.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Produtos:</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.products.map((prod: any) => (
                          <span
                            key={prod.id}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-sm text-blue-900 dark:text-blue-300"
                          >
                            {prod.product.name} x{prod.quantity} - {formatCurrency(prod.product.price * prod.quantity)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preço Total */}
                  <div className="flex items-center gap-2 text-lg font-bold text-amber-600 dark:text-amber-500">
                    <DollarSign className="w-5 h-5" />
                    {formatCurrency(appointment.totalPrice ?? 0)}
                  </div>

                  {/* Motivo do Cancelamento */}
                  {appointment.cancelReason && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Motivo:</strong> {appointment.cancelReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                {appointment.status === 'SCHEDULED' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleComplete(appointment.id)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ✓ Concluir
                    </button>
                    <button
                      onClick={() => setCancelModalId(appointment.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ✗ Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cancelar */}
      {cancelModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancelar Agendamento</h3>
              <button
                onClick={() => {
                  setCancelModalId(null);
                  setCancelReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Por favor, informe o motivo do cancelamento:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Cliente solicitou reagendamento"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 h-24 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancelModalId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => handleCancel(cancelModalId)}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Agendamento</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Formulário de novo agendamento será implementado em breve
              </p>
              <Button onClick={() => setShowNewModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
