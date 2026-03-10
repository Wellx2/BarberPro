import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  Calendar, CheckCircle, ChevronLeft, ChevronRight,
  Phone, X, Plus, Minus, ShoppingBag, Scissors, AlertCircle,
  Clock, XCircle, UserCheck, Package, Star
} from 'lucide-react';
import { useBarberSchedule } from '../../hooks/useAppointments';
import {
  appointmentService,
  productService,
  serviceOrderService,
  serviceService,
  clientService,
  barberService
} from '../../services';
import { Product, Barber, Service, Client } from '../../types';

// ============================================================
// Tipos auxiliares
// ============================================================
interface CartItem {
  product: Product;
  quantity: number;
}


// ============================================================
// Modal de Ordem de Serviço
// ============================================================
interface ServiceOrderModalProps {
  appointment: any;
  onClose: () => void;
  onComplete: (extraProducts: Array<{ id: string; quantity: number }>) => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  shopId: string;
}

// ============================================================
// Modal de Bloqueio de Agenda (Agenda Lock)
// ============================================================
interface AgendaLockModalProps {
  barberId: string;
  selectedDate: Date;
  shop: any;
  onClose: () => void;
  onConfirm: (data: { date: string; startTime: string; endTime: string; reason: string; forceOverride: boolean }) => Promise<void>;
}

import { AgendaLockModal } from '../../components/modals/AgendaLockModal';

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
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingItems(true);
        // 1. Carregar/Criar Order no Backend
        let currentOrder;
        try {
          currentOrder = await serviceOrderService.getByAppointment(appointment.id);
        } catch (e) {
          // Se não houver, cria uma nova OS para o agendamento
          currentOrder = await serviceOrderService.create({
            clientId: appointment.clientId,
            barberId: appointment.barberId,
            appointmentId: appointment.id,
            items: appointment.services.map((s: any) => ({
              type: 'SERVICE',
              serviceId: s.serviceId,
              name: s.service?.name || s.name,
              quantity: 1,
              unitPrice: s.service?.price || s.price,
            })),
          });
        }
        setOrder(currentOrder);

        // 2. Carregar Lista de Produtos e Serviços para adição
        const [prodData, svcData] = await Promise.all([
          productService.list(shopId, true),
          serviceService.list(shopId),
        ]);
        setProducts(prodData.filter((p: Product) => p.active && p.stock > 0));
        setAvailableServices(svcData.filter((s: Service) => s.active));
      } catch (e) {
        console.error('Erro ao carregar dados da OS:', e);
      } finally {
        setLoadingItems(false);
      }
    };
    loadData();
  }, [shopId, appointment.id]);

  const handleAddItem = async (item: any) => {
    if (!order) return;
    try {
      await serviceOrderService.addItem(order.id, item);
      const updated = await serviceOrderService.findOne(order.id);
      setOrder(updated);
    } catch (e) {
      alert('Erro ao adicionar item');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!order) return;
    try {
      await serviceOrderService.removeItem(order.id, itemId);
      const updated = await serviceOrderService.findOne(order.id);
      setOrder(updated);
    } catch (e) {
      alert('Erro ao remover item');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Sales Booster: Sugerir produtos baseados nos serviços
  const getRecommendations = () => {
    if (!order?.items) return [];
    const serviceNames = order.items.filter((i: any) => i.type === 'SERVICE').map((i: any) => i.name.toLowerCase());

    // Lógica simples de recomendação
    if (serviceNames.some(n => n.includes('barba') || n.includes('shave'))) {
      return products.filter(p => p.name.toLowerCase().includes('óleo') || p.name.toLowerCase().includes('balm')).slice(0, 2);
    }
    if (serviceNames.some(n => n.includes('corte') || n.includes('hair'))) {
      return products.filter(p => p.name.toLowerCase().includes('pomada') || p.name.toLowerCase().includes('gel')).slice(0, 2);
    }
    return products.slice(0, 2); // Sugestão padrão
  };

  const recommendations = getRecommendations();

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await serviceOrderService.complete(order.id, {
        paymentMethod: 'CASH', // Simplificado para o Dashboard do Barbeiro
      });
      onComplete([]); // Notifica o componente pai
    } catch (e) {
      alert('Erro ao concluir OS');
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loadingItems ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <p className="mt-4 text-gray-500 text-sm">Carregando itens da comanda...</p>
            </div>
          ) : (
            <>
              {/* Seção de Itens Atuais */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" /> Itens da Comanda
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowServiceSearch(!showServiceSearch)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Serviço
                    </button>
                  </div>
                </div>

                {showServiceSearch && (
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Selecionar Serviço Extra</p>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {availableServices.map(svc => (
                        <button
                          key={svc.id}
                          onClick={() => {
                            handleAddItem({
                              type: 'SERVICE',
                              serviceId: svc.id,
                              name: svc.name,
                              quantity: 1,
                              unitPrice: svc.price
                            });
                            setShowServiceSearch(false);
                          }}
                          className="flex justify-between items-center p-2 text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                        >
                          <span className="text-gray-700 dark:text-gray-300">{svc.name}</span>
                          <span className="font-bold text-amber-600">{formatCurrency(svc.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {order?.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'SERVICE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {item.type === 'SERVICE' ? <Scissors className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sales Booster (Recomendações) */}
              {recommendations.length > 0 && (
                <section className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star className="w-3 h-3 fill-amber-500" /> Dica de Venda (Boost)
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {recommendations.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddItem({
                          type: 'PRODUCT',
                          productId: p.id,
                          name: p.name,
                          quantity: 1,
                          unitPrice: p.price
                        })}
                        className="flex-shrink-0 flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-700 shadow-sm hover:border-amber-500 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600">
                          <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-black text-amber-600">{formatCurrency(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Seção de Adição de Produtos */}
              <section className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" /> Vender Produtos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddItem({
                        type: 'PRODUCT',
                        productId: product.id,
                        name: product.name,
                        quantity: 1,
                        unitPrice: product.price
                      })}
                      className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-amber-400 dark:hover:border-amber-400 bg-white dark:bg-gray-800 transition-all text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-amber-600 font-bold">{formatCurrency(product.price)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {showCancelForm && (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-in slide-in-from-bottom-2">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Motivo do cancelamento:</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Ex: Cliente desistiu..."
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowCancelForm(false); setCancelReason(''); }} className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Voltar
                </button>
                <button onClick={handleCancelConfirm} disabled={!cancelReason.trim() || cancelling} className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors font-bold">
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-end mb-5">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Subtotal da Comanda</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
                {formatCurrency(order?.subtotal || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Items</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{order?.items?.length || 0}</p>
            </div>
          </div>

          {!showCancelForm && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-3.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-sm shadow-sm"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={completing || loadingItems || !order}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-60 shadow-lg shadow-green-200 dark:shadow-none"
              >
                <CheckCircle className="w-6 h-6" />
                {completing ? 'Concluindo...' : 'Finalizar Conta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Modal de Novo Agendamento (pelo Barbeiro)
// ============================================================
interface CreateAppointmentModalProps {
  barberId: string;
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  barberId,
  shopId,
  onClose,
  onSuccess,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('09:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cData, sData] = await Promise.all([
          clientService.list(shopId),
          serviceService.list(shopId),
        ]);
        setClients(cData);
        setServices(sData.filter((s: Service) => s.active));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || selectedServices.length === 0) return;
    setSaving(true);
    try {
      await appointmentService.create({
        clientId: selectedClient,
        barberId,
        serviceIds: selectedServices,
        date: `${date}T${time}:00`,
        notes,
      });
      onSuccess();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" /> Novo Agendamento
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
            <select
              required
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Serviços</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
              {services.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${selectedServices.includes(s.id)
                    ? 'bg-amber-500 border-amber-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Hora</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 resize-none h-20"
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 mt-2"
          >
            {saving ? 'Criando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
};
export const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { shop } = useShop();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [serviceOrderAppt, setServiceOrderAppt] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showCreateApptModal, setShowCreateApptModal] = useState(false);
  const [barberLocks, setBarberLocks] = useState<any[]>([]);
  const [loadingLocks, setLoadingLocks] = useState(false);
  const [barberDetail, setBarberDetail] = useState<Barber | null>(null);
  const [overdueAppointments, setOverdueAppointments] = useState<any[]>([]);
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);

  // barberId: usa o ID da entidade Barber do JWT (se disponível)
  // Se não estiver no JWT, passa null e o backend filtra pelo token JWT (BARBER role)
  const barberId = user?.barberId || null;

  useEffect(() => {
    if (barberId) {
      barberService.getById(barberId)
        .then(data => setBarberDetail(data as any))
        .catch(console.error);

      // Verificar agendamentos pendentes de datas passadas
      appointmentService.list({ status: 'SCHEDULED' })
        .then(data => {
          const now = new Date();
          const overdue = data.filter(apt => {
            const dateStr = apt.date || apt.scheduledFor;
            return dateStr && new Date(dateStr) < now;
          });
          if (overdue.length > 0) {
            setOverdueAppointments(overdue);
            setShowOverdueAlert(true);
          }
        })
        .catch(console.error);
    }
  }, [barberId]);

  const { schedule, loading, error, refresh } = useBarberSchedule(barberId, selectedDate);

  // No topo do componente ou dentro do hook correspondente
  const safeFormatTime = (dateValue: any) => {
    if (!dateValue) return '--:--';

    // Se for objeto vazio
    if (typeof dateValue === 'object' && !(dateValue instanceof Date) && Object.keys(dateValue || {}).length === 0) {
      return '--:--';
    }

    let date = new Date(dateValue);

    // Se falhar o parse direto (pode ser string em formato pt-BR vindo do backend ou SQLite)
    if (Number.isNaN(date.getTime()) && typeof dateValue === 'string') {
      // Tenta extrair DD/MM/YYYY e HH:mm via Regex
      const match = dateValue.match(/(\d{2})\/(\d{2})\/(\d{4})(?:.*?(\d{2}):(\d{2}))?/);
      if (match) {
        const [_, d, m, y, h, min] = match;
        // Cria objeto Date tratando como hora local para evitar shifts
        date = new Date(Number(y), Number(m) - 1, Number(d), Number(h || '0'), Number(min || '0'));
      } else if (/^\d+$/.test(dateValue)) {
        // Se for apenas timestamp em string
        date = new Date(Number(dateValue));
      }
    }

    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };


  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const commissionRate = barberDetail?.commissionRate || 40;

  // Resumo do dia
  const summary = {
    scheduled: schedule.filter(apt => apt.status === 'SCHEDULED').length,
    completed: schedule.filter(apt => apt.status === 'COMPLETED').length,
    cancelled: schedule.filter(apt => ['CANCELLED', 'CANCELLED_BY_BARBER'].includes(apt.status)).length,
    totalCompleted: schedule
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => sum + (apt.totalPrice || 0), 0),
    totalCommission: schedule
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => {
        const rate = barberDetail?.commissionRate || 40;
        return sum + ((apt.totalPrice || 0) * (rate / 100));
      }, 0),
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

  useEffect(() => {
    if (barberId) {
      setLoadingLocks(true);
      barberService.getAgendaLocks(barberId)
        .then(locks => {
          // Filtra locks do dia selecionado
          const dateStr = selectedDate.toISOString().split('T')[0];
          setBarberLocks(locks.filter((l: any) => l.date === dateStr));
        })
        .finally(() => setLoadingLocks(false));
    }
  }, [barberId, selectedDate, showLockModal]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Minha Agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Olá, <strong>{user?.name?.split(' ')[0]}</strong>! Aqui estão seus agendamentos.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateApptModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Agendar Cliente
          </button>
          <button
            onClick={() => setShowLockModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm"
          >
            <Clock className="w-5 h-5" />
            Trancar Horário
          </button>
        </div>
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
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide mb-1">Minha Comissão</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{formatCurrency(summary.totalCommission)}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">Saldo</p>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(barberDetail?.balance || 0)}</p>
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
      ) : (schedule.length === 0 && barberLocks.length === 0) ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum agendamento ou bloqueio</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sua agenda está livre para este dia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bloqueios do Barbeiro */}
          {barberLocks.map((lock) => (
            <div key={lock.id} className="bg-gray-50 dark:bg-gray-800/40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <Clock className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-tight">
                      HORÁRIO TRANCADO: <span className="text-amber-600 dark:text-amber-500">{lock.startTime} - {lock.endTime}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{lock.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Lista de Agendamentos */}
          {[...schedule]
            .sort((a, b) => {
              // Priority: SCHEDULED (0), COMPLETED (1), Others (2)
              const sp = (s: string) => {
                if (s === 'SCHEDULED') return 0;
                if (s === 'COMPLETED') return 1;
                return 2;
              };
              const spDiff = sp(a.status) - sp(b.status);
              if (spDiff !== 0) return spDiff;

              const da = new Date(a.date || a.scheduledFor || 0).getTime();
              const db = new Date(b.date || b.scheduledFor || 0).getTime();

              // If SCHEDULED, order by time ASC (earliest first)
              if (a.status === 'SCHEDULED') return da - db;
              // If others, order by time DESC (most recent first)
              return db - da;
            })
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
                          {safeFormatTime(appointment.date || appointment.scheduledFor)}
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
                          Comissão: {formatCurrency((appointment.totalPrice || 0) * (commissionRate / 100))} ({commissionRate}%)
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

      {/* Modal de Bloqueio de Agenda */}
      {showLockModal && (
        <AgendaLockModal
          memberId={barberId || ''}
          selectedDate={selectedDate}
          shop={shop}
          onClose={() => setShowLockModal(false)}
          onCheckConflicts={(data) => barberService.checkConflicts(data)}
          onConfirm={async (data) => {
            try {
              await barberService.createAgendaLock({
                barberId: barberId || '',
                ...data
              });
              setShowLockModal(false);
              refresh();
              alert(data.forceOverride ? 'Horário trancado e clientes notificados!' : 'Horário trancado com sucesso!');
            } catch (e: any) {
              alert(e?.response?.data?.message || e?.message || 'Erro ao trancar horário. Verifique conflitos.');
            }
          }}
        />
      )}
      {/* Alerta de Agendamentos Pendentes */}
      {showOverdueAlert && overdueAppointments.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pendências Detectadas!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você possui <strong>{overdueAppointments.length}</strong> agendamento(s) de datas passadas que ainda constam como abertos.
              Por favor, atualize o status deles para manter sua agenda e financeiro corretos.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowOverdueAlert(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md"
              >
                Entendi, vou resolver agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Agendamento */}
      {showCreateApptModal && (
        <CreateAppointmentModal
          barberId={barberId || ''}
          shopId={user?.shopId || ''}
          onClose={() => setShowCreateApptModal(false)}
          onSuccess={() => {
            setShowCreateApptModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};
