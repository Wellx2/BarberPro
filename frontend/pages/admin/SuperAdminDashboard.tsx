
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Store, Users, Settings, Plus, Edit3, Trash2, 
  Check, X, Search, Smartphone, MapPin, Layers, 
  ShoppingBag, Package, PieChart, ArrowRight, UserPlus, 
  ChevronRight, Save, Shield, Info, Lock
} from 'lucide-react';
import { Shop, User, UserRole } from '../../types';
import { MOCK_SHOPS, MOCK_USERS, UI_STYLE } from '../../constants';
import { useNotification } from '../../context/NotificationContext';
import { useShop } from '../../context/ShopContext';

export const SuperAdminDashboard: React.FC = () => {
    const { addNotification } = useNotification();
    const { updateShopSettings, createShop } = useShop();
    const [shops, setShops] = useState<Shop[]>(() => JSON.parse(localStorage.getItem('shops') || JSON.stringify(MOCK_SHOPS)));
    const [users, setUsers] = useState<User[]>(() => {
        const stored = localStorage.getItem('global_users');
        if (stored) return JSON.parse(stored);
        return Object.values(MOCK_USERS);
    });

    const [activeTab, setActiveTab] = useState<'SHOPS' | 'USERS' | 'GLOBAL'>('SHOPS');
    const [editShop, setEditShop] = useState<Shop | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveShop = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editShop) return;

        const isNew = editShop.id.startsWith('new-');
        const updatedShop = isNew ? { ...editShop, id: `shop-${Date.now()}` } : editShop;
        
        const newShopsList = isNew ? [...shops, updatedShop] : shops.map(s => s.id === updatedShop.id ? updatedShop : s);
        setShops(newShopsList);
        localStorage.setItem('shops', JSON.stringify(newShopsList));
        
        if (isNew) createShop(updatedShop);
        else updateShopSettings(updatedShop);

        setEditShop(null);
        addNotification('success', `Unidade ${updatedShop.name} configurada!`);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        const isNew = editUser.id.startsWith('new-');
        const updatedUser = isNew ? { ...editUser, id: `u-${Date.now()}` } : editUser;
        const newUsersList = isNew ? [...users, updatedUser] : users.map(u => u.id === updatedUser.id ? updatedUser : u);
        setUsers(newUsersList);
        localStorage.setItem('global_users', JSON.stringify(newUsersList));
        setEditUser(null);
        addNotification('success', 'Perfil de operador atualizado.');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pb-32 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-gray-900 rounded-[35px] shadow-2xl border-4 border-amber-500/20">
                        <ShieldCheck size={42} className="text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter dark:text-white leading-none">Console Master</h1>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2">Gestão de SaaS & Multi-Tenancy</p>
                    </div>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-[30px] shadow-xl border dark:border-gray-700">
                    <button onClick={() => setActiveTab('SHOPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SHOPS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-amber-500'}`}>Unidades</button>
                    <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-amber-500'}`}>Operadores</button>
                </div>
            </div>

            {activeTab === 'SHOPS' && (
                <div className="space-y-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Rede de Barbearias</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Configure permissões e limites por unidade</p>
                        </div>
                        <button onClick={() => setEditShop({ id: `new-${Date.now()}`, name: '', address: '', phone: '', image: '', openingTime: '09:00', closingTime: '20:00', intervalMinutes: 30, loyaltyEnabled: true, loyaltyProgramTarget: 8, settings: { showBarbers: true, subscriptionEnabled: false, allowPayOnLocation: true, productsEnabled: false, inventoryEnabled: false, maxServices: 10, maxProducts: 0 } })} className={UI_STYLE.button.primary}>
                            <Plus size={20} /> Adicionar Unidade
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {shops.map(s => (
                            <div key={s.id} className={`${UI_STYLE.card} p-8 flex flex-col group hover:border-amber-500 transition-all shadow-xl`}>
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <img src={s.image} className="w-24 h-24 rounded-[35px] object-cover shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        <div>
                                            <h3 className="text-2xl font-black uppercase dark:text-white leading-none">{s.name}</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{s.address}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditShop(s)} className="p-4 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-amber-500 rounded-2xl transition-all">
                                        <Settings size={22} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-8">
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${s.settings.productsEnabled ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <ShoppingBag size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Loja</span>
                                    </div>
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${s.settings.inventoryEnabled ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <Package size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Estoque</span>
                                    </div>
                                    <div className={`p-4 rounded-[25px] flex flex-col items-center justify-center text-center border ${s.settings.subscriptionEnabled ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <Layers size={20} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Planos</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-between items-center pt-6 border-t dark:border-gray-700">
                                    <div className="flex gap-4">
                                        <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5 tracking-tighter">Limite Serviços</p><p className="font-black dark:text-white">{s.settings.maxServices}</p></div>
                                        <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5 tracking-tighter">Limite Loja</p><p className="font-black dark:text-white">{s.settings.maxProducts}</p></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">Ativa no Portal</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'USERS' && (
                <div className="space-y-10 animate-fade-in">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Operadores do Sistema</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Gerencie quem gerencia as unidades</p>
                        </div>
                        <button onClick={() => setEditUser({ id: `new-${Date.now()}`, name: '', email: '', phone: '', role: UserRole.ADMIN })} className={UI_STYLE.button.primary}>
                            <UserPlus size={20} /> Novo Gestor
                        </button>
                    </div>

                    <div className={`${UI_STYLE.card} overflow-hidden border-gray-100`}>
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
                                                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-100" />
                                                <div><p className="font-black uppercase text-sm dark:text-white leading-none mb-1">{u.name}</p><p className="text-xs text-gray-400 font-medium">{u.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.SUPER_ADMIN ? 'bg-black text-white' : u.role === UserRole.ADMIN ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600'}`}>{u.role}</span>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-gray-500 dark:text-gray-400">
                                            {u.shopId ? shops.find(s => s.id === u.shopId)?.name : 'Acesso Global'}
                                        </td>
                                        <td className="p-6 text-center">
                                            <button onClick={() => setEditUser(u)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-amber-500 rounded-xl transition-all"><Edit3 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Editar Unidade - SUPER ADMIN CONFIG */}
            {editShop && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in">
                    <form onSubmit={handleSaveShop} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border dark:border-gray-700 max-h-[95vh]">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-500 rounded-[20px]"><Settings size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Configuração de Unidade</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tenant Level Settings</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setEditShop(null)}><X size={32} /></button>
                        </div>
                        
                        <div className="p-10 space-y-12 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <h4 className="text-xs font-black uppercase text-amber-500 tracking-[0.3em]">1. Informações Básicas</h4>
                                <div className="space-y-4">
                                    <input placeholder="Nome da Unidade" required className={UI_STYLE.input} value={editShop.name} onChange={e => setEditShop({...editShop, name: e.target.value})} />
                                    <input placeholder="Endereço Completo" required className={UI_STYLE.input} value={editShop.address} onChange={e => setEditShop({...editShop, address: e.target.value})} />
                                    <input placeholder="URL da Imagem de Capa" className={UI_STYLE.input} value={editShop.image} onChange={e => setEditShop({...editShop, image: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-xs font-black uppercase text-amber-500 tracking-[0.3em]">2. Liberação de Recursos</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { label: 'Loja de Produtos', key: 'productsEnabled', icon: ShoppingBag },
                                        { label: 'Controle de Estoque', key: 'inventoryEnabled', icon: Package },
                                        { label: 'Planos de Assinatura', key: 'subscriptionEnabled', icon: Layers },
                                        { label: 'Agendamento por Barbeiro', key: 'showBarbers', icon: Users }
                                    ].map(feature => (
                                        <button 
                                            key={feature.key} 
                                            type="button" 
                                            onClick={() => setEditShop({...editShop, settings: { ...editShop.settings, [feature.key]: !((editShop.settings as any)[feature.key]) }})}
                                            className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${((editShop.settings as any)[feature.key]) ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-gray-50 dark:border-gray-750 grayscale opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${((editShop.settings as any)[feature.key]) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}><feature.icon size={20} /></div>
                                                <span className="font-black uppercase text-[10px] tracking-widest dark:text-white">{feature.label}</span>
                                            </div>
                                            {((editShop.settings as any)[feature.key]) ? <Check size={20} className="text-amber-500" /> : <Lock size={20} className="text-gray-300" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8 lg:col-span-2 pt-10 border-t dark:border-gray-700">
                                <h4 className="text-xs font-black uppercase text-amber-500 tracking-[0.3em]">3. Limites de Escopo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-[35px] space-y-4">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Max. Serviços no Catálogo</p>
                                        <div className="flex items-center gap-6">
                                            <input type="range" min="0" max="100" className="flex-1 accent-amber-500" value={editShop.settings.maxServices} onChange={e => setEditShop({...editShop, settings: {...editShop.settings, maxServices: parseInt(e.target.value)}})} />
                                            <span className="text-2xl font-black text-amber-500">{editShop.settings.maxServices}</span>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-[35px] space-y-4">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Max. Produtos na Loja</p>
                                        <div className="flex items-center gap-6">
                                            <input type="range" min="0" max="200" className="flex-1 accent-amber-500" value={editShop.settings.maxProducts} onChange={e => setEditShop({...editShop, settings: {...editShop.settings, maxProducts: parseInt(e.target.value)}})} />
                                            <span className="text-2xl font-black text-amber-500">{editShop.settings.maxProducts}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 pt-12 pb-6">
                                <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>
                                    <Save size={24} /> Salvar Configurações Master
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Editar Usuário - SUPER ADMIN PERMISSIONS */}
            {editUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fade-in">
                    <form onSubmit={handleSaveUser} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border dark:border-gray-700">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-500 rounded-[20px]"><Users size={24} /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Gestão de Permissões</h3>
                            </div>
                            <button type="button" onClick={() => setEditUser(null)}><X size={32} /></button>
                        </div>
                        
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">Nome do Operador</label>
                                <input required className={UI_STYLE.input} value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} />
                                
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">Role (Nível de Acesso)</label>
                                <select className={UI_STYLE.input} value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value as any})}>
                                    <option value={UserRole.ADMIN}>Administrador de Unidade</option>
                                    <option value={UserRole.BARBER}>Barbeiro Profissional</option>
                                    <option value={UserRole.CLIENT}>Cliente Comum</option>
                                    <option value={UserRole.SUPER_ADMIN}>Super Admin Global</option>
                                </select>

                                {editUser.role !== UserRole.SUPER_ADMIN && (
                                    <>
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">Vincular à Unidade</label>
                                        <select className={UI_STYLE.input} value={editUser.shopId || ''} onChange={e => setEditUser({...editUser, shopId: e.target.value})}>
                                            <option value="">Sem vínculo específico</option>
                                            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</p>)}
                                        </select>
                                    </>
                                )}
                            </div>

                            <button type="submit" className={UI_STYLE.button.secondary + " w-full !py-6"}>
                                <Shield className="text-amber-500" size={20} /> Aplicar Permissões
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
