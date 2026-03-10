/**
 * Serviço de Autenticação
 */

import { api } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterShopData {
  name: string;
  email: string;
  password: string;
  shopName: string;
  shopAddress: string;
  phone?: string;
}

interface AuthResponse {
  accessToken: string;        // ✅ Corrigido para camelCase
  refreshToken: string;       // ✅ Corrigido para camelCase
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    shopId: string;
    barberId?: string;
    clientId?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const authData = response.data;


    if (authData.accessToken && authData.refreshToken) {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));


      // Buscar módulos habilitados após login
      try {
        await this.fetchEnabledModules(authData.user.shopId);
      } catch (error) {
        console.warn('âš ï¸ Não foi possível carregar módulos:', error);
      }
    } else {
      console.error('âŒ Login não retornou tokens válidos');
      console.error('Formato recebido:', authData);
      throw new Error('Login não retornou tokens válidos');
    }

    return authData;
  },

  async registerShop(data: RegisterShopData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register-shop', data);
    const authData = response.data;
    if (authData.accessToken) {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    return authData;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('enabled_modules'); // Limpar módulos
    }
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken, // âœ… Backend espera camelCase
    });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  },

  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async validateToken(): Promise<{ user: AuthResponse['user']; message: string }> {
    const response = await api.get<{ user: AuthResponse['user']; message: string }>('/auth/me');
    return response.data;
  },

  // Buscar módulos habilitados da barbearia
  async fetchEnabledModules(shopId: string): Promise<string[]> {
    try {
      const response = await api.get<Array<{ moduleType: string }>>(`/barbershop-modules/shop/${shopId}/enabled`);
      const modules = response.data.map((m) => m.moduleType);
      localStorage.setItem('enabled_modules', JSON.stringify(modules));
      return modules;
    } catch (error) {
      console.warn('âš ï¸ Endpoint de módulos não disponível. Habilitando todos por padrão.');
      // Se o endpoint não existir, habilita todos os módulos por padrão
      const allModules = [
        'AGENDA', 'FINANCEIRO', 'CAIXA', 'SERVICOS',
        'GESTAO_TIME', 'PRODUTOS', 'MARKETING', 'PLANOS',
        'NOTIFICACOES', 'CLIENTES'
      ];
      localStorage.setItem('enabled_modules', JSON.stringify(allModules));
      return allModules;
    }
  },

  // Verificar se tem acesso a um módulo
  hasModuleAccess(moduleType: string): boolean {
    const user = this.getCurrentUser();

    // SUPER_ADMIN tem acesso a tudo
    if (user?.role === 'SUPER_ADMIN') return true;

    const modulesStr = localStorage.getItem('enabled_modules');
    if (!modulesStr) return false;

    try {
      const enabledModules: string[] = JSON.parse(modulesStr);
      return enabledModules.includes(moduleType);
    } catch {
      return false;
    }
  },

  // Perfil e Recuperação de Senha
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: any): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  async updateProfile(data: any): Promise<{ message: string; user: AuthResponse['user'] }> {
    const response = await api.put<{ message: string; user: AuthResponse['user'] }>('/auth/profile', data);

    // Se a atualização foi bem sucedida, atualiza o localStorage
    if (response.data.user) {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('barber_user', JSON.stringify(updatedUser));
    }

    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  // Verificar se pode gerenciar items featured (ADMIN ou SUPER_ADMIN)
  canManageFeatured(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  },
};
