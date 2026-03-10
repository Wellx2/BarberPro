
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, Appointment } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, birthDate?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  deductCredit: () => void;
  updatePlan: (planId: string) => void;
  toggleFavorite: (barberId: string) => void;
  updateUserProfile: (data: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('barber_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      localStorage.removeItem('barber_user');
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('barber_user', JSON.stringify(user));
    else localStorage.removeItem('barber_user');
  }, [user]);

  // Login real no backend
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      // Converter dados do backend para formato User do frontend
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        phone: '', // Backend pode não retornar phone
        role: response.user.role as UserRole,
        shopId: response.user.shopId,
        // Capturar barberId/clientId se retornados pelo backend no login
        ...(response.user.barberId && { barberId: response.user.barberId }),
        ...(response.user.clientId && { clientId: response.user.clientId }),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=random`,
        favorites: [],
        credits: 0,
        loyaltyStamps: 0
      };

      setUser(userData);
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const register = (name: string, email: string, phone: string, birthDate?: string) => {
    const newUserId = `c-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name,
      email,
      phone,
      birthDate,
      role: UserRole.CLIENT,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      credits: 0,
      favorites: [],
      loyaltyStamps: 0
    };

    // LÃ“GICA DE VÍNCULO DE HISTÃ“RICO
    try {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        const appointments: Appointment[] = JSON.parse(storedAppointments);
        const updatedApts = appointments.map(apt => {
          // Se o agendamento manual tiver o mesmo telefone, vincula ao novo ID do usuário
          if (apt.clientPhone === phone) {
            return { ...apt, clientId: newUserId, clientPhone: undefined };
          }
          return apt;
        });
        localStorage.setItem('appointments', JSON.stringify(updatedApts));
      }

      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        const invoices = JSON.parse(storedInvoices);
        const updatedInvoices = invoices.map((inv: any) => {
          if (inv.clientPhone === phone) {
            return { ...inv, clientId: newUserId };
          }
          return inv;
        });
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      }
    } catch (e) {
      console.error("Erro ao vincular histórico:", e);
    }

    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    // Limpar todos os dados de autenticação
    localStorage.removeItem('barber_user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('shops_fetch_done'); // Permitir novo fetch na próxima sessão

  };

  const deductCredit = () => {
    setUser(prev => prev ? { ...prev, credits: Math.max(0, (prev.credits || 0) - 1) } : null);
  };

  const updatePlan = (planId: string) => {
    setUser(prev => {
      if (!prev) return null;
      let newCredits = planId === 'premium' ? 8 : 4;
      return { ...prev, planId, credits: newCredits };
    });
  };

  const toggleFavorite = (barberId: string) => {
    setUser(prev => {
      if (!prev) return null;
      const favorites = prev.favorites || [];
      return { ...prev, favorites: favorites.includes(barberId) ? favorites.filter(id => id !== barberId) : [...favorites, barberId] };
    });
  };

  const updateUserProfile = async (data: any) => {
    try {
      const response = await authService.updateProfile(data);

      // Mapear retorno do backend para o formato User do frontend
      const updatedUserData: User = {
        ...user!,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone || '',
      };

      setUser(updatedUserData);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao solicitar recuperação de senha');
    }
  };

  const resetPassword = async (data: any) => {
    try {
      await authService.resetPassword(data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao redefinir senha');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      deductCredit,
      updatePlan,
      toggleFavorite,
      updateUserProfile,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
