
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, DollarSign, Scissors, Store, ShoppingBag, Eye, EyeOff, 
  Clock, X, Check, TrendingUp, Sliders, Edit3, Trash2, Plus, 
  AlertCircle, ChevronRight, ChevronLeft, Info, PlusCircle, Trash, Power, Package,
  TrendingDown, Settings, AlertTriangle, Layers, Calculator, Camera, Save, ArrowRight, List,
  Calendar, Award, BarChart3, ChevronDown, ChevronUp, History, UserCheck, Megaphone,
  Wallet, PieChart, Landmark, ArrowUpRight, Tag, Gift, Percent, AlertOctagon,
  MinusCircle, Send, User as UserIcon
} from 'lucide-react';
import { Appointment, Barber, Invoice, Product, Plan, FixedCost, Service, Campaign, User } from '../../types';
import { MOCK_APPOINTMENTS, SERVICES, BARBERS, PRODUCTS, PLANS, UI_STYLE, MOCK_FIXED_COSTS } from '../../constants';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';

const ADMIN_TABS = [
    { id: 'FINANCIAL', icon: DollarSign, label: 'Financeiro & BI' },
    { id: 'FIXED_COSTS', icon: Power, label: 'Insumos / Custos' },
    { id: 'BARBERS', icon: Users, label: 'Gestão de Time' },
    { id: 'SERVICES', icon: Scissors, label: 'Catálogo de Serviços' },
    { id: 'PRODUCTS', icon: ShoppingBag, label: 'Produtos & Estoque' },
    { id: 'PLANS', icon: Layers, label: 'Planos & Assinaturas' },
    { id: 'MARKETING', icon: Megaphone, label: 'Marketing & CRM' },
];

type FinancialDetailType = 'GROSS' | 'COMMISSIONS' | 'COSTS' | 'NET' | null;

export const AdminDashboard: React.FC<{ onViewVisitor?: () => void, isVisitorMode?: boolean }> = ({ onViewVisitor, isVisitorMode }) => {
  const { shop: currentShop, shops, setShop, updateShopSettings } = useShop();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('FINANCIAL');
  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [financialDetail, setFinancialDetail] = useState<FinancialDetailType>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // States for dynamic data with persistence
  const [appointments] = useState<Appointment[]>(() => JSON.parse(localStorage.getItem('appointments') || JSON.stringify(MOCK_APPOINTMENTS)));
  const [barbers, setBarbers] = useState<Barber[]>(() => JSON.parse(localStorage.getItem('barbers') || JSON.stringify(BARBERS)));
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(() => JSON.parse(localStorage.getItem('fixed_costs') || JSON.stringify(MOCK_FIXED_COSTS)));
  const [unitServices, setUnitServices] = useState<Service[]>(() => JSON.parse(localStorage.getItem('unit_services') || JSON.stringify(SERVICES)));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || JSON.stringify(PRODUCTS)));
  const [plans, setPlans] = useState<Plan[]>(() => JSON.parse(localStorage.getItem('plans') || JSON.stringify(PLANS)));
  const [invoices] = useState<Invoice[]>(() => JSON.parse(localStorage.getItem('invoices') || '[]'));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => JSON.parse(localStorage.getItem('campaigns') || '[]'));

  // Edit Modal States
  const [editBarber, setEditBarber] = useState<Barber | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editCost, setEditCost] = useState<FixedCost | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      if (activeTabRef.current) {
          const tab = activeTabRef.current;
          const scrollLeft = tab.offsetLeft - (container.offsetWidth / 2) + (tab.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'auto' });
      }
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - (container.offsetWidth / 2) + (tab.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const analytics = useMemo(() => {
    const shopId = currentShop.id;
    const shopApts = appointments.filter(a => a.shopId === shopId && a.status === 'COMPLETED');
    const shopInvoices = invoices.filter(i => i.shopId === shopId && i.status === 'PAID');
    const activeCosts = fixedCosts.filter(c => c.shopId === shopId && c.active);

    const serviceRev = shopApts.reduce((acc, a) => acc + a.totalPrice, 0);
    const productRev = shopInvoices.filter(i => i.type === 'PRODUCT').reduce((acc, i) => acc + i.amount, 0);
    const costTotal = activeCosts.reduce((acc, c) => acc + c.value, 0);
    
    const commissionsByBarber = barbers.filter(b => b.shopId === shopId).map(b => {
        const apts = shopApts.filter(a => a.barberId === b.id);
        const totalComm = apts.reduce((sum, a) => sum + (a.totalPrice * ((b.commissionRate || 50) / 100)), 0);
        return { id: b.id, name: b.name, amount: totalComm, avatar: b.avatar, count: apts.length };
    }).sort((a,b) => b.amount - a.amount);

    const commTotal = commissionsByBarber.reduce((acc, b) => acc + b.amount, 0);
    const gross = serviceRev + productRev;
    const net = gross - commTotal - costTotal;
    
    return { gross, serviceRev, productRev, costTotal, commTotal, commissionsByBarber, activeCosts, net, isLoss: net < 0 };
  }, [appointments, invoices, currentShop.id, barbers, fixedCosts]);

  const toggleActive = (id: string, type: 'BARBER' | 'COST' | 'SERVICE' | 'PRODUCT' | 'PLAN' | 'CAMPAIGN') => {
      let updated: any[] = [];
      if (type === 'BARBER') {
          updated = barbers.map(b => b.id === id ? { ...b, active: !b.active } : b);
          setBarbers(updated);
          localStorage.setItem('barbers', JSON.stringify(updated));
      } else if (type === 'COST') {
          updated = fixedCosts.map(c => c.id === id ? { ...c, active: !c.active } : c);
          setFixedCosts(updated);
          localStorage.setItem('fixed_costs', JSON.stringify(updated));
      } else if (type === 'SERVICE') {
          updated = unitServices.map(s => s.id === id ? { ...s, active: !s.active } : s);
          setUnitServices(updated);
          localStorage.setItem('unit_services', JSON.stringify(updated));
      } else if (type === 'PRODUCT') {
          updated = products.map(p => p.id === id ? { ...p, active: !p.active } : p);
          setProducts(updated);
          localStorage.setItem('products', JSON.stringify(updated));
      } else if (type === 'PLAN') {
          updated = plans.map(p => p.id === id ? { ...p, active: !p.active } : p);
          setPlans(updated);
          localStorage.setItem('plans', JSON.stringify(updated));
      } else if (type === 'CAMPAIGN') {
          updated = campaigns.map(c => c.id === id ? { ...c, active: !c.active } : c);
          setCampaigns(updated);
          localStorage.setItem('campaigns', JSON.stringify(updated));
      }
      addNotification('success', 'Status atualizado!');
  };

  const deleteItem = (id: string, type: 'BARBER' | 'COST' | 'SERVICE' | 'PRODUCT' | 'PLAN' | 'CAMPAIGN') => {
      if (!window.confirm('Tem certeza que deseja excluir este item permanentemente?')) return;
      
      let updated: any[] = [];
      if (type === 'BARBER') {
          updated = barbers.filter(b => b.id !== id);
          setBarbers(updated);
          localStorage.setItem('barbers', JSON.stringify(updated));
      } else if (type === 'COST') {
          updated = fixedCosts.filter(c => c.id !== id);
          setFixedCosts(updated);
          localStorage.setItem('fixed_costs', JSON.stringify(updated));
      } else if (type === 'SERVICE') {
          updated = unitServices.filter(s => s.id !== id);
          setUnitServices(updated);
          localStorage.setItem('unit_services', JSON.stringify(updated));
      } else if (type === 'PRODUCT') {
          updated = products.filter(p => p.id !== id);
          setProducts(updated);
          localStorage.setItem('products', JSON.stringify(updated));
      } else if (type === 'PLAN') {
          updated = plans.filter(p => p.id !== id);
          setPlans(updated);
          localStorage.setItem('plans', JSON.stringify(updated));
      } else if (type === 'CAMPAIGN') {
          updated = campaigns.filter(c => c.id !== id);
          setCampaigns(updated);
          localStorage.setItem('campaigns', JSON.stringify(updated));
      }
      addNotification('success', 'Item removido com sucesso!');
  };

  const saveBarber = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editBarber) return;
      const updated = editBarber.id.startsWith('new-') 
          ? [...barbers, { ...editBarber, id: `b-${Date.now()}` }]
          : barbers.map(b => b.id === editBarber.id ? editBarber : b);
      setBarbers(updated);
      localStorage.setItem('barbers', JSON.stringify(updated));
      setEditBarber(null);
      addNotification('success', 'Dados do profissional salvos!');
  };

  const saveService = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editService) return;
      const updated = editService.id.startsWith('new-')
          ? [...unitServices, { ...editService, id: `s-${Date.now()}` }]
          : unitServices.map(s => s.id === editService.id ? editService : s);
      setUnitServices(updated);
      localStorage.setItem('unit_services', JSON.stringify(updated));
      setEditService(null);
      addNotification('success', 'Serviço atualizado com sucesso!');
  };

  const saveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCost) return;
    const updated = editCost.id.startsWith('new-')
        ? [...fixedCosts, { ...editCost, id: `c-${Date.now()}` }]
        : fixedCosts.map(c => c.id === editCost.id ? editCost : c);
    setFixedCosts(updated);
    localStorage.setItem('fixed_costs', JSON.stringify(updated));
    setEditCost(null);
    addNotification('success', 'Custo/Insumo salvo!');
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    const updated = editProduct.id.startsWith('new-')
        ? [...products, { ...editProduct, id: `p-${Date.now()}` }]
        : products.map(p => p.id === editProduct.id ? editProduct : p);
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
    setEditProduct(null);
    addNotification('success', 'Produto atualizado no estoque!');
  };

  const savePlan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editPlan) return;
      const updated = editPlan.id.startsWith('new-')
          ? [...plans, { ...editPlan, id: `plan-${Date.now()}` }]
          : plans.map(p => p.id === editPlan.id ? editPlan : p);
      setPlans(updated);
      localStorage.setItem('plans', JSON.stringify(updated));
      setEditPlan(null);
      addNotification('success', 'Plano de assinatura salvo!');
  };

  const saveCampaign = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editCampaign) return;
      const updated = editCampaign.id.startsWith('new-')
          ? [...campaigns, { ...editCampaign, id: `camp-${Date.now()}`, createdAt: new Date().toISOString() }]
          : campaigns.map(c => c.id === editCampaign.id ? editCampaign : c);
      setCampaigns(updated);
      localStorage.setItem('campaigns', JSON.stringify(updated));
      setEditCampaign(null);
      addNotification('success', 'Campanha de marketing salva!');
  };

  const triggerCampaign = (campaign: Campaign) => {
      addNotification('info', `Disparando campanha "${campaign.title}" para o público alvo...`, 'CRM Marketing');
      setTimeout(() => {
          addNotification('success', 'Campanha enviada com sucesso para a base selecionada!', 'Concluído');
      }, 2000);
  };

  const toggleSubscriptionModule = () => {
      const updatedShop = {
          ...currentShop,
          settings: {
              ...currentShop.settings,
              subscriptionEnabled: !currentShop.settings.subscriptionEnabled
          }
      };
      updateShopSettings(updatedShop);
      addNotification('info', updatedShop.settings.subscriptionEnabled ? 'Planos habilitados para esta unidade.' : 'Planos desabilitados para esta unidade.');
  };

  const handleProductLoss = (productId: string) => {
    const amount = prompt('Quantas unidades foram perdidas? (vencimento, quebra, etc.)');
    if (!amount || isNaN(Number(amount))) return;
    
    const qty = Number(amount);
    const updated = products.map(p => {
        if (p.id === productId) {
            const newStock = Math.max(0, p.stock - qty);
            return { ...p, stock: newStock };
        }
        return p;
    });
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
    addNotification('warning', `Perda de ${qty} un. registrada. Estoque atualizado.`, 'Controle de Perdas');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-32 animate-fade-in relative">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-100 dark:border-gray-700 pb-8 mb-12">
            <div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-4">Dashboard Master</h1>
                <div className="flex flex-wrap items-center gap-3">
                    {shops.map(s => (
                        <button key={s.id} onClick={() => setShop(s)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${currentShop.id === s.id ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-amber-500'}`}>
                            <Store size={14}/> {s.name}
                        </button>
                    ))}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                    <button onClick={onViewVisitor} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap border-2 ${isVisitorMode ? 'bg-amber-500 text-white border-white' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-amber-500'}`}>
                        <Eye size={14}/> {isVisitorMode ? 'Sair Visitante' : 'Ver como Cliente'}
                    </button>
                </div>
            </div>
            <button onClick={() => setShowFinancialValues(!showFinancialValues)} className={`p-4 rounded-2xl transition-all hidden md:block ${showFinancialValues ? 'bg-white dark:bg-gray-800 text-gray-400 border dark:border-gray-700' : 'bg-amber-500 text-white shadow-xl'}`}>
                {showFinancialValues ? <EyeOff size={22}/> : <Eye size={22}/>}
            </button>
        </div>

        {/* MENU ADMINISTRATIVO CAROUSEL */}
        <div className="relative mb-16">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center h-full pointer-events-none">
                {canScrollLeft && (
                    <button onClick={() => handleManualScroll('left')} className="p-2 text-amber-500 pointer-events-auto hover:text-amber-600 active:scale-95 transition-all ml-[-15px] md:ml-[-10px]"><ChevronLeft size={36} strokeWidth={3} /></button>
                )}
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center h-full pointer-events-none">
                {canScrollRight && (
                    <button onClick={() => handleManualScroll('right')} className="p-2 text-amber-500 pointer-events-auto hover:text-amber-600 active:scale-95 transition-all mr-[-15px] md:mr-[-10px]"><ChevronRight size={36} strokeWidth={3} /></button>
                )}
            </div>

            <div ref={scrollContainerRef} className="flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-hide snap-x px-8 md:px-14 py-4 w-full" style={{ scrollSnapType: 'x mandatory' }}>
                {ADMIN_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} ref={isActive ? activeTabRef : null} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center transition-all duration-300 snap-center relative shrink-0 ${isActive ? 'min-w-[140px] md:min-w-[180px] p-6 rounded-[35px] bg-amber-500 text-white shadow-xl shadow-amber-500/30' : 'min-w-[120px] md:min-w-[150px] p-5 rounded-[30px] bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 opacity-60 hover:opacity-100'}`}>
                            <div className={`transition-all duration-300 rounded-2xl flex items-center justify-center mb-3 ${isActive ? 'bg-white/20 w-12 h-12' : 'bg-gray-50 dark:bg-gray-900 w-11 h-11'}`}><Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-white' : 'text-amber-500'} /></div>
                            <span className={`font-black uppercase tracking-wider text-center transition-all duration-300 leading-tight ${isActive ? 'text-[10px]' : 'text-[8px]'}`}>{tab.label}</span>
                            {isActive && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* CONTENT */}
        <main className="min-w-0">
            {activeTab === 'FINANCIAL' && (
                <div className="space-y-10 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div onClick={() => setFinancialDetail('NET')} className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl cursor-pointer group hover:scale-[1.01] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                            <TrendingUp className="absolute -right-6 -bottom-6 text-white/5" size={140} />
                            <div className="flex justify-between items-start relative z-10">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Resultado Líquido</p>
                                <ArrowUpRight size={18} className="text-amber-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1 flex-wrap">
                                    <span className="text-sm md:text-lg font-bold opacity-60">R$</span>
                                    <span className={`font-black tracking-tighter break-all ${analytics.net.toString().length > 6 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>
                                        {showFinancialValues ? analytics.net.toFixed(2) : '••••'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div onClick={() => setFinancialDetail('GROSS')} className={`${UI_STYLE.card} p-8 cursor-pointer hover:border-amber-500 transition-all group flex flex-col justify-between min-h-[180px]`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2"><Landmark size={16} className="text-amber-500" /><p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">Faturamento Bruto</p></div>
                                <ArrowUpRight size={16} className="text-gray-200 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <div className="flex items-baseline gap-1"><span className="text-sm font-bold text-gray-400">R$</span><span className="text-2xl md:text-3xl font-black dark:text-white leading-none">{showFinancialValues ? analytics.gross.toFixed(2) : '••••'}</span></div>
                        </div>

                        <div onClick={() => setFinancialDetail('COMMISSIONS')} className={`${UI_STYLE.card} p-8 cursor-pointer hover:border-red-500 transition-all group flex flex-col justify-between min-h-[180px]`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2"><Wallet size={16} className="text-red-500" /><p className="text-[9px] font-black uppercase text-red-500 tracking-[0.2em]">Comissões</p></div>
                                <ArrowUpRight size={16} className="text-gray-200 group-hover:text-red-500 transition-colors" />
                            </div>
                            <div className="flex items-baseline gap-1"><span className="text-sm font-bold text-red-500">R$</span><span className="text-2xl md:text-3xl font-black text-red-500 leading-none">{showFinancialValues ? analytics.commTotal.toFixed(2) : '••••'}</span></div>
                        </div>

                        <div onClick={() => setFinancialDetail('COSTS')} className={`${UI_STYLE.card} p-8 cursor-pointer hover:border-blue-500 transition-all group flex flex-col justify-between min-h-[180px]`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2"><PieChart size={16} className="text-blue-500" /><p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em]">Insumos / Fixos</p></div>
                                <ArrowUpRight size={16} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex items-baseline gap-1"><span className="text-sm font-bold text-blue-500">R$</span><span className="text-2xl md:text-3xl font-black text-blue-500 leading-none">{analytics.costTotal.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'FIXED_COSTS' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Insumos & Despesas</h2>
                        <button onClick={() => setEditCost({ id: `new-${Date.now()}`, shopId: currentShop.id, name: '', value: 0, quantity: 1, category: 'SUPPLY', active: true })} className={UI_STYLE.button.primary}><Plus size={18}/> Novo Item</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {fixedCosts.filter(c => c.shopId === currentShop.id).map(cost => (
                            <div key={cost.id} className={`${UI_STYLE.card} p-8 flex flex-col md:flex-row items-center justify-between gap-6 group transition-all ${!cost.active ? 'opacity-50 grayscale' : 'hover:border-amber-500/50'}`}>
                                <div className="flex items-center gap-6 flex-1 w-full">
                                    <div className={`p-4 rounded-2xl ${!cost.active ? 'bg-gray-200 text-gray-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}><Package size={24}/></div>
                                    <div><h4 className="font-black uppercase text-sm dark:text-white">{cost.name}</h4><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{cost.category}</span></div>
                                </div>
                                <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-gray-700 justify-between md:justify-end">
                                    <div className="text-right"><div className="flex items-baseline gap-1 justify-end"><span className="text-[10px] font-bold text-gray-400">R$</span><span className="text-xl font-black dark:text-white">{cost.value.toFixed(2)}</span></div></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditCost(cost)} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-xl transition-all"><Edit3 size={18}/></button>
                                        <button onClick={() => toggleActive(cost.id, 'COST')} className={`p-3 rounded-xl transition-all ${cost.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={18}/></button>
                                        <button onClick={() => deleteItem(cost.id, 'COST')} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'BARBERS' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Gestão de Time</h2>
                        <button onClick={() => setEditBarber({ id: `new-${Date.now()}`, shopId: currentShop.id, name: '', specialties: [], rating: 5, avatar: 'https://i.pravatar.cc/150', description: '', totalCuts: 0, experience: '', unit: currentShop.name, active: true, commissionRate: 50, birthDate: '' })} className={UI_STYLE.button.primary}><Plus size={18}/> Novo Barbeiro</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {barbers.filter(b => b.shopId === currentShop.id).map(b => (
                            <div key={b.id} className={`${UI_STYLE.card} p-6 flex items-center gap-5 hover:border-amber-500 transition-all ${!b.active ? 'opacity-50 grayscale' : ''}`}>
                                <img src={b.avatar} className="w-20 h-20 rounded-[28px] object-cover shadow-lg" />
                                <div className="flex-1">
                                    <h4 className="font-black uppercase text-base dark:text-white">{b.name}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{b.experience || 'Exp. N/A'} • Comiss. {b.commissionRate}%</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {b.specialties.map(s => <span key={s} className="text-[8px] font-black uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-0.5 rounded-full">{s}</span>)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditBarber(b)} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-xl transition-all"><Edit3 size={18}/></button>
                                    <button onClick={() => toggleActive(b.id, 'BARBER')} className={`p-3.5 rounded-xl transition-all ${b.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={18}/></button>
                                    <button onClick={() => deleteItem(b.id, 'BARBER')} className="p-3.5 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'SERVICES' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Catálogo de Serviços</h2>
                        <button onClick={() => setEditService({ id: `new-${Date.now()}`, name: '', duration: 30, price: 0, category: 'HAIR', image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500', active: true, description: '' })} className={UI_STYLE.button.primary}><Plus size={18}/> Novo Serviço</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {unitServices.map(s => (
                            <div key={s.id} className={`${UI_STYLE.card} p-6 flex flex-col gap-4 hover:border-amber-500 transition-all ${!s.active ? 'opacity-50 grayscale' : ''}`}>
                                <img src={s.image} className="w-full h-32 rounded-2xl object-cover mb-2" />
                                <div className="flex justify-between items-start"><h4 className="font-black uppercase text-sm dark:text-white leading-tight">{s.name}</h4><span className="font-black text-amber-500 text-base">R$ {s.price.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{s.duration} MIN</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditService(s)} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-xl transition-all"><Edit3 size={16}/></button>
                                        <button onClick={() => toggleActive(s.id, 'SERVICE')} className={`p-3 rounded-xl transition-all ${s.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={16}/></button>
                                        <button onClick={() => deleteItem(s.id, 'SERVICE')} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'PRODUCTS' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Gestão de Estoque</h2>
                        <button onClick={() => setEditProduct({ id: `new-${Date.now()}`, shopId: currentShop.id, name: '', description: '', price: 0, costPrice: 0, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500', category: 'Cabelo', stock: 0, active: true })} className={UI_STYLE.button.primary}><Plus size={18}/> Novo Produto</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.filter(p => p.shopId === currentShop.id).map(p => (
                            <div key={p.id} className={`${UI_STYLE.card} p-5 flex flex-col gap-4 hover:border-amber-500 transition-all ${!p.active ? 'opacity-50 grayscale' : ''}`}>
                                <div className="relative group overflow-hidden rounded-2xl">
                                    <img src={p.image} className="w-full h-40 object-cover group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase border border-white/10">{p.stock} UN</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black uppercase text-sm dark:text-white truncate mb-1">{p.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 line-clamp-1">{p.description}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-gray-400 leading-none mb-1">Preço Venda</p>
                                            <p className="text-xl font-black text-amber-500">R$ {p.price.toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => handleProductLoss(p.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Registrar Perda">
                                            <AlertOctagon size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                                    <button onClick={() => setEditProduct(p)} className="flex-1 p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-xl transition-all flex items-center justify-center"><Edit3 size={16}/></button>
                                    <button onClick={() => toggleActive(p.id, 'PRODUCT')} className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center ${p.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={16}/></button>
                                    <button onClick={() => deleteItem(p.id, 'PRODUCT')} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-xl transition-all flex items-center justify-center"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'PLANS' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Planos & Assinaturas</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gerencie as assinaturas recorrentes desta unidade</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={toggleSubscriptionModule} 
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${currentShop.settings.subscriptionEnabled ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}
                            >
                                <Power size={16} />
                                {currentShop.settings.subscriptionEnabled ? 'Planos Ativados' : 'Planos Desativados'}
                            </button>
                            <button 
                                onClick={() => setEditPlan({ id: `new-${Date.now()}`, shopId: currentShop.id, name: '', price: 0, benefits: [], discount: 0, active: true })} 
                                className={UI_STYLE.button.primary}
                            >
                                <Plus size={18}/> Novo Plano
                            </button>
                        </div>
                    </div>

                    {!currentShop.settings.subscriptionEnabled && (
                        <div className="p-8 bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-[40px] flex flex-col items-center text-center">
                            <AlertCircle className="text-amber-500 mb-4" size={48} />
                            <h3 className="font-black uppercase text-amber-600 dark:text-amber-500 mb-2">Módulo Inativo</h3>
                            <p className="text-sm text-gray-400 max-w-sm font-medium">Os planos estão configurados, mas não aparecerão para os clientes até que você ative o módulo acima.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.filter(p => p.shopId === currentShop.id).map(plan => (
                            <div key={plan.id} className={`${UI_STYLE.card} p-10 flex flex-col hover:border-amber-500 transition-all ${!plan.active ? 'opacity-50 grayscale' : ''}`}>
                                <div className="mb-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">{plan.name}</h4>
                                        {plan.isPopular && <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Destaque</span>}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-amber-500 tracking-tighter">R$ {plan.price.toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">/ mês</span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-3 mb-10 flex-1">
                                    {plan.benefits.map((benefit, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-xs font-medium text-gray-500">
                                            <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                                            {benefit}
                                        </li>
                                    ))}
                                    {plan.discount > 0 && (
                                        <li className="flex items-start gap-3 text-xs font-black text-amber-600 uppercase">
                                            <Percent size={14} className="shrink-0 mt-0.5" />
                                            {plan.discount}% de desconto em produtos
                                        </li>
                                    )}
                                </ul>

                                <div className="flex gap-3 pt-8 border-t dark:border-gray-700">
                                    <button onClick={() => setEditPlan(plan)} className="flex-1 p-4 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-2xl transition-all flex items-center justify-center"><Edit3 size={18}/></button>
                                    <button onClick={() => toggleActive(plan.id, 'PLAN')} className={`flex-1 p-4 rounded-2xl transition-all flex items-center justify-center ${plan.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={18}/></button>
                                    <button onClick={() => deleteItem(plan.id, 'PLAN')} className="p-4 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-2xl transition-all flex items-center justify-center"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'MARKETING' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Marketing & CRM</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de Criativos e Automações de Disparo</p>
                        </div>
                        <button onClick={() => setEditCampaign({ id: `new-${Date.now()}`, shopId: currentShop.id, title: '', description: '', type: 'PROMOTION', target: 'ALL', active: true, createdAt: new Date().toISOString() })} className={UI_STYLE.button.primary}><Plus size={18}/> Nova Campanha</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campaigns.filter(c => c.shopId === currentShop.id).map(camp => (
                            <div key={camp.id} className={`${UI_STYLE.card} p-8 flex flex-col gap-6 hover:border-amber-500 transition-all ${!camp.active ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${camp.type === 'BIRTHDAY' ? 'bg-pink-100 text-pink-600' : camp.type === 'COUPON' ? 'bg-green-100 text-green-600' : camp.type === 'FLASH_SALE' ? 'bg-red-100 text-red-600' : camp.type === 'BLUE-100 text-blue-600'}`}>
                                        {camp.type.replace('_', ' ')}
                                    </div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(camp.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter dark:text-white mb-2 leading-none">{camp.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 font-medium leading-relaxed">{camp.description}</p>
                                </div>
                                <div className="flex items-center gap-2 border-y dark:border-gray-700 py-4 my-2">
                                    <Users size={14} className="text-amber-500" />
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Público: {camp.target === 'ALL' ? 'Todos os Clientes' : camp.target === 'SUBSCRIBERS' ? 'Apenas Assinantes' : 'Cliente Específico'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => triggerCampaign(camp)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"><Send size={14}/> Disparar Agora</button>
                                    <button onClick={() => setEditCampaign(camp)} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500 rounded-xl transition-all"><Edit3 size={18}/></button>
                                    <button onClick={() => toggleActive(camp.id, 'CAMPAIGN')} className={`p-3 rounded-xl transition-all ${camp.active ? 'bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-amber-500' : 'bg-amber-500 text-white'}`}><Power size={18}/></button>
                                    <button onClick={() => deleteItem(camp.id, 'CAMPAIGN')} className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {campaigns.filter(c => c.shopId === currentShop.id).length === 0 && (
                            <div className="col-span-2 py-20 text-center bg-gray-50 dark:bg-gray-900/40 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                <Megaphone className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-sm font-black uppercase text-gray-400 tracking-widest">Nenhuma campanha configurada.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>

        {/* MODAL FINANCEIRO ANALÍTICO */}
        {financialDetail && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-fade-in">
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md" onClick={() => setFinancialDetail(null)}></div>
                <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl max-w-2xl w-full p-8 md:p-16 relative z-10 flex flex-col max-h-[90vh] overflow-hidden border dark:border-gray-700">
                    <button onClick={() => setFinancialDetail(null)} className="absolute top-10 right-10 text-gray-400 hover:text-amber-500 p-3 bg-gray-50 dark:bg-gray-750 rounded-full transition-all z-20"><X size={28} /></button>
                    <div className="text-center mb-12 pr-12"><h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none mb-3">{financialDetail === 'NET' ? 'Demonstrativo Operacional' : financialDetail === 'GROSS' ? 'Faturamento Total' : financialDetail === 'COMMISSIONS' ? 'Auditória de Comissões' : 'Insumos & Custos Fixos'}</h3><p className="text-[11px] font-black uppercase text-gray-400 tracking-[0.3em]">{currentShop.name}</p></div>
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                        {financialDetail === 'COMMISSIONS' && (
                            <div className="space-y-4">
                                {analytics.commissionsByBarber.map(b => (
                                    <div key={b.id} className="p-8 bg-gray-50 dark:bg-gray-900/40 rounded-[35px] border dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center gap-4"><img src={b.avatar} className="w-12 h-12 rounded-2xl object-cover" /><div><p className="font-black uppercase text-sm dark:text-white">{b.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{b.count} atendimentos</p></div></div>
                                        <p className="font-black text-red-500 text-lg">R$ {b.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {financialDetail === 'COSTS' && (
                            <div className="space-y-4">
                                {analytics.activeCosts.map(c => (
                                    <div key={c.id} className="p-8 bg-gray-50 dark:bg-gray-900/40 rounded-[35px] border dark:border-gray-700 flex justify-between items-center"><div className="flex items-center gap-4"><Package className="text-blue-500" size={20}/><p className="font-black uppercase text-xs dark:text-white">{c.name}</p></div><p className="font-black text-red-500 text-base">R$ {c.value.toFixed(2)}</p></div>
                                ))}
                            </div>
                        )}
                        {financialDetail === 'NET' && (
                            <div className="space-y-6">
                                <div className="p-8 bg-green-500/5 rounded-[40px] border border-green-500/10 flex justify-between items-center"><span className="text-xs font-black uppercase text-green-600 tracking-[0.2em]">Entradas (+)</span><div className="flex items-baseline gap-1"><span className="text-sm font-bold text-green-600">R$</span><span className="text-3xl font-black text-green-500 tracking-tighter">{analytics.gross.toFixed(2)}</span></div></div>
                                <div className="p-8 bg-red-500/5 rounded-[40px] border border-red-500/10 flex justify-between items-center"><span className="text-xs font-black uppercase text-red-500 tracking-[0.2em]">Saídas Operacionais (-)</span><div className="flex items-baseline gap-1"><span className="text-sm font-bold text-red-500">R$</span><span className="text-3xl font-black text-red-500 tracking-tighter">{(analytics.commTotal + analytics.costTotal).toFixed(2)}</span></div></div>
                                <div className="pt-12 mt-10 border-t dark:border-gray-700 flex flex-col md:flex-row justify-between items-center px-4 gap-4"><span className="text-xl font-black uppercase dark:text-white tracking-tighter">Lucro Líquido</span><div className="flex items-baseline gap-1 flex-wrap justify-center"><span className={`text-2xl font-bold ${analytics.isLoss ? 'text-red-600' : 'text-green-500'}`}>R$</span><span className={`font-black tracking-tighter break-words text-center ${analytics.isLoss ? 'text-red-600' : 'text-green-500'} ${analytics.net.toString().length > 6 ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl'}`}>{analytics.net.toFixed(2)}</span></div></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDIÇÃO BARBEIRO */}
        {editBarber && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={saveBarber} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-black uppercase tracking-tighter text-xl">Gestão de Profissional</h3>
                        <button type="button" onClick={() => setEditBarber(null)}><X size={24} /></button>
                    </div>
                    <div className="p-10 overflow-y-auto space-y-8">
                        <div className="flex justify-center"><div className="relative group cursor-pointer" onClick={() => { const url = prompt('Cole a URL da nova imagem:', editBarber.avatar); if(url) setEditBarber({...editBarber, avatar: url}) }}><img src={editBarber.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-amber-500 shadow-xl" /><div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div></div></div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Nome do Profissional</label><input required className={UI_STYLE.input} value={editBarber.name} onChange={e => setEditBarber({...editBarber, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Aniversário</label><input type="date" className={UI_STYLE.input} value={editBarber.birthDate} onChange={e => setEditBarber({...editBarber, birthDate: e.target.value})} /></div>
                                <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Experiência (ex: 5 Anos)</label><input className={UI_STYLE.input} value={editBarber.experience} onChange={e => setEditBarber({...editBarber, experience: e.target.value})} /></div>
                            </div>
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Comissão (%)</label><input type="number" className={UI_STYLE.input} value={editBarber.commissionRate} onChange={e => setEditBarber({...editBarber, commissionRate: Number(e.target.value)})} /></div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 block">Especialidades (Serviços Atuantes)</label>
                                <div className="flex flex-wrap gap-2">
                                    {unitServices.map(s => {
                                        const isSelected = editBarber.specialties.includes(s.name);
                                        return (
                                            <button key={s.id} type="button" onClick={() => setEditBarber({...editBarber, specialties: isSelected ? editBarber.specialties.filter(spec => spec !== s.name) : [...editBarber.specialties, s.name]})} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-transparent border-gray-100 dark:border-gray-700 text-gray-400'}`}>{s.name}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}><Save size={20} /> Salvar Alterações</button>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL EDIÇÃO SERVIÇO */}
        {editService && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={saveService} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-tighter text-xl">Configurar Serviço</h3><button type="button" onClick={() => setEditService(null)}><X size={24} /></button></div>
                    <div className="p-10 space-y-6">
                        <div className="flex justify-center"><img src={editService.image} onClick={() => { const url = prompt('URL da Imagem:', editService.image); if(url) setEditService({...editService, image: url}) }} className="w-full h-32 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-gray-200 dark:border-gray-700" /></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Nome do Serviço</label><input required className={UI_STYLE.input} value={editService.name} onChange={e => setEditService({...editService, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Preço (R$)</label><input type="number" className={UI_STYLE.input} value={editService.price} onChange={e => setEditService({...editService, price: Number(e.target.value)})} /></div>
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Duração (Min)</label><input type="number" className={UI_STYLE.input} value={editService.duration} onChange={e => setEditService({...editService, duration: Number(e.target.value)})} /></div>
                        </div>
                        <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}><Save size={20} /> Salvar Serviço</button>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL EDIÇÃO PRODUTO */}
        {editProduct && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={saveProduct} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-black uppercase tracking-tighter text-xl">Configurar Produto</h3>
                        <button type="button" onClick={() => setEditProduct(null)}><X size={24} /></button>
                    </div>
                    <div className="p-10 overflow-y-auto space-y-6">
                        <div className="flex justify-center mb-4">
                            <img 
                                src={editProduct.image} 
                                onClick={() => { const url = prompt('URL da Imagem:', editProduct.image); if(url) setEditProduct({...editProduct, image: url}) }} 
                                className="w-full h-40 rounded-3xl object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-inner" 
                            />
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Nome do Produto</label>
                                <input required className={UI_STYLE.input} value={editProduct.name} onChange={e => setEditProduct({...editProduct, name: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Descrição Breve</label>
                                <textarea className={UI_STYLE.input + " !p-4 min-h-[80px] font-medium"} value={editProduct.description} onChange={e => setEditProduct({...editProduct, description: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Preço Venda (R$)</label>
                                    <input type="number" step="0.01" className={UI_STYLE.input} value={editProduct.price} onChange={e => setEditProduct({...editProduct, price: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Preço Custo (R$)</label>
                                    <input type="number" step="0.01" className={UI_STYLE.input} value={editProduct.costPrice || 0} onChange={e => setEditProduct({...editProduct, costPrice: Number(e.target.value)})} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Categoria</label>
                                    <input className={UI_STYLE.input} value={editProduct.category} onChange={e => setEditProduct({...editProduct, category: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Estoque (UN)</label>
                                    <input type="number" className={UI_STYLE.input} value={editProduct.stock} onChange={e => setEditProduct({...editProduct, stock: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>
                                <Save size={20} /> Salvar Produto
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL EDIÇÃO PLANO */}
        {editPlan && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={savePlan} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-black uppercase tracking-tighter text-xl">Configurar Plano de Assinatura</h3>
                        <button type="button" onClick={() => setEditPlan(null)}><X size={24} /></button>
                    </div>
                    <div className="p-10 overflow-y-auto space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Nome do Plano</label>
                                <input required className={UI_STYLE.input} value={editPlan.name} onChange={e => setEditPlan({...editPlan, name: e.target.value})} placeholder="Ex: Premium Gold" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Valor Mensal (R$)</label>
                                    <input type="number" step="0.01" className={UI_STYLE.input} value={editPlan.price} onChange={e => setEditPlan({...editPlan, price: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">% Desconto em Produtos</label>
                                    <input type="number" className={UI_STYLE.input} value={editPlan.discount} onChange={e => setEditPlan({...editPlan, discount: Number(e.target.value)})} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2 ml-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Benefícios Inclusos</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditPlan({...editPlan, benefits: [...editPlan.benefits, '']})}
                                        className="text-[9px] font-black uppercase text-amber-500 hover:underline"
                                    >
                                        + Adicionar Linha
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {editPlan.benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                className={UI_STYLE.input + " !py-3 !text-xs"} 
                                                value={benefit} 
                                                onChange={e => {
                                                    const newBenefits = [...editPlan.benefits];
                                                    newBenefits[idx] = e.target.value;
                                                    setEditPlan({...editPlan, benefits: newBenefits});
                                                }}
                                                placeholder="Ex: 4 cortes mensais"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setEditPlan({...editPlan, benefits: editPlan.benefits.filter((_, i) => i !== idx)})}
                                                className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                            >
                                                <MinusCircle size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    {editPlan.benefits.length === 0 && (
                                        <p className="text-[10px] text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl">Nenhum benefício listado ainda.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl">
                                <input 
                                    type="checkbox" 
                                    id="isPopular" 
                                    className="w-5 h-5 accent-amber-500"
                                    checked={editPlan.isPopular} 
                                    onChange={e => setEditPlan({...editPlan, isPopular: e.target.checked})} 
                                />
                                <label htmlFor="isPopular" className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 cursor-pointer">Destacar como plano mais popular</label>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>
                                <Save size={20} /> Salvar Plano de Assinatura
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL EDIÇÃO CAMPANHA MARKETING */}
        {editCampaign && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={saveCampaign} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <Megaphone className="text-amber-500" size={28} />
                            <h3 className="font-black uppercase tracking-tighter text-xl">Criativo de Campanha</h3>
                        </div>
                        <button type="button" onClick={() => setEditCampaign(null)}><X size={24} /></button>
                    </div>
                    <div className="p-10 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Tipo de Promoção</label>
                                <select className={UI_STYLE.input + " !py-4"} value={editCampaign.type} onChange={e => setEditCampaign({...editCampaign, type: e.target.value as any})}>
                                    <option value="PROMOTION">Promoção Geral</option>
                                    <option value="BIRTHDAY">Aniversário</option>
                                    <option value="COUPON">Cupom de Desconto</option>
                                    <option value="FLASH_SALE">Promoção Relâmpago</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Público Alvo</label>
                                <select className={UI_STYLE.input + " !py-4"} value={editCampaign.target} onChange={e => setEditCampaign({...editCampaign, target: e.target.value as any})}>
                                    <option value="ALL">Todos os Clientes</option>
                                    <option value="SUBSCRIBERS">Assinantes Ativos</option>
                                    <option value="SPECIFIC">Cliente Específico</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Título da Campanha</label>
                            <input required className={UI_STYLE.input} value={editCampaign.title} onChange={e => setEditCampaign({...editCampaign, title: e.target.value})} placeholder="Ex: Aniversário BarberPro - Seu Presente Chegou!" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Texto do Criativo (Mensagem)</label>
                            <textarea required className={UI_STYLE.input + " min-h-[150px] !p-6 leading-relaxed font-medium"} value={editCampaign.description} onChange={e => setEditCampaign({...editCampaign, description: e.target.value})} placeholder="Cole aqui o seu texto persuasivo..." />
                        </div>

                        {editCampaign.target === 'SPECIFIC' && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">ID do Cliente</label>
                                <input className={UI_STYLE.input} value={editCampaign.targetUserId || ''} onChange={e => setEditCampaign({...editCampaign, targetUserId: e.target.value})} placeholder="Busque por nome ou telefone..." />
                            </div>
                        )}

                        <div className="pt-4">
                            <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>
                                <Save size={20} /> Salvar Campanha no CRM
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL EDIÇÃO CUSTO/INSUMO */}
        {editCost && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                <form onSubmit={saveCost} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-sm overflow-hidden flex flex-col">
                    <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-black uppercase tracking-tighter text-xl">Gerir Insumo</h3>
                        <button type="button" onClick={() => setEditCost(null)}><X size={24} /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Descrição</label><input required className={UI_STYLE.input} value={editCost.name} onChange={e => setEditCost({...editCost, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Valor Total</label><input type="number" className={UI_STYLE.input} value={editCost.value} onChange={e => setEditCost({...editCost, value: Number(e.target.value)})} /></div>
                            <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 ml-2">Quantidade</label><input type="number" className={UI_STYLE.input} value={editCost.quantity} onChange={e => setEditCost({...editCost, quantity: Number(e.target.value)})} /></div>
                        </div>
                        <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>Salvar Registro</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};
