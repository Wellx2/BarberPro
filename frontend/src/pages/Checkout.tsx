import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { paymentService } from '../services/paymentService';
import { 
  Scissors, ArrowRight, ArrowLeft, Check, 
  User, Mail, Phone, Lock, Building, ShieldCheck, 
  MapPin, FileText, Loader2 
} from 'lucide-react';

const PLANS_DETAILS: Record<string, {
  id: string;
  name: string;
  price: number;
  normalPrice: number;
  period: string;
  badge?: string;
  features: string[];
}> = {
  plus: {
    id: 'plus',
    name: 'Klyp Barber PLUS',
    price: 79,
    normalPrice: 79,
    period: 'mês',
    features: [
      'Até 6 barbeiros ativos',
      'Agendamento Online 24/7',
      'Controle de Caixa & Vendas',
      'Produtos & Controle de Estoque'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Klyp Barber PRO',
    price: 89,
    normalPrice: 125,
    period: 'mês',
    badge: 'Recomendado / 40% OFF',
    features: [
      'Até 20 barbeiros ativos',
      'Inteligência Preditiva (Anti-Churn)',
      'Caixa & Relatórios Financeiros PRO',
      'Painel de Comissões Automatizado',
      'Suporte Prioritário por WhatsApp'
    ]
  },
  master: {
    id: 'master',
    name: 'Klyp Barber MASTER',
    price: 149,
    normalPrice: 149,
    period: 'mês',
    features: [
      'Barbeiros ativos ilimitados',
      'Custom Branding (Logotipo próprio)',
      'Gerente de Conta Dedicado',
      'Suporte VIP 24h & Migração de dados'
    ]
  }
};

export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'pro';
  const plan = PLANS_DETAILS[planKey] || PLANS_DETAILS.pro;

  const navigate = useNavigate();
  const { loginWithUserData } = useAuth();
  const { addNotification } = useNotification();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Admin Owner Data
    name: '',
    email: '',
    phone: '',
    password: '',
    // Step 2: Barbershop Data
    shopName: '',
    cnpj: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      addNotification('warning', 'Por favor, preencha todos os campos obrigatórios.', 'Dados incompletos');
      return;
    }
    if (formData.password.length < 6) {
      addNotification('warning', 'A senha deve conter no mínimo 6 caracteres.', 'Senha muito curta');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.phone) {
      addNotification('warning', 'Nome da Barbearia e WhatsApp são obrigatórios.', 'Campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // 1. Cadastra Barbearia e Usuário
      const registerRes = await api.post<{
        shop: { id: string; name: string };
        user: { id: string; name: string; email: string; role: string; shopId: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/register-shop', {
        shopName: formData.shopName,
        cnpj: formData.cnpj || undefined,
        name: formData.name,
        email: formData.email || undefined,
        password: formData.password,
        phone: formData.phone,
        address: formData.address || undefined
      });

      const { user, accessToken, refreshToken } = registerRes.data;

      // 2. Faz o login automático utilizando a nova helper do AuthContext
      loginWithUserData(user, accessToken, refreshToken);
      addNotification('success', 'Cadastro realizado com sucesso! Gerando link de pagamento...', 'Bem-vindo!');

      // 3. Solicita link do Mercado Pago com o token já setado (pela helper loginWithUserData)
      try {
        const checkoutRes = await paymentService.generateCheckoutLink(plan.id);
        if (checkoutRes && checkoutRes.checkoutUrl) {
          // Redireciona para o Mercado Pago
          window.location.href = checkoutRes.checkoutUrl;
        } else {
          throw new Error('URL de checkout inválida.');
        }
      } catch (payError: any) {
        console.error('Erro ao gerar checkout:', payError);
        addNotification('error', 'Sua barbearia foi criada, mas ocorreu um erro ao gerar a cobrança. Acesse o painel para tentar novamente.', 'Erro de Pagamento');
        // Redireciona para o admin se falhar o checkout, pois a conta já existe e está logada!
        navigate('/admin');
      }

    } catch (error: any) {
      console.error('Erro no cadastro rápido:', error);
      const msg = error.message || error.response?.data?.message || 'Ocorreu um erro ao processar o seu cadastro.';
      addNotification('error', msg, 'Falha no Cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Left Column: Plan summary and stack list */}
      <div className="lg:w-5/12 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-white/5 p-8 lg:p-16 flex flex-col justify-between relative">
        <div>
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-12 cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar para a Home
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2.5 rounded-xl">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">Klyp<span className="text-orange-500">Barber</span></span>
          </div>

          <p className="text-sm text-orange-500 font-bold uppercase tracking-widest mb-2">Você escolheu o plano:</p>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black">{plan.name}</h1>
            {plan.badge && (
              <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-orange-500/30">
                {plan.badge}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-8">
            {plan.normalPrice > plan.price && (
              <span className="text-sm text-gray-500 line-through mr-1">R$ {plan.normalPrice}</span>
            )}
            <span className="text-4xl font-extrabold text-white">R$ {plan.price}</span>
            <span className="text-gray-400 text-sm">/{plan.period}</span>
          </div>

          <hr className="border-white/5 mb-8" />

          <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Recursos Inclusos:</h3>
          <ul className="space-y-4">
            {plan.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <div className="bg-orange-500/10 border border-orange-500/20 p-0.5 rounded-full mt-0.5">
                  <Check className="w-3.5 h-3.5 text-orange-500" strokeWidth={3} />
                </div>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-center">
          <ShieldCheck className="w-10 h-10 text-green-400 shrink-0" />
          <div>
            <h4 className="font-bold text-sm text-white">Compra 100% Segura</h4>
            <p className="text-xs text-gray-500 mt-1">Seus dados estão protegidos por criptografia de ponta a ponta e processados de forma segura.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout steps form */}
      <div className="flex-1 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                step === 1 
                  ? 'bg-orange-500 border-orange-500 text-white font-black' 
                  : 'bg-green-500/20 border-green-500 text-green-400'
              }`}>
                {step > 1 ? <Check size={16} strokeWidth={3} /> : '1'}
              </span>
              <span className={`text-sm font-bold ${step === 1 ? 'text-white' : 'text-gray-500'}`}>Administrador</span>
            </div>
            <div className="flex-1 h-px bg-white/5 mx-4"></div>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                step === 2 
                  ? 'bg-orange-500 border-orange-500 text-white font-black' 
                  : 'border-white/10 text-gray-500'
              }`}>
                2
              </span>
              <span className={`text-sm font-bold ${step === 2 ? 'text-white' : 'text-gray-500'}`}>Barbearia</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Crie sua Conta Admin</h2>
                  <p className="text-xs text-gray-500">Dados do proprietário para acesso ao painel de gestão.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Seu Nome Completo *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: João Silva"
                        required
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">E-mail de Acesso *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ex: joao@seuemail.com"
                        required
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp de Contato *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Ex: (11) 99999-9999"
                        required
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha de Acesso *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                >
                  Continuar para Barbearia <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={12} /> Voltar para o passo anterior
                  </button>
                  <h2 className="text-xl font-bold mb-1">Dados da Barbearia</h2>
                  <p className="text-xs text-gray-500">Configuração inicial do perfil da sua barbearia.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Barbearia *</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="Ex: Barbearia do João"
                        required
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CPF ou CNPJ (Opcional)</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        placeholder="Ex: 00.000.000/0000-00"
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endereço da Barbearia (Opcional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade"
                        className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      Concluir & Ir para o Pagamento <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
