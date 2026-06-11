import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { paymentService } from '../services/paymentService';
import {
  Scissors, ArrowRight, ArrowLeft, Check,
  User, Mail, Phone, Lock, Building, ShieldCheck,
  MapPin, FileText, Loader2, AlertCircle, Eye, EyeOff
} from 'lucide-react';

// ─── Helpers de Máscara ────────────────────────────────────────────────────
const maskPhone = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})/, '$1-$2');
};

const maskCNPJ = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2');
};

// ─── Helpers de Validação ──────────────────────────────────────────────────
const isValidEmail = (email: string): boolean =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 254;

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Fraca', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Razoável', color: '#f97316' };
  if (score <= 3) return { score, label: 'Boa', color: '#eab308' };
  return { score, label: 'Forte', color: '#22c55e' };
};

// ─── Planos ────────────────────────────────────────────────────────────────
const PLANS_DETAILS: Record<string, {
  id: string; name: string; price: number; normalPrice: number;
  period: string; badge?: string; features: string[];
}> = {
  plus: {
    id: 'plus', name: 'Klyp Barber PLUS', price: 79, normalPrice: 79, period: 'mês',
    features: ['Até 6 barbeiros ativos', 'Agendamento Online 24/7', 'Controle de Caixa & Vendas', 'Produtos & Controle de Estoque']
  },
  pro: {
    id: 'pro', name: 'Klyp Barber PRO', price: 89, normalPrice: 125, period: 'mês',
    badge: 'Recomendado / 40% OFF',
    features: ['Até 20 barbeiros ativos', 'Inteligência Preditiva (Anti-Churn)', 'Caixa & Relatórios Financeiros PRO', 'Painel de Comissões Automatizado', 'Suporte Prioritário por WhatsApp']
  },
  master: {
    id: 'master', name: 'Klyp Barber MASTER', price: 149, normalPrice: 149, period: 'mês',
    features: ['Barbeiros ativos ilimitados', 'Custom Branding (Logotipo próprio)', 'Gerente de Conta Dedicado', 'Suporte VIP 24h & Migração de dados']
  }
};

// ─── Campo com erro inline ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
      {label} {required && <span className="text-orange-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
        <AlertCircle size={12} /> {error}
      </p>
    )}
    {!error && hint && <p className="mt-1.5 text-xs text-gray-600">{hint}</p>}
  </div>
);

const inputCls = (hasError?: boolean) =>
  `w-full bg-black border ${hasError ? 'border-red-500' : 'border-white/10'} focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-colors`;

// ─── Componente Principal ──────────────────────────────────────────────────
export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'pro';
  const plan = PLANS_DETAILS[planKey] || PLANS_DETAILS.pro;

  const navigate = useNavigate();
  const { loginWithUserData } = useAuth();
  const { addNotification } = useNotification();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // anti double-submit
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    shopName: '', cnpj: '', address: ''
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData, boolean>>>({});

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let masked = value;
    if (name === 'phone') masked = maskPhone(value);
    if (name === 'cnpj') masked = maskCNPJ(value);
    if (name === 'name') masked = value.slice(0, 100);
    if (name === 'shopName') masked = value.slice(0, 100);
    if (name === 'email') masked = value.slice(0, 254).toLowerCase().trim();
    if (name === 'password') masked = value.slice(0, 128);

    setFormData(prev => ({ ...prev, [name]: masked }));
    // Limpa erro ao digitar
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name as keyof typeof formData, formData[name as keyof typeof formData]);
  }, [formData]);

  const validateField = (name: keyof typeof formData, value: string) => {
    let error = '';
    switch (name) {
      case 'name':
        if (value.trim().length < 3) error = 'Nome deve ter no mínimo 3 caracteres.';
        else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) error = 'Nome deve conter apenas letras.';
        break;
      case 'email':
        if (!isValidEmail(value)) error = 'Informe um e-mail válido (ex: joao@email.com).';
        break;
      case 'phone':
        if (!isValidPhone(value)) error = 'Informe um celular brasileiro válido: (11) 99999-9999.';
        break;
      case 'password':
        if (value.length < 8) error = 'A senha deve ter no mínimo 8 caracteres.';
        break;
      case 'shopName':
        if (value.trim().length < 3) error = 'Nome da barbearia deve ter no mínimo 3 caracteres.';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
    return !error;
  };

  const validateStep1 = (): boolean => {
    const fields: (keyof typeof formData)[] = ['name', 'email', 'phone', 'password'];
    setTouched(prev => ({ ...prev, name: true, email: true, phone: true, password: true }));
    const results = fields.map(f => validateField(f, formData[f]));
    return results.every(Boolean);
  };

  const validateStep2 = (): boolean => {
    setTouched(prev => ({ ...prev, shopName: true }));
    return validateField('shopName', formData.shopName);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
    else addNotification('warning', 'Corrija os campos destacados antes de continuar.', 'Dados inválidos');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) {
      addNotification('warning', 'Corrija os campos destacados antes de continuar.', 'Dados inválidos');
      return;
    }
    if (submitted || loading) return; // anti double-submit

    setSubmitted(true);
    setLoading(true);
    try {
      const registerRes = await api.post<{
        shop: { id: string; name: string };
        user: { id: string; name: string; email: string; role: string; shopId: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/register-shop', {
        shopName: formData.shopName.trim(),
        cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : undefined,
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address.trim() || undefined
      });

      const { user, accessToken, refreshToken } = registerRes.data;
      loginWithUserData(user, accessToken, refreshToken);
      addNotification('success', 'Cadastro realizado! Gerando link de pagamento...', 'Bem-vindo!');

      try {
        const checkoutRes = await paymentService.generateCheckoutLink(plan.id);
        if (checkoutRes?.checkoutUrl) {
          window.location.href = checkoutRes.checkoutUrl;
        } else {
          throw new Error('URL de checkout inválida.');
        }
      } catch {
        addNotification('error', 'Barbearia criada, mas houve um erro no pagamento. Acesse o painel para tentar novamente.', 'Erro de Pagamento');
        navigate('/admin');
      }

    } catch (error: any) {
      const rawMsg: string = error?.response?.data?.message || error?.message || '';
      const lowerMsg = rawMsg.toLowerCase();

      if (lowerMsg.includes('barbearia já cadastrada') || lowerMsg.includes('already')) {
        addNotification('error',
          'Esse nome de barbearia já está em uso. Tente outro nome ou entre em contato.',
          'Nome indisponível'
        );
        setErrors(prev => ({ ...prev, shopName: 'Este nome já está cadastrado. Tente outro.' }));
        setStep(2);
      } else if (lowerMsg.includes('email') || lowerMsg.includes('usuario') || lowerMsg.includes('usuário')) {
        addNotification('error',
          'Esse e-mail já está cadastrado. Faça login ou use outro e-mail.',
          'E-mail em uso'
        );
        setErrors(prev => ({ ...prev, email: 'E-mail já cadastrado. Use outro ou faça login.' }));
        setStep(1);
      } else {
        addNotification('error', rawMsg || 'Erro ao processar o cadastro. Tente novamente.', 'Falha no Cadastro');
      }
      // Libera o submit novamente para corrigir e tentar
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(formData.password);

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Coluna Esquerda: Resumo do plano */}
      <div className="lg:w-5/12 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-white/5 p-8 lg:p-16 flex flex-col justify-between">
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
            <p className="text-xs text-gray-500 mt-1">
              Seus dados são protegidos com criptografia de ponta. Processamento via Mercado Pago.
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário */}
      <div className="flex-1 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-lg">

          {/* Progress */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                step === 1 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-green-500/20 border-green-500 text-green-400'
              }`}>
                {step > 1 ? <Check size={16} strokeWidth={3} /> : '1'}
              </span>
              <span className={`text-sm font-bold ${step === 1 ? 'text-white' : 'text-gray-500'}`}>Administrador</span>
            </div>
            <div className="flex-1 h-px bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                step === 2 ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 text-gray-500'
              }`}>2</span>
              <span className={`text-sm font-bold ${step === 2 ? 'text-white' : 'text-gray-500'}`}>Barbearia</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 shadow-2xl">

            {/* ── PASSO 1: Dados do Proprietário ────────────────────────── */}
            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-5" noValidate>
                <div>
                  <h2 className="text-xl font-bold mb-1">Crie sua Conta Admin</h2>
                  <p className="text-xs text-gray-500">Dados do proprietário para acesso ao painel de gestão.</p>
                </div>

                <div className="space-y-4">
                  {/* Nome */}
                  <Field label="Seu Nome Completo" required error={touched.name ? errors.name : undefined}
                    hint="Mínimo 3 letras, apenas letras e espaços.">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-name"
                        type="text" name="name" value={formData.name}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Ex: João Silva"
                        maxLength={100} autoComplete="name"
                        className={inputCls(touched.name && !!errors.name)}
                      />
                    </div>
                  </Field>

                  {/* E-mail */}
                  <Field label="E-mail de Acesso" required error={touched.email ? errors.email : undefined}>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-email"
                        type="email" name="email" value={formData.email}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Ex: joao@seuemail.com"
                        maxLength={254} autoComplete="email"
                        className={inputCls(touched.email && !!errors.email)}
                      />
                    </div>
                    {touched.email && errors.email && errors.email.includes('login') && (
                      <Link to="/login" className="inline-block mt-1 text-xs text-orange-400 underline">
                        Já tem conta? Entrar →
                      </Link>
                    )}
                  </Field>

                  {/* Telefone */}
                  <Field label="WhatsApp de Contato" required
                    error={touched.phone ? errors.phone : undefined}
                    hint="Formato: (11) 99999-9999 — apenas Brasil">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-phone"
                        type="tel" name="phone" value={formData.phone}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="(11) 99999-9999"
                        maxLength={15} autoComplete="tel"
                        inputMode="numeric"
                        className={inputCls(touched.phone && !!errors.phone)}
                      />
                    </div>
                  </Field>

                  {/* Senha */}
                  <Field label="Senha de Acesso" required
                    error={touched.password ? errors.password : undefined}
                    hint="Mínimo 8 caracteres. Use letras, números e símbolos para maior segurança.">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password" value={formData.password}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Mínimo 8 caracteres"
                        maxLength={128} autoComplete="new-password"
                        className={`${inputCls(touched.password && !!errors.password)} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Barra de força da senha */}
                    {formData.password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : '#27272a' }}
                            />
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: pwStrength.color }}>
                          Senha {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </Field>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                >
                  Continuar para Barbearia <ArrowRight size={16} />
                </button>

                <p className="text-center text-xs text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-orange-400 hover:text-orange-300 underline">Entrar</Link>
                </p>
              </form>

            ) : (
              /* ── PASSO 2: Dados da Barbearia ──────────────────────────── */
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={12} /> Voltar para o passo anterior
                  </button>
                  <h2 className="text-xl font-bold mb-1">Dados da Barbearia</h2>
                  <p className="text-xs text-gray-500">Configuração inicial do perfil da sua barbearia.</p>
                </div>

                <div className="space-y-4">
                  {/* Nome da Barbearia */}
                  <Field label="Nome da Barbearia" required
                    error={touched.shopName ? errors.shopName : undefined}
                    hint="Mínimo 3 caracteres. Esse será o nome público da sua barbearia.">
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-shopname"
                        type="text" name="shopName" value={formData.shopName}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Ex: Barbearia do João"
                        maxLength={100} autoComplete="organization"
                        className={inputCls(touched.shopName && !!errors.shopName)}
                      />
                    </div>
                  </Field>

                  {/* CNPJ (opcional) */}
                  <Field label="CNPJ (Opcional)" hint="Apenas números, formatação automática.">
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-cnpj"
                        type="text" name="cnpj" value={formData.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                        maxLength={18} inputMode="numeric"
                        className={inputCls()}
                      />
                    </div>
                  </Field>

                  {/* Endereço (opcional) */}
                  <Field label="Endereço da Barbearia (Opcional)">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="checkout-address"
                        type="text" name="address" value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade"
                        maxLength={200} autoComplete="street-address"
                        className={inputCls()}
                      />
                    </div>
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Criando sua barbearia...</>
                  ) : (
                    <>Concluir &amp; Ir para o Pagamento <ArrowRight size={16} /></>
                  )}
                </button>

                <p className="text-center text-xs text-gray-600">
                  Ao concluir, você concorda com os{' '}
                  <a href="/termos" target="_blank" className="text-orange-400 underline">Termos de Uso</a>
                  {' '}e a{' '}
                  <a href="/privacidade" target="_blank" className="text-orange-400 underline">Política de Privacidade</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
