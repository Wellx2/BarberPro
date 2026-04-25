import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Shield, Zap, ShieldCheck, Rocket, CheckCircle2, Lock, Users, Activity } from 'lucide-react';

export const SubscriptionTab: React.FC = () => {
    const { shop } = useShop();
    const sub = shop.subscription;
    const tier = sub?.tier || 'BASIC';
    const features = sub?.features;

    // Helper para design dos planos
    const getTierDesign = (currentTier: string) => {
        const normalizedTier = currentTier?.toUpperCase() || 'BASIC';
        switch (normalizedTier) {
            case 'BASIC': return { name: 'KlypBarber BASIC', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: Shield,  desc: 'Essencial para barbeiros independentes', maxStaff: 2 };
            case 'PLUS': return { name: 'KlypBarber PLUS', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Zap,      desc: 'Perfeito para pequenas equipes', maxStaff: 6 };
            case 'PRO': return { name: 'KlypBarber PRO', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: ShieldCheck, desc: 'Para barbearias em expansão de marca', maxStaff: 20 };
            case 'MASTER': return { name: 'KlypBarber MASTER', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Rocket,    desc: 'O poder absoluto para franquias', maxStaff: 'Ilimitado' };
            default: return { name: 'KlypBarber BASIC', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: Shield,  desc: 'Essencial', maxStaff: 2 };
        }
    };

    const design = getTierDesign(tier);
    const Icon = design.icon;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Cabeçalho da Assinatura */}
            <div className={`p-8 md:p-12 rounded-[40px] border-2 shadow-2xl relative overflow-hidden ${design.bg} ${design.border}`}>
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className={`p-4 rounded-3xl bg-white shadow-xl ${design.color}`}>
                            <Icon size={40} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter ${design.color} leading-none`}>
                                    {design.name}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white shadow-sm border ${design.border} ${design.color}`}>Ativo</span>
                            </div>
                            <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mt-2">{design.desc}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Limite da Licença</p>
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 w-full md:w-64 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Users size={20} className="text-gray-400" />
                            </div>
                            <div className="text-3xl font-black text-gray-800 leading-none">{features?.maxTeamMembers || design.maxStaff}</div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Profissionais (Time)</p>
                        </div>
                        {tier !== 'MASTER' && (
                            <button className="w-full mt-2 px-6 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-105 active:scale-95 shadow-xl">
                                Solicitar Upgrade ✨
                            </button>
                        )}
                    </div>
                </div>

                {/* Ícone gigante no fundo */}
                <div className={`absolute -bottom-10 -right-10 opacity-10 ${design.color} pointer-events-none transform -rotate-12`}>
                    <Icon size={250} />
                </div>
            </div>

            {/* Breakdown de Recursos */}
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2 ml-4">
                    <Activity size={16} /> Recursos da Assinatura
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Agendamentos */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                        <div>
                            <h4 className="font-black text-sm uppercase dark:text-white">Agendamentos</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Sistema de marcação online ilimitado para clientes.</p>
                        </div>
                    </div>

                    {/* Produtos */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        {features?.hasProducts ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <Lock size={24} className="text-gray-300 shrink-0" />}
                        <div>
                            <h4 className={`font-black text-sm uppercase ${features?.hasProducts ? 'dark:text-white' : 'text-gray-400'}`}>Loja de Produtos</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Venda e controle de estoque de produtos físicos.</p>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        {features?.hasFinancialDashboard ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <Lock size={24} className="text-gray-300 shrink-0" />}
                        <div>
                            <h4 className={`font-black text-sm uppercase ${features?.hasFinancialDashboard ? 'dark:text-white' : 'text-gray-400'}`}>Financeiro PRO</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Divisão de comissões, recebíveis e fluxo de caixa.</p>
                        </div>
                    </div>

                    {/* White Label */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        {features?.hasWhiteLabel ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <Lock size={24} className="text-gray-300 shrink-0" />}
                        <div>
                            <h4 className={`font-black text-sm uppercase ${features?.hasWhiteLabel ? 'dark:text-white' : 'text-gray-400'}`}>White Label</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Sua logomarca, suas cores, sua identidade no app.</p>
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        {features?.hasAuditLogs ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <Lock size={24} className="text-gray-300 shrink-0" />}
                        <div>
                            <h4 className={`font-black text-sm uppercase ${features?.hasAuditLogs ? 'dark:text-white' : 'text-gray-400'}`}>Monitoramento de Logs</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Acompanhe quem editou ou excluiu registros no sistema.</p>
                        </div>
                    </div>

                    {/* AI Analytics */}
                     <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                        {features?.hasAIAnalysis ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <Lock size={24} className="text-gray-300 shrink-0" />}
                        <div>
                            <h4 className={`font-black text-sm uppercase ${features?.hasAIAnalysis ? 'dark:text-white' : 'text-gray-400'}`}>Dashboard A.I.</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Insights automáticos usando Inteligência Artificial Klyp.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dúvidas sobre sua fatura ou Upgrade?</p>
                <button className="mt-2 text-tenant-primary font-black uppercase text-sm hover:underline">Falar com Consultor KlypBarber</button>
            </div>
        </div>
    );
};
