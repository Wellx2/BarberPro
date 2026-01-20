
import React, { useState } from 'react';
// Fix: Import useNavigate and useLocation from react-router to resolve export errors in some environments
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User, Scissors, Shield, Briefcase, Mail, ArrowRight, ArrowLeft, Phone } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // QA: Se veio do agendamento, o "from" será /book e conterá o location.state
  const from = location.state?.from || '/dashboard';

  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleLogin = (role: UserRole) => {
    login(role);
    // QA: Passa o state adiante para o Booking receber os serviços pré-selecionados
    navigate(from, { replace: true, state: location.state });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      let formattedValue = value;
      if (value.length > 2) formattedValue = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      if (value.length > 7) formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      setFormData({ ...formData, phone: formattedValue });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.phone) {
        if (formData.phone.length < 14) {
            alert("Por favor, insira um número de celular válido.");
            return;
        }
        register(formData.name, formData.email, formData.phone);
        // QA: Mesmo redirecionamento inteligente do login
        navigate(from, { replace: true, state: location.state });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] md:min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-4 transition-all">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-50 dark:border-gray-700">
        <div className="bg-gray-900 p-8 text-center relative">
            {isRegistering && <button onClick={() => setIsRegistering(false)} className="absolute top-6 left-6 text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>}
            <div className="inline-block p-4 rounded-2xl bg-amber-500 mb-4 shadow-lg shadow-amber-500/30"><Scissors className="h-8 w-8 text-white" /></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{isRegistering ? 'Nova Conta' : 'Acesse sua conta'}</h2>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-2">{isRegistering ? 'Seja bem-vindo ao time' : 'Escolha sua porta de entrada'}</p>
        </div>
        <div className="p-8">
            {!isRegistering ? (
                <div className="space-y-4">
                    <button onClick={() => handleLogin(UserRole.CLIENT)} className="w-full flex items-center p-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-gray-750 transition-all group">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform"><User className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                        <div className="ml-4 text-left"><h3 className="font-bold text-sm dark:text-white">Sou Cliente</h3><p className="text-[10px] text-gray-400 uppercase font-black">Agendar e comprar</p></div>
                    </button>
                    <button onClick={() => handleLogin(UserRole.BARBER)} className="w-full flex items-center p-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-gray-750 transition-all group">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform"><Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                        <div className="ml-4 text-left"><h3 className="font-bold text-sm dark:text-white">Sou Barbeiro</h3><p className="text-[10px] text-gray-400 uppercase font-black">Gestão da agenda</p></div>
                    </button>
                    <button onClick={() => handleLogin(UserRole.ADMIN)} className="w-full flex items-center p-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-gray-750 transition-all group">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform"><Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div>
                        <div className="ml-4 text-left"><h3 className="font-bold text-sm dark:text-white">Administrador</h3><p className="text-[10px] text-gray-400 uppercase font-black">Controle total</p></div>
                    </button>
                    <button onClick={() => setIsRegistering(true)} className="w-full text-center mt-6 text-[10px] font-black uppercase text-amber-600 hover:underline">Ainda não tem conta? Criar agora</button>
                </div>
            ) : (
                <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
                    <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Nome Completo</label><input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-50 dark:border-gray-700 rounded-2xl text-sm dark:text-white" placeholder="João da Silva" /></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">WhatsApp</label><input type="tel" required value={formData.phone} onChange={handlePhoneChange} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-50 dark:border-gray-700 rounded-2xl text-sm dark:text-white" placeholder="(11) 99999-9999" /></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">E-mail</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-50 dark:border-gray-700 rounded-2xl text-sm dark:text-white" placeholder="joao@email.com" /></div>
                    <button type="submit" className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20">Registrar e Acessar</button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
