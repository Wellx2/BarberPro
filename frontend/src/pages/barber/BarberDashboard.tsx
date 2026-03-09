import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  Calendar, CheckCircle, ChevronLeft, ChevronRight,
  Phone, X, Plus, Minus, ShoppingBag, Scissors, AlertCircle,
  Clock, XCircle, UserCheck, Package
} from 'lucide-react';
import { useBarberSchedule } from '../../hooks/useAppointments';
import { appointmentService } from '../../services/appointmentService';
import { productService } from '../../services/productService';
import { Product } from '../../types';

// ============================================================
// Tipos auxiliares
// ============================================================
interface CartItem {
  product: Product;
  quantity: number;
}

interface ServiceOrderModalProps {
  appointment: any;
  onClose: () => void;
  onComplete: (extraProducts: Array<{ id: string; quantity: number }>) => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  shopId: string;
}

// ============================================================
// Modal de Ordem de Serviço
// ============================================================
const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  appointment,
  onClose,
  onComplete,
  onCancel,
  shopId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProducts(true);
        const data = await productService.list(shopId, true);
        setProducts(data.filter((p: Product) => p.active && p.stock > 0));
      } catch (e) {
        console.error('Erro ao buscar produtos:', e);
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, [shopId]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.product.id !== productId);
    });
  };

  const servicesTotalPrice =
    appointment.services?.reduce(
      (sum: number, svc: any) => sum + (svc.service?.price || svc.price || 0), 0
    ) || appointment.totalPrice || 0;

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const grandTotal = servicesTotalPrice + cartTotal;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await onCancel(cancelReason);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-500" />
              Ordem de Serviço
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Cliente: <strong>{appointment.client?.name || appointment.clientName || 'Cliente'}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Serviços agendados */}
          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-500" /> Serviços Agendados
            </h3>
            <div className="space-y-2">
              {appointment.services?.length > 0 ? (
                appointment.services.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="flex justify-between items-center px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {svc.service?.name || svc.name}
                    </span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(svc.service?.price || svc.price || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Nenhum serviço registrado</p>
              )}
            </div>
          </section>

          {/* Produtos adicionais */}
          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" /> Produtos / Consumo Adicional
            </h3>
            {loadingProducts ? (
              <div className="text-center py-6 text-gray-400">Carregando produtos...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                Nenhum produto disponível no estoque
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map(product => {
                  const cartItem = cart.find(i => i.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-amber-400 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-gray-400">Estoque: {product.stock}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {cartItem ? (
                          <>
                            <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(product)} className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(product)} className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Resumo do carrinho */}
          {cart.length > 0 && (
            <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> Produtos Adicionados
              </h3>
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.product.name} x{item.quantity}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </section>
          )}

          {/* Formulário de cancelamento */}
          {showCancelForm && (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Motivo do cancelamento:</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Ex: Cliente não compareceu..."
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowCancelForm(false); setCancelReason(''); }} className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Voltar
                </button>
                <button onClick={handleCancelConfirm} disabled={!cancelReason.trim() || cancelling} className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors font-semibold">
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>Serviços: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(servicesTotalPrice)}</span></p>
              {cartTotal > 0 && <p>Produtos: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(cartTotal)}</span></p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Geral</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          {!showCancelForm && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelForm(true)}
                className="flex items-center gap-2 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold text-sm"
              >
                <XCircle className="w-4 h-4" />
                Cancelar OS
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-60"
              >
                <CheckCircle className="w-5 h-5" />
                {completing ? 'Concluindo...' : 'Concluir Atendimento'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// BarberDashboard principal
// ============================================================
export const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { shop } = useShop();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [serviceOrderAppt, setServiceOrderAppt] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // barberId: usa o ID da entidade Barber do JWT (se disponível)
  // Se não estiver no JWT, passa null e o backend filtra pelo token JWT (BARBER role)
  const barberId = user?.barberId || null;

  const { schedule, loading, error, refresh } = useBarberSchedule(barberId, selectedDate);

  const formatTime = (dateStr: string) => {
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
      return '--:--';
    }

    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  // Resumo do dia
  const summary = {
    scheduled: schedule.filter(apt => apt.status === 'SCHEDULED').length,
    completed: schedule.filter(apt => apt.status === 'COMPLETED').length,
    cancelled: schedule.filter(apt => ['CANCELLED', 'CANCELLED_BY_BARBER'].includes(apt.status)).length,
    totalCompleted: schedule
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => sum + (apt.totalPrice || 0), 0),
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  // Abrir Ordem de Serviço (cliente chegou na barbearia)
  const handleClientArrived = (appointment: any) => {
    setServiceOrderAppt(appointment);
  };

  // Concluir atendimento via Ordem de Serviço
  const handleCompleteFromOS = async (extraProducts: Array<{ id: string; quantity: number }>) => {
    if (!serviceOrderAppt) return;
    setActionLoading(serviceOrderAppt.id);
    try {
      await appointmentService.complete(serviceOrderAppt.id, extraProducts);
      setServiceOrderAppt(null);
      refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao concluir atendimento');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancelar pelo barbeiro via Ordem de Serviço
  const handleCancelFromOS = async (reason: string) => {
    if (!serviceOrderAppt) return;
    setActionLoading(serviceOrderAppt.id);
    try {
      await appointmentService.cancelByBarber(serviceOrderAppt.id, reason);
      setServiceOrderAppt(null);
      refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar agendamento');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancelar diretamente da lista (cliente não compareceu)
  const handleDirectCancel = async (appointment: any) => {
    const reason = window.prompt('Motivo do cancelamento (obrigatório):\nEx: Cliente não compareceu');
    if (!reason?.trim()) return;
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

  const getStatusLabel = (status: string) => ({
    SCHEDULED: 'Agendado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    CANCELLED_BY_BARBER: 'Cancelado pelo barbeiro',
  }[status] || status);

  const getStatusColor = (status: string) => ({
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    CANCELLED_BY_BARBER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  }[status] || 'bg-gray-100 text-gray-800');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Minha Agenda</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Olá, <strong>{user?.name?.split(' ')[0]}</strong>! Aqui estão seus agendamentos.
        </p>
      </div>

      {/* Seletor de Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between gap-3">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900 dark:text-white capitalize">{formatDate(selectedDate)}</p>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={e => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400 border-0 bg-transparent cursor-pointer focus:outline-none"
          />
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">Aguardando</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{summary.scheduled}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide mb-1">Concluídos</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{summary.completed}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide mb-1">Cancelados</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{summary.cancelled}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide mb-1">Faturado</p>
          <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{formatCurrency(summary.totalCompleted)}</p>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando agenda...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Erro ao carregar agenda</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => refresh()} className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline">
              Tentar novamente
            </button>
          </div>
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum agendamento</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Nenhum atendimento marcado para este dia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...schedule]
            .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
            .map(appointment => {
              const isLoading = actionLoading === appointment.id;
              const isCancelled = ['CANCELLED', 'CANCELLED_BY_BARBER'].includes(appointment.status);
              const isCompleted = appointment.status === 'COMPLETED';
              const isScheduled = appointment.status === 'SCHEDULED';

              return (
                <div
                  key={appointment.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 transition-all ${isCompleted ? 'opacity-70 border-green-400'
                      : isCancelled ? 'opacity-50 border-red-400'
                        : 'border-amber-400 hover:shadow-md'
                    }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Horário */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <Clock className="w-4 h-4 text-amber-500 mb-1" />
                        <span className="text-lg font-bold text-amber-900 dark:text-amber-100 leading-none">
                          {appointment.date ? formatTime(appointment.date) : 'â€”'}
                        </span>
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {(appointment as any).client?.name || (appointment as any).clientName || 'Cliente'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        {/* Telefone */}
                        {((appointment as any).client?.phone || (appointment as any).client?.user?.phone) && (
                          <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Phone className="w-3 h-3" />
                            {(appointment as any).client?.phone || (appointment as any).client?.user?.phone}
                          </p>
                        )}

                        {/* Serviços */}
                        {(appointment as any).services?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(appointment as any).services.map((svc: any) => (
                              <span key={svc.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
                                {svc.service?.name || svc.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Produtos */}
                        {appointment.products && appointment.products.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {appointment.products.map((prod: any) => (
                              <span key={prod.id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-xs text-blue-800 dark:text-blue-300">
                                {prod.product?.name || prod.name} x{prod.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(appointment.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Comissão: {formatCurrency((appointment.totalPrice || 0) * 0.4)}
                        </p>
                      </div>
                    </div>

                    {/* Ações â€” apenas para SCHEDULED */}
                    {isScheduled && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleClientArrived(appointment)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
                        >
                          <UserCheck className="w-4 h-4" />
                          {isLoading ? 'Aguarde...' : 'Cliente Chegou'}
                        </button>
                        <button
                          onClick={() => handleDirectCancel(appointment)}
                          disabled={isLoading}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Não Veio
                        </button>
                      </div>
                    )}

                    {/* Status concluído */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Atendimento concluído com sucesso
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal de Ordem de Serviço */}
      {serviceOrderAppt && (
        <ServiceOrderModal
          appointment={serviceOrderAppt}
          shopId={user?.shopId || (shop as any)?.id || ''}
          onClose={() => setServiceOrderAppt(null)}
          onComplete={handleCompleteFromOS}
          onCancel={handleCancelFromOS}
        />
      )}
    </div>
  );
};
