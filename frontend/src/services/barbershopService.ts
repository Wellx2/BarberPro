/**
 * Serviço de Barbearias
 */

import { api } from './api';

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  image: string;
  logo?: string | null;          // 🎨 Logo original
  logoUrl?: string | null;       // 🎨 White Label URL alternativa
  bannerUrl?: string | null;     // 🎨 White Label Banner
  primaryColor?: string | null;  // 🎨 White Label Cor primária
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  settings?: {
    subscriptionEnabled: boolean;
    notificationsEnabled: boolean;
    darkModeEnabled: boolean;
    modulesEnabled?: {
      clientPlans?: boolean;
      products?: boolean;
      reviews?: boolean;
      cashier?: boolean;
      financial?: boolean;
      reports?: boolean;
    };
  };
}

export interface SwitchShopResponse {
  message: string;
  shop: Barbershop;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    shopId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface BarbershopPreview {
  shop: {
    id: string;
    name: string;
    phone: string;
    address: string;
    openingTime: string;
    closingTime: string;
    intervalMinutes: number;
    logo: string | null;
    logoUrl?: string | null;   // 🎨 White Label
    bannerUrl?: string | null; // 🎨 White Label
    primaryColor?: string | null; // 🎨 White Label
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    duration: number;
    image: string | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    image: string | null;
  }>;
  barbers: Array<{
    id: string;
    name: string;
    nickname: string;
    description: string;
    specialties: string[];
    rating: number;
    avatar: string | null;
    role: string;
  }>;
}

export const barbershopService = {
  /**
   * Lista todas as barbearias públicas (sem autenticação)
   */
  async listPublic(): Promise<Barbershop[]> {
    try {
      // Tentar endpoint público primeiro
      const response = await api.get<Barbershop[]>('/barbershops/public');
      return response.data;
    } catch (error: any) {
      console.error('âŒ barbershopService: Erro não endpoint público:', error);
      // Fallback para endpoint principal (pode não ter /public)
      try {
        const response = await api.get<Barbershop[]>('/barbershops');
        return response.data;
      } catch (fallbackError: any) {
        console.error('âŒ barbershopService: Fallback também falhou:', fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Busca preview de barbearia (sem autenticação)
   * Retorna shop + top 3 serviços + top 3 produtos + top 3 barbeiros
   */
  async getPreview(shopId: string): Promise<BarbershopPreview> {
    const response = await api.get<BarbershopPreview>(`/barbershops/public/${shopId}`);
    return response.data;
  },

  /**
   * Lista todas as barbearias (requer autenticação)
   */
  async list(): Promise<Barbershop[]> {
    const response = await api.get<Barbershop[]>('/barbershops');
    return response.data;
  },

  /**
   * Busca barbearia por ID
   */
  async getById(id: string): Promise<Barbershop> {
    const response = await api.get<Barbershop>(`/barbershops/${id}`);
    return response.data;
  },

  /**
   * Cria nova barbearia (requer autenticação SUPER_ADMIN)
   */
  async create(data: Omit<Barbershop, 'id'>): Promise<Barbershop> {
    const response = await api.post<Barbershop>('/barbershops', data);
    return response.data;
  },

  /**
   * Atualiza barbearia (requer autenticação ADMIN)
   */
  async update(id: string, data: Partial<Barbershop>): Promise<Barbershop> {
    const response = await api.patch<Barbershop>(`/barbershops/${id}`, data);
    return response.data;
  },

  /**
   * Remove barbearia (requer autenticação SUPER_ADMIN)
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/barbershops/${id}`);
  },

  /**
   * Troca de barbearia (multitenant)
   * Retorna novo JWT com shopId atualizado
   */
  async switch(shopId: string): Promise<SwitchShopResponse> {
    const response = await api.post<SwitchShopResponse>('/barbershops/switch', { shopId });
    return response.data;
  },

  /**
   * Atualiza configurações de módulos da barbearia
   */
  async updateModuleSettings(shopId: string, modulesEnabled: any): Promise<Barbershop> {
    const response = await api.patch<Barbershop>(`/barbershops/${shopId}/modules`, { modulesEnabled });
    return response.data;
  },
};
