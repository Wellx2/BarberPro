import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, Scissors, ShoppingBag, Layers,
  Calculator, Settings, Package, Info, Clock,
  Menu, MoreHorizontal, Share2, Store, ShieldCheck
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { Container } from '../../components/layout/Container';
import { ShopSelector } from '../../components/ShopSelector';
import { FinancialTab } from './FinancialTab';
import { TeamTab } from './TeamTab';
import { ServicesTab } from './ServicesTab';
import { ProductsTab } from './ProductsTab';
import { StockTab } from './StockTab';
import { PlansTab } from './PlansTab';
import { SubscriptionTab } from './SubscriptionTab';
import { SettingsTab } from './SettingsTab';
import { Cashier } from './Cashier';
import { Supplies } from './Supplies';
import AdminAppointmentHistory from './AdminAppointmentHistory';
import { BarberScheduleView } from '../../components/admin/BarberScheduleView';

const getTabs = (hasBarberId: boolean, shop: any) => {
  const { features } = shop.subscription || {};
  const modules = shop.settings?.modulesEnabled || {};

  const baseTabs = [
    { id: 'FINANCIAL', label: 'Financeiro', icon: DollarSign, short: 'Grana', enabled: features?.hasFinancialDashboard && modules?.financial },
    { id: 'CASHIER', label: 'Caixa Operacional', icon: Calculator, short: 'Caixa', enabled: features?.hasCashier && modules?.cashier },
    { id: 'BARBERS', label: 'Equipe', icon: Users, short: 'Equipe', enabled: true },
    { id: 'SERVICES', label: 'Serviços', icon: Scissors, short: 'Serviços', enabled: true },
    { id: 'PRODUCTS', label: 'Produtos', icon: ShoppingBag, short: 'Itens', enabled: features?.hasProducts && modules?.products },
    { id: 'STOCK', label: 'Estoque', icon: Package, short: 'Estoque', enabled: features?.hasInventory && modules?.products },
    { id: 'SUPPLIES', label: 'Insumos', icon: Layers, short: 'Insumos', enabled: features?.hasInventory && modules?.financial },
    { id: 'HISTORY', label: 'Histórico', icon: Clock, short: 'Agenda', enabled: true },
    { id: 'PLANS', label: 'Planos', icon: Info, short: 'Planos', enabled: modules?.clientPlans },
    { id: 'SUBSCRIPTION', label: 'Assinatura', icon: ShieldCheck, short: 'Assinatura', enabled: true },
    { id: 'SETTINGS', label: 'Configurações', icon: Settings, short: 'Config', enabled: true },
  ].filter(t => t.enabled !== false);

  if (hasBarberId) {
    return [
      { id: 'MY_SCHEDULE', label: 'Minha Agenda', icon: Clock, short: 'Minha Agenda' },
      ...baseTabs
    ];
  }

  return baseTabs;
};


export const AdminDashboard: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { user } = useAuth();
  
  const hasBarberId = !!user?.barberId;
  const TABS = getTabs(hasBarberId, currentShop);
  const MOBILE_PRIMARY = TABS.slice(0, 4);
  const MOBILE_OVERFLOW = TABS.slice(4);

  // Selecionar a primeira aba disponível como padrão se não for barbeiro
  const defaultTab = hasBarberId ? 'MY_SCHEDULE' : (TABS.length > 0 ? TABS[0].id : 'SETTINGS');

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showShopSelector, setShowShopSelector] = useState(false);

  // Validar se a aba ativa ainda está disponível (caso mude o plano em runtime)
  React.useEffect(() => {
    const isTabEnabled = TABS.some(t => t.id === activeTab) || activeTab === 'MY_SCHEDULE';
    if (!isTabEnabled) {
      const fallbackTab = hasBarberId ? 'MY_SCHEDULE' : TABS[0]?.id;
      if (fallbackTab && fallbackTab !== activeTab) {
        setActiveTab(fallbackTab);
      }
    }
  }, [activeTab, TABS, hasBarberId]);

  const renderTabById = (id: string) => {
    switch (id) {
      case 'FINANCIAL': return <FinancialTab />;
      case 'CASHIER': return <Cashier />;
      case 'BARBERS': return <TeamTab />;
      case 'SERVICES': return <ServicesTab />;
      case 'PRODUCTS': return <ProductsTab />;
      case 'STOCK': return <StockTab />;
      case 'SUPPLIES': return <Supplies />;
      case 'HISTORY': return <AdminAppointmentHistory />;
      case 'PLANS': return <PlansTab />;
      case 'SUBSCRIPTION': return <SubscriptionTab />;
      case 'SETTINGS': return <SettingsTab />;
      default: return <SettingsTab />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'MY_SCHEDULE': return <BarberScheduleView barberId={user?.barberId || ''} userName={user?.name || ''} />;
      case 'FINANCIAL': return <FinancialTab />;
      case 'CASHIER': return <Cashier />;
      case 'BARBERS': return <TeamTab />;
      case 'SERVICES': return <ServicesTab />;
      case 'PRODUCTS': return <ProductsTab />;
      case 'STOCK': return <StockTab />;
      case 'SUPPLIES': return <Supplies />;
      case 'HISTORY': return <AdminAppointmentHistory />;
      case 'PLANS': return <PlansTab />;
      case 'SUBSCRIPTION': return <SubscriptionTab />;
      case 'SETTINGS': return <SettingsTab />;
      default: return hasBarberId 
        ? <BarberScheduleView barberId={user?.barberId || ''} userName={user?.name || ''} /> 
        : (TABS.length > 0 ? renderTabById(TABS[0].id) : <SettingsTab />);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-0">
      <Container className="pt-6 lg:pt-8">
        {/* Header Responsivo */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tenant-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-tenant-primary/20">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Painel Administrativo</h1>
              <div 
                onClick={() => setShowShopSelector(true)}
                className="flex items-center gap-2 text-tenant-primary font-bold text-xs uppercase cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="truncate max-w-[150px] sm:max-w-[250px]">{currentShop.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-tenant-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* User Profile / Logout (Desktop) */}
          <div className="hidden sm:flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-400">
               {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="pr-2">
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{user?.role === 'ADMIN' ? 'Proprietário' : 'Administrador'}</p>
            </div>
          </div>
        </header>

        {/* Banner Voltar ao Console Master - apenas para SUPER_ADMIN */}
        {user?.role === 'SUPER_ADMIN' && (
          <div
            onClick={() => { window.location.href = '/admin/super'; }}
            className="flex items-center justify-between gap-3 mb-6 px-5 py-3 bg-gray-900 text-white rounded-2xl cursor-pointer hover:bg-tenant-primary transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-tenant-primary group-hover:text-white transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest">Modo Gestor de Unidade &mdash; Clique para voltar ao Console Master</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">&#x2190; Voltar</span>
          </div>
        )}

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex flex-wrap gap-2 mb-8 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-tenant-primary text-white shadow-lg shadow-tenant-primary/20 scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content Area */}
        <main className="min-h-[500px] pb-24 lg:pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderTabContent()}
        </main>

        {/* Mobile Navbar Fixa */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-50">
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
              >
                {activeTab === tab.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-tenant-primary" />
                )}
                <tab.icon size={20} className="transition-transform duration-200" style={{ transform: activeTab === tab.id ? 'scale(1.15)' : 'scale(1)' }} />
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{tab.short}</span>
              </button>
            ))}

            <button
              onClick={() => setShowMobileMenu(prev => !prev)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative touch-manipulation ${
                showMobileMenu || MOBILE_OVERFLOW.some(t => t.id === activeTab)
                  ? 'text-tenant-primary'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700'
              }`}
            >
              {(showMobileMenu || MOBILE_OVERFLOW.some(t => t.id === activeTab)) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-tenant-primary" />
              )}
              <MoreHorizontal size={20} className={`transition-transform duration-300 ${showMobileMenu ? 'rotate-90' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Mais</span>
            </button>
          </div>
        </nav>

        {/* Mobile Overflow Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-40 lg:hidden pointer-events-none">
            <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => setShowMobileMenu(false)} />
            <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border border-gray-100 dark:border-gray-800 pointer-events-auto">
              <div className="grid grid-cols-3 gap-4">
                {MOBILE_OVERFLOW.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-tenant-primary/10 text-tenant-primary scale-[1.05]'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`p-4 rounded-2xl ${activeTab === tab.id ? 'bg-tenant-primary text-white shadow-lg shadow-tenant-primary/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <tab.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shop Selector Modal */}
        {showShopSelector && (
          <ShopSelector 
            isOpen={showShopSelector}
            onClose={() => setShowShopSelector(false)}
          />
        )}
      </Container>
    </div>
  );
};
