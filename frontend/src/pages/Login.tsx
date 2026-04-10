import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../services';
import { Scissors, ArrowLeft, Key, Phone, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
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
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      addNotification('success', `Bem-vindo!`);
      navigate(from, { replace: true, state: location.state });
    } catch (error: any) {
      console.error('Erro no login:', error);
      addNotification('error', error.message || 'Erro ao fazer login');
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

    setIsLoading(true);
    try {
      const cleanPhone = registerData.phone.replace(/\D/g, '');
      const payload = { ...registerData, phone: cleanPhone };
      
      const response = await authService.register(payload);
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
        
        {/* Header Section */}
        <div className="bg-gray-900 p-8 md:p-10 text-center relative">
          {view !== 'LOGIN' && (
            <button
              onClick={() => setView('LOGIN')}
              className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="inline-block p-4 rounded-2xl bg-tenant-primary/10 mb-4 transition-transform hover:scale-110 duration-300">
            <Scissors className="h-8 w-8 text-tenant-primary" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            {view === 'LOGIN' ? 'Klypbarber' : 'Nova Conta'}
          </h2>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-3">
            {view === 'LOGIN' ? 'Faça login para continuar' : 'Cadastre-se para agendar seu horário'}
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

              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setView('REGISTER')}
                  className="text-center text-[10px] font-black uppercase text-tenant-primary hover:underline"
                >
                  Não tem conta? Cadastrar grátis
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

          {view === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
              <Input
                label="Seu Nome Completo"
                required
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                placeholder="Ex: João da Silva"
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
                placeholder="seu@email.com"
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

              {/* Footer CTA para Barbearias - Lead First Flow */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-tenant-primary/5 transition-all"
                  onClick={async () => {
                    if (!registerData.name || !registerData.email || !registerData.password || registerData.phone.length < 14) {
                      addNotification('warning', 'Preencha seus dados de cadastro acima primeiro para criar sua barbearia.');
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const cleanPhone = registerData.phone.replace(/\D/g, '');
                      const payload = { ...registerData, phone: cleanPhone };
                      const response = await authService.register(payload);
                      await login(payload.email, payload.password);
                      navigate('/onboarding', { replace: true });
                    } catch (error: any) {
                      addNotification('error', error.message || 'Erro ao criar conta');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <div className="p-2 bg-tenant-primary/10 rounded-xl text-tenant-primary group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-tenant-primary tracking-widest">Dono de Barbearia?</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preencha seus dados e clique aqui para cadastrar sua unidade agora e ganhar 7 dias grátis.</p>
                  </div>
                </div>
              </div>
            </form>
          )}

          {view === 'FORGOT_PASSWORD' && (
            <InstructionsView
              onBack={() => setView('LOGIN')}
              onSubmit={async (email) => {
                setIsLoading(true);
                try {
                  await authService.forgotPassword(email);
                  addNotification('success', 'Instruções de recuperação enviadas para o seu e-mail.');
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
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
         <Scissors size={14} className="text-gray-500" />
         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Powered by Klypbarber</span>
      </div>
    </div>
  );
};

const InstructionsView: React.FC<{
  onBack: () => void,
  onSubmit: (email: string) => Promise<void>,
  isLoading: boolean
}> = ({ onBack, onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-sm text-gray-500 dark:text-white/60 leading-relaxed">
        Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha com segurança.
      </p>

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
          {isLoading ? 'Enviando...' : 'Recuperar Senha'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-center text-[10px] font-black uppercase text-gray-500 hover:text-tenant-primary"
        >
          Voltar para o Login
        </button>
      </div>
    </div>
  );
};
