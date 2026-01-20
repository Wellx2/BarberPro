
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, Appointment } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  register: (name: string, email: string, phone: string, birthDate?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  deductCredit: () => void;
  updatePlan: (planId: string) => void;
  toggleFavorite: (barberId: string) => void;
  updateUserProfile: (data: Partial<User>) => void;
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

  const login = (role: UserRole) => {
    const mockUser = role === UserRole.CLIENT ? MOCK_USERS.client :
                     role === UserRole.BARBER ? MOCK_USERS.barber :
                     MOCK_USERS.admin;
    setUser({ ...mockUser, favorites: mockUser.favorites || [] });
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

    // LÓGICA DE VÍNCULO DE HISTÓRICO
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
    localStorage.removeItem('barber_user');
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

  const updateUserProfile = (data: Partial<User>) => {
      setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, deductCredit, updatePlan, toggleFavorite, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
