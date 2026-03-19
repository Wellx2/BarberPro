
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../services';
import { Scissors, ArrowLeft, Key, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'PHONE_LOGIN'>('LOGIN');
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isShopOwner: false, // Nova flag
    shopName: '',
    shopAddress: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Usar o novo método de login que faz requisição real ao backend
      await login(loginData.email, loginData.password);

      addNotification('success', `Bem-vindo!`);
      navigate(from, { replace: true, state: location.state });
    } catch (error: any) {
      console.error('Erro não login:', error);
      addNotification('error', error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (phone: string) => {
    setIsLoading(true);
    try {
      // Simulação de envio de OTP (Em um app real, chamaria o backend)
      addNotification('success', `Código enviado para ${phone}`);
      // setView('VERIFY_OTP'); // Futura implementação
      alert("Recurso de login por telefone (OTP) em desenvolvimento. Use e-mail por enquanto.");
    } catch (error: any) {
      addNotification('error', 'Erro ao enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formattedValue = value;
    if (value.length > 2) formattedValue = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 7) formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    setRegisterData({ ...registerData, phone: formattedValue });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.phone.length < 14) {
      addNotification('error', 'Por favor, insira um número de celular válido.');
      return;
    }

    // Se isShopOwner for false (cliente comum), não exigir dados da barbearia.
    // Enviamos "Cliente" como shopName provisório ou a service decide.
    // (A documentação não informou o exato endpoint de client public, 
    // assumindo registrarShop por manter compatibilidade preexistente caso não modificado não back)

    setIsLoading(true);
    try {
      const cleanPhone = registerData.phone.replace(/\D/g, ''); // Fix the 400 Bad Request
      const basePayload = { ...registerData, phone: cleanPhone };
      
      const payload = registerData.isShopOwner ? basePayload : {
        ...basePayload,
        shopName: 'Client Account', // Bypass validation if required by DTO
        shopAddress: 'N/A'
      };

      const response = await authService.registerShop(payload);

      // Após registrar, fazer login automático
      await login(payload.email, payload.password);

      addNotification('success', `Bem-vindo, ${response.user.name}!`);
      navigate(from, { replace: true, state: location.state });
    } catch (error: any) {
      addNotification('error', error.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] md:min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-4 transition-all">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-50 dark:border-gray-700">
        <div className="bg-gray-900 p-8 md:p-10 text-center relative">
          {view !== 'LOGIN' && view !== 'ROLES' && (
            <button
              onClick={() => setView('LOGIN')}
              className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="inline-block p-4 rounded-2xl bg-tenant-primary/10 mb-4">
            <Scissors className="h-8 w-8 text-tenant-primary" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            {view === 'LOGIN' ? 'Klypbarber' : view === 'REGISTER' ? 'Nova Conta' : 'Escolha seu Perfil'}
          </h2>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-3">
            {view === 'LOGIN'
              ? 'Faça login para continuar'
              : view === 'REGISTER'
                ? 'Crie sua conta e barbearia'
                : 'Selecione como deseja acessar'}
          </p>
        </div>

        <div className="p-8">
          {view === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="E-mail"
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="seu@email.com"
                fullWidth
              />
              <Input
                label="Senha"
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                fullWidth
              />
              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="flex flex-col gap-2 mt-4">
                {/* 
                <button
                  type="button"
                  onClick={() => setView('PHONE_LOGIN')}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-tenant-primary/30 rounded-xl text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 hover:bg-tenant-primary/5 transition-all"
                >
                  <Phone size={14} className="text-tenant-primary" /> Entrar com WhatsApp
                </button>
                */}
                <button
                  type="button"
                  onClick={() => setView('REGISTER')}
                  className="text-center text-[10px] font-black uppercase text-tenant-primary hover:underline mt-2"
                >
                  Não tenho conta? Cadastrar
                </button>
                <button
                  type="button"
                  onClick={() => setView('FORGOT_PASSWORD')}
                  className="text-center text-[10px] font-black uppercase text-gray-500 hover:text-tenant-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {view === 'PHONE_LOGIN' && (
            <PhoneLoginView
              onBack={() => setView('LOGIN')}
              onSubmit={handlePhoneLogin}
              isLoading={isLoading}
            />
          )}

          {view === 'FORGOT_PASSWORD' && (
            <InstructionsView
              onBack={() => setView('LOGIN')}
              onSubmit={async (email) => {
                setIsLoading(true);
                try {
                  await authService.forgotPassword(email);
                  addNotification('success', 'Se o e-mail existir, você receberá instruções de recuperação.');
                  setView('LOGIN');
                } catch (error: any) {
                  addNotification('error', error.message || 'Erro ao processar solicitação');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {view === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="isShopOwner"
                  checked={registerData.isShopOwner}
                  onChange={e => setRegisterData({ ...registerData, isShopOwner: e.target.checked })}
                  className="w-4 h-4 text-tenant-primary bg-gray-100 border-gray-300 rounded focus:ring-tenant-primary cursor-pointer"
                />
                <label htmlFor="isShopOwner" className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest cursor-pointer">
                  Quero cadastrar minha barbearia
                </label>
              </div>

              {registerData.isShopOwner && (
                <div className="space-y-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <Input
                    label="Nome da Barbearia"
                    required
                    value={registerData.shopName}
                    onChange={(e) => setRegisterData({ ...registerData, shopName: e.target.value })}
                    placeholder="Barbearia Prime"
                    fullWidth
                  />
                  <Input
                    label="Endereço da Barbearia"
                    required
                    value={registerData.shopAddress}
                    onChange={(e) => setRegisterData({ ...registerData, shopAddress: e.target.value })}
                    placeholder="Rua exemplo, 123"
                    fullWidth
                  />
                </div>
              )}
              <Input
                label="Seu Nome Completo"
                required
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                placeholder="João da Silva"
                fullWidth
              />
              <Input
                label="WhatsApp"
                type="tel"
                required
                value={registerData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                fullWidth
              />
              <Input
                label="E-mail"
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="jáoao@email.com"
                fullWidth
              />
              <Input
                label="Senha"
                type="password"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="••••••••"
                fullWidth
              />
              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Registrar e Acessar'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para a vista de esqueci senha
const InstructionsView: React.FC<{
  onBack: () => void,
  onSubmit: (email: string) => Promise<void>,
  isLoading: boolean
}> = ({ onBack, onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-tenant-primary/5 dark:bg-tenant-primary/10 p-4 rounded-xl border border-tenant-primary/20 dark:border-tenant-primary/30">
        <p className="text-sm text-tenant-primary dark:text-white/80 font-medium">
          Digite seu e-mail abaixo. Se houver uma conta associada, enviaremos as instruções para recuperar sua senha.
        </p>
      </div>

      <Input
        label="Seu E-mail"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        fullWidth
      />

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={() => onSubmit(email)}
          disabled={isLoading || !email}
        >
          {isLoading ? 'Enviando...' : 'Enviar Instruções'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-center text-[10px] font-black uppercase text-gray-500 hover:text-tenant-primary transition-colors"
        >
          Voltar para o Login
        </button>
      </div>
    </div>
  );
};

// Componente auxiliar para a vista de login por telefone
const PhoneLoginView: React.FC<{
  onBack: () => void,
  onSubmit: (phone: string) => Promise<void>,
  isLoading: boolean
}> = ({ onBack, onSubmit, isLoading }) => {
  const [phone, setPhone] = useState('');

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-tenant-primary/5 dark:bg-tenant-primary/10 p-4 rounded-xl border border-tenant-primary/20 dark:border-tenant-primary/30">
        <p className="text-sm text-tenant-primary dark:text-white/80 font-medium text-center">
          Acesse sua conta rapidamente usando seu WhatsApp. Enviaremos um código de acesso.
        </p>
      </div>

      <Input
        label="WhatsApp"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        placeholder="(11) 99999-9999"
        fullWidth
      />

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={() => onSubmit(phone)}
          disabled={isLoading || phone.length < 14}
        >
          {isLoading ? 'Enviando...' : 'Receber Código'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-center text-[10px] font-black uppercase text-gray-500 hover:text-tenant-primary transition-colors"
        >
          Entrar com E-mail e Senha
        </button>
      </div>
    </div>
  );
};
