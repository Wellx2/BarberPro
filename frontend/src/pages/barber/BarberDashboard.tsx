import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle, ChevronLeft, ChevronRight,
  Phone, X, Plus, Minus, ShoppingBag, Scissors, AlertCircle,
  Clock, XCircle, UserCheck, Package, Star, AlertTriangle, ShieldAlert, Shield,
  BellRing, ToggleLeft, ToggleRight, Search, ChevronDown
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
        // 1. Carregar/Criar Order não Backend
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
              <Scissors className="w-5 h-5 text-tenant-primary" />
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tenant-primary"></div>
              <p className="mt-4 text-gray-500 text-sm">Carregando itens da comanda...</p>
            </div>
          ) : (
            <>
              {/* Sessão de Itens Atuais */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-tenant-primary" /> Itens da Comanda
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowServiceSearch(!showServiceSearch)}
                      className="text-xs font-bold text-tenant-primary dark:text-tenant-primary hover:underline flex items-center gap-1"
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
                          className="flex justify-between items-center p-2 text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-tenant-primary/20"
                        >
                          <span className="text-gray-700 dark:text-gray-300">{svc.name}</span>
                          <span className="font-bold text-tenant-primary">{formatCurrency(svc.price)}</span>
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
                        <div className={`p-2 rounded-lg ${item.type === 'SERVICE' ? 'bg-tenant-primary/5 text-tenant-primary' : 'bg-blue-50 text-blue-600'}`}>
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
                <section className="bg-tenant-primary/5/50 dark:bg-tenant-primary/10 border border-tenant-primary/20/50 dark:border-tenant-primary/30/50 rounded-2xl p-4 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-black text-tenant-primary dark:text-tenant-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star className="w-3 h-3 fill-tenant-primary" /> Dica de Venda (Boost)
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
                        className="flex-shrink-0 flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-tenant-primary/20 dark:border-tenant-primary/50 shadow-sm hover:border-tenant-primary transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-tenant-primary/10 dark:bg-tenant-primary/20/40 rounded-lg flex items-center justify-center text-tenant-primary">
                          <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-black text-tenant-primary">{formatCurrency(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Sessão de Adição de Produtos */}
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
                      className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-tenant-primary/40 dark:hover:border-tenant-primary/40 bg-white dark:bg-gray-800 transition-all text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-tenant-primary font-bold">{formatCurrency(product.price)}</p>
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
              <p className="text-3xl font-black text-tenant-primary dark:text-tenant-primary">
                {formatCurrency(order?.subtotal || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Items</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{order?.items?.length || 0}</p>
            </div>
          </div>

          {!showCancelForm && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold text-sm shadow-sm"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                  Fechar
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
              
              <button
                onClick={() => setShowCancelForm(true)}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold uppercase tracking-wider text-center py-2"
              >
                Cancelar este agendamento (Cliente desistiu)
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
  
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [date, setDate] = useState<string>(getLocalDateString());
  const [time, setTime] = useState<string>('09:00');
  const [notes, setNotes] = useState('');

  // Dropdown & New Client states
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const handleCreateClient = async () => {
    if (!newClientName || !newClientPhone) return;
    setCreatingClient(true);
    try {
      const newCli = await clientService.create({ name: newClientName, phone: newClientPhone, shopId });
      setClients(prev => [...prev, newCli]);
      setSelectedClient(newCli.id);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientPhone('');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erro ao criar cliente');
    } finally {
      setCreatingClient(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    const phoneStr = c.phone?.toLowerCase() || c.user?.phone?.toLowerCase() || '';
    const nameStr = c.name?.toLowerCase() || '';
    const codeStr = c.id?.toLowerCase() || '';
    return nameStr.includes(term) || phoneStr.includes(term) || codeStr.includes(term);
  });

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
    if (!selectedClient) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (selectedServices.length === 0) {
      alert("Por favor, selecione pelo menos um serviço.");
      return;
    }
    setSaving(true);
    try {
      // Build a timezone-aware ISO string so the backend UTC server
      // interprets the correct local time (BRT = UTC-3)
      const localDate = new Date(`${date}T${time}:00`);
      const tzOffsetMs = localDate.getTimezoneOffset() * 60000;
      const localISOString = new Date(localDate.getTime() - tzOffsetMs).toISOString();

      await appointmentService.create({
        clientId: selectedClient,
        barberId,
        serviceIds: selectedServices,
        date: localISOString,
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
            <Plus className="w-5 h-5 text-tenant-primary" /> Novo Agendamento
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
            <div 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-tenant-primary"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={selectedClient ? "font-medium text-gray-900 dark:text-white" : "text-gray-500"}>
                {selectedClient ? clients.find(c => c.id === selectedClient)?.name : 'Selecione ou busque um cliente...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg max-h-60 flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, telefone ou ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tenant-primary dark:text-white"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="overflow-y-auto p-1 grow">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(c => (
                      <div
                        key={c.id}
                        className={`px-3 py-2 rounded-lg cursor-pointer flex flex-col mb-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedClient === c.id ? 'bg-tenant-primary/10 text-tenant-primary dark:bg-tenant-primary/20' : 'text-gray-700 dark:text-gray-300'}`}
                        onClick={() => {
                          setSelectedClient(c.id);
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                      >
                        <span className="font-bold text-sm">{c.name}</span>
                        {(c.phone || c.user?.phone) && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {c.phone || c.user?.phone}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 truncate mt-0.5">ID: {c.id.split('-')[0]}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Nenhum cliente encontrado
                    </div>
                  )}
                </div>
                
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 mt-auto bg-gray-50 dark:bg-gray-800/80 rounded-b-xl shrink-0">
                  <button 
                    type="button"
                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-tenant-primary hover:bg-tenant-primary/10 rounded-lg transition-colors"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowNewClientForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4"/> Cadastrar Novo Cliente
                  </button>
                </div>
              </div>
            )}
          </div>

          {showNewClientForm && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative animate-in fade-in slide-in-from-top-2">
              <button 
                type="button" 
                onClick={() => setShowNewClientForm(false)}
                title="Cancelar"
                className="absolute top-2 right-2 p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-tenant-primary" /> Cadastro Rápido
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-tenant-primary dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">WhatsApp (DDD + Número) *</label>
                <input
                  type="tel"
                  placeholder="Ex: 11999999999"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value.replace(/\D/g, '').slice(0,11))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-tenant-primary dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={creatingClient || !newClientName || newClientPhone.length < 10}
                className="w-full mt-1 py-2.5 bg-tenant-primary hover:opacity-90 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              >
                {creatingClient ? 'Procesando...' : 'Salvar e Usar no Agendamento'}
              </button>
            </div>
          )}

          {!showNewClientForm && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Serviços</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${selectedServices.includes(s.id)
                        ? 'bg-tenant-primary border-tenant-primary text-white'
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
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tenant-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tenant-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tenant-primary resize-none h-20"
                />
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 mt-2"
              >
                {saving ? 'Criando...' : 'Confirmar Agendamento'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Modal de Saldo do Barbeiro
// ============================================================
interface BalanceModalProps {
  barberDetail: Barber | null;
  onClose: () => void;
  balancePeriod: 0 | 7 | 15 | 30;
  setBalancePeriod: (p: 0 | 7 | 15 | 30) => void;
  allAppointments: any[];
  commissionRate: number;
  formatCurrency: (v: number) => string;
}

const BalanceModal: React.FC<BalanceModalProps> = ({
  barberDetail,
  onClose,
  balancePeriod,
  setBalancePeriod,
  allAppointments,
  commissionRate,
  formatCurrency,
}) => {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - balancePeriod);

  const isToday = balancePeriod === 0;

  const periodCompleted = isToday 
    ? allAppointments.filter(apt => {
        if (apt.status !== 'COMPLETED') return false;
        const d = new Date(apt.date || apt.scheduledFor || 0);
        return d.toDateString() === now.toDateString();
      })
    : allAppointments.filter(apt => {
        if (apt.status !== 'COMPLETED') return false;
        const d = new Date(apt.date || apt.scheduledFor || 0);
        return d >= cutoffDate && d <= now;
      });

  const periodRevenue = periodCompleted.reduce((sum, apt) => sum + (apt.totalPrice || 0), 0);
  const periodCommission = periodRevenue * ((barberDetail?.commissionRate || commissionRate) / 100);

  // Group past appointments by month (outside current period, for history)
  const historyMap: Record<string, { revenue: number; commission: number; count: number }> = {};
  allAppointments.forEach(apt => {
    if (apt.status !== 'COMPLETED') return;
    const d = new Date(apt.date || apt.scheduledFor || 0);
    if (d >= cutoffDate) return; // ignore the current period
    const key = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!historyMap[key]) historyMap[key] = { revenue: 0, commission: 0, count: 0 };
    historyMap[key].revenue += apt.totalPrice || 0;
    historyMap[key].commission += (apt.totalPrice || 0) * ((barberDetail?.commissionRate || commissionRate) / 100);
    historyMap[key].count += 1;
  });
  const historyEntries = Object.entries(historyMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Meu Saldo</h2>
            <p className="text-xs text-gray-500 mt-0.5">Comissões por período</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Period selector */}
          <div className="flex gap-2">
            {([0, 7, 15, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setBalancePeriod(p)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                  balancePeriod === p
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p === 0 ? 'Hoje' : `${p} dias`}
              </button>
            ))}
          </div>

          {/* Period summary */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800 text-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">
              Comissão ({isToday ? 'Hoje' : `${balancePeriod} dias`})
            </p>
            <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(periodCommission)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
              {periodCompleted.length} atend. · Faturamento bruto: {formatCurrency(periodRevenue)}
            </p>
          </div>

          {/* Current balance */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Saldo atual na conta</p>
               <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{formatCurrency((barberDetail?.balance || 0) > 0 ? barberDetail?.balance : periodCommission)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* History */}
          {historyEntries.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Saldos Anteriores</h3>
              <div className="space-y-2">
                {historyEntries.map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{month}</p>
                      <p className="text-xs text-gray-400">{data.count} atendimento{data.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.commission)}</p>
                      <p className="text-[10px] text-gray-400">de {formatCurrency(data.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {historyEntries.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">Nenhum histórico anterior disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const BarberDashboard: React.FC = () => {
  const navigate = useNavigate();
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
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balancePeriod, setBalancePeriod] = useState<0 | 7 | 15 | 30>(0);
  const [cancelModalAppt, setCancelModalAppt] = useState<any | null>(null);
  const [cancellationCounts, setCancellationCounts] = useState<{ monthly: number; weekly: number }>({ monthly: 0, weekly: 0 });
  const [allAppointments, setAllAppointments] = useState<any[]>([]);



  // barberId: usa o ID da entidade Barber do JWT (se disponível)
  // Se não estiver no JWT, passa null e o backend filtra pelo token JWT (BARBER role)
  const barberId = user?.barberId || null;

  const fetchBarberInfo = useCallback(() => {
    if (barberId) {
      barberService.getById(barberId)
        .then(data => setBarberDetail(data as any))
        .catch(console.error);
    }
  }, [barberId]);

  const fetchCancelCount = useCallback(() => {
    if (user?.role === 'BARBER') {
      appointmentService.getMyCancellationsCount()
        .then(counts => setCancellationCounts(counts))
        .catch(console.error);
    }
  }, [user?.role]);


  useEffect(() => {
    fetchBarberInfo();
    fetchCancelCount();

    // Carregar histórico de 30 dias para o Modal de Saldo
    appointmentService.list({ 
      status: 'COMPLETED',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      endDate: new Date().toISOString()
    }).then(setAllAppointments).catch(console.error);

    if (barberId) {

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
  }, [barberId, fetchBarberInfo]);

  const { schedule, loading, error, refresh } = useBarberSchedule(barberId, selectedDate);

  // No topo do componente ou dentro do hook correspondente
  const safeFormatTime = (dateValue: any) => {
    if (!dateValue) return '--:--';

    if (typeof dateValue === 'object' && !(dateValue instanceof Date) && Object.keys(dateValue || {}).length === 0) {
      return '--:--';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '--:--';

    // 🇧🇷 Forçamos a exibição no fuso de Brasília para garantir consistência
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
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
    avgTicket: schedule.filter(apt => apt.status === 'COMPLETED').length > 0
      ? schedule.filter(apt => apt.status === 'COMPLETED').reduce((sum, apt) => sum + (apt.totalPrice || 0), 0) / schedule.filter(apt => apt.status === 'COMPLETED').length
      : 0,
  };

  const getPeriodCommission = useCallback((period: number) => {
    if (period === 0) return summary.totalCommission;
    
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - period);

    return allAppointments
      .filter(apt => {
        if (apt.status !== 'COMPLETED') return false;
        const d = new Date(apt.date || apt.scheduledFor || 0);
        return d >= cutoffDate && d <= now;
      })
      .reduce((sum, apt) => {
        const rate = barberDetail?.commissionRate || 40;
        return sum + ((apt.totalPrice || 0) * (rate / 100));
      }, 0);
  }, [allAppointments, summary.totalCommission, barberDetail?.commissionRate]);

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  // Registra chegada e abre a ordem de serviço silenciosamente
  const handleMarkArrived = async (appointment: any) => {
    setActionLoading(appointment.id);
    try {
      await serviceOrderService.create({
        clientId: (appointment as any).client?.id || appointment.clientId || '',
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

  // Abrir Modal de Ordem de Serviço (Adicionar produtos / Finalizar)
  const handleClientArrived = (appointment: any) => {
    setServiceOrderAppt(appointment);
  };

  // Concluir atendimento via Ordem de Serviço
  const handleCompleteFromOS = async (_extraProducts: Array<{ id: string; quantity: number }>) => {
    // O ServiceOrderModal já chamou serviceOrderService.complete(), que internamente
    // marca o agendamento como COMPLETED. Apenas fechamos o modal e atualizamos a agenda.
    setServiceOrderAppt(null);
    refresh();
    fetchBarberInfo(); // Atualiza o saldo (balance) em tempo real após a conclusão
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
  const handleDirectCancel = (appointment: any) => {
    setCancelModalAppt(appointment);
  };

  const confirmDirectCancel = async (reason: string) => {
    if (!cancelModalAppt) return;
    setActionLoading(cancelModalAppt.id);
    try {
      await appointmentService.cancelByBarber(cancelModalAppt.id, reason);
      setCancelModalAppt(null);
      refresh();
      fetchCancelCount();
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar agendamento');
    } finally {
      setActionLoading(null);
    }
  };


  // Enviar lembrete manual ao cliente
  const handleSendReminder = async (appointmentId: string) => {
    try {
      const res = await appointmentService.sendManualReminder(appointmentId);
      if (res.success) {
        alert('Lembrete enviado com sucesso!');
      } else if (res.reason === 'NOTIFICATIONS_DISABLED_BY_USER') {
        alert('O cliente desativou o recebimento de notificações (LGPD).');
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao enviar lembrete');
    }
  };

  // Ativar/Desativar lembrete automático (2h antes)
  const handleToggleReminder = async (appointment: any) => {
    try {
      const newStatus = !appointment.reminderEnabled;
      await appointmentService.updatePreferences(appointment.id, { reminderEnabled: newStatus });
      refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao atualizar preferência');
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-tenant-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Agendar Cliente
          </button>
          <button
            onClick={() => {
              const currentUrl = window.location.pathname;
              if (currentUrl.includes('/admin')) {
                // Se estiver dentro do Admin (BarberScheduleView), tenta trocar a aba
                const historyBtn = document.querySelector('[data-tab-id="HISTORY"]') as HTMLElement;
                if (historyBtn) historyBtn.click();
              } else {
                // Se estiver no dashboard puro do barbeiro (/barber), navega para a rota de admin history
                navigate('/admin?tab=HISTORY');
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <Clock className="w-5 h-5 text-tenant-primary" />
            Histórico
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
            value={(() => {
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
            })()}
            onChange={e => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400 border-0 bg-transparent cursor-pointer focus:outline-none"
          />
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Cards de Resumo - Linha 1: Status dos agendamentos */}
      <div className="grid grid-cols-3 gap-3 mb-3">
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
      </div>

      {/* Cards de Resumo - Linha 2: Financeiro */}
      <div className={`grid gap-3 mb-6 ${(shop as any)?.modulesEnabled?.barberCanViewTicketMedio !== false ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wide mb-1">Minha Comis.</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(summary.totalCommission)}</p>
        </div>
        {(shop as any)?.modulesEnabled?.barberCanViewTicketMedio !== false && (
          <div className="bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-xl p-4 border border-tenant-primary/10 dark:border-tenant-primary/30">
            <p className="text-xs text-tenant-primary dark:text-tenant-primary font-semibold uppercase tracking-wide mb-1">Ticket Médio</p>
            <p className="text-3xl font-bold text-tenant-primary dark:text-white/90">{formatCurrency(summary.avgTicket)}</p>
          </div>
        )}
        <button
          onClick={() => setShowBalanceModal(true)}
          className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group cursor-pointer"
        >
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1 flex items-center justify-between">
            <span>Meu Saldo ({balancePeriod === 0 ? 'Hoje' : `${balancePeriod} dias`})</span>
            <span className="text-[9px] opacity-60 group-hover:opacity-100 transition-opacity">▲ ver períodos</span>
          </p>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(getPeriodCommission(balancePeriod))}</p>
        </button>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tenant-primary mx-auto"></div>
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
                      HORÁRIO TRANCADO: <span className="text-tenant-primary dark:text-tenant-primary">{lock.startTime} - {lock.endTime}</span>
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

              const apptDate = new Date(appointment.date || appointment.scheduledFor);
              const nowMidnight = new Date();
              nowMidnight.setHours(23, 59, 59, 999);
              const isTodayOrPast = apptDate.getTime() <= nowMidnight.getTime();

              // 🚫 Bloqueia "Chegou" para agendamentos futuros (tolerância de 5 min)
              // Cobre tanto dias futuros quanto horários futuros no mesmo dia
              const isFutureAppointment = apptDate.getTime() > Date.now() + 5 * 60 * 1000;

              const hasOrderItems = !!((appointment as any).serviceOrder?.items?.length);
              const orderItems = hasOrderItems ? (appointment as any).serviceOrder.items : [];
              
              const displayServices = hasOrderItems 
                ? orderItems.filter((i: any) => i.type === 'SERVICE')
                : (appointment as any).services || [];
                
              const displayProducts = hasOrderItems
                ? orderItems.filter((i: any) => i.type === 'PRODUCT')
                : appointment.products || [];

              const displayTotal = (appointment as any).serviceOrder?.total || appointment.totalPrice;

              const displayCommission = hasOrderItems
                ? orderItems.reduce((s: number, i: any) => s + (i.commissionValue || 0), 0)
                : (displayTotal || 0) * (commissionRate / 100);

              return (
                <div
                  key={appointment.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 transition-all ${isCompleted ? 'opacity-70 border-green-400'
                    : isCancelled ? 'opacity-50 border-red-400'
                      : 'border-tenant-primary/40 hover:shadow-md'
                    }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Horário */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-xl border border-tenant-primary/20 dark:border-tenant-primary/30">
                        <Clock className="w-4 h-4 text-tenant-primary mb-1" />
                        <span className="text-lg font-bold text-tenant-primary dark:text-white/90 leading-none">
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
                        {displayServices.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {displayServices.map((svc: any) => (
                              <span key={svc.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
                                {svc.service?.name || svc.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Produtos */}
                        {displayProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {displayProducts.map((prod: any) => (
                              <span key={prod.id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-xs text-blue-800 dark:text-blue-300">
                                {prod.product?.name || prod.name} {prod.quantity > 1 ? `x${prod.quantity}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xl font-bold text-tenant-primary dark:text-tenant-primary">
                          {formatCurrency(displayTotal)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Comissão: {formatCurrency(displayCommission)} {!hasOrderItems && `(${commissionRate}%)`}
                        </p>
                      </div>
                    </div>

                    {/* Ações — apenas para SCHEDULED */}
                    {isScheduled && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {(isTodayOrPast && !isFutureAppointment) ? (
                          (appointment as any).serviceOrder ? (
                            <button
                              onClick={() => handleClientArrived(appointment)}
                              disabled={isLoading}
                              className="flex-1 min-w-[120px] py-2.5 px-4 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              {isLoading ? 'Aguarde...' : 'Abrir Comanda'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkArrived(appointment)}
                              disabled={isLoading}
                              className="flex-1 min-w-[120px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              <UserCheck className="w-4 h-4" />
                              {isLoading ? 'Aguarde...' : 'Chegou'}
                            </button>
                          )
                        ) : (
                          <div className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 rounded-xl font-medium text-xs flex items-center justify-center text-center border border-dashed border-gray-200 dark:border-gray-700">
                            {isFutureAppointment
                              ? `Disponível às ${apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Aguardando o dia do agendamento'}
                          </div>
                        )}
                        
                        <div className="flex flex-1 gap-2">
                          <button
                            onClick={() => handleSendReminder(appointment.id)}
                            className="flex-1 py-2.5 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2"
                            title="Enviar lembrete agora"
                          >
                            <BellRing className="w-4 h-4" />
                            Lembrar
                          </button>
                          
                          <button
                            onClick={() => handleToggleReminder(appointment)}
                            className={`flex flex-1 items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                              appointment.reminderEnabled 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                            }`}
                            title={appointment.reminderEnabled ? 'Lembrete automático ativado' : 'Ativar lembrete automático'}
                          >
                            {appointment.reminderEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                            <span>Auto</span>
                          </button>
                        </div>

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
              const { forceOverride, ...payload } = data;
              await barberService.createAgendaLock({
                barberId: barberId || '',
                ...payload
              });
              setShowLockModal(false);
              refresh();
              alert(data.forceOverride ? 'Horário trancado e clientes não notificados!' : 'Horário trancado com sucesso!');
            } catch (e: any) {
              alert(e?.response?.data?.message || e?.message || 'Erro ao trancar Horário. Verifique conflitos.');
            }
          }}
        />
      )}
      {/* Alerta de Agendamentos Pendentes */}
      {showOverdueAlert && overdueAppointments.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-tenant-primary/10 dark:bg-tenant-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-tenant-primary dark:text-tenant-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pendências Detectadas!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você possui <strong>{overdueAppointments.length}</strong> agendamento(s) de datas passadas que ainda constam como abertos.
              Por favor, atualize o status deles para manter sua agenda e financeiro corretos.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowOverdueAlert(false)}
                className="w-full py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-md"
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
      {/* Modal de Saldo */}
      {showBalanceModal && (
        <BalanceModal
          barberDetail={barberDetail}
          onClose={() => setShowBalanceModal(false)}
          balancePeriod={balancePeriod}
          setBalancePeriod={setBalancePeriod}
          allAppointments={allAppointments}
          commissionRate={commissionRate}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modal de Cancelamento Direto (Não Veio) */}
      {cancelModalAppt && (
        <CancelAppointmentModal
          appointment={cancelModalAppt}
          onClose={() => setCancelModalAppt(null)}
          onConfirm={confirmDirectCancel}
          counts={cancellationCounts}
        />
      )}
    </div>
  );
};

// --- COMPONENTE: CancelAppointmentModal (Moderno & Anti-Fraude) ---
const CancelAppointmentModal: React.FC<{
  appointment: any;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  counts: { monthly: number; weekly: number };
}> = ({ appointment, onClose, onConfirm, counts }) => {
  const [reason, setReason] = useState('Cliente não compareceu');
  const [loading, setLoading] = useState(false);

  const { monthly, weekly } = counts;
  const isNearLimit = monthly >= 7;
  const isOverLimit = monthly >= 10;
  const isWeeklyHigh = weekly >= 5;

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Confirmar Cancelamento</h2>
          </div>
          <p className="text-white/80 text-sm">
            Você está prestes a cancelar o agendamento de <strong>{appointment.client?.name || 'Cliente'}</strong>.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-2xl border-2 flex items-start gap-4 ${
            isOverLimit 
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
              : isNearLimit 
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
          }`}>
            <div className={`p-2 rounded-lg ${
              isOverLimit ? 'bg-red-200 text-red-700' : isNearLimit ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900 dark:text-white">Uso de Cancelamentos</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Você já realizou <strong>{monthly}</strong> cancelamentos este mês.
              </p>
              
              {isWeeklyHigh && !isOverLimit && (
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 uppercase tracking-tight">
                  💡 Dica: Verificamos {weekly} cancelamentos nesta semana. Para evitar "No-Show", envie lembretes aos clientes!
                </p>
              )}

              {isOverLimit && (
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-2 uppercase tracking-tight">
                  🚨 LIMITE MENSAL EXCEDIDO (10/10). 
                </p>
              )}
              {!isOverLimit && isNearLimit && (
                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mt-1 uppercase">
                  ⚠️ Cuidado: Você está próximo do limite mensal de 10.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Motivo do Cancelamento
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['Cliente não compareceu', 'Erro no agendamento', 'Indisponibilidade', 'Outro'].map((m) => (
                <button
                  key={m}
                  onClick={() => setReason(m)}
                  className={`px-3 py-2 text-xs rounded-xl border transition-all ${
                    reason === m 
                      ? 'bg-red-50 border-red-500 text-red-700 font-bold dark:bg-red-900/40 dark:text-red-300' 
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo..."
              className="w-full h-24 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Manter Agendamento
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
              className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


