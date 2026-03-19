import React from 'react';
import { PlansSection } from '../components/PlansSection';
import { useShop } from '../context/ShopContext';
import { Check, Star, Shield, Zap } from 'lucide-react';

export const Plans: React.FC = () => {
    const { shop } = useShop();
    const showPlans = shop.settings.modulesEnabled?.clientPlans !== false;

    if (!showPlans) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 max-w-md">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Planos indisponíveis</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Esta barbearia desativou planos para clientes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Hero Header for Plans */}
            <div className="bg-gray-900 pt-16 pb-12 text-center px-4">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-6">
                    Assinaturas <span className="text-tenant-primary">{shop.name}</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Faça parte do clube. Tenha cortes sempre alinhados, descontos exclusivos em produtos e prioridade na agenda.
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="bg-white dark:bg-gray-800 py-12 border-b border-gray-100 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-4">
                        <div className="w-12 h-12 bg-tenant-primary/10 text-tenant-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Economia Real</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Assinantes economizam até 40% comparado ao valor avulso dos serviços.</p>
                    </div>
                    <div className="p-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Sempre Alinhado</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Mantenha o corte em dia com visitas frequentes sem se preocupar com o custo por visita.</p>
                    </div>
                    <div className="p-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Sem Fidelidade</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cancele quando quiser, sem multas ou letras miúdas. Você não controle.</p>
                    </div>
                </div>
            </div>

            {/* Reusing the Plans Component */}
            <PlansSection simple={true} />

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Perguntas Frequentes</h2>
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Posso usar em qualquer unidade?</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Sim! Sua assinatura Klypbarber é válida em todas as unidades da nossa rede.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Como funciona a renovação?</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">A renovação é automática mensalmente não seu cartão de crédito. Você pode cancelar a renovação a qualquer momento pelo seu painel.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Os créditos acumulam?</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Não. Os serviços do plano (cortes/barba) são válidos dentro do mês vigente (ciclo de 30 dias) e não acumulam para o mês seguinte.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};