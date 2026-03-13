import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Users, Scissors, ShoppingBag, Layers, Megaphone,
  Plus, Trash2, Edit3, X, Power, Check, TrendingUp, Eye, EyeOff,
  Calculator, AlertCircle, PieChart, BarChart3, Landmark, Tag, Share2, Image as ImageIcon,
  Lock, Calendar, Clock, Settings, Zap, Store, ChevronDown, MessageSquare, Shield, Package, Info,
  Menu, MoreHorizontal
} from 'lucide-react';
import {
  Appointment, Barber, Invoice, Product, Plan, Service, Campaign,
  TeamMember, TeamMemberRole, TEAM_ROLE_LABELS, BarberWorkModel, WORK_MODEL_LABELS, CreateTeamMemberDto,
  AgendaLock, CreateAgendaLockDto, AgendaLockConflict
} from '../../types';
import { AgendaLockModal } from '../../components/modals/AgendaLockModal';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button, Card, Input, Select } from '../../components/ui';
import { Container } from '../../components/layout/Container';
import { Grid } from '../../components/layout/Grid';
import { Modal, Alert } from '../../components/feedback';
import { Cashier } from './Cashier';
import { Supplies } from './Supplies';
import { ShareLink } from '../../components/ShareLink';
import { ShopSelector } from '../../components/ShopSelector';
import AdminAppointmentHistory from './AdminAppointmentHistory';
import { productService } from '../../services/productService';
import { serviceService } from '../../services/serviceService';
import { teamService } from '../../services/teamService';
import { planService } from '../../services/planService';
import { barbershopService } from '../../services/barbershopService';
import {
  getFinancialAnalytics,
  type FinancialAnalytics,
  type AnalyticsPeriod
} from '../../services/financialService';
import { expenseService, type Expense, type CreateExpenseDto, EXPENSE_TYPE_LABELS } from '../../services/expenseService';

export const AdminDashboard: React.FC = () => {
  const { shop: currentShop, setShop: setCurrentShop } = useShop();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('FINANCIAL');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [financialPeriod, setFinancialPeriod] = useState<AnalyticsPeriod>('TODAY');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [showShopSelector, setShowShopSelector] = useState(false);

  // Estados para Detalhamento Financeiro (Modais)
  const [showRevenueDetail, setShowRevenueDetail] = useState(false);
  const [showCommissionDetail, setShowCommissionDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const fallbackImage = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80';

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const maxRangeDate = formatDate(new Date());
  const minRangeDate = (() => {
    const min = new Date();
    min.setFullYear(min.getFullYear() - 2);
    return formatDate(min);
  })();

  const setRollingRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setCustomRange({ startDate: formatDate(start), endDate: formatDate(end) });
    setUseCustomRange(true);
    setFinancialPeriod('MONTH');
  };

  // Estados para integrao com API
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [appointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  // Custos fixos / Despesas via API
  const [fixedCosts, setFixedCosts] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<CreateExpenseDto>({ type: 'RENT', description: '', amount: 0, isRecurring: false });
  // Controle de sub-view na aba PRODUCTS
  const [productSubView, setProductSubView] = useState<'PRODUCTS' | 'STOCK'>('PRODUCTS');
  const [unitServices, setUnitServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices] = useState<Invoice[]>([]);

  // Estados para Team (Equipe/Colaboradores)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [editTeamMember, setEditTeamMember] = useState<TeamMember | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState<CreateTeamMemberDto>({
    name: '',
    email: '',
    phone: '',
    role: TeamMemberRole.BARBER,
    specialties: [],
    description: '',
    commissionRate: 50,
    workModel: BarberWorkModel.COMMISSION_ONLY,
    active: true,
  });

  // Estados para Trancar Agenda
  const [showLockAgendaModal, setShowLockAgendaModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  // Estados para Plans (Planos)
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    benefitMonths: 1,
    benefitServices: 0,
    benefitProducts: 0,
    benefitMoneyback: 0,
    description: '',
    benefits: [] as string[],
    discount: 0,
    active: true,
  });

  const [editBarber, setEditBarber] = useState<Barber | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Estados para White Label
  const [wlPrimaryColor, setWlPrimaryColor] = useState(currentShop.primaryColor || '#f59e0b');
  const [isSavingWl, setIsSavingWl] = useState(false);

  useEffect(() => {
    setWlPrimaryColor(currentShop.primaryColor || '#f59e0b');
  }, [currentShop.primaryColor]);

  const handleSaveWhiteLabel = async () => {
    try {
      setIsSavingWl(true);
      const updatedShop = await barbershopService.update(currentShop.id, {
        primaryColor: wlPrimaryColor
      });
      // Update only the specific field we knãow changed, to avoid type mismatch
      setCurrentShop({
        ...currentShop,
        primaryColor: wlPrimaryColor
      });
      addNotification('success', 'Configurações de aparência salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar aparência:', error);
      addNotification('error', 'Erro ao salvar as configurações de aparência.');
    } finally {
      setIsSavingWl(false);
    }
  };

  // Estado do modal de Confirmação de Remoção
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'SERVICE' | 'PRODUCT'; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: '',
    image: ''
  });
  const [serviceImagePreview, setServiceImagePreview] = useState<string>('');

  // Comprimir e converter imagem para base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar mantendo proporção (max 600px para reduzir tamanho)
          const maxSize = 600;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir para JPEG com qualidade 0.6 (mais comprimido)
          const compressedBase64 = canvas.toDataURL('image/jápeg', 0.6);

          // Verificar tamanho final
          const sizeKB = compressedBase64.length / 1024;

          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Converter imagem para base64
  const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        addNotification('error', 'Por favor, selecione apenas arquivos de imagem');
        return;
      }
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('error', 'Imagem muito grande. Tamanho máximo: 5MB');
        return;
      }

      try {
        const compressedBase64 = await compressImage(file);
        setServiceForm({ ...serviceForm, image: compressedBase64 });
        setServiceImagePreview(compressedBase64);
        addNotification('success', 'Imagem carregada com sucesso!');
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        addNotification('error', 'Erro ao processar imagem');
      }
    }
  };
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    image: '',
    category: '',
    stock: 0,
    unit: 'unidade'
  });

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification('error', 'Por favor, selecione apenas arquivos de imagem');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'Imagem muito grande. Tamanho máximo: 5MB');
      e.target.value = '';
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setProductForm(prev => ({ ...prev, image: compressedBase64 }));
      addNotification('success', 'Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao processar imagem do produto:', error);
      addNotification('error', 'Não foi possível processar a imagem. Tente outra.');
    } finally {
      e.target.value = '';
    }
  };

  // Carregar serviços do backend
  useEffect(() => {
    // Não fazer requisição com ID mock
    if (!currentShop.id || currentShop.id.startsWith('shop-')) {
      console.warn('?? Aguardando shopId real para carregar serviços');
      setLoadingServices(false);
      return;
    }

    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const data = await serviceService.list(currentShop.id);
        setUnitServices(data);
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        addNotification('error', 'Erro ao carregar serviços');
        setUnitServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, [currentShop.id, addNotification]);

  // Carregar team members do backend
  useEffect(() => {
    if (!currentShop.id || currentShop.id.startsWith('shop-')) {
      console.warn('?? Aguardando shopId real para carregar equipe');
      setLoadingTeam(false);
      return;
    }

    const loadTeam = async () => {
      try {
        setLoadingTeam(true);
        // Admin vê todos os membros (ativos e inativos)
        const data = await teamService.list(true);
        setTeamMembers(data);
      } catch (error) {
        console.error('Erro ao carregar equipe:', error);
        addNotification('error', 'Erro ao carregar equipe');
        setTeamMembers([]);
      } finally {
        setLoadingTeam(false);
      }
    };

    loadTeam();
  }, [currentShop.id, addNotification]);

  // Carregar planos do backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const data = await planService.getAll();
        // Filtrar planos da loja atual (se necessário)
        setPlans(data);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        addNotification('error', 'Erro ao carregar planos');
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [addNotification]);

  // Carregar produtos do backend
  useEffect(() => {
    // Não fazer requisição com ID mock
    if (!currentShop.id || currentShop.id.startsWith('shop-')) {
      setLoadingProducts(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        // Admin vê todos os produtos (ativos e inativos)
        const data = await productService.list(currentShop.id, true);
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        addNotification('error', 'Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [currentShop.id, addNotification]);

  // Escutar evento de troca de loja (multitenant)
  useEffect(() => {
    const handleShopChange = (event: CustomEvent) => {
      const { newShopId, shop } = event.detail;
      addNotification('success', `Loja alterada para ${shop?.name || 'nova unidade'}`);

      // Forçar reload de todos os dados da nova loja
      // (os useEffects com dependência currentShop.id também vão disparar)
      setTimeout(() => {
        window.location.reload(); // Reload completo para garantir estado limpo
      }, 500);
    };

    window.addEventListener('shop-changed', handleShopChange as EventListener);
    return () => window.removeEventListener('shop-changed', handleShopChange as EventListener);
  }, [addNotification]);

  // Buscar analytics financeiros da API
  useEffect(() => {
    // Não fazer requisição com ID mock
    if (!currentShop.id || currentShop.id.startsWith('shop-')) {
      console.warn('?? Aguardando shopId real para carregar analytics');
      setLoadingAnalytics(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const startDate = useCustomRange ? customRange.startDate : undefined;
        const endDate = useCustomRange ? customRange.endDate : undefined;
        const data = await getFinancialAnalytics(currentShop.id, financialPeriod, startDate, endDate);
        setAnalytics(data);
      } catch (error: any) {
        console.error('? Erro ao carregar analytics:', error);

        // Verificar se é erro de autenticação
        if (error?.statusCode === 401 || error?.response?.status === 401) {
          addNotification('error', 'Sessão expirada. Faça login novamente.');
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/login';
          }, 2000);
          return;
        }

        // Verificar se é erro de permissão (403)
        if (error?.statusCode === 403 || error?.response?.status === 403) {
          console.warn('?? Erro 403: Permissão negada para acessar dados financeiros');
          addNotification(
            'warning',
            'Você não tem permissão para acessar os dados financeiros desta barbearia. Entre em contato com o administrador.',
            'Acesso Negado'
          );
          return;
        }

        // Verificar se endpoint não existe (404)
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          console.warn('?? Endpoint /financial/analytics não encontrado');
          addNotification(
            'info',
            'O módulo financeiro ainda não foi implementado não backend. Esta funcionalidade estará disponível na Fase 2.',
            'Em Desenvolvimento'
          );
          return;
        }

        addNotification('error', 'Erro ao carregar dados financeiros');
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [currentShop.id, financialPeriod, customRange.startDate, customRange.endDate, useCustomRange, addNotification]);

  // Carregar despesas/custos fixos da API
  useEffect(() => {
    if (!currentShop?.id) return;
    setLoadingExpenses(true);
    expenseService.list()
      .then(data => setFixedCosts(data))
      .catch(err => {
        console.error('Erro ao carregar despesas:', err);
        setFixedCosts([]);
      })
      .finally(() => setLoadingExpenses(false));
  }, [currentShop.id]);

  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditExpense(expense);
      setExpenseForm({ type: expense.type, description: expense.description, amount: expense.amount, isRecurring: expense.isRecurring, dueDate: expense.dueDate });
    } else {
      setEditExpense(null);
      setExpenseForm({ type: 'RENT', description: '', amount: 0, isRecurring: false, dueDate: undefined });
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description.trim()) { addNotification('error', 'Descrição é obrigatória'); return; }
    if (!expenseForm.amount || expenseForm.amount <= 0) { addNotification('error', 'Valor deve ser maior que zero'); return; }
    try {
      if (editExpense) {
        await expenseService.update(editExpense.id, expenseForm);
        addNotification('success', 'Despesa atualizada!');
      } else {
        await expenseService.create(expenseForm);
        addNotification('success', 'Despesa criada!');
      }
      const data = await expenseService.list();
      setFixedCosts(data);
      setShowExpenseModal(false);
    } catch (err: any) {
      addNotification('error', err?.response?.data?.message || 'Erro ao salvar despesa');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Excluir esta despesa?')) return;
    try {
      await expenseService.remove(id);
      addNotification('success', 'Despesa excluída!');
      setFixedCosts(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      addNotification('error', 'Erro ao excluir despesa');
    }
  };

  const handleMarkExpensePaid = async (id: string) => {
    try {
      await expenseService.markAsPaid(id);
      addNotification('success', 'Marcada como paga!');
      const data = await expenseService.list();
      setFixedCosts(data);
    } catch (err: any) {
      addNotification('error', 'Erro ao marcar como paga');
    }
  };

  // Abrir modal de serviço para editar ou criar
  const handleOpenServiceModal = (service?: Service) => {
    if (service) {
      setEditService(service);
      setServiceForm({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || 30,
        category: service.category || '',
        image: service.image || ''
      });
      setServiceImagePreview(service.image || '');
    } else {
      setEditService(null);
      setServiceForm({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        category: '',
        image: ''
      });
      setServiceImagePreview('');
    }
    setShowServiceModal(true);
  };

  // Salvar serviço (criar ou editar)
  const handleSaveService = async () => {
    try {
      if (!serviceForm.name || !serviceForm.name.trim()) {
        addNotification('error', 'Nome do serviço  obrigatrio');
        return;
      }

      if (!serviceForm.category || !serviceForm.category.trim()) {
        addNotification('error', 'Categoria  obrigatria');
        return;
      }

      if (serviceForm.price <= 0 || serviceForm.duration <= 0) {
        addNotification('error', 'Preço e duração devem ser maiores que zero');
        return;
      }

      // Garantir que price e duration sejám numeros validos
      const price = parseFloat(String(serviceForm.price));
      const duration = parseInt(String(serviceForm.duration), 10);

      if (isNaN(price) || price <= 0) {
        addNotification('error', 'Preço inválido');
        return;
      }

      if (isNaN(duration) || duration <= 0) {
        addNotification('error', 'Duração inválida');
        return;
      }

      if (editService) {
        // Atualizar serviço existente
        const updateData: any = {
          name: serviceForm.name.trim(),
          price: price,
          duration: duration,
          category: serviceForm.category.trim(),
        };

        // Adicionar campos opcionais apenas se tiverem valor
        if (serviceForm.description && serviceForm.description.trim()) {
          updateData.description = serviceForm.description.trim();
        }
        if (serviceForm.image && serviceForm.image.trim()) {
          updateData.image = serviceForm.image.trim();
        }

        await serviceService.update(editService.id, updateData);
        addNotification('success', 'Serviço atualizado com sucesso!');
      } else {
        // Criar novo serviço
        const createData: any = {
          name: serviceForm.name.trim(),
          price: price,
          duration: duration,
          category: serviceForm.category.trim(),
          active: true, // Adicionar estado ativo
        };

        // Adicionar campos opcionais apenas se tiverem valor
        if (serviceForm.description && serviceForm.description.trim()) {
          createData.description = serviceForm.description.trim();
        }
        if (serviceForm.image && serviceForm.image.trim()) {
          createData.image = serviceForm.image.trim();
        }

        // Validar tamanho da imagem (max 100KB base64)
        if (createData.image && createData.image.length > 100 * 1024) {
          addNotification('error', 'Imagem muito grande. Tente uma imagem menãor.');
          return;
        }

        await serviceService.create(createData);
        addNotification('success', 'Serviço criado com sucesso!');
      }
      // Recarregar serviços
      const data = await serviceService.list(currentShop.id);
      setUnitServices(data);
      setShowServiceModal(false);
      setServiceImagePreview('');
    } catch (error: any) {
      console.error('? Erro ao salvar serviço:', error);
      console.error('? Resposta do servidor:', error.response?.data);
      console.error('? Status:', error.response?.status);
      console.error('? Config:', error.config);

      const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar serviço';

      // Log do payload que foi enviado
      if (error.config?.data) {
        try {
          const sentData = JSON.parse(error.config.data);
          console.error('?? Payload enviado:', sentData);
        } catch (e) {
          console.error('?? Payload (raw):', error.config.data);
        }
      }

      if (error.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      if (Array.isArray(errorMessage)) {
        addNotification('error', `Validação: ${errorMessage.join(', ')}`);
      } else if (error.response?.status === 400) {
        addNotification('error', `Dados inválidos: ${errorMessage}`);
      } else if (error.response?.status === 403) {
        addNotification('error', 'Você não tem permissão para esta ação');
      } else if (error.response?.status === 404) {
        addNotification('error', 'Serviço não encontrado');
      } else {
        addNotification('error', errorMessage);
      }
    }
  };

  const toggleActive = (id: string, type: 'BARBER' | 'SERVICE' | 'COST' | 'PRODUCT' | 'PLAN') => {
    let updated: any[] = [];
    if (type === 'BARBER') {
      updated = barbers.map(b => b.id === id ? { ...b, active: !b.active } : b);
      setBarbers(updated);
      localStorage.setItem('barbers', JSON.stringify(updated));
    } else if (type === 'SERVICE') {
      // Atualizar serviço não backend
      const service = unitServices.find(s => s.id === id);
      if (service) {
        serviceService.update(id, { active: !service.active })
          .then(() => serviceService.list(currentShop.id))
          .then(data => {
            setUnitServices(data);
            addNotification('success', 'Status do serviço atualizado!');
          })
          .catch(error => {
            console.error('Erro ao atualizar serviço:', error);
            if (error?.statusCode === 401) {
              addNotification('error', 'Sessão expirada. Faça login novamente.');
              setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
              }, 2000);
              return;
            }
            addNotification('error', 'Erro ao atualizar serviço. Verifique se o backend está rodando.');
          });
        return;
      }
    } else if (type === 'PRODUCT') {
      // Atualizar produto não backend
      const product = products.find(p => p.id === id);
      if (product) {
        productService.update(id, { active: !product.active })
          .then(() => {
            // Recarregar TODOS os produtos (ativos e inativos) para admin
            return productService.list(currentShop.id, true);
          })
          .then(data => {
            setProducts(data);
            addNotification('success', 'Status do produto atualizado!');
          })
          .catch(error => {
            console.error('Erro ao atualizar produto:', error);

            // Verificar se  erro de autenticação
            if (error?.statusCode === 401) {
              addNotification('error', 'Sessão expirada. Faça login novamente.');
              // Limpar dados e redirecionar para login
              setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
              }, 2000);
              return;
            }

            addNotification('error', 'Erro ao atualizar produto. Verifique se o backend está rodando.');
          });
        return; // Sair antes de chamar addNotification abaixo
      }
    }
    addNotification('success', 'Status atualizado!');
  };

  const deleteItem = (id: string, type: 'BARBER' | 'SERVICE' | 'COST') => {
    // Encontrar o item para exibir o nãome não modal
    let itemName = '';
    if (type === 'SERVICE') {
      const service = unitServices.find(s => s.id === id);
      itemName = service?.name || 'este serviço';
      setDeleteTarget({ id, type: 'SERVICE', name: itemName });
      setShowDeleteModal(true);
      return;
    }

    // Para outros tipos (BARBER), manter lógica antiga
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    let updated: any[] = [];
    if (type === 'BARBER') {
      updated = barbers.filter(b => b.id !== id);
      setBarbers(updated);
      localStorage.setItem('barbers', JSON.stringify(updated));
    }
    addNotification('success', 'Item removido!');
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        costPrice: product.costPrice || 0,
        image: product.image || '',
        category: product.category || '',
        stock: product.stock || 0,
        unit: product.unit || 'unidade'
      });
    } else {
      setEditProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        costPrice: 0,
        image: '',
        category: '',
        stock: 0,
        unit: 'unidade'
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!productForm.name || !productForm.name.trim()) {
        addNotification('error', 'Nome do produto é obrigatório');
        return;
      }

      if (!productForm.category || !productForm.category.trim()) {
        addNotification('error', 'Categoria é obrigatória');
        return;
      }

      if (productForm.price <= 0) {
        addNotification('error', 'Preço deve ser maior que zero');
        return;
      }

      // Garantir que os números sejám válidos
      const price = parseFloat(String(productForm.price));
      const costPrice = parseFloat(String(productForm.costPrice)) || 0;
      const stock = parseInt(String(productForm.stock), 10) || 0;

      if (isNaN(price) || price <= 0) {
        addNotification('error', 'Preço inválido');
        return;
      }

      if (editProduct) {
        // Atualizar produto existente
        // ?? NÃO enviar shopId - o backend pega do token JWT (TenantGuard)
        const updateData: any = {
          name: productForm.name.trim(),
          price: price,
          category: productForm.category.trim(),
          stock: stock,
          costPrice: costPrice,
          unit: productForm.unit || 'unidade'
        };

        // SÓ incluir campos opcionais se tiverem valor
        if (productForm.description && productForm.description.trim()) {
          updateData.description = productForm.description.trim();
        }
        if (productForm.image && productForm.image.trim()) {
          updateData.image = productForm.image.trim();
        }

        await productService.update(editProduct.id, updateData);
        addNotification('success', 'Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const createData: any = {
          name: productForm.name.trim(),
          price: price,
          category: productForm.category.trim(),
          stock: stock,
          costPrice: costPrice,
          active: true,
          unit: productForm.unit || 'unidade'
        };

        // SÓ incluir campos opcionais se tiverem valor
        if (productForm.description && productForm.description.trim()) {
          createData.description = productForm.description.trim();
        }
        if (productForm.image && productForm.image.trim()) {
          createData.image = productForm.image.trim();
        }

        // Validar tamanho da imagem (max 100KB base64)
        if (createData.image && createData.image.length > 100 * 1024) {
          addNotification('error', 'Imagem muito grande. Tente uma imagem menãor.');
          return;
        }

        await productService.create(createData);
        addNotification('success', 'Produto criado com sucesso!');
      }

      // Recarregar produtos
      const data = await productService.list(currentShop.id, true);
      setProducts(data);
      setShowProductModal(false);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);

      // Tratamento específico de erros
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar produto';

      if (error.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Extrair mensagem de erro do response
      if (Array.isArray(errorMessage)) {
        // Array de erros de validação do class-validator
        addNotification('error', `Validação: ${errorMessage.join(', ')}`);
      } else if (error.response?.status === 400) {
        addNotification('error', `Dados inválidos: ${errorMessage}`);
      } else if (error.response?.status === 403) {
        addNotification('error', 'Você não tem permissão para esta ação');
      } else if (error.response?.status === 404) {
        addNotification('error', 'Produto não encontrado');
      } else {
        addNotification('error', errorMessage);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setDeleteTarget({ id, type: 'PRODUCT', name: product.name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (!deleteReason.trim()) {
      addNotification('error', 'Por favor, informe o motivo da Remoção');
      return;
    }

    try {
      if (deleteTarget.type === 'PRODUCT') {
        await productService.remove(deleteTarget.id, deleteReason);
        const data = await productService.list(currentShop.id, true);
        setProducts(data);
        addNotification('success', 'Produto removido com sucesso!');
      } else if (deleteTarget.type === 'SERVICE') {
        await serviceService.remove(deleteTarget.id, deleteReason);
        const data = await serviceService.list(currentShop.id);
        setUnitServices(data);
        addNotification('success', 'serviço removido com sucesso!');
      }

      // Fechar modal e limpar estados
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (error: any) {
      console.error('Erro ao remover:', error);

      if (error?.statusCode === 401 || error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao remover. Verifique sua conexão.';
      addNotification('error', typeof errorMessage === 'string' ? errorMessage : errorMessage[0]);
    }
  };

  // ============================================================================
  // FUNÇÕES DE TEAM MANAGEMENT (Gerenciamento de Equipe)
  // ============================================================================

  const handleOpenTeamModal = (member?: TeamMember) => {
    if (member) {
      setEditTeamMember(member);
      setTeamForm({
        name: member.name || '',
        nickname: member.nickname || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || TeamMemberRole.BARBER,
        specialties: member.specialties || [],
        description: member.description || '',
        bio: member.bio || '',
        commissionRate: member.commissionRate || 50,
        experienceYears: member.experienceYears || 0,
        avatar: member.avatar || '',
        birthDate: member.birthDate || '',
        hireDate: member.hireDate || '',
        workModel: member.workModel || BarberWorkModel.COMMISSION_ONLY,
        monthlySalary: member.monthlySalary || 0,
        chairRentalFee: member.chairRentalFee || 0,
        active: member.active !== undefined ? member.active : true,
      });
    } else {
      setEditTeamMember(null);
      setTeamForm({
        name: '',
        email: '',
        phone: '',
        role: TeamMemberRole.BARBER,
        specialties: [],
        description: '',
        commissionRate: 50,
        workModel: BarberWorkModel.COMMISSION_ONLY,
        active: true,
      });
    }
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async () => {
    try {
      if (!teamForm.name || !teamForm.name.trim()) {
        addNotification('error', 'Nome é obrigatório');
        return;
      }

      if (editTeamMember) {
        // Atualizar membro existente
        await teamService.update(editTeamMember.id, teamForm);
        addNotification('success', `${TEAM_ROLE_LABELS[teamForm.role]} atualizado(a) com sucesso!`);
      } else {
        // Criar novo membro
        await teamService.create(teamForm);
        addNotification('success', `${TEAM_ROLE_LABELS[teamForm.role]} adicionado(a) com sucesso!`);
      }

      // Recarregar equipe
      const data = await teamService.list(true);
      setTeamMembers(data);
      setShowTeamModal(false);
    } catch (error: any) {
      console.error('Erro ao salvar membro da equipe:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar';

      if (error.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }

      if (Array.isArray(errorMessage)) {
        addNotification('error', `Validação: ${errorMessage.join(', ')}`);
      } else {
        addNotification('error', errorMessage);
      }
    }
  };

  const handleToggleTeamMemberActive = async (id: string) => {
    try {
      await teamService.toggleActive(id);
      const data = await teamService.list(true);
      setTeamMembers(data);
      addNotification('success', 'Status atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      if (error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      addNotification('error', 'Erro ao atualizar status');
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name} da equipe?`)) {
      return;
    }

    const reason = prompt('Motivo da Remoção (obrigatório):');
    if (!reason || !reason.trim()) {
      addNotification('error', 'Motivo é obrigatório');
      return;
    }

    try {
      await teamService.remove(id, reason.trim());
      const data = await teamService.list(true);
      setTeamMembers(data);
      addNotification('success', 'Membro removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      if (error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      addNotification('error', 'Erro ao remover membro');
    }
  };

  // ============================================================================
  // FUNÇÕES DE AGENDA LOCK (Trancar Agenda)
  // ============================================================================

  const handleOpenLockAgendaModal = (member: TeamMember) => {
    setSelectedTeamMember(member);
    setShowLockAgendaModal(true);
  };



  // ============================================================================
  // FUNÇÕES DE PLANS MANAGEMENT (Gerenciamento de Planos)
  // ============================================================================

  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditPlan(plan);
      setPlanForm({
        name: plan.name || '',
        price: plan.price || 0,
        benefitMonths: plan.benefitMonths || 1,
        benefitServices: plan.benefitServices || 0,
        benefitProducts: plan.benefitProducts || 0,
        benefitMoneyback: plan.benefitMoneyback || 0,
        description: plan.description || '',
        benefits: plan.benefits || [],
        discount: plan.discount || 0,
        active: plan.active ?? true,
      });
    } else {
      setEditPlan(null);
      setPlanForm({
        name: '',
        price: 0,
        benefitMonths: 1,
        benefitServices: 0,
        benefitProducts: 0,
        benefitMoneyback: 0,
        description: '',
        benefits: [],
        discount: 0,
        active: true,
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    try {
      if (!planForm.name || !planForm.name.trim()) {
        addNotification('error', 'Nome do plano é obrigatório');
        return;
      }

      if (planForm.price <= 0) {
        addNotification('error', 'Preço deve ser maior que zero');
        return;
      }

      if (editPlan) {
        // Atualizar plano existente
        await planService.update(editPlan.id, planForm);
        addNotification('success', 'Plano atualizado com sucesso!');
      } else {
        // Criar novo plano
        await planService.create(planForm);
        addNotification('success', 'Plano criado com sucesso!');
      }

      // Recarregar planos
      const data = await planService.getAll();
      setPlans(data);
      setShowPlanModal(false);
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar plano';

      if (error.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }

      if (Array.isArray(errorMessage)) {
        addNotification('error', `Validação: ${errorMessage.join(', ')}`);
      } else {
        addNotification('error', errorMessage);
      }
    }
  };

  const handleTogglePlanActive = async (id: string) => {
    try {
      await planService.toggleActive(id);
      const data = await planService.getAll();
      setPlans(data);
      addNotification('success', 'Status do plano atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar status do plano:', error);
      if (error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      addNotification('error', 'Erro ao atualizar status do plano');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${name}"?`)) {
      return;
    }

    try {
      await planService.delete(id);
      const data = await planService.getAll();
      setPlans(data);
      addNotification('success', 'Plano excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      if (error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      addNotification('error', 'Erro ao excluir plano');
    }
  };

  const handleModuleToggle = async (moduleName: string, enabled: boolean) => {
    try {
      const restrictedModules = ['cashier', 'financial', 'reports'];
      if (!isSuperAdmin && restrictedModules.includes(moduleName)) {
        addNotification('warning', 'Somente o Super Admin pode alterar este módulo.', 'Permissão restrita');
        return;
      }

      const updatedModules = {
        ...currentShop.settings.modulesEnabled,
        [moduleName]: enabled,
      };

      await barbershopService.updateModuleSettings(currentShop.id, updatedModules);

      // Atualizar estado local
      setCurrentShop({
        ...currentShop,
        settings: {
          ...currentShop.settings,
          modulesEnabled: updatedModules,
        },
      });

      addNotification('success', `Módulo ${enabled ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao atualizar configuração de módulo:', error);
      if (error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return;
      }
      addNotification('error', 'Erro ao atualizar configuração. Tente novamente.');
    }
  };

  // ─── Tab Groups ────────────────────────────────────────────────────────────
  const TAB_GROUPS = [
    {
      label: 'Financeiro',
      color: 'emerald',
      tabs: [
        { id: 'FINANCIAL', icon: DollarSign, label: 'Saúde Financeira', short: 'Saúde' },
        { id: 'CASHIER', icon: Calculator, label: 'Caixa', short: 'Caixa' },
      ],
    },
    {
      label: 'Gestão',
      color: 'blue',
      tabs: [
        { id: 'BARBERS', icon: Users, label: 'Time', short: 'Time' },
        { id: 'SERVICES', icon: Scissors, label: 'Serviços', short: 'Serviços' },
        { id: 'PRODUCTS', icon: ShoppingBag, label: 'Produtos', short: 'Produtos' },
      ],
    },
    {
      label: 'Estoque & Abast.',
      color: 'orange',
      tabs: [
        { id: 'STOCK', icon: Layers, label: 'Estoque', short: 'Estoque' },
        { id: 'SUPPLIES', icon: Package, label: 'Insumos', short: 'Insumos' },
        { id: 'PLANS', icon: Tag, label: 'Planos', short: 'Planos' },
      ],
    },
    {
      label: 'Análise & Config.',
      color: 'purple',
      tabs: [
        { id: 'HISTORY', icon: Calendar, label: 'Histórico', short: 'Histórico' },
        { id: 'SETTINGS', icon: Settings, label: 'Configurações', short: 'Config.' },
        ...(isSuperAdmin ? [{ id: 'SUPER', icon: Shield, label: 'Super Admin', short: 'Super' }] : []),
      ],
    },
  ];

  const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);
  // Mobile: first 4 primary tabs pinned to bottom bar; rest in overflow drawer
  const MOBILE_PRIMARY = ALL_TABS.slice(0, 4);
  const MOBILE_OVERFLOW = ALL_TABS.slice(4);
  const activeTabObj = ALL_TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-24 md:pb-8">
      <Container size="xl" className="py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 md:gap-6">
          <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Painel Administrativo</h1>

            {/* Shop Selector Button */}
            <button
              onClick={() => setShowShopSelector(true)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-tenant-primary/5 dark:hover:bg-tenant-primary/20/20 transition-all border border-gray-200 dark:border-gray-700 hover:border-tenant-primary dark:hover:border-tenant-primary"
            >
              <Store size={16} className="text-gray-600 dark:text-gray-400 group-hover:text-tenant-primary transition-colors" />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest group-hover:text-tenant-primary dark:group-hover:text-tenant-primary">
                {currentShop.name}
              </span>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-tenant-primary transition-colors" />
            </button>
          </div>
          <Button
            onClick={() => setShowShareLink(true)}
            variant="outline"
            icon={<Share2 size={20} />}
            className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
            aria-label="Compartilhar"
          >
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
        </div>

        {/* ── DESKTOP NAVIGATION: grouped pill tabs ── */}
        <nav className="hidden md:flex flex-col gap-2" aria-label="Navegação administrativa">
          <div className="flex gap-3 flex-wrap">
            {TAB_GROUPS.map((group, gi) => (
              <div key={gi} className="flex items-center gap-1">
                {/* Group label */}
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 pr-1 select-none">
                  {group.label}
                </span>
                {group.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    aria-label={tab.label}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200
                      ${
                        activeTab === tab.id
                          ? 'bg-tenant-primary text-white shadow-lg shadow-tenant-primary/30 scale-105'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                      }`}
                  >
                    <tab.icon size={14} className="flex-shrink-0" />
                    {tab.short}
                  </button>
                ))}
                {/* Divider between groups */}
                {gi < TAB_GROUPS.length - 1 && (
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 ml-2" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          {/* Active tab breadcrumb indicator */}
          {activeTabObj && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-0.5 w-4 rounded-full bg-tenant-primary" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {TAB_GROUPS.find(g => g.tabs.some(t => t.id === activeTab))?.label}
                <span className="mx-1 text-gray-300 dark:text-gray-600">›</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{activeTabObj.label}</span>
              </span>
            </div>
          )}
        </nav>

        {/* ── MOBILE NAVIGATION: sticky bottom bar + overflow drawer ── */}
        {/* Overlay for drawer */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
        )}

        {/* Overflow drawer (slide up) */}
        <div
          className={`fixed bottom-16 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out ${
            showMobileMenu ? 'translate-y-0' : 'translate-y-[110%]'
          }`}
          aria-label="Menu adicional"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-3 mb-2 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Mais opções</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              {TAB_GROUPS.map((group, gi) => (
                <div key={gi} className="mb-4 last:mb-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2 px-1">{group.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-tenant-primary text-white shadow-md shadow-tenant-primary/30'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={tab.label}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                      >
                        <tab.icon size={20} className="flex-shrink-0" />
                        <span className="text-[10px] font-bold leading-tight">{tab.short}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile sticky bottom navigation bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom"
          aria-label="Navegação principal"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch h-16">
            {MOBILE_PRIMARY.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative touch-manipulation ${
                  activeTab === tab.id
                    ? 'text-tenant-primary'
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {activeTab === tab.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-tenant-primary" aria-hidden="true" />
                )}
                <tab.icon size={20} className="transition-transform duration-200" style={{ transform: activeTab === tab.id ? 'scale(1.15)' : 'scale(1)' }} />
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{tab.short}</span>
              </button>
            ))}

            {/* Mais / overflow button */}
            <button
              onClick={() => setShowMobileMenu(prev => !prev)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative touch-manipulation ${
                showMobileMenu || MOBILE_OVERFLOW.some(t => t.id === activeTab)
                  ? 'text-tenant-primary'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Mais opções"
              aria-expanded={showMobileMenu}
            >
              {(showMobileMenu || MOBILE_OVERFLOW.some(t => t.id === activeTab)) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-tenant-primary" aria-hidden="true" />
              )}
              <MoreHorizontal size={20} className={`transition-transform duration-300 ${showMobileMenu ? 'rotate-90' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Mais</span>
            </button>
          </div>
        </nav>

        {/* Histórico Tab */}
        {activeTab === 'HISTORY' && (
          <AdminAppointmentHistory />
        )}

        {/* Insumos Tab */}
        {activeTab === 'SUPPLIES' && (
          <Supplies />
        )}

        {/* Financial Health Tab - Saúde Financeira */}
        {activeTab === 'FINANCIAL' && (
          <div className="space-y-6">
            {/* Loading State Skeleton */}
            {loadingAnalytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      {[...Array(3)].map((_, já) => <div key={já} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State / No Data */}
            {!loadingAnalytics && !analytics && (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <AlertCircle size={48} className="text-red-500" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Erro ao carregar dados</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Não foi possível carregar os dados financeiros. Verifique sua conexão e tente novamente.
                    </p>
                  </div>
                  <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
                </div>
              </Card>
            )}

            {/* Conteúdo com dados carregados */}
            {!loadingAnalytics && analytics && (
              <>
                {/* Período Selector */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setUseCustomRange(false);
                      setFinancialPeriod('TODAY');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === 'TODAY' && !useCustomRange
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    hoje
                  </button>
                  <button
                    onClick={() => {
                      setUseCustomRange(false);
                      setFinancialPeriod('WEEK');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === 'WEEK' && !useCustomRange
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    7 Dias
                  </button>
                  <button
                    onClick={() => setRollingRange(15)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange && customRange.startDate && customRange.endDate
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    15 Dias
                  </button>
                  <button
                    onClick={() => {
                      setUseCustomRange(false);
                      setFinancialPeriod('MONTH');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === 'MONTH' && !useCustomRange
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    30 Dias
                  </button>
                  <button
                    onClick={() => {
                      setUseCustomRange(false);
                      setFinancialPeriod('QUARTER');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === 'QUARTER' && !useCustomRange
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    90 Dias
                  </button>
                  <button
                    onClick={() => setUseCustomRange(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange
                      ? 'bg-tenant-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Personalizado
                  </button>
                </div>

                {useCustomRange && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Início</label>
                      <input
                        type="date"
                        value={customRange.startDate}
                        min={minRangeDate}
                        max={maxRangeDate}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Fim</label>
                      <input
                        type="date"
                        value={customRange.endDate}
                        min={minRangeDate}
                        max={maxRangeDate}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => setUseCustomRange(true)}
                        variant="primary"
                        className="w-full"
                        disabled={!customRange.startDate || !customRange.endDate}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status Geral - Indicador de Saúde */}
                {(financialPeriod === 'MONTH' || financialPeriod === 'QUARTER') && (
                  <Card className={`p-6 border-2 ${analytics.margin >= 30
                    ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-500'
                    : analytics.margin >= 15
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-500'
                      : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-500'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-2">
                          Saúde Financeira: {
                            analytics.margin >= 30 ? 'Excelente' :
                              analytics.margin >= 15 ? 'Atenção' :
                                'Crítico'
                          }
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Margem de lucro: <span className="font-black">{analytics.margin.toFixed(1)}%</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setShowFinancialValues(!showFinancialValues)}
                        className="p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={showFinancialValues ? 'Ocultar valores' : 'Mostrar valores'}
                      >
                        {showFinancialValues ? <Eye size={24} /> : <EyeOff size={24} />}
                      </button>
                    </div>
                  </Card>
                )}

                {/* Métricas Principais - 4 Cards */}
                <Grid cols={4} gap="lg" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Faturamento Bruto */}
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-start mb-3">
                      <TrendingUp size={28} className="opacity-70" />
                      <span className="text-xs font-bold opacity-80 uppercase">Receita</span>
                    </div>
                    <p className="text-3xl font-black mb-1">
                      R$ {showFinancialValues ? analytics.gross.toFixed(2) : ''}
                    </p>
                    <p className="text-xs opacity-80 font-bold">Faturamento Bruto</p>
                  </Card>

                  {/* Lucro Líquido */}
                  <Card className={`p-6 text-white ${analytics.isLoss
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                    <div className="flex justify-between items-start mb-3">
                      <DollarSign size={28} className="opacity-70" />
                      <span className="text-xs font-bold opacity-80 uppercase">Lucro</span>
                    </div>
                    <p className="text-3xl font-black mb-1">
                      R$ {showFinancialValues ? analytics.net.toFixed(2) : ''}
                    </p>
                    <p className="text-xs opacity-80 font-bold">Resultado Final</p>
                  </Card>

                  {/* Ticket Médio */}
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start mb-3">
                      <BarChart3 size={28} className="opacity-70" />
                      <span className="text-xs font-bold opacity-80 uppercase">Média</span>
                    </div>
                    <p className="text-3xl font-black mb-1">
                      R$ {showFinancialValues ? analytics.avgTicket.toFixed(2) : ''}
                    </p>
                    <p className="text-xs opacity-80 font-bold">Ticket Médio</p>
                  </Card>

                  {/* Margem de Lucro */}
                  <Card className="bg-gradient-to-br from-tenant-primary to-tenant-primary text-white p-6">
                    <div className="flex justify-between items-start mb-3">
                      <PieChart size={28} className="opacity-70" />
                      <span className="text-xs font-bold opacity-80 uppercase">Margem</span>
                    </div>
                    <p className="text-3xl font-black mb-1">
                      {showFinancialValues ? analytics.margin.toFixed(1) : ''}<span className="text-2xl">%</span>
                    </p>
                    <p className="text-xs opacity-80 font-bold">Lucro / Receita</p>
                  </Card>
                </Grid>

                {/* BI Insight Row Taxas e Insumos (novos campos do backend) */}
                {(analytics.cardFees > 0 || analytics.supplyCostsTotal > 0) && (
                  <Grid cols={3} gap="lg" className="grid-cols-1 sm:grid-cols-3">
                    {analytics.cardFees > 0 && (
                      <Card className="p-5 border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Taxas de Cartão</p>
                        <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                          R$ {showFinancialValues ? analytics.cardFees.toFixed(2) : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Crédito 4% Débito 2%</p>
                      </Card>
                    )}
                    {analytics.supplyCostsTotal > 0 && (
                      <Card className="p-5 border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Custo de Insumos</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          R$ {showFinancialValues ? analytics.supplyCostsTotal.toFixed(2) : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">supplyCost por serviço  execues</p>
                      </Card>
                    )}
                    <Card className="p-5 border-l-4 border-teal-500 bg-teal-50 dark:bg-teal-900/10">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-1">Taxa de Ocupação</p>
                      <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                        {analytics.totalAppointments > 0
                          ? `${Math.min(100, Math.round((analytics.totalAppointments / Math.max(analytics.totalAppointments, 1)) * 100))}%`
                          : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{analytics.totalAppointments} atendimentos não período</p>
                    </Card>
                  </Grid>
                )}

                <div>
                  <h3 className="text-lg font-black uppercase text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500" />
                    Receitas por Fonte
                  </h3>
                  <Grid cols={3} gap="lg" className="grid-cols-1 sm:grid-cols-3">
                    {/* serviços */}
                    <Card
                      className="p-5 border-l-4 border-purple-500 bg-white dark:bg-gray-800 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => setShowRevenueDetail(true)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <Scissors size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">serviços</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? analytics.serviceRev.toFixed(2) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {analytics.gross > 0 ? ((analytics.serviceRev / analytics.gross) * 100).toFixed(0) : 0}% do total
                        </span>
                        <ChevronDown size={14} className="text-gray-400" />
                      </div>
                    </Card>

                    {/* Produtos */}
                    <Card className="p-5 border-l-4 border-orange-500 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                          <ShoppingBag size={24} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Produtos</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? analytics.productRev.toFixed(2) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {analytics.gross > 0 ? ((analytics.productRev / analytics.gross) * 100).toFixed(0) : 0}% do total
                        </span>
                      </div>
                    </Card>

                    {/* Planos */}
                    <Card className="p-5 border-l-4 border-blue-500 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                          <Layers size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Planos</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? analytics.planRev.toFixed(2) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {analytics.gross > 0 ? ((analytics.planRev / analytics.gross) * 100).toFixed(0) : 0}% do total
                        </span>
                      </div>
                    </Card>
                  </Grid>
                </div>

                {/* Despesas e Comissões  */}
                <Grid cols={2} gap="lg" className="grid-cols-1 lg:grid-cols-2">
                  {/* Despesas */}
                  <Card onClick={() => setShowExpenseDetail(true)} className="cursor-pointer hover:shadow-lg transition-all">
                    <Card.Body className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                          <AlertCircle size={20} className="text-red-500" />
                          Despesas
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-black text-red-600 dark:text-red-400">
                            R$ {showFinancialValues ? analytics.expenses.toFixed(2) : ''}
                          </p>
                          <ChevronDown size={18} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Comissões</span>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? analytics.totalCommissions.toFixed(2) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Custos Fixos</span>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? analytics.fixedCostsTotal.toFixed(2) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Custo de Produtos</span>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            R$ {showFinancialValues ? (analytics.productRev * 0.3).toFixed(2) : ''}
                          </span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Top Profissionais */}
                  <Card onClick={() => setShowCommissionDetail(true)} className="cursor-pointer hover:shadow-lg transition-all">
                    <Card.Body className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                          <Users size={20} className="text-tenant-primary" />
                          Top Profissionais
                        </h3>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        {analytics.commissionsByBarber.slice(0, 5).map((barber, index) => (
                          <div key={barber.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white ${index === 0 ? 'bg-tenant-primary' :
                                index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                                }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{barber.name}</p>
                                <p className="text-xs text-gray-500">{barber.appointments} atendimentos - {barber.commissionRate}%</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-tenant-primary">
                                R$ {showFinancialValues ? barber.commission.toFixed(2) : ''}
                              </p>
                              <p className="text-xs text-gray-500">
                                Faturou R$ {showFinancialValues ? barber.revenue.toFixed(2) : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Grid>

                {/* KPIs Operacionais */}
                <Card>
                  <Card.Body className="space-y-4">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-500" />
                      KPIs Operacionais
                    </h3>
                    <Grid cols={4} gap="md" className="grid-cols-2 sm:grid-cols-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
                          {analytics.totalAppointments}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase">Atendimentos</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">
                          R$ {showFinancialValues ? analytics.avgTicket.toFixed(0) : ''}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase">Ticket Médio</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">
                          {analytics.commissionsByBarber.length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase">Profissionais</p>
                      </div>
                      <div className="text-center p-4 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-xl">
                        <p className="text-3xl font-black text-tenant-primary dark:text-tenant-primary mb-1">
                          {analytics.margin.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase">Margem</p>
                      </div>
                    </Grid>
                  </Card.Body>
                </Card>

                {/* Alertas Inteligentes - só exibe após 7+ dias de dados */}
                {(analytics.margin < 15 || analytics.isLoss || analytics.avgTicket < 50) &&
                  (financialPeriod === 'WEEK' || financialPeriod === 'MONTH' || financialPeriod === 'QUARTER' ||
                    (useCustomRange && customRange.startDate && customRange.endDate &&
                      Math.floor((new Date(customRange.endDate).getTime() - new Date(customRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) >= 7)
                  ) && (
                  <Card className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
                    <Card.Body className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                        <h3 className="font-black text-lg text-red-900 dark:text-red-100 uppercase">
                          Alertas de Gestão
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {analytics.isLoss && (
                          <Alert variant="error" className="text-sm">
                            <strong>Prejáuízo identificado:</strong> Suas despesas superam a receita. Revise custos fixos e comissões urgentemente.
                          </Alert>
                        )}
                        {analytics.margin < 15 && !analytics.isLoss && (
                          <Alert variant="warning" className="text-sm">
                            <strong>Margem baixa:</strong> Sua margem de lucro está abaixo de 15%. Considere ajustar preços ou reduzir custos.
                          </Alert>
                        )}
                        {analytics.avgTicket < 50 && (
                          <Alert variant="warning" className="text-sm">
                            <strong>Ticket médio baixo:</strong> Incentive venda de produtos e serviços adicionais para aumentar o valor médio.
                          </Alert>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Resumo Executivo */}
                <Card>
                  <Card.Body className="space-y-4">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                      <Landmark size={20} className="text-gray-500" />
                      Resumo Executivo (DRE Simplificado)
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Receita Bruta</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">
                          + R$ {showFinancialValues ? analytics.gross.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ serviços</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? analytics.serviceRev.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ Produtos</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? analytics.productRev.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ Planos</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? analytics.planRev.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-red-700 dark:text-red-400">(-) Despesas Totais</span>
                        <span className="font-black text-red-600 dark:text-red-400">
                          - R$ {showFinancialValues ? analytics.expenses.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ Comissões</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? analytics.totalCommissions.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ Custos Fixos</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? analytics.fixedCostsTotal.toFixed(2) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 pl-4">+ Custo Produtos</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {showFinancialValues ? (analytics.productRev * 0.3).toFixed(2) : ''}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between py-3 mt-2 rounded-lg px-3 ${analytics.isLoss
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                        <span className="font-black text-lg text-gray-900 dark:text-white">LUCRO LÍQUIDO</span>
                        <span className={`font-black text-2xl ${analytics.isLoss
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                          }`}>
                          R$ {showFinancialValues ? analytics.net.toFixed(2) : ''}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Sessão Custos Fixos / Despesas */}
            <Card className="mt-4">
              <Card.Body className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Custos Fixos & Despesas</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Gerencie aluguel, contas e outras despesas recorrentes</p>
                  </div>
                  <Button size="md" variant="primary" icon={<Plus size={18} />} onClick={() => handleOpenExpenseModal()} className="flex-shrink-0">
                    <span className="hidden sm:inline">Nova Despesa</span>
                  </Button>
                </div>

                {loadingExpenses ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-tenant-primary border-t-transparent"></div>
                    <p className="mt-3 text-gray-500 text-sm">Carregando despesas...</p>
                  </div>
                ) : fixedCosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhuma despesa cadastrada.</p>
                    <p className="text-xs mt-1">Clique em "Nova Despesa" para começar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Descrição</th>
                          <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Tipo</th>
                          <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Valor</th>
                          <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Recorrente</th>
                          <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Status</th>
                          <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedCosts.map(expense => (
                          <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">{expense.description}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                                {EXPENSE_TYPE_LABELS[expense.type] || expense.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white">
                              R$ {expense.amount.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {expense.isRecurring ? (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">Sim</span>
                              ) : (
                                <span className="text-gray-400 text-xs">Não</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {expense.isPaid ? (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-bold">Paga</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs font-bold">Pendente</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-center gap-1">
                                {!expense.isPaid && (
                                  <button onClick={() => handleMarkExpensePaid(expense.id)} title="Marcar como paga"
                                    className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors">
                                    <Check size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleOpenExpenseModal(expense)} title="Editar"
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors">
                                  <Edit3 size={14} />
                                </button>
                                <button onClick={() => handleDeleteExpense(expense.id)} title="Excluir"
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                          <td colSpan={2} className="py-2.5 px-3 font-black text-gray-900 dark:text-white">Total</td>
                          <td className="py-2.5 px-3 text-right font-black text-red-600 dark:text-red-400">
                            R$ {fixedCosts.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )
        }

        {/* Cashier Tab */}
        {activeTab === 'CASHIER' && <Cashier />}

        {/* Team Tab - Gerenciamento de Equipe */}
        {
          activeTab === 'BARBERS' && (
            <Card>
              <Card.Body className="space-y-4">
                <div className="flex justify-between items-center mb-4 gap-2">
                  <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Time de Profissionais</h3>
                  <Button
                    size="md"
                    variant="primary"
                    icon={<Plus size={20} />}
                    onClick={() => handleOpenTeamModal()}
                    className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
                    aria-label="Adicionar Colaborador"
                  >
                    <span className="hidden sm:inline">Adicionar Colaborador</span>
                  </Button>
                </div>

                {loadingTeam ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando equipe...</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum colaborador cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map(member => (
                      <Card key={member.id} className={`relative transition-all ${!member.active ? 'opacity-60' : ''}`}>
                        {/* Badge de status */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.active
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {member.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <Card.Body className="p-4">
                          <div className="flex items-start gap-4 mb-4">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-tenant-primary"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-tenant-primary/10 dark:bg-tenant-primary/20 flex items-center justify-center">
                                <Users size={32} className="text-tenant-primary dark:text-tenant-primary" />
                              </div>
                            )}

                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{member.name}</h4>
                              <p className="text-sm font-medium text-tenant-primary dark:text-tenant-primary">
                                {TEAM_ROLE_LABELS[member.role]}
                              </p>
                              {member.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                              )}
                              {member.phone && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</p>
                              )}
                            </div>
                          </div>

                          {member.specialties && member.specialties.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Especialidades:</p>
                              <div className="flex flex-wrap gap-1">
                                {member.specialties.map((spec, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {member.commissionRate !== undefined && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <strong>Comissão:</strong> {member.commissionRate}%
                            </p>
                          )}

                          {/* Ações */}
                          <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={() => handleOpenTeamModal(member)}
                              className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                              <span className="text-xs font-bold">Editar</span>
                            </button>

                            <button
                              onClick={() => handleToggleTeamMemberActive(member.id)}
                              className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${member.active
                                ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 text-orange-600 dark:text-orange-400'
                                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 dark:text-green-400'
                                }`}
                              title={member.active ? 'Desativar' : 'Ativar'}
                            >
                              <Power size={14} />
                              <span className="text-xs font-bold">{member.active ? 'Desativar' : 'Ativar'}</span>
                            </button>

                            <button
                              onClick={() => handleOpenLockAgendaModal(member)}
                              disabled={!member.active}
                              className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed text-purple-600 dark:text-purple-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                              title={member.active ? 'Trancar Agenda' : 'Ative para trancar agenda'}
                            >
                              <Lock size={14} />
                              <span className="text-xs font-bold hidden sm:inline">Trancar</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTeamMember(member.id, member.name)}
                              className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center justify-center"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          )
        }

        {/* Services Tab */}
        {
          activeTab === 'SERVICES' && (
            <Card>
              <Card.Body className="space-y-4">
                <div className="flex justify-between items-center mb-4 gap-2">
                  <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Catálogo de serviços</h3>
                  <Button
                    size="md"
                    variant="primary"
                    icon={<Plus size={20} />}
                    onClick={() => handleOpenServiceModal()}
                    className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
                    aria-label="Novo serviço"
                  >
                    <span className="hidden sm:inline">Novo serviço</span>
                  </Button>
                </div>

                {loadingServices ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando serviços...</p>
                  </div>
                ) : unitServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Scissors size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum serviço cadastrado.</p>
                  </div>
                ) : (
                  <Grid cols={3} gap="lg">
                    {unitServices.map(service => (
                      <Card key={service.id} className="relative overflow-hidden transition-all">
                        {/* Badge de Status - Sempre colorido (não afetado por grayscale) */}
                        <div className="absolute top-2 right-2 z-10">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${service.active
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {service.active ? <Eye size={12} /> : <EyeOff size={12} />}
                            <span className="hidden sm:inline">{service.active ? 'Ativo' : 'Inativo'}</span>
                          </span>
                        </div>

                        {/* Imagem - fica em grayscale quando inativo */}
                        <div className={`h-32 bg-gray-100 dark:bg-gray-800 ${!service.active ? 'grayscale' : ''}`}>
                          <img
                            src={service.image || fallbackImage}
                            alt={service.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = fallbackImage;
                            }}
                          />
                        </div>

                        <Card.Body className="space-y-2 p-4">
                          {/* Informações do serviço - fica em grayscale quando inativo */}
                          <div className={!service.active ? 'grayscale opacity-60' : ''}>
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{service.name}</h4>
                            <p className="text-2xl font-black text-tenant-primary">R$ {service.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{service.duration}min</p>
                          </div>

                          {/* Botões */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            {/* Botão Editar - SEMPRE ativo e colorido */}
                            <button
                              onClick={() => handleOpenServiceModal(service)}
                              className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 active:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                              title="Editar serviço"
                            >
                              <Edit3 size={14} />
                              <span className="text-xs font-bold">Editar</span>
                            </button>

                            {/* Botão Ativar/Desativar - SEMPRE colorido */}
                            <button
                              onClick={() => toggleActive(service.id, 'SERVICE')}
                              className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${service.active
                                ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 active:bg-orange-200 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 active:bg-green-200 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                                }`}
                              title={service.active ? 'Desativar serviço (ocultar das vendas)' : 'Ativar serviço'}
                            >
                              <Power size={14} />
                              <span className="text-xs font-bold">{service.active ? 'Desativar' : 'Ativar'}</span>
                            </button>

                            {/* Botão Excluir - DESABILITADO quando inativo */}
                            <button
                              onClick={() => deleteItem(service.id, 'SERVICE')}
                              disabled={!service.active}
                              className={`flex-1 p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${!service.active ? 'grayscale opacity-40 cursor-not-allowed' : ''}`}
                              title={service.active ? 'Excluir permanentemente' : 'Ative o serviço para poder excluir'}
                            >
                              <Trash2 size={14} />
                              <span className="text-xs font-bold">Excluir</span>
                            </button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Card.Body>
            </Card>
          )
        }

        {/* Products Tab */}
        {
          activeTab === 'PRODUCTS' && (
            <Card>
              <Card.Body className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => setProductSubView('PRODUCTS')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${productSubView === 'PRODUCTS' ? 'bg-white dark:bg-gray-700 text-tenant-primary shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Produtos
                    </button>
                    <button
                      onClick={() => setProductSubView('STOCK')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${productSubView === 'STOCK' ? 'bg-white dark:bg-gray-700 text-tenant-primary shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Controle de Estoque
                    </button>
                  </div>
                  {productSubView === 'PRODUCTS' && (
                    <Button
                      size="md"
                      variant="primary"
                      icon={<Plus size={20} />}
                      onClick={() => handleOpenProductModal()}
                      className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
                      aria-label="Novo Produto"
                    >
                      <span className="hidden sm:inline">Novo Produto</span>
                    </Button>
                  )}
                </div>

                {/* Sub-view: Estoque */}
                {productSubView === 'STOCK' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Visualize e edite rapidamente o estoque de todos os produtos.</p>
                    {loadingProducts ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-tenant-primary border-t-transparent"></div>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhum produto cadastrado.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Produto</th>
                              <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Categoria</th>
                              <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Preço Venda</th>
                              <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Custo Unit.</th>
                              <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Estoque</th>
                              <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Ajuste</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(product => (
                              <tr key={product.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!product.active ? 'opacity-50' : ''}`}>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <img src={product.image || fallbackImage} alt={product.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={e => { e.currentTarget.src = fallbackImage; }} />
                                    <span className="font-medium text-gray-900 dark:text-white text-xs line-clamp-2">{product.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">{product.category || ''}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white font-medium text-xs">
                                  R$ {product.price.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                                  {product.costPrice ? `R$ ${product.costPrice.toFixed(2)}` : ''}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock === 0
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : product.stock <= 5
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}>
                                    {product.stock}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => {
                                        const novoEstoque = Math.max(0, product.stock - 1);
                                        productService.update(product.id, { stock: novoEstoque })
                                          .then(() => productService.list(currentShop.id, true))
                                          .then(data => setProducts(data))
                                          .catch(() => addNotification('error', 'Erro ao atualizar estoque'));
                                      }}
                                      disabled={product.stock === 0}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-base"
                                      title="Remover 1 unidade"
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={() => {
                                        const novoEstoque = product.stock + 1;
                                        productService.update(product.id, { stock: novoEstoque })
                                          .then(() => productService.list(currentShop.id, true))
                                          .then(data => setProducts(data))
                                          .catch(() => addNotification('error', 'Erro ao atualizar estoque'));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500 hover:bg-green-100 transition-colors font-bold text-base"
                                      title="Adicionar 1 unidade"
                                    >
                                      +
                                    </button>
                                    <button onClick={() => handleOpenProductModal(product)} title="Editar produto"
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 transition-colors">
                                      <Edit3 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                              <td colSpan={4} className="py-2.5 px-3 font-black text-gray-900 dark:text-white text-sm">Total em estoque</td>
                              <td className="py-2.5 px-3 text-center font-black text-tenant-primary dark:text-tenant-primary">
                                {products.reduce((sum, p) => sum + p.stock, 0)} unid.
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                        {products.some(p => p.stock === 0) && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium">
                            <AlertCircle size={14} />
                            {products.filter(p => p.stock === 0).length} produto(s) sem estoque.
                          </div>
                        )}
                        {products.filter(p => p.stock > 0 && p.stock <= 5).length > 0 && (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                            <AlertCircle size={14} />
                            {products.filter(p => p.stock > 0 && p.stock <= 5).length} produto(s) com estoque baixo (= 5 unidades).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view: Produtos */}
                {productSubView === 'PRODUCTS' && (
                  <>
                    {loadingProducts ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando produtos...</p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Nenhum produto cadastrado.</p>
                      </div>
                    ) : (
                      <Grid cols={1} md={2} lg={3} gap="md">
                        {products.map(product => (
                          <Card key={product.id} className="relative overflow-hidden transition-all">
                            {/* Badge de Status - Sempre colorido (não afetado por grayscale) */}
                            <div className="absolute top-1.5 right-1.5 z-10">
                              <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1 shadow-lg ${product.active
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}>
                                {product.active ? <Eye size={10} className="sm:w-3 sm:h-3" /> : <EyeOff size={10} className="sm:w-3 sm:h-3" />}
                                <span className="hidden sm:inline">{product.active ? 'Ativo' : 'Inativo'}</span>
                              </span>
                            </div>

                            {/* Imagem - fica em grayscale quando inativo */}
                            <div className={`h-32 sm:h-40 bg-gray-100 dark:bg-gray-800 ${!product.active ? 'grayscale' : ''}`}>
                              <img
                                src={product.image || fallbackImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = fallbackImage;
                                }}
                              />
                            </div>

                            <Card.Body className="space-y-2 p-3 sm:p-4">
                              {/* Informações do produto - fica em grayscale quando inativo */}
                              <div className={!product.active ? 'grayscale opacity-60' : ''}>
                                <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2">{product.name}</h4>
                                <p className="text-base sm:text-lg font-black text-tenant-primary">R$ {product.price.toFixed(2)}</p>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className="text-gray-500">Estoque: {product.stock}</span>
                                  {product.stock === 0 && (
                                    <span className="text-red-500 font-bold text-[9px] sm:text-xs">SEM ESTOQUE</span>
                                  )}
                                </div>
                              </div>

                              {/* Botões */}
                              <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                                {/* Botão Editar - SEMPRE ativo e colorido */}
                                <button
                                  onClick={() => handleOpenProductModal(product)}
                                  className="w-full sm:flex-1 p-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 active:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                                  title="Editar produto"
                                >
                                  <Edit3 size={16} />
                                  <span className="text-xs font-bold">Editar</span>
                                </button>

                                {/* Botão Ativar/Desativar - SEMPRE colorido */}
                                <button
                                  onClick={() => toggleActive(product.id, 'PRODUCT')}
                                  className={`w-full sm:flex-1 p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${product.active
                                    ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 active:bg-orange-200 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                    : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 active:bg-green-200 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}
                                  title={product.active ? 'Desativar produto (ocultar das vendas)' : 'Ativar produto'}
                                >
                                  <Power size={16} />
                                  <span className="text-xs font-bold">{product.active ? 'Desativar' : 'Ativar'}</span>
                                </button>

                                {/* Botão Excluir - DESABILITADO quando inativo */}
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={!product.active}
                                  className={`w-full sm:flex-1 p-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${!product.active ? 'grayscale opacity-40 cursor-not-allowed' : ''}`}
                                  title={product.active ? 'Excluir permanentemente' : 'Ative o produto para poder excluir'}
                                >
                                  <Trash2 size={16} />
                                  <span className="text-xs font-bold">Excluir</span>
                                </button>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </Grid>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          )
        }

        {/* Plans Tab - Planos de Assinatura */}
        {
          activeTab === 'PLANS' && (
            <Card>
              <Card.Body className="space-y-4">
                <div className="flex justify-between items-center mb-4 gap-2">
                  <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Planos de Assinatura</h3>
                  <Button
                    size="md"
                    variant="primary"
                    icon={<Plus size={20} />}
                    onClick={() => handleOpenPlanModal()}
                    className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
                    aria-label="Novo Plano"
                  >
                    <span className="hidden sm:inline">Novo Plano</span>
                  </Button>
                </div>

                {loadingPlans ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando planos...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum plano cadastrado.</p>
                  </div>
                ) : (
                  <Grid cols={3} gap="lg">
                    {plans.map(plan => (
                      <Card key={plan.id} className={`border-2 border-tenant-primary hover:shadow-xl transition-shadow ${!plan.active ? 'opacity-60 grayscale' : ''}`}>
                        {/* Badge de Status */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${plan.active
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {plan.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <Card.Body className="space-y-4">
                          <div>
                            <h4 className="font-black text-xl text-tenant-primary dark:text-tenant-primary uppercase">{plan.name}</h4>
                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                              R$ {plan.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Validade: {plan.benefitMonths} ms(es)
                            </p>
                          </div>

                          {/* Benefícios */}
                          <div className="space-y-2 py-3 border-y border-gray-200 dark:border-gray-700">
                            {plan.benefitServices > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Check size={16} className="text-green-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {plan.benefitServices} serviços inclusos
                                </span>
                              </div>
                            )}
                            {plan.benefitProducts > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Check size={16} className="text-green-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {plan.benefitProducts} produtos inclusos
                                </span>
                              </div>
                            )}
                            {plan.benefitMoneyback > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Check size={16} className="text-green-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {plan.benefitMoneyback}% de cashback
                                </span>
                              </div>
                            )}
                            {plan.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                {plan.description}
                              </p>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenPlanModal(plan)}
                              className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleTogglePlanActive(plan.id)}
                              className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${plan.active
                                ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 text-orange-600 dark:text-orange-400'
                                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 dark:text-green-400'
                                }`}
                            >
                              {plan.active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id, plan.name)}
                              disabled={plan.active}
                              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-colors"
                              title={plan.active ? 'Desative o plano antes de excluir' : 'Excluir plano'}
                            >
                              Excluir
                            </button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Card.Body>
            </Card>
          )
        }

        {/* Settings Tab - Configurações de Módulos */}
        {
          activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              {/* Informações do Plano da Barbearia */}
              {currentShop.subscription && (
                <Card className="border-l-4 border-tenant-primary">
                  <Card.Body className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase flex items-center gap-2">
                          <Zap size={24} className="text-tenant-primary" />
                          Plano Atual da Barbearia
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Gerencie os recursos disponíveis para sua barbearia
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-tenant-primary/5 to-tenant-primary/5 dark:from-tenant-primary/10 dark:to-tenant-primary/10 rounded-xl p-4 border-2 border-tenant-primary/30 dark:border-tenant-primary/50">
                        <p className="text-xs font-bold text-tenant-primary dark:text-tenant-primary/80 uppercase mb-1">Plano Contratado</p>
                        <p className="text-2xl font-black text-tenant-primary dark:text-tenant-primary">
                          {currentShop.subscription.tier === 'SIMPLE' && 'Simples'}
                          {currentShop.subscription.tier === 'PLUS' && 'Plus'}
                          {currentShop.subscription.tier === 'PREMIUM' && 'Premium'}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">Válido até</p>
                        <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                          {new Date(currentShop.subscription.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className={`rounded-xl p-4 ${currentShop.subscription.status === 'ACTIVE'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                        }`}>
                        <p className="text-xs font-bold uppercase mb-1 ${
                        currentShop.subscription.status === 'ACTIVE' 
                          ? 'text-green-900 dark:text-green-300' 
                          : 'text-red-900 dark:text-red-300'
                      }">Status</p>
                        <p className={`text-lg font-black ${currentShop.subscription.status === 'ACTIVE'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                          }`}>
                          {currentShop.subscription.status === 'ACTIVE' && 'Ativo'}
                          {currentShop.subscription.status === 'EXPIRED' && 'Expirado'}
                          {currentShop.subscription.status === 'SUSPENDED' && 'Suspenso'}
                        </p>
                      </div>
                    </div>

                    {/* Recursos do Plano */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">Recursos Inclusos:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentShop.subscription.features.hasAppointments && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Sistema de Agendamentos</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasCashier && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Fechamento de Caixa</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasFinancialDashboard && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Dashboard Financeiro</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasCommissionReports && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Relatórios de Comissão</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasProducts && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Gestão de Produtos</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasInventory && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Controle de Estoque</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasAdvancedReports && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Relatórios Avançados</span>
                          </div>
                        )}
                        {currentShop.subscription.features.hasAIAnalysis && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-500" />
                            <span>Análise com IA</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Check size={16} className="text-green-500" />
                          <span>Até {currentShop.subscription.features.maxTeamMembers === 999 ? 'Ilimitados' : currentShop.subscription.features.maxTeamMembers} Funcionários</span>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Controle de Módulos */}
              <Card>
                <Card.Body className="space-y-6">
                  <div>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase">
                      Módulos do Sistema
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Ative ou desative funcionalidades de acordo com suas necessidades
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Módulo de Planos de Clientes */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers size={20} className="text-tenant-primary" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Planos para Clientes</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permite criar e vender planos de assinatura para seus clientes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.clientPlans !== false}
                          onChange={(e) => handleModuleToggle('clientPlans', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tenant-primary dark:peer-focus:ring-tenant-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-tenant-primary"></div>
                      </label>
                    </div>

                    {/* Módulo de Produtos e Estoque */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag size={20} className="text-blue-500" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Produtos e Estoque</h4>
                          {!currentShop.subscription?.features.hasProducts && (
                            <span className="px-2 py-0.5 bg-tenant-primary/10 dark:bg-tenant-primary/15 text-tenant-primary dark:text-tenant-primary/80 text-xs font-bold rounded-full">
                              Requer upgrade
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Gestão completa de produtos com controle de estoque
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.products !== false}
                          disabled={!currentShop.subscription?.features.hasProducts}
                          onChange={(e) => handleModuleToggle('products', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                      </label>
                    </div>

                    {/* Módulo de Avaliações */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={20} className="text-tenant-primary" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Avaliações</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Exibe avaliações de clientes na página inicial
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.reviews !== false}
                          onChange={(e) => handleModuleToggle('reviews', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tenant-primary dark:peer-focus:ring-tenant-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-tenant-primary"></div>
                      </label>
                    </div>

                    {/* Módulo de Caixa */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calculator size={20} className="text-green-500" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Caixa</h4>
                          {!isSuperAdmin && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                              Somente Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sistema de fechamento e controle de caixa
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.cashier !== false}
                          disabled={!isSuperAdmin}
                          onChange={(e) => handleModuleToggle('cashier', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                      </label>
                    </div>

                    {/* Módulo Financeiro */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign size={20} className="text-purple-500" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Dashboard Financeiro</h4>
                          {!currentShop.subscription?.features.hasFinancialDashboard && (
                            <span className="px-2 py-0.5 bg-tenant-primary/10 dark:bg-tenant-primary/15 text-tenant-primary dark:text-tenant-primary/80 text-xs font-bold rounded-full">
                              Requer upgrade
                            </span>
                          )}
                          {!isSuperAdmin && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                              Somente Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Análises financeiras completas e saúde do negócio
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.financial !== false}
                          disabled={!currentShop.subscription?.features.hasFinancialDashboard || !isSuperAdmin}
                          onChange={(e) => handleModuleToggle('financial', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                      </label>
                    </div>

                    {/* Módulo de Relatórios */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 size={20} className="text-indigo-500" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Relatórios Avançados</h4>
                          {!currentShop.subscription?.features.hasAdvancedReports && (
                            <span className="px-2 py-0.5 bg-tenant-primary/10 dark:bg-tenant-primary/15 text-tenant-primary dark:text-tenant-primary/80 text-xs font-bold rounded-full">
                              Requer upgrade
                            </span>
                          )}
                          {!isSuperAdmin && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                              Somente Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Relatórios detalhados de vendas, estoque e comissões
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentShop.settings.modulesEnabled?.reports !== false}
                          disabled={!currentShop.subscription?.features.hasAdvancedReports || !isSuperAdmin}
                          onChange={(e) => handleModuleToggle('reports', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                  </div>

                  {/* Aviso */}
                  <Alert variant="info" className="text-sm">
                    <strong>Nota:</strong> Algumas funcionalidades podem estar limitadas de acordo com o plano contratado.
                    Entre em contato com o suporte para fazer upgrade do seu plano.
                  </Alert>
                </Card.Body>
              </Card>

              {/* Aparência (White Label) */}
              <Card>
                <Card.Body className="space-y-6">
                  <div>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                      <ImageIcon size={20} className="text-tenant-primary" />
                      Aparência (White Label)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Personalize as cores da barbearia para seus clientes e colaboradores.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">Cor Primária</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cor principal usada em botões, links e destaques no aplicativo.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={wlPrimaryColor}
                          onChange={(e) => setWlPrimaryColor(e.target.value)}
                          className="h-10 w-20 cursor-pointer rounded bg-transparent border-0 p-0"
                          title="Escolher Cor Primária"
                        />
                        <Button
                          onClick={handleSaveWhiteLabel}
                          disabled={isSavingWl || wlPrimaryColor === (currentShop.primaryColor || '#f59e0b')}
                          variant="primary"
                        >
                          {isSavingWl ? 'Salvando...' : 'Salvar Aparência'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )
        }

        {/* Share Link Modal */}
        <ShareLink isOpen={showShareLink} onClose={() => setShowShareLink(false)} />

        {/* Shop Selector Modal */}
        {
          showShopSelector && (
            <ShopSelector onClose={() => setShowShopSelector(false)} />
          )
        }

        {/* Team Member Modal - CRUD */}
        {
          showTeamModal && (
            <Modal
              isOpen={showTeamModal}
              onClose={() => setShowTeamModal(false)}
              size="lg"
              title={editTeamMember ? 'Editar Colaborador' : 'Novo Colaborador'}
            >
              <div className="flex flex-col gap-5 pb-2">
                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>

                  {/* Função/Cargo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Função/Cargo *
                    </label>
                    <Select
                      value={teamForm.role}
                      onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value as TeamMemberRole })}
                    >
                      {Object.entries(TEAM_ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Email e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        E-mail
                      </label>
                      <Input
                        type="email"
                        value={teamForm.email || ''}
                        onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                        placeholder="joao@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Telefone
                      </label>
                      <Input
                        type="tel"
                        value={teamForm.phone || ''}
                        onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  {/* Especialidades (para funções relevantes) */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Especialidades
                        </label>
                        <Input
                          value={teamForm.specialties?.join(', ') || ''}
                          onChange={(e) => setTeamForm({
                            ...teamForm,
                            specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="Corte, Barba, Coloração"
                        />
                        <p className="text-xs text-gray-500 mt-1">Separe por vírgula</p>
                      </div>
                    )}

                  {/* Comisssão (para funções relevantes) */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Taxa de Comissão (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={teamForm.commissionRate || 50}
                          onChange={(e) => setTeamForm({ ...teamForm, commissionRate: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}

                  {/* Modelo de Trabalho */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Modelo de Trabalho *
                        </label>
                        <Select
                          value={teamForm.workModel}
                          onChange={(e) => setTeamForm({ ...teamForm, workModel: e.target.value as BarberWorkModel })}
                        >
                          {Object.entries(WORK_MODEL_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </Select>
                      </div>
                    )}

                  {/* Salário Mensal (se aplicável) */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) &&
                    (teamForm.workModel === BarberWorkModel.SALARY ||
                      teamForm.workModel === BarberWorkModel.SALARY_COMMISSION) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Salário Mensal (R$)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={teamForm.monthlySalary || 0}
                          onChange={(e) => setTeamForm({ ...teamForm, monthlySalary: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}

                  {/* Taxa de Aluguel da Cadeira */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) &&
                    teamForm.workModel === BarberWorkModel.CHAIR_RENT && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Taxa de Aluguel (R$/mês)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={teamForm.chairRentalFee || 0}
                          onChange={(e) => setTeamForm({ ...teamForm, chairRentalFee: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}

                  {/* Data de Nascimento e Data de Contratação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Data de Nascimento
                      </label>
                      <Input
                        type="date"
                        value={teamForm.birthDate || ''}
                        onChange={(e) => setTeamForm({ ...teamForm, birthDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Data de Contratação
                      </label>
                      <Input
                        type="date"
                        value={teamForm.hireDate || ''}
                        onChange={(e) => setTeamForm({ ...teamForm, hireDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Anãos de Experincia */}
                  {(teamForm.role === TeamMemberRole.BARBER ||
                    teamForm.role === TeamMemberRole.HAIRDRESSER ||
                    teamForm.role === TeamMemberRole.MANICURIST) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Anãos de Experincia
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={teamForm.experienceYears || 0}
                          onChange={(e) => setTeamForm({ ...teamForm, experienceYears: parseInt(e.target.value) })}
                        />
                      </div>
                    )}

                  {/* URL Avatar */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      URL da Foto
                    </label>
                    <Input
                      type="url"
                      value={teamForm.avatar || ''}
                      onChange={(e) => setTeamForm({ ...teamForm, avatar: e.target.value })}
                      placeholder="https://exemplo.com/foto.jápg"
                    />
                  </div>

                  {/* Descrição/Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Descrição/Bio
                    </label>
                    <textarea
                      value={teamForm.description || ''}
                      onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                      placeholder="Breve Descrição sobre o profissional..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary resize-nãone"
                    />
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="w-full sm:flex-1 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveTeamMember}
                    className="w-full sm:flex-1 px-6 py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-tenant-primary/30 transition-all"
                  >
                    {editTeamMember ? 'Salvar Alterações' : 'Adicionar Colaborador'}
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Lock Agenda Modal */}
        {showLockAgendaModal && selectedTeamMember && (
          <AgendaLockModal
            memberId={selectedTeamMember.id}
            selectedDate={new Date()}
            shop={currentShop}
            onClose={() => setShowLockAgendaModal(false)}
            onCheckConflicts={(data) => teamService.checkConflicts(data)}
            onConfirm={async (data) => {
              try {
                await teamService.createLock({
                  teamMemberId: selectedTeamMember.id,
                  ...data
                });
                setShowLockAgendaModal(false);
                addNotification('success', 'Agenda bloqueada com sucesso!');
                if (data.forceOverride) {
                  addNotification('info', 'Clientes afetados foram notificados');
                }
              } catch (error: any) {
                console.error('Erro ao bloquear agenda:', error);
                const errorMessage = error.response?.data?.message || 'Erro ao bloquear agenda';
                addNotification('error', errorMessage);
              }
            }}
          />
        )}

        {/* Plan Modal - CRUD de Planos */}
        {
          showPlanModal && (
            <Modal
              isOpen={showPlanModal}
              onClose={() => setShowPlanModal(false)}
              size="lg"
              title={editPlan ? 'Editar Plano' : 'Novo Plano de Assinatura'}
            >
              <div className="flex flex-col gap-5 pb-2">
                <div className="space-y-4">
                  {/* Nome do Plano */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Plano *
                    </label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Ex: Plano Mensal Premium"
                    />
                  </div>

                  {/* Preço e Validade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Preço (R$) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Validade (meses) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={planForm.benefitMonths}
                        onChange={(e) => setPlanForm({ ...planForm, benefitMonths: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-lg p-4 space-y-3">
                    <h4 className="font-bold text-tenant-primary dark:text-tenant-primary/80 flex items-center gap-2">
                      <Tag size={16} />
                      Benefícios do Plano
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          Serviços Inclusos
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={planForm.benefitServices}
                          onChange={(e) => setPlanForm({ ...planForm, benefitServices: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          Produtos Inclusos
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={planForm.benefitProducts}
                          onChange={(e) => setPlanForm({ ...planForm, benefitProducts: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          Cashback (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={planForm.benefitMoneyback}
                          onChange={(e) => setPlanForm({ ...planForm, benefitMoneyback: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Descreva os benefícios e detalhes do plano..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary resize-nãone"
                    />
                  </div>

                  {/* Preview do Plano */}
                  {planForm.price > 0 && (
                    <div className="bg-gradient-to-br from-tenant-primary/5 to-tenant-primary/5 dark:from-tenant-primary/10 dark:to-tenant-primary/10 rounded-lg p-4 border-2 border-tenant-primary/30 dark:border-tenant-primary/50">
                      <p className="text-xs font-bold text-tenant-primary dark:text-tenant-primary/80 mb-2">Preview:</p>
                      <div className="space-y-1">
                        <p className="font-black text-xl text-tenant-primary dark:text-tenant-primary">{planForm.name || 'Nome do Plano'}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">R$ {planForm.price.toFixed(2)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {planForm.benefitServices > 0 && (
                            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-bold">
                              ? {planForm.benefitServices} serviços
                            </span>
                          )}
                          {planForm.benefitProducts > 0 && (
                            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-bold">
                              ? {planForm.benefitProducts} produtos
                            </span>
                          )}
                          {planForm.benefitMoneyback > 0 && (
                            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-bold">
                              ? {planForm.benefitMoneyback}% cashback
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="w-full sm:flex-1 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePlan}
                    className="w-full sm:flex-1 px-6 py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-tenant-primary/30 transition-all"
                  >
                    {editPlan ? 'Salvar Alterações' : 'Criar Plano'}
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Service Edit/Create Modal - Mobile Optimized */}
        {
          showServiceModal && (
            <Modal
              isOpen={showServiceModal}
              onClose={() => {
                setShowServiceModal(false);
                setServiceImagePreview('');
              }}
              size="lg"
              title={editService ? 'Editar Serviço' : 'Novo Serviço'}
            >
              <div className="flex flex-col gap-5 sm:gap-6 pb-2">
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Nome */}
                    <div className="sm:col-span-2">
                      <Input
                        label="Nome do Serviço *"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        placeholder="Ex: Corte de Cabelo"
                      />
                    </div>

                    {/* Categoria */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Categoria *</label>
                      <select
                        value={serviceForm.category}
                        onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      >
                        <option value="">Selecione...</option>
                        <option value="Cabelo">Cabelo</option>
                        <option value="Barba">Barba</option>
                        <option value="Combo">Combo</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    {/* Preço */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Preço (R$) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={serviceForm.price > 0 ? serviceForm.price.toString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                          setServiceForm({ ...serviceForm, price: value ? parseFloat(value) : 0 });
                        }}
                        placeholder="0.00"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      />
                    </div>

                    {/* Duração */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Duração (min) *</label>
                      <input
                        type="number"
                        value={serviceForm.duration > 0 ? serviceForm.duration : ''}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                        placeholder="30"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      />
                    </div>

                    {/* Upload de Imagem */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Imagem do Serviço</label>

                      {serviceImagePreview ? (
                        // Preview com Overlay
                        <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden group">
                          <img
                            src={serviceImagePreview}
                            alt="Preview do serviço"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex flex-col sm:flex-row items-center justify-center gap-3 p-3 text-sm font-semibold">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleServiceImageUpload}
                                className="hidden"
                              />
                              <div className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 shadow">
                                <ImageIcon size={16} />
                                Alterar Foto
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setServiceForm({ ...serviceForm, image: '' });
                                setServiceImagePreview('');
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors flex items-center gap-2 shadow"
                            >
                              <X size={16} />
                              Remover
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Estado inicial - Botão clean
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleServiceImageUpload}
                            className="hidden"
                          />
                          <div className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-tenant-primary dark:hover:border-tenant-primary transition-colors flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-tenant-primary/5 dark:hover:bg-tenant-primary/10">
                            <div className="p-4 bg-white dark:bg-gray-700 rounded-full">
                              <ImageIcon size={32} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Adicionar imagem</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Máximo 5MB</p>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                    {/* Descrição */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Descrição</label>
                      <textarea
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        placeholder="Descreva o Serviço..."
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation resize-nãone"
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-4 sm:-mx-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowServiceModal(false);
                      setServiceImagePreview('');
                    }}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-750 transition-all active:scale-95 touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveService}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-tenant-primary/30 transition-all active:scale-95 touch-manipulation"
                  >
                    {editService ? 'Salvar Alterações' : 'Criar Serviço'}
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Product Edit/Create Modal - Mobile Optimized */}
        {
          showProductModal && (
            <Modal
              isOpen={showProductModal}
              onClose={() => setShowProductModal(false)}
              size="lg"
              title={editProduct ? 'Editar Produto' : 'Novo Produto'}
            >
              <div className="flex flex-col gap-5 sm:gap-6 pb-2">
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Nome */}
                    <div className="sm:col-span-2">
                      <Input
                        label="Nome do Produto *"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Ex: Pomada Matte"
                      />
                    </div>

                    {/* Categoria */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Categoria *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      >
                        <option value="">Selecione...</option>
                        <option value="Cabelo">Cabelo</option>
                        <option value="Barba">Barba</option>
                        <option value="Higiene">Higiene</option>
                        <option value="Acessórios">Acessórios</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    {/* Unidade */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Unidade</label>
                      <select
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      >
                        <option value="unidade">Unidade</option>
                        <option value="grama">Grama (g)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="litro">Litro (L)</option>
                        <option value="kg">Quilograma (kg)</option>
                      </select>
                    </div>

                    {/* Preço de Venda */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Preço de Venda (R$) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={productForm.price > 0 ? productForm.price.toString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                          setProductForm({ ...productForm, price: value ? parseFloat(value) : 0 });
                        }}
                        placeholder="0.00"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      />
                    </div>

                    {/* Preço de Custo */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Preço de Custo (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={productForm.costPrice > 0 ? productForm.costPrice.toString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                          setProductForm({ ...productForm, costPrice: value ? parseFloat(value) : 0 });
                        }}
                        placeholder="0.00"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      />
                    </div>

                    {/* Estoque */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Estoque Inicial</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={productForm.stock > 0 ? productForm.stock.toString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setProductForm({ ...productForm, stock: value ? parseInt(value) : 0 });
                        }}
                        placeholder="0"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                      />
                    </div>

                    {/* Upload de Imagem */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Imagem do Produto</label>
                      <div className="flex flex-col gap-3">
                        {productForm.image ? (
                          <div className="relative w-full h-48 sm:h-56 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group">
                            <img src={productForm.image} alt="Preview do produto" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex flex-col sm:flex-row items-center justify-center gap-3 p-3 text-sm font-semibold">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProductImageUpload}
                                  className="hidden"
                                />
                                <div className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 shadow">
                                  <ImageIcon size={16} />
                                  Trocar foto
                                </div>
                              </label>
                              <button
                                type="button"
                                onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors flex items-center gap-2 shadow"
                              >
                                <X size={16} />
                                Remover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProductImageUpload}
                              className="hidden"
                            />
                            <div className="w-full h-44 sm:h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-tenant-primary dark:hover:border-tenant-primary transition-colors flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-tenant-primary/5 dark:hover:bg-tenant-primary/10">
                              <div className="p-4 bg-white dark:bg-gray-700 rounded-full">
                                <ImageIcon size={32} className="text-gray-400 dark:text-gray-500" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enviar imagem do produto</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aceita JPG/PNG até 5MB</p>
                              </div>
                            </div>
                          </label>
                        )}

                        <div className="space-y-1">
                          <p className="text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300">Ou cole uma URL (opcional)</p>
                          <input
                            type="url"
                            value={productForm.image}
                            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                            placeholder="https://exemplo.com/imagem.jápg"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation"
                          />
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Preview aparece imediatamente aps selecionar.  possvel remover ou trocar antes de salvar.</p>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Descrição</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Descreva o produto..."
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary touch-manipulation resize-nãone"
                      />
                    </div>
                  </div>

                  {/* Margem de Lucro */}
                  {productForm.price > 0 && productForm.costPrice > 0 && (
                    <div className="bg-tenant-primary/5 dark:bg-tenant-primary/10 border border-tenant-primary/20 dark:border-tenant-primary/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm font-bold text-tenant-primary dark:text-tenant-primary/80">
                        Margem de Lucro: {((productForm.price - productForm.costPrice) / productForm.price * 100).toFixed(1)}%
                      </p>
                      <p className="text-[10px] sm:text-xs text-tenant-primary dark:text-tenant-primary mt-1">
                        Lucro por unidade: R$ {(productForm.price - productForm.costPrice).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 -mx-4 sm:-mx-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-750 transition-all active:scale-95 touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-tenant-primary/30 transition-all active:scale-95 touch-manipulation"
                  >
                    {editProduct ? 'Salvar Alterações' : 'Criar Produto'}
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Modal de Confirmação de Remoção */}
        {
          showDeleteModal && deleteTarget && (
            <Modal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
                setDeleteReason('');
              }}
              size="md"
              title="Confirmar Remoção"
            >
              <div className="flex flex-col gap-5 pb-2">
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    Tem certeza que deseja remover <strong className="text-gray-900 dark:text-white">{deleteTarget.name}</strong>?
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Esta ação não pode ser desfeita. O {deleteTarget.type === 'PRODUCT' ? 'produto' : 'serviço'} será removido do sistema.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Motivo da remoção *
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder={`Ex: ${deleteTarget.type === 'PRODUCT' ? 'Produto descontinuado' : 'Serviço não oferecido mais'}`}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-red-500 touch-manipulation resize-nãone"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O motivo será registrado não histórico de auditoria
                    </p>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-4 sm:-mx-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTarget(null);
                      setDeleteReason('');
                    }}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-750 transition-all active:scale-95 touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={!deleteReason.trim()}
                    className="w-full sm:flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-red-500/30 transition-all active:scale-95 touch-manipulation"
                  >
                    Confirmar Remoção
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Modal de Despesa/Custo Fixo */}
        {
          showExpenseModal && (
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title={editExpense ? 'Editar Despesa' : 'Nova Despesa'}>
              <div className="space-y-4 p-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
                  <select
                    value={expenseForm.type}
                    onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary"
                  >
                    {Object.entries(EXPENSE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Ex: Aluguel sala, Conta de luz..."
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Valor (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseForm.amount > 0 ? expenseForm.amount.toString() : ''}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setExpenseForm({ ...expenseForm, amount: v ? parseFloat(v) : 0 });
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Vencimento (opcional)</label>
                  <input
                    type="date"
                    value={expenseForm.dueDate || ''}
                    onChange={e => setExpenseForm({ ...expenseForm, dueDate: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-nãone focus:border-tenant-primary"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={!!expenseForm.isRecurring}
                    onChange={e => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                    className="w-4 h-4 accent-[var(--tenant-primary)]"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Despesa recorrente (mensal)
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveExpense}
                    className="flex-1 py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold text-sm shadow-lg shadow-tenant-primary/30 transition-colors">
                    {editExpense ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </div>
            </Modal>
          )
        }

        {/* Modal de Detalhamento de Receita */}
        <Modal
          isOpen={showRevenueDetail}
          onClose={() => setShowRevenueDetail(false)}
          title="Detalhamento de Faturamento"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 text-gray-900 dark:text-white">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase text-purple-600">Serviços</span>
                  <span className="text-lg font-black text-purple-700 dark:text-purple-400">R$ {analytics?.serviceRev.toFixed(2)}</span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-900/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-1000"
                    style={{ width: `${analytics ? (analytics.serviceRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase text-blue-600">Produtos</span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">R$ {analytics?.productRev.toFixed(2)}</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-1000"
                    style={{ width: `${analytics ? (analytics.productRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-2xl border border-tenant-primary/10 dark:border-tenant-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase text-tenant-primary">Planos / Assinaturas</span>
                  <span className="text-lg font-black text-tenant-primary dark:text-tenant-primary">R$ {analytics?.planRev.toFixed(2)}</span>
                </div>
                <div className="w-full bg-tenant-primary/20 dark:bg-tenant-primary/20/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-tenant-primary h-full transition-all duration-1000"
                    style={{ width: `${analytics ? (analytics.planRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <Alert variant="info" icon={<Info size={18} />}>
              Estes valores representam o faturamento bruto antes de descontos, taxas de cartão e comissões.
            </Alert>
          </div>
        </Modal>

        {/* Modal de Detalhamento de Comissões */}
        <Modal
          isOpen={showCommissionDetail}
          onClose={() => setShowCommissionDetail(false)}
          title="Extrato de Comissões por Profissional"
        >
          <div className="space-y-4">
            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-900 dark:text-white">
              {analytics?.commissionsByBarber.map((barber) => (
                <div key={barber.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                      {barber.avatar ? (
                        <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{barber.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{barber.appointments} atendimentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-tenant-primary dark:text-tenant-primary">R$ {barber.commission.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Faturamento: R$ {barber.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-gray-900 dark:text-white">
              <span className="font-black text-sm uppercase text-gray-500">Total Comissões</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">R$ {analytics?.totalCommissions.toFixed(2)}</span>
            </div>
          </div>
        </Modal>

        {/* Modal de Detalhamento de Despesas */}
        <Modal
          isOpen={showExpenseDetail}
          onClose={() => setShowExpenseDetail(false)}
          title="Detalhamento de Custos e Despesas"
        >
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Totais do Período</p>
              <div className="grid grid-cols-2 gap-3 text-gray-900 dark:text-white">
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-xs font-bold text-red-500 uppercase">Custos Fixos</p>
                  <p className="text-lg font-black text-red-700 dark:text-red-400">R$ {analytics?.fixedCostsTotal.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                  <p className="text-xs font-bold text-orange-500 uppercase">Insumos e Taxas</p>
                  <p className="text-lg font-black text-orange-700 dark:text-orange-400">R$ {((analytics?.supplyCostsTotal || 0) + (analytics?.cardFees || 0)).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Resumo de Saídas</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm font-medium dark:text-white">Custos Fixos / Aluguel</span>
                  <span className="font-bold dark:text-white">R$ {analytics?.fixedCostsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm font-medium dark:text-white">Comissões de Profissionais</span>
                  <span className="font-bold dark:text-white">R$ {analytics?.totalCommissions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm font-medium dark:text-white">Custo de Insumos</span>
                  <span className="font-bold dark:text-white">R$ {analytics?.supplyCostsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm font-medium dark:text-white">Taxas de Operação (Cartão)</span>
                  <span className="font-bold dark:text-white">R$ {analytics?.cardFees.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-900 -mx-6 -mb-6 p-6">
              <span className="font-black text-sm uppercase text-white">Custo Total Operacional</span>
              <span className="text-2xl font-black text-red-500">
                R$ {((analytics?.expenses || 0) + (analytics?.totalCommissions || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      </Container >
    </div >
  );
};
