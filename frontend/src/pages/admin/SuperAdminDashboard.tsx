import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, Store, Users, Settings, Plus, Edit3, Trash2,
    Check, X, Search, Smartphone, MapPin, Layers,
    ShoppingBag, Package, PieChart, ArrowRight, UserPlus,
    ChevronRight, Save, Shield, Info, Lock, Zap, RefreshCw, Loader2,
    ToggleLeft, ToggleRight, ExternalLink, Building2
} from 'lucide-react';
import { Shop, User, UserRole } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useShop } from '../../context/ShopContext';
import { Button, Card, Input, Select } from '../../components/ui';
import { barbershopService, QuickSetupData } from '../../services/barbershopService';
import { userService } from '../../services/userService';
import { onboardingService } from '../../services/onboardingService';
import { authService } from '../../services/authService';

// Helper local para o ícone Rocket se não estiver no lucide
const RocketIcon = ({ size, className }: { size?: number, className?: string }) => (
    <Zap size={size} className={className} />
);

export const SuperAdminDashboard: React.FC = () => {
    const { addNotification } = useNotification();
    const { updateShopSettings } = useShop();
    
    const [shops, setShops] = useState<Shop[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [togglingShopId, setTogglingShopId] = useState<string | null>(null);
    const [isNewUnit, setIsNewUnit] = useState(false);
    const [newUnitData, setNewUnitData] = useState({ name: '', phone: '', address: '', ownerName: '', ownerEmail: '', ownerPassword: '' });

    const [activeTab, setActiveTab] = useState<'SHOPS' | 'USERS' | 'GLOBAL' | 'ACTIVATIONS'>('SHOPS');
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [editShop, setEditShop] = useState<Shop | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [isQuickSetup, setIsQuickSetup] = useState(false);
    
    const [quickSetupData, setQuickSetupData] = useState<QuickSetupData>({
        name: '',
        phone: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        servicesCount: 10,
        productsCount: 6,
        barbersCount: 4,
        plansCount: 3
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopsData, usersData, onboardingData] = await Promise.all([
                barbershopService.list(),
                userService.list(),
                onboardingService.listPendingRequests().catch(() => [])
            ]);
            // Converte minimamente para Shop do frontend se necessário
            // O ideal seria usar o convertBarbershopToShop do context, mas aqui listamos todas
            setShops(shopsData as any);
            setUsers(usersData);
            setPendingRequests(onboardingData);
        } catch (error) {
            console.error('Erro ao carregar dados do console master:', error);
            addNotification('error', 'Não foi possível carregar os dados do sistema.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Helper para mapear cores e nomes dos planos
    const getTierConfig = (tier: string | undefined) => {
        switch (tier) {
            case 'BASIC': return { label: 'Plano Basic', color: 'bg-gray-100 text-gray-600', icon: Shield };
            case 'PLUS': return { label: 'Plano Plus', color: 'bg-blue-50 text-blue-600', icon: Zap };
            case 'PRO': return { label: 'Plano Pro', color: 'bg-amber-50 text-amber-600', icon: ShieldCheck };
            case 'MASTER': return { label: 'Plano Master', color: 'bg-indigo-50 text-indigo-600', icon: RocketIcon };
            default: return { label: 'Sem Plano', color: 'bg-gray-50 text-gray-400', icon: Lock };
        }
    };

    const handleSaveShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editShop) return;

        const isNew = (editShop as any).id?.startsWith('new-');
        if (isNew) {
            addNotification('info', 'Use o Onboarding Rápido para novas barbearias.');
            return;
        }

        setSaving(true);
        try {
            // ── 1. Dados Básicos ──────────────────────────────────────────────
            // Envia APENAS os campos aceitos pelo UpdateBarbershopDto (whitelist explícita)
            const basicPayload: Record<string, any> = {};
            const basicFields = ['name', 'slug', 'cnpj', 'phone', 'whatsapp', 'email',
                'address', 'logo', 'logoUrl', 'bannerUrl', 'primaryColor',
                'openingTime', 'closingTime', 'intervalMinutes',
                'loyaltyEnabled', 'subscriptionEnabled',
                'socialInstagram', 'socialWhatsapp', 'socialGoogleReview',
                'vipBannerTitle', 'vipBannerText', 'settings'];

            for (const field of basicFields) {
                if ((editShop as any)[field] !== undefined) {
                    basicPayload[field] = (editShop as any)[field];
                }
            }
            // Remove modulesEnabled do settings (vai via endpoint próprio)
            if (basicPayload.settings?.modulesEnabled) {
                const { modulesEnabled, ...restSettings } = basicPayload.settings;
                basicPayload.settings = restSettings;
            }

            await barbershopService.update(editShop.id, basicPayload);

            // ── 2. Assinatura (plano + limite de membros) ─────────────────────
            const tier = (editShop as any).subscriptionTier;
            const maxMembers = (editShop as any).maxTeamMembers;
            if (tier || maxMembers !== undefined) {
                await barbershopService.updateSubscription(editShop.id, {
                    ...(tier && { subscriptionTier: tier }),
                    ...(maxMembers !== undefined && { maxTeamMembers: maxMembers }),
                });
            }

            // ── 3. Módulos / Recursos liberados ───────────────────────────────
            const modulesEnabled = (editShop as any).modulesEnabled;
            if (modulesEnabled !== undefined) {
                await barbershopService.updateModuleSettings(editShop.id, modulesEnabled);
            }

            updateShopSettings(editShop);
            addNotification('success', `Unidade ${editShop.name} atualizada com sucesso!`);
            setEditShop(null);
            loadData();
        } catch (error: any) {
            const msg = error?.response?.data?.message;
            addNotification('error', msg || 'Erro ao salvar configurações da unidade.');
        } finally {
            setSaving(false);
        }
    };


    const onTierChange = (tier: string) => {
        if (!editShop) return;
        
        let maxMembers = 2;
        if (tier === 'PLUS') maxMembers = 6;
        if (tier === 'PRO') maxMembers = 20;
        if (tier === 'MASTER') maxMembers = 999;

        setEditShop({
            ...editShop,
            subscriptionTier: tier,
            maxTeamMembers: maxMembers
        } as any);
    };

    const handleQuickSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quickSetupData.ownerPassword && quickSetupData.ownerPassword.length < 6) {
            addNotification('error', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setSaving(true);
        try {
            await barbershopService.quickSetup(quickSetupData);
            addNotification('success', `Barbearia ${quickSetupData.name} criada e configurada com sucesso!`);
            setIsQuickSetup(false);
            // Reset form
            setQuickSetupData({
                name: '',
                phone: '',
                ownerName: '',
                ownerEmail: '',
                ownerPassword: '',
                servicesCount: 10,
                productsCount: 6,
                barbersCount: 4,
                plansCount: 3
            });
            loadData();
        } catch (error: any) {
            addNotification('error', error.response?.data?.message || 'Erro ao realizar setup rápido.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        
        setSaving(true);
        try {
            const isNew = editUser.id.startsWith('new-');
            const password = (editUser as any).password;
            
            if (isNew) {
                if (!password || password.length < 6) {
                    addNotification('error', 'A senha predefinida precisa ter pelo menos 6 caracteres.');
                    setSaving(false);
                    return;
                }
                await userService.create({
                    name: editUser.name,
                    email: editUser.email || '',
                    role: editUser.role,
                    shopId: editUser.shopId,
                    password: password
                });
                addNotification('success', 'Novo gestor criado com sucesso.');
            } else {
                // Clean payload for update (whitelist fields)
                const updatePayload: any = {
                    name: editUser.name,
                    email: editUser.email,
                    role: editUser.role,
                    shopId: editUser.shopId,
                    active: editUser.active
                };
                
                if (password) {
                    if (password.length < 6) {
                        addNotification('error', 'Se for alterar a senha, ela precisa ter pelo menos 6 caracteres.');
                        setSaving(false);
                        return;
                    }
                    updatePayload.password = password;
                }
                
                await userService.update(editUser.id, updatePayload);
                addNotification('success', 'Perfil de operador atualizado.');
            }
            setEditUser(null);
            loadData();
        } catch (error: any) {
            const msg = error?.response?.data?.message;
            addNotification('error', Array.isArray(msg) ? msg[0] : msg || 'Erro ao salvar usuário.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Deseja realmente REMOVER PERMANENTEMENTE o acesso de ${name}?`)) return;
        
        try {
            await userService.hardDelete(id);
            addNotification('success', 'Operador removido do sistema.');
            loadData();
        } catch (error) {
            addNotification('error', 'Erro ao remover operador.');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // No backend o campo é 'active'
            await barbershopService.updateStatus(id, !currentStatus);
            addNotification('success', `Unidade ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`);
            loadData();
        } catch (error) {
            addNotification('error', 'Erro ao alterar status da unidade.');
        }
    };

    const handleManageShop = async (shopId: string) => {
        try {
            const data = await barbershopService.switch(shopId);
            
            // Salvar novos tokens e dados do usuário (com o novo shopId)
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('barber_user', JSON.stringify(data.user));
            
            // Carregar módulos habilitados da nova barbearia
            try {
                await authService.fetchEnabledModules(data.user.shopId);
            } catch (e) {
                console.warn('Erro ao carregar módulos na troca:', e);
            }
            
            addNotification('success', `Entrando na gestão da unidade: ${data.shop.name}`);
            
            // Redirecionar para o dashboard principal
            // Usamos window.location para forçar o recarregamento dos contextos com o novo shopId do token
            window.location.href = '/dashboard';
        } catch (error) {
            addNotification('error', 'Erro ao acessar gestão da unidade.');
        }
    };

    if (loading && shops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={48} className="text-tenant-primary animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest text-gray-400">Carregando Console Master...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pb-32 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-gray-900 rounded-[35px] shadow-2xl border-4 border-tenant-primary/20">
                        <ShieldCheck size={42} className="text-tenant-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter dark:text-white leading-none">Console Master</h1>
                        <p className="text-[10px] font-black text-tenant-primary uppercase tracking-widest mt-2">Gestão de SaaS & Multi-Tenancy</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={loadData} className="rounded-full p-3 h-12 w-12 flex items-center justify-center">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <div className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-[30px] shadow-xl border dark:border-gray-700">
                        <button onClick={() => setActiveTab('SHOPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SHOPS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-tenant-primary'}`}>Unidades</button>
                        <button onClick={() => setActiveTab('ACTIVATIONS')} className={`relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVATIONS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-tenant-primary'}`}>
                            Ativações
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tenant-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-tenant-primary text-[8px] items-center justify-center text-white">
                                        {pendingRequests.length}
                                    </span>
                                </span>
                            )}
                        </button>
                        <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-tenant-primary'}`}>Operadores</button>
                    </div>
                </div>
            </div>

            {activeTab === 'SHOPS' && (
                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Rede de Barbearias</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Configure permissões e limites por unidade</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" onClick={() => setIsNewUnit(true)}>
                                <Building2 size={20} /> Nova Unidade
                            </Button>
                            <Button variant="secondary" className="bg-tenant-primary/10 border-tenant-primary/20 text-tenant-primary hover:bg-tenant-primary/20" onClick={() => setIsQuickSetup(true)}>
                                <Zap size={20} /> Onboarding Rápido
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {shops.map(s => (
                            <Card key={s.id} hover className="p-8 flex flex-col shadow-xl">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="relative group/img">
                                            <img src={s.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200'} className={`w-24 h-24 rounded-[35px] object-cover shadow-2xl transition-all duration-500 ${(s as any).active === false ? 'grayscale opacity-70 group-hover/img:grayscale-0' : ''}`} />
                                            {s.logoUrl && <img src={s.logoUrl} className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 object-contain bg-white ${(s as any).active === false ? 'grayscale' : ''}`} />}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase dark:text-white leading-none">{s.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getTierConfig((s as any).subscriptionTier).color}`}>
                                                    {React.createElement(getTierConfig((s as any).subscriptionTier).icon, { size: 10 })}
                                                    {getTierConfig((s as any).subscriptionTier).label}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.address ? s.address.split(',')[0] : 'Endereço não informado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditShop(s)} className="p-4 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-tenant-primary rounded-2xl transition-all">
                                        <Settings size={22} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-8">
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${(s as any).modulesEnabled?.products ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <ShoppingBag size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Loja</span>
                                    </div>
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${(s as any).modulesEnabled?.reports ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <PieChart size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Dash</span>
                                    </div>
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${(s as any).modulesEnabled?.clientPlans ? 'bg-tenant-primary/5 border-tenant-primary/10 text-tenant-primary' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <Layers size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Planos</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-wrap justify-between items-center gap-3 pt-6 border-t dark:border-gray-700">
                                    <div className="flex gap-4">
                                        <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5 tracking-tighter">ID</p><p className="text-[10px] font-mono dark:text-white">{s.id.split('-')[0]}...</p></div>
                                        <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5 tracking-tighter">Fone</p><p className="text-[10px] font-bold dark:text-white">{s.phone}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Toggle de Status */}
                                        <button
                                            onClick={async () => {
                                                setTogglingShopId(s.id);
                                                await toggleStatus(s.id, (s as any).active !== false);
                                                setTogglingShopId(null);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                (s as any).active !== false
                                                    ? 'bg-green-50 border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                                    : 'bg-red-50 border-red-200 text-red-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                                            }`}
                                            title={(s as any).active !== false ? 'Clique para desativar' : 'Clique para ativar'}
                                        >
                                            {togglingShopId === s.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (s as any).active !== false ? (
                                                <><ToggleRight size={14} /> Ativa</>
                                            ) : (
                                                <><ToggleLeft size={14} /> Inativa</>
                                            )}
                                        </button>
                                        {/* Botão Administrar */}
                                        <button
                                            onClick={() => handleManageShop(s.id)}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-tenant-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                                            title="Entrar como administrador desta unidade"
                                        >
                                            <ExternalLink size={12} /> Administrar
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'ACTIVATIONS' && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Solicitações de Ativação</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-1">Valide pagamentos PIX e libere o acesso dos parceiros</p>
                    </div>

                    <Card className="overflow-hidden border-orange-100 shadow-orange-900/5">
                        {pendingRequests.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <Check size={48} className="text-gray-200" />
                                <p className="text-sm font-black uppercase tracking-widest text-gray-300">Nenhuma ativação pendente</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-orange-500 text-white">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Unidade / Solicitante</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Plano / Valor</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Data Solicitação</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Ações de Ativação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {pendingRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-orange-50/30 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="p-6">
                                                <div>
                                                    <p className="font-black uppercase text-sm dark:text-white leading-none mb-2">{req.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                        {req.users?.[0]?.name} • {req.users?.[0]?.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getTierConfig(req.subscriptionTier).color}`}>
                                                        {req.subscriptionTier}
                                                    </span>
                                                    <span className="text-xs font-black dark:text-white">
                                                        R$ {req.subscriptionTier === 'BASIC' ? '65,00' : req.subscriptionTier === 'PLUS' ? '75,00' : '115,00'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-xs font-bold text-gray-400 uppercase">
                                                {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center gap-3">
                                                    <button 
                                                        onClick={async () => {
                                                            if (!window.confirm('Confirmar ativação e liberação de acesso?')) return;
                                                            try {
                                                                await onboardingService.approveRequest(req.id);
                                                                addNotification('success', 'Barbearia ativada com sucesso!');
                                                                loadData();
                                                            } catch (error) {
                                                                addNotification('error', 'Erro ao ativar barbearia.');
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md"
                                                    >
                                                        <Check size={14} /> Ativar
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (!window.confirm('Inativar esta solicitação definitivamente?')) return;
                                                            try {
                                                                await onboardingService.rejectRequest(req.id);
                                                                addNotification('info', 'Solicitação inativada.');
                                                                loadData();
                                                            } catch (error) {
                                                                addNotification('error', 'Erro ao inativar.');
                                                            }
                                                        }}
                                                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                                        title="Inativar"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'USERS' && (
                <div className="space-y-10 animate-fade-in">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Operadores do Sistema</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Gerencie quem gerencia as unidades</p>
                        </div>
                        <Button variant="primary" onClick={() => setEditUser({ id: `new-${Date.now()}`, name: '', email: '', phone: '', role: UserRole.ADMIN } as any)}>
                            <UserPlus size={20} /> Novo Gestor
                        </Button>
                    </div>

                    <Card className="overflow-hidden border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-white">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest">Usuário</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest">Cargo / Permissão</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest">Unidade Alvo</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-100" />
                                                <div><p className="font-black uppercase text-sm dark:text-white leading-none mb-1">{u.name}</p><p className="text-xs text-gray-400 font-medium">{u.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.SUPER_ADMIN ? 'bg-black text-white' : u.role === UserRole.ADMIN ? 'bg-tenant-primary text-white' : 'bg-blue-100 text-blue-600'}`}>{u.role}</span>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-gray-500 dark:text-gray-400">
                                            {u.shopId ? shops.find(s => s.id === u.shopId)?.name : 'Acesso Global'}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setEditUser(u)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-tenant-primary rounded-xl transition-all" title="Editar"><Edit3 size={18} /></button>
                                                <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all" title="Remover"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* Modal Nova Unidade */}
            {isNewUnit && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setSaving(true);
                            try {
                                await barbershopService.create({
                                    name: newUnitData.name,
                                    phone: newUnitData.phone,
                                    address: newUnitData.address,
                                    ownerName: newUnitData.ownerName,
                                    ownerEmail: newUnitData.ownerEmail,
                                    ownerPassword: newUnitData.ownerPassword,
                                });
                                addNotification('success', `Unidade "${newUnitData.name}" criada com sucesso!`);
                                setIsNewUnit(false);
                                setNewUnitData({ name: '', phone: '', address: '', ownerName: '', ownerEmail: '', ownerPassword: '' });
                                loadData();
                            } catch (error: any) {
                                addNotification('error', error.message || 'Erro ao criar unidade.');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border dark:border-gray-700 my-8"
                    >
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/10 rounded-[20px]"><Building2 size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Nova Unidade</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cadastro básico de barbearia</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsNewUnit(false)}><X size={32} /></button>
                        </div>

                        <div className="p-10 space-y-10 max-h-[75vh] overflow-y-auto text-left">
                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">1. Dados da Barbearia</h4>
                                <Input label="Nome da Barbearia" placeholder="Ex: Barber Studio Centro" required value={newUnitData.name} onChange={e => setNewUnitData({ ...newUnitData, name: e.target.value })} fullWidth />
                                <Input label="Telefone de Contato" placeholder="(11) 99999-9999" required value={newUnitData.phone} onChange={e => setNewUnitData({ ...newUnitData, phone: e.target.value })} fullWidth />
                                <Input label="Endereço (Opcional)" placeholder="Rua, Número, Bairro" value={newUnitData.address} onChange={e => setNewUnitData({ ...newUnitData, address: e.target.value })} fullWidth />
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">2. Conta do Administrador</h4>
                                <Input label="Nome Completo do Dono" placeholder="Ex: João da Silva" required value={newUnitData.ownerName} onChange={e => setNewUnitData({ ...newUnitData, ownerName: e.target.value })} fullWidth />
                                <Input label="E-mail de Acesso" type="email" placeholder="admin@barbearia.com" required value={newUnitData.ownerEmail} onChange={e => setNewUnitData({ ...newUnitData, ownerEmail: e.target.value })} fullWidth />
                                <Input label="Senha Temporária" type="password" placeholder="Mínimo 6 caracteres" required value={newUnitData.ownerPassword} onChange={e => setNewUnitData({ ...newUnitData, ownerPassword: e.target.value })} fullWidth />
                            </div>

                            <Button type="submit" variant="primary" size="lg" fullWidth disabled={saving}>
                                {saving ? <Loader2 size={24} className="animate-spin" /> : <><Building2 size={20} className="mr-2" /> Criar Unidade</>}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Onboarding Rápido */}
            {isQuickSetup && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <form onSubmit={handleQuickSetup} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border dark:border-gray-700 my-8">
                        <div className="p-8 bg-tenant-primary text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/20 rounded-[20px] backdrop-blur-sm"><Zap size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Onboarding Rápido</h3>
                                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Criação prática com Inteligência de Dados</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsQuickSetup(false)}><X size={32} /></button>
                        </div>

                        <div className="p-10 space-y-12 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">1. Sobre a Barbearia</h4>
                                    <div className="space-y-4">
                                        <Input label="Nome da Barbearia" placeholder="Ex: Barber Tech" required value={quickSetupData.name} onChange={e => setQuickSetupData({ ...quickSetupData, name: e.target.value })} fullWidth />
                                        <Input label="Telefone de Contato" placeholder="(11) 99999-9999" required value={quickSetupData.phone} onChange={e => setQuickSetupData({ ...quickSetupData, phone: e.target.value })} fullWidth />
                                        <Input label="Endereço (Opcional)" placeholder="Rua, Número, Bairro" value={quickSetupData.address || ''} onChange={e => setQuickSetupData({ ...quickSetupData, address: e.target.value })} fullWidth />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">2. Conta do Administrador</h4>
                                    <div className="space-y-4">
                                        <Input label="Nome Completo" placeholder="Nome do Dono" required value={quickSetupData.ownerName} onChange={e => setQuickSetupData({ ...quickSetupData, ownerName: e.target.value })} fullWidth />
                                        <Input label="E-mail de Acesso" placeholder="admin@email.com" type="email" required value={quickSetupData.ownerEmail} onChange={e => setQuickSetupData({ ...quickSetupData, ownerEmail: e.target.value })} fullWidth />
                                        <Input label="Senha Temporária" placeholder="Mínimo 6 caracteres" type="password" required value={quickSetupData.ownerPassword || ''} onChange={e => setQuickSetupData({ ...quickSetupData, ownerPassword: e.target.value })} fullWidth />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t dark:border-gray-700 text-left">
                                <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em] mb-8">3. Automação de Conteúdo</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[30px] space-y-3">
                                        <p className="text-[9px] font-black uppercase text-gray-400 text-center">Serviços</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <input type="number" min="0" max="20" className="w-16 bg-white dark:bg-gray-800 border-none rounded-xl text-center font-black py-2" value={quickSetupData.servicesCount} onChange={e => setQuickSetupData({ ...quickSetupData, servicesCount: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[30px] space-y-3">
                                        <p className="text-[9px] font-black uppercase text-gray-400 text-center">Produtos</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <input type="number" min="0" max="20" className="w-16 bg-white dark:bg-gray-800 border-none rounded-xl text-center font-black py-2" value={quickSetupData.productsCount} onChange={e => setQuickSetupData({ ...quickSetupData, productsCount: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[30px] space-y-3">
                                        <p className="text-[9px] font-black uppercase text-gray-400 text-center">Barbeiros</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <input type="number" min="0" max="10" className="w-16 bg-white dark:bg-gray-800 border-none rounded-xl text-center font-black py-2" value={quickSetupData.barbersCount} onChange={e => setQuickSetupData({ ...quickSetupData, barbersCount: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[30px] space-y-3">
                                        <p className="text-[9px] font-black uppercase text-gray-400 text-center">Planos Clientes</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <input type="number" min="0" max="5" className="w-16 bg-white dark:bg-gray-800 border-none rounded-xl text-center font-black py-2" value={quickSetupData.plansCount} onChange={e => setQuickSetupData({ ...quickSetupData, plansCount: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button type="submit" variant="primary" size="lg" fullWidth disabled={saving}>
                                    {saving ? <Loader2 size={24} className="animate-spin" /> : <><RocketIcon size={24} className="mr-2" /> Iniciar Lançamento da Unidade</>}
                                </Button>
                                <p className="text-[9px] text-center font-bold text-gray-400 uppercase mt-4 tracking-widest">A nova barbearia estará ativa imediatamente após a criação</p>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Editar Unidade */}
            {editShop && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <form onSubmit={handleSaveShop} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border dark:border-gray-700 my-8">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-tenant-primary rounded-[20px]"><Settings size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Configuração de Unidade</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tenant Level Settings</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setEditShop(null)}><X size={32} /></button>
                        </div>

                        <div className="p-10 space-y-12 max-h-[75vh] overflow-y-auto text-left">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">1. Informações Básicas</h4>
                                    <div className="space-y-4">
                                        <Input label="Nome da Unidade" required value={editShop.name} onChange={e => setEditShop({ ...editShop, name: e.target.value })} fullWidth />
                                        <Input label="Endereço Completo" required value={editShop.address || ''} onChange={e => setEditShop({ ...editShop, address: e.target.value })} fullWidth />
                                        <Input label="URL da Imagem de Capa" value={editShop.image || ''} onChange={e => setEditShop({ ...editShop, image: e.target.value })} fullWidth />
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 ml-4">Cor Primária (White Label)</label>
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl">
                                                <input
                                                    type="color"
                                                    value={editShop.primaryColor || '#f59e0b'}
                                                    onChange={e => setEditShop({ ...editShop, primaryColor: e.target.value })}
                                                    className="h-10 w-20 cursor-pointer rounded-xl bg-transparent border-0 p-0"
                                                />
                                                <span className="text-sm font-black uppercase text-gray-400">{editShop.primaryColor || '#f59e0b'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em]">2. Plano & Assinatura (KlypBarber)</h4>
                                    
                                    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-[35px] border-2 border-dashed dark:border-gray-700">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 block">Nivel de Assinatura</label>
                                            <Select 
                                                value={(editShop as any).subscriptionTier || 'BASIC'} 
                                                onChange={e => onTierChange(e.target.value)} 
                                                fullWidth
                                            >
                                                <option value="BASIC">KlypBarber BASIC (Até 2 Prof.)</option>
                                                <option value="PLUS">KlypBarber PLUS (Até 6 Prof.)</option>
                                                <option value="PRO">KlypBarber PRO (Até 20 Prof.)</option>
                                                <option value="MASTER">KlypBarber MASTER (Ilimitado)</option>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 block">Limite de Profissionais (Time)</label>
                                            <Input 
                                                type="number" 
                                                value={(editShop as any).maxTeamMembers || 2} 
                                                onChange={e => setEditShop({ ...editShop, maxTeamMembers: parseInt(e.target.value) } as any)} 
                                                fullWidth 
                                                placeholder="Ex: 5"
                                            />
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 ml-4 uppercase">Este limite trava a criação de novos profissionais na unidade</p>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-black uppercase text-tenant-primary tracking-[0.3em] pt-4">3. Liberação de Recursos</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { label: 'Loja de Produtos', key: 'products', icon: ShoppingBag },
                                            { label: 'Relatórios & Financeiro', key: 'reports', icon: PieChart },
                                            { label: 'Planos de Assinatura', key: 'clientPlans', icon: Layers },
                                            { label: 'Fluxo de Caixa', key: 'cashier', icon: Package }
                                        ].map(feature => {
                                            // modulesEnabled vem como campo direto do Barbershop no backend
                                            const modulesEnabled = (editShop as any).modulesEnabled as any;
                                            const isEnabled = modulesEnabled?.[feature.key];
                                            return (
                                                <button
                                                    key={feature.key}
                                                    type="button"
                                                    onClick={() => setEditShop({
                                                        ...editShop,
                                                        modulesEnabled: {
                                                            ...modulesEnabled,
                                                            [feature.key]: !isEnabled
                                                        }
                                                    } as any)}
                                                    className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${isEnabled ? 'border-tenant-primary bg-tenant-primary/5/50 dark:bg-tenant-primary/10' : 'border-gray-50 dark:border-gray-750 grayscale opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-tenant-primary text-white' : 'bg-gray-100 text-gray-400'}`}><feature.icon size={20} /></div>
                                                        <span className="font-black uppercase text-[10px] tracking-widest dark:text-white">{feature.label}</span>
                                                    </div>
                                                    {isEnabled ? <Check size={20} className="text-tenant-primary" /> : <Lock size={20} className="text-gray-300" />}
                                                </button>
                                            )
                                        })}
                                    </div>

                                </div>
                            </div>

                            <div className="pt-12">
                                <Button type="submit" variant="primary" size="lg" fullWidth disabled={saving}>
                                    {saving ? <Loader2 size={24} className="animate-spin" /> : <><Save size={24} className="mr-2" /> Salvar Configurações Master</>}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Editar Usuário */}
            {editUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <form onSubmit={handleSaveUser} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border dark:border-gray-700">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-500 rounded-[20px]"><Users size={24} /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Gestão de Permissões</h3>
                            </div>
                            <button type="button" onClick={() => setEditUser(null)}><X size={32} /></button>
                        </div>

                        <div className="p-10 space-y-8 text-left">
                            <div className="space-y-4">
                                <Input label="Nome do Operador" required value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} fullWidth />
                                
                                <Input label="E-mail de Acesso" type="email" required value={editUser.email || ''} onChange={e => setEditUser({ ...editUser, email: e.target.value })} fullWidth />
                                
                                <Input label={editUser.id.startsWith('new-') ? 'Senha de Acesso' : 'Nova Senha (opcional)'} type="password" placeholder={editUser.id.startsWith('new-') ? 'Mínimo 6 caracteres' : 'Deixe em branco para manter a atual'} value={(editUser as any).password || ''} onChange={e => setEditUser({ ...editUser, password: e.target.value } as any)} fullWidth required={editUser.id.startsWith('new-')} />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 block">Cargo (Nível de Acesso)</label>
                                    <Select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as any })} fullWidth>
                                        <option value={UserRole.ADMIN}>Administrador de Unidade</option>
                                        <option value={UserRole.BARBER}>Barbeiro Profissional</option>
                                        <option value={UserRole.CLIENT}>Cliente Comum</option>
                                        <option value={UserRole.SUPER_ADMIN}>Super Admin Global</option>
                                    </Select>
                                </div>

                                {editUser.role !== UserRole.SUPER_ADMIN && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-4 block">Vincular à Unidade</label>
                                        <Select value={editUser.shopId || ''} onChange={e => setEditUser({ ...editUser, shopId: e.target.value })} fullWidth>
                                            <option value="">Sem vínculo específico</option>
                                            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" variant="secondary" size="lg" fullWidth disabled={saving}>
                                {saving ? <Loader2 size={24} className="animate-spin" /> : <><Shield className="text-tenant-primary mr-2" size={20} /> Aplicar Permissões</>}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
