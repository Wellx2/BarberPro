import React, { useState } from 'react';
import { 
  Gift, Copy, Share2, TrendingUp, CheckCircle2, 
  Users, DollarSign, ArrowRight, Award, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ReferralProgram: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [copied, setCopied] = useState(false);

  // Generate a mock referral link based on user ID or a random string if not available
  const referralCode = user?.id ? user.id.split('-')[0].toUpperCase() : 'KLYP50';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addNotification('success', 'Link copiado para a área de transferência!', 'Sucesso');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Klyp Barber - O Melhor Sistema para Barbearias',
        text: 'Comece a usar o Klyp Barber e aumente o faturamento da sua barbearia!',
        url: referralLink,
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10">
              <Gift className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-sm tracking-widest uppercase">Programa de Indicação</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Indique e <span className="text-yellow-300">Ganhe Dinheiro</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-lg">
              Indique o Klyp Barber para amigos donos de barbearia. Você ganha bônus em dinheiro direto na sua conta ou em descontos na sua assinatura para cada amigo que assinar.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex items-center gap-2 max-w-md">
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                className="bg-transparent border-none text-white font-medium px-4 py-2 outline-none w-full truncate"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-white text-orange-600 p-3 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Copiar Link"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
              <button 
                onClick={shareLink}
                className="bg-black/20 text-white p-3 rounded-xl hover:bg-black/40 transition-colors flex-shrink-0"
                title="Compartilhar"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="hidden md:flex justify-end">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl text-center max-w-xs shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
              <Award className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-2">Até R$ 150</h3>
              <p className="text-white/80 text-sm font-medium">De recompensa por CADA indicação convertida.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-600 dark:text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cliques no Link</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-orange-600 dark:text-orange-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cadastros Realizados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-green-600 dark:text-green-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bônus Acumulado</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ 115,00</p>
          </div>
        </div>
      </div>

      {/* How it works & Rewards */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Rules */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-orange-500 w-6 h-6" />
            Como Funciona?
          </h2>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent hidden-before">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-orange-100 text-orange-600 font-bold shrink-0 shadow z-10">1</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 ml-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Compartilhe</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Envie seu link exclusivo para um amigo dono de barbearia.</p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-orange-100 text-orange-600 font-bold shrink-0 shadow z-10">2</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 ml-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Ele Assina</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Seu amigo cria a conta e assina qualquer plano pago do Klyp Barber.</p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-orange-100 text-orange-600 font-bold shrink-0 shadow z-10">3</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 ml-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Você Ganha</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">O bônus cai na sua conta em até 7 dias, direto via PIX ou desconto.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <DollarSign className="text-green-500 w-6 h-6" />
            Tabela de Recompensas
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">O valor que você ganha depende do plano que o seu indicado assinar.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-orange-500/30 transition-colors">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Se ele assinar o</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Plano Basic (R$ 65)</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Você Ganha</span>
                <p className="font-black text-xl text-green-600 dark:text-green-400">R$ 40,00</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-orange-500/20 bg-orange-50 dark:bg-orange-900/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">Mais Popular</div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">Se ele assinar o</span>
                <h4 className="font-bold text-orange-900 dark:text-orange-100 text-lg">Plano Pro (R$ 89)</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">Você Ganha</span>
                <p className="font-black text-2xl text-green-600 dark:text-green-400">R$ 60,00</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-500/30 transition-colors">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Se ele assinar o</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Plano Master (R$ 159)</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Você Ganha</span>
                <p className="font-black text-xl text-green-600 dark:text-green-400">R$ 100,00</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Award className="w-5 h-5 shrink-0" />
                <span>Indicou 5 amigos num mês? Ganhe um <strong>Bônus Extra de R$ 200</strong>!</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral List (Mock) */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Suas Indicações</h3>
          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Ver Histórico de Pagamentos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Barbearia / Contato</th>
                <th className="px-6 py-4">Data do Cadastro</th>
                <th className="px-6 py-4">Plano Escolhido</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Seu Bônus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">Barbearia do Zé</p>
                  <p className="text-xs text-gray-500">jose@email.com</p>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">12 Mai 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Pro</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Assinatura Ativa
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">R$ 60,00</td>
              </tr>
              <tr>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">Cortes & Navalhas</p>
                  <p className="text-xs text-gray-500">contato@cortes.com</p>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">10 Mai 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Basic</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Assinatura Ativa
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">R$ 40,00</td>
              </tr>
              <tr>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">Estúdio Masculino</p>
                  <p className="text-xs text-gray-500">estudio@masculino.com</p>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">13 Mai 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Pendente</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium text-xs">
                    Em Período de Teste
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
