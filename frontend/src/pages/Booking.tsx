
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Calendar as CalendarIcon, Clock, Check, User, AlertCircle, ChevronLeft, Scissors, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Appointment, Service, Barber, BlockedPeriod } from '../types';
import { useShop } from '../context/ShopContext';
import { Calendar } from '../components/Calendar';
import { Button } from '../components/ui/Button';
import { serviceService } from '../services/serviceService';
import { barberService } from '../services/barberService';
import { barbershopService } from '../services/barbershopService';
import { appointmentService } from '../services/appointmentService';
import { clientService, Client } from '../services/clientService';

export const Booking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { shop, generateTimeSlots } = useShop();

  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [blockedPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtrar barbeiros ativos da loja atual
  // Barbeiros do endpoint público (/barbers/public/shop/:id) já vêm filtrados por loja
  // Barbeiros autenticados têm shopId. Ambos os casos precisam funcionar.
  const shopBarbers = allBarbers.filter(b => {
    // Se não tem nenhum shopId (veio do endpoint público), confiar que já é da loja correta
    const hasNoShopId = !b.barbershopId && !b.shopId;
    const belongsToShop = hasNoShopId || b.barbershopId === shop.id || b.shopId === shop.id;
    return belongsToShop && b.active !== false;
  });
  const activeServices = allServices.filter(s => s.active !== false);

  const timeSlots = generateTimeSlots();

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>(''); // Para ADMIN/BARBER escolher cliente
  const [clientSearchQuery, setClientSearchQuery] = useState<string>(''); // Busca de clientes
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true); // 🛡️ LGPD toggle por agendamento

  // Auto-selecionar o barbeiro logado se for BARBER
  useEffect(() => {
    if (user?.role === 'BARBER' && !selectedBarber && allBarbers.length > 0) {
      if (user.barberId) {
        setSelectedBarber(user.barberId);
      } else {
        const matchingBarber = allBarbers.find(b => b.id === user.id || b.email === user.email);
        if (matchingBarber) {
          setSelectedBarber(matchingBarber.id);
        }
      }
    }
  }, [user, allBarbers, selectedBarber]);

  // Pré-selecionar data atual para melhor UX
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAllServices, setShowAllServices] = useState(false); // 🔥 Otimização MVP: Mostrar poucos por padrão
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Calcular duração total dos serviços selecionados
  const totalDuration = selectedServices.reduce((total, serviceId) => {
    const service = activeServices.find(s => s.id === serviceId);
    return total + (service?.duration || 0);
  }, 0);

  // Carregar dados do backend
  useEffect(() => {
    // Não fazer requisição com ID mock
    if (!shop.id || shop.id.startsWith('shop-')) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);


        // Buscar serviços (endpoint público retorna todos)
        const services = await serviceService.list(shop.id).catch(() => []);

        // Buscar clientes (apenas para ADMIN/BARBER)
        let clients: Client[] = [];
        if (user && (user.role === 'ADMIN' || user.role === 'BARBER' || user.role === 'SUPER_ADMIN')) {
          try {
            clients = await clientService.list(shop.id);
          } catch (error) {
          }
        }

        // Buscar barbeiros - tentar endpoint público primeiro (NOVO!)
        let barbers: Barber[] = [];
        try {
          // Primeiro: tentar endpoint público (retorna TODOS os barbeiros)
          barbers = await barberService.listPublic(shop.id);
          // Garantir que shopId estejá preenchido
          barbers = barbers.map(b => ({ ...b, shopId: shop.id, barbershopId: shop.id }));
        } catch (error: any) {
          // Fallback 1: tentar endpoint autenticado
          try {
            barbers = await barberService.list(shop.id);
          } catch (authError: any) {
            // Fallback 2: usar preview (apenas TOP 3)
            const preview = await barbershopService.getPreview(shop.id);
            barbers = preview.barbers.map(b => ({
              id: b.id,
              name: b.name,
              email: '',
              phone: '',
              avatar: b.avatar || undefined,
              bio: b.description || undefined,
              specialties: b.specialties || [],
              rating: b.rating,
              reviewCount: 0,
              barbershopId: shop.id,
              shopId: shop.id,
              active: true
            }));
          }
        }

        setAllServices(services);
        setAllBarbers(barbers);
        setAllClients(clients);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setAllServices([]);
        setAllBarbers([]);
        setAllClients([]);
        addNotification('error', 'Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shop.id, addNotification]);

  useEffect(() => {
    if (location.state) {
      const { preSelectedBarberId, preSelectedDate, preSelectedTime, preSelectedServiceId } = location.state;
      if (preSelectedServiceId) {
        setSelectedServices(Array.isArray(preSelectedServiceId) ? preSelectedServiceId : [preSelectedServiceId]);
      }
      if (preSelectedBarberId) setSelectedBarber(preSelectedBarberId);
      if (preSelectedDate) setSelectedDate(preSelectedDate);
      if (preSelectedTime) setSelectedTime(preSelectedTime);

      // Se temos serviços e barbeiro pré-selecionados, podemos pular para a etapa de data/hora
      if (preSelectedServiceId && preSelectedBarberId) {
        // Para CLIENT/BARBER, etapa 3 é data/hora. Para ADMIN, etapa 4.
        if (user?.role === 'CLIENT' || user?.role === 'BARBER') {
          setStep(3);
        } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
          setStep(4);
        }
      }
    }
  }, [location.state, user?.role]);

  // Carregar slots disponíveis quando barbeiro, data e duração forem selecionados
  useEffect(() => {
    const loadAvailableSlots = async () => {

      if (!selectedBarber || selectedBarber === 'any' || !selectedDate) {
        setAvailableSlots(timeSlots);
        return;
      }

      try {
        setLoadingSlots(true);
        const slots = await appointmentService.getAvailableSlots(selectedBarber, selectedDate, totalDuration > 0 ? totalDuration : undefined);
        setAvailableSlots(slots && slots.length > 0 ? slots : timeSlots);
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        // Fallback: usar todos os slots se a API falhar
        setAvailableSlots(timeSlots);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedBarber, selectedDate, totalDuration, user?.role]); // Removido timeSlots para evitar loop

  const isBlocked = (date: string, time: string, barberId: string) => {
    if (barberId === 'any') return false;

    // 🚫 Para CLIENTEs: bloquear horários passados do dia atual (UX + segurança)
    // ADMIN e BARBER podem agendar retroativamente (esquecimento na correria)
    if (user?.role === 'CLIENT') {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        const now = new Date();
        const [slotHour, slotMinute] = time.split(':').map(Number);
        const slotTime = new Date(now);
        slotTime.setHours(slotHour, slotMinute, 0, 0);
        // Early return antes de checar a lista da API
        // (a API não filtra horários passados, então faríamos isso aqui)
        if (slotTime <= now) {
          return true; // Horário já passou — bloquear visualmente
        }
      }
    }

    // Se temos slots da API, usar eles (disponibilidade do barbeiro)
    if (availableSlots.length > 0) {
      return !availableSlots.includes(time);
    }
    // Fallback: verificar localmente
    const dayBlock = blockedPeriods.some(b => b.barberId === barberId && b.date === date && b.type === 'DAY');
    const timeBlock = blockedPeriods.some(b => b.barberId === barberId && b.date === date && b.type === 'TIME' && time >= (b.startTime || '') && time < (b.endTime || ''));
    return dayBlock || timeBlock;
  };

  const handleConfirm = async () => {
    if (!user) { navigate('/login', { state: { from: '/book' } }); return; }

    // Para BARBER: o próprio barbeiro logado é o barbeiro — não precisa de shopBarbers
    if (shopBarbers.length === 0 && user.role !== 'BARBER') {
      addNotification('error', 'Nenhum barbeiro disponível no momento');
      return;
    }

    // Validar campos obrigatórios
    if (!selectedDate) {
      addNotification('error', 'Selecione uma data para o agendamento');
      return;
    }
    if (!selectedTime) {
      addNotification('error', 'Selecione um horário para o agendamento');
      return;
    }
    if (selectedServices.length === 0) {
      addNotification('error', 'Selecione pelo menãos um serviço');
      return;
    }
    // Para BARBER: barberId é inferido do JWT no backend, não precisa de selectedBarber
    if (user.role !== 'BARBER' && (!selectedBarber || (selectedBarber === 'any' && shopBarbers.length === 0))) {
      addNotification('error', 'Nenhum barbeiro disponível');
      return;
    }

    try {
      // Para BARBER: não precisa de finalBarberId (backend usa JWT)
      // Para CLIENT/ADMIN: resolver o ID final do barbeiro
      let finalBarberId: string;
      if (selectedBarber === 'any') {
        // 'Qualquer um' selecionado: usar o primeiro barbeiro disponível
        const firstBarber = shopBarbers[0];
        if (!firstBarber) {
          addNotification('error', 'Nenhum barbeiro disponível no momento.', 'Erro no Agendamento');
          return;
        }
        finalBarberId = firstBarber.id;
      } else {
        finalBarberId = selectedBarber || '';
      }

      // UX apenas: garantir que uma escolha foi feita antes de enviar
      // Toda validação de dados (UUID, existência do barbeiro, vínculo à loja) é responsabilidade do backend
      if (user.role !== 'BARBER' && !finalBarberId) {
        addNotification('error', 'Selecione um barbeiro para continuar.', 'Barbeiro obrigatório');
        return;
      }

      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hour, minute] = selectedTime.split(':').map(Number);
      
      // Criar a data localmente com precisão de segundos zerados
      const appointmentDate = new Date(year, month - 1, day, hour, minute, 0, 0);

      if (Number.isNaN(appointmentDate.getTime())) {
        addNotification('error', 'Data ou horário inválido para agendamento', 'Erro no Agendamento');
        return;
      }

      // Only block past times for CLIENTS (barbers/admins can book same-day retroactively)
      if (user.role === 'CLIENT' && appointmentDate <= new Date()) {
        addNotification('error', 'Selecione uma data e horário futuros', 'Erro no Agendamento');
        return;
      }

      // Payload condicional por role:
      // CLIENT: apenas barberId + serviceIds + date (clientId inferido do JWT)
      // BARBER: apenas clientId + serviceIds + date (barberId inferido do JWT)
      // ADMIN: clientId + barberId + serviceIds + date (ambos obrigatórios)
      let appointmentData: any = {
        serviceIds: selectedServices,
        date: appointmentDate.toISOString(),
        reminderEnabled, // 🛡️ LGPD: persist user's reminder preference
      };

      // CLIENT: precisa de barberId, clientId é inferido do JWT
      if (user.role === 'CLIENT') {
        appointmentData.barberId = finalBarberId;
      }
      // BARBER: precisa de clientId, barberId é inferido do JWT
      else if (user.role === 'BARBER') {
        if (!selectedClient) {
          addNotification('error', 'Selecione um cliente para o agendamento');
          return;
        }
        appointmentData.clientId = selectedClient;
      }
      // ADMIN: precisa de ambos clientId e barberId
      else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        if (!selectedClient) {
          addNotification('error', 'Selecione um cliente para o agendamento');
          return;
        }
        appointmentData.clientId = selectedClient;
        appointmentData.barberId = finalBarberId;
      }


      await appointmentService.create(appointmentData);

      // Formatar data para exibição
      const dataFormatada = new Date(selectedDate + 'T00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      addNotification(
        'success',
        `Agendamento confirmado para ${dataFormatada} às ${selectedTime}!`,
        'Sucesso'
      );
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);

      // Exibir mensagem de erro do backend (validações centralizadas lá)
      const rawMessage = error.response?.data?.message || error.message;
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join(' | ')
        : (rawMessage || 'Erro ao criar agendamento');

      // Tratar erro 403 (vínculo) priorizando mensagem do backend
      if (error?.response?.status === 403 || error?.status === 403) {
        addNotification(
          'error',
          errorMessage !== 'Erro ao criar agendamento' ? errorMessage : 'Você só pode agendar para seu próprio perfil. Contate o administrador se precisar de ajuda.',
          'Acesso Negado'
        );
        return;
      }

      addNotification('error', errorMessage, 'Erro no Agendamento');
    }
  };

  const visibleServices = showAllServices ? activeServices : activeServices.slice(0, 3);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border dark:border-gray-700 overflow-hidden min-h-[550px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tenant-primary border-t-transparent mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando agendamento...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se há serviços disponíveis
  if (activeServices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border dark:border-gray-700 overflow-hidden min-h-[550px] flex items-center justify-center">
          <div className="text-center p-8">
            <AlertCircle size={64} className="mx-auto mb-4 text-tenant-primary" />
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Nenhum serviço disponível</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Entre em contato com a barbearia para mais informações.</p>
            <button onClick={() => navigate('/')} className="bg-[#f59e0b] bg-tenant-primary text-white px-8 py-3 rounded-[22px] font-black uppercase text-xs tracking-wider">Voltar ao Início</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* Header com botão voltar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-tenant-primary transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Agendamento</h1>
        <div className="w-20"></div> {/* Spacer para centralizar */}
      </div>

      {/* Progress steps */}
      <div className="flex justify-between items-center mb-10 px-4 relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-1 before:bg-gray-200 dark:before:bg-gray-800 before:-z-10">
        {Array.from({ length: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 5 : 4 }, (_, i) => i + 1).map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all z-10 ${step >= s ? 'bg-tenant-primary text-white shadow-lg scale-110' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border dark:border-gray-700 overflow-hidden min-h-[550px]">
        {step === 1 && (
          <div className="p-8 md:p-12 animate-fade-in">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">O que vamos fazer hoje?</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Selecione um ou mais serviços</p>
              </div>
              {selectedServices.length > 0 && (
                <div className="text-right">
                  <p className="text-3xl font-black text-tenant-primary tracking-tighter">
                    R$ {activeServices.filter(s => selectedServices.includes(s.id)).reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'} e {totalDuration}min
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleServices.map(s => (
                <button key={s.id} onClick={() => setSelectedServices(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} className={`p-6 rounded-[30px] border-2 transition-all flex items-center gap-5 text-left group ${selectedServices.includes(s.id) ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-50 dark:border-gray-700 hover:border-tenant-primary/30'}`}>
                  <div className="w-16 h-16 rounded-[20px] overflow-hidden shrink-0 group-hover:scale-110 transition-transform"><img src={s.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm dark:text-white uppercase leading-tight mb-1">{s.name}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-tenant-primary font-black">R$ {s.price.toFixed(2)}</span>
                      <span className="text-gray-400 flex items-center gap-1"><Clock size={12} /> {s.duration}min</span>
                    </div>
                  </div>
                  {selectedServices.includes(s.id) && <div className="w-6 h-6 rounded-full bg-tenant-primary flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
                </button>
              ))}
            </div>

            {!showAllServices && activeServices.length > 3 && (
              <button
                onClick={() => setShowAllServices(true)}
                className="w-full mt-6 py-4 rounded-[22px] border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-tenant-primary hover:border-tenant-primary transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
              >
                <ChevronDown size={16} /> Ver todos os {activeServices.length} serviços
              </button>
            )}

            {/* 🔥 Sugestão Upsell MVP */}
            {selectedServices.length === 1 && (
              <div className="mt-8 bg-tenant-primary/5 dark:bg-tenant-primary/10 border border-tenant-primary/20 dark:border-tenant-primary/30 rounded-[20px] p-4 flex items-center justify-between animate-fade-in group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tenant-primary/10 dark:bg-tenant-primary/20 rounded-full">
                    <AlertCircle size={16} className="text-tenant-primary" />
                  </div>
                  <p className="text-xs font-bold text-tenant-primary dark:text-tenant-primary/80">
                    <span className="block text-[9px] uppercase tracking-widest opacity-80 mb-0.5">Dica do Barbeiro</span>
                    Que tal adicionar um segundo serviço para completar o visual?
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button disabled={selectedServices.length === 0} onClick={() => setStep(2)} className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-tenant-primary/20 disabled:opacity-30 transition-all active:scale-95">
                Próximo Passo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Seleção de Cliente (apenas para ADMIN/BARBER) */}
        {step === 2 && user && (user.role === 'ADMIN' || user.role === 'BARBER' || user.role === 'SUPER_ADMIN') && (
          <div className="p-8 md:p-12 animate-fade-in">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Para qual cliente?</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Selecione o cliente para esse agendamento</p>
            </div>

            {/* Search bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar cliente por nome..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-[24px] border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-tenant-primary outline-nãone transition-all"
              />
            </div>

            {/* Clients grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {allClients
                .filter(c => c.active && c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c.id)}
                    className={`p-6 rounded-[30px] border-2 transition-all group ${selectedClient === c.id ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-tenant-primary/30'}`}
                  >
                    <div className="w-16 h-16 rounded-[22px] mx-auto mb-3 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-tenant-primary group-hover:text-white transition-all">
                      <User size={28} />
                    </div>
                    <p className="font-black uppercase text-[10px] tracking-wider dark:text-white leading-tight truncate">{c.name}</p>
                    {c.phone && <p className="text-[9px] text-gray-400 mt-1">{c.phone}</p>}
                  </button>
                ))
              }
            </div>

            {allClients.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <User size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold uppercase text-xs tracking-widest">Nenhum cliente cadastrado</p>
              </div>
            )}

            <div className="mt-12 flex justify-between">
              <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-tenant-primary transition-colors">Voltar</button>
              <button
                disabled={!selectedClient}
                onClick={() => setStep(3)}
                className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-tenant-primary/30 disabled:opacity-30 transition-all active:scale-95"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2 para CLIENT ou Step 3 para ADMIN/BARBER: Seleção de Barbeiro */}
        {step === 2 && user?.role === 'CLIENT' && (
          <div className="p-8 md:p-12 animate-fade-in text-center">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Escolha o Profissional</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Selecione seu barbeiro preferido</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <button onClick={() => setSelectedBarber('any')} className={`p-8 rounded-[35px] border-2 transition-all group ${selectedBarber === 'any' ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-50 dark:border-gray-700 hover:border-tenant-primary/30'}`}>
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-[28px] mx-auto mb-4 flex items-center justify-center text-gray-400 group-hover:bg-tenant-primary group-hover:text-white transition-all"><User size={32} /></div>
                <p className="font-black uppercase text-[10px] tracking-widest dark:text-white leading-nãone">Qualquer um</p>
              </button>
              {shopBarbers.map(b => (
                <button key={b.id} onClick={() => setSelectedBarber(b.id)} className={`p-8 rounded-[35px] border-2 transition-all group ${selectedBarber === b.id ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-50 dark:border-gray-700 hover:border-tenant-primary/30'}`}>
                  <img src={b.avatar || b.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.name) + '&background=f59e0b&color=fff'} className="w-20 h-20 rounded-[28px] mx-auto mb-4 object-cover shadow-xl border-4 border-white dark:border-gray-700 group-hover:scale-105 transition-transform" />
                  <p className="font-black uppercase text-[10px] tracking-widest dark:text-white leading-nãone truncate">{b.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
            <div className="mt-16 flex justify-between px-4"><button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-tenant-primary transition-colors">Voltar</button><button disabled={!selectedBarber} onClick={() => setStep(3)} className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-tenant-primary/20 active:scale-95 transition-all">Continuar</button></div>
          </div>
        )}

        {step === 3 && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <div className="p-8 md:p-12 animate-fade-in text-center">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Escolha o Profissional</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Selecione o barbeiro para esse agendamento</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {shopBarbers.map(b => (
                <button key={b.id} onClick={() => setSelectedBarber(b.id)} className={`p-8 rounded-[35px] border-2 transition-all group ${selectedBarber === b.id ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-50 dark:border-gray-700 hover:border-tenant-primary/30'}`}>
                  <img src={b.avatar || b.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.name) + '&background=f59e0b&color=fff'} className="w-20 h-20 rounded-[28px] mx-auto mb-4 object-cover shadow-xl border-4 border-white dark:border-gray-700 group-hover:scale-105 transition-transform" />
                  <p className="font-black uppercase text-[10px] tracking-widest dark:text-white leading-nãone truncate">{b.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
            <div className="mt-16 flex justify-between px-4"><button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-tenant-primary transition-colors">Voltar</button><button disabled={!selectedBarber} onClick={() => setStep(4)} className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-tenant-primary/20 active:scale-95 transition-all">Continuar</button></div>
          </div>
        )}

        {/* Step 3 para CLIENT/BARBER ou Step 4 para ADMIN: Data + Horário */}
        {step === 3 && user && (user.role === 'CLIENT' || user.role === 'BARBER') && (
          <div className="p-8 md:p-12 animate-fade-in bg-[#111827]">
            <div className="text-center mb-10">
              <h4 className="text-[10px] font-black uppercase text-tenant-primary tracking-[0.3em] mb-2">Horários Para</h4>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-nãone">
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase() : 'Selecione uma data'}
              </h2>
              {totalDuration > 0 && (
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                  <Clock size={14} className="text-tenant-primary" /> Duração total: {totalDuration} minutos
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-[#1f2937] p-6 rounded-[40px] border border-gray-700 shadow-inner">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  isDateDisabled={(d) => {
                    // ðŸŽ¨ UX: Desabilitar datas passadas (visual apenas - backend valida de verdade)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(d);
                    checkDate.setHours(0, 0, 0, 0);

                    if (checkDate < today) {
                      return true; // Data não passado
                    }

                    // Verificar bloqueios do barbeiro
                    return blockedPeriods.some(
                      b => b.barberId === selectedBarber &&
                        b.date === d.toISOString().split('T')[0] &&
                        b.type === 'DAY'
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 auto-rows-max">
                {timeSlots.map(time => {
                  const blocked = isBlocked(selectedDate, time, selectedBarber);
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      disabled={blocked || !selectedDate}
                      onClick={() => setSelectedTime(time)}
                      className={`py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all relative ${blocked
                        ? 'bg-[#1a222f] text-gray-700 opacity-20 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#f59e0b] bg-tenant-primary text-white shadow-2xl shadow-tenant-primary/40 z-10 scale-105'
                          : 'bg-[#1a222f] text-white hover:bg-tenant-primary/10 hover:text-tenant-primary hover:-translate-y-0.5 active:scale-95'
                        }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-16 flex justify-between"><button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-tenant-primary">Voltar</button><button disabled={!selectedTime} onClick={() => setStep(4)} className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Continuar</button></div>
          </div>
        )}

        {/* Step 4 para ADMIN: Data + Horário */}
        {step === 4 && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <div className="p-8 md:p-12 animate-fade-in bg-[#111827]">
            <div className="text-center mb-10">
              <h4 className="text-[10px] font-black uppercase text-tenant-primary tracking-[0.3em] mb-2">Horários Para</h4>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase() : 'Selecione uma data'}
              </h2>
              {totalDuration > 0 && (
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                  <Clock size={14} className="text-tenant-primary" /> Duração total: {totalDuration} minutos
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-[#1f2937] p-6 rounded-[40px] border border-gray-700 shadow-inner">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  isDateDisabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(d);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate < today;
                  }}
                />
              </div>
              <div className="h-full max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-tenant-primary grid grid-cols-2 gap-3 content-start">
                {timeSlots.map(time => {
                  const isSelected = time === selectedTime;
                  const blocked = isBlocked(selectedDate, time, selectedBarber);
                  return (
                    <button
                      key={time}
                      disabled={blocked || !selectedDate}
                      onClick={() => setSelectedTime(time)}
                      className={`py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all relative ${blocked
                        ? 'bg-[#1a222f] text-gray-700 opacity-20 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#f59e0b] bg-tenant-primary text-white shadow-2xl shadow-tenant-primary/40 z-10 scale-105'
                          : 'bg-[#1a222f] text-white hover:bg-tenant-primary/10 hover:text-tenant-primary hover:-translate-y-0.5 active:scale-95'
                        }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-16 flex justify-between"><button onClick={() => setStep(3)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-tenant-primary">Voltar</button><button disabled={!selectedTime} onClick={() => setStep(5)} className="bg-[#f59e0b] bg-tenant-primary text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Continuar</button></div>
          </div>
        )}

        {/* Step 4 para CLIENT/BARBER ou Step 5 para ADMIN: Confirmação */}
        {((step === 4 && user && (user.role === 'CLIENT' || user.role === 'BARBER')) || (step === 5 && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'))) && (
          <div className="p-8 md:p-12 animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Confirmação</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Revise os detalhes do agendamento</p>
            </div>
            <div className="max-w-md mx-auto bg-gray-900 rounded-[50px] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tenant-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-5">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Data & Hora</span>
                  <span className="font-black text-tenant-primary uppercase tracking-tight">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase()} às {selectedTime}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-5">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Barbeiro</span>
                  <span className="font-black text-white uppercase tracking-tight">{shopBarbers.find(b => b.id === selectedBarber)?.name || 'Profissional'}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 dark:text-gray-400 font-bold">Total Estimado</span>
                    <span className="text-2xl font-black text-tenant-primary">
                      R$ {activeServices.filter(s => selectedServices.includes(s.id)).reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Lembrete de Agendamento</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reminderEnabled ? 'Você receberá um lembrete antes do horário' : 'Lembrete desativado para este agendamento'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        id="reminder-toggle"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-nãone rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-tenant-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <Button
                className="w-full flex items-center justify-center gap-4 py-6 text-lg font-bold"
                variant="primary"
                onClick={handleConfirm}
              >
                <Check size={24} strokeWidth={3} /> <span>Confirmar Agora</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
