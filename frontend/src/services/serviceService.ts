/**
 * Serviço de Serviços (Services)
 */

import { api } from './api';
import { Service } from '../types';

interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  active?: boolean;
}

interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
  image?: string;
  active?: boolean;
  featured?: boolean;
}

export const serviceService = {
  async create(data: CreateServiceDto): Promise<Service> {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  async list(barbershopId: string): Promise<Service[]> {
    try {
      const response = await api.get<Service[]>(`/services/public/shop/${barbershopId}`);
      // Filtro de segurança: remover itens com deletedAt preenchido
      return response.data.filter((s: any) => !s.deletedAt);
    } catch (error: any) {
      console.error('Erro ao buscar serviços:', error.message);
      throw error;
    }
  },

  async getById(id: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}`, data);
    return response.data;
  },

  /**
   * Remove serviço (soft delete)
   * @param id - UUID do serviço
   * @param reason - Motivo da remoção (obrigatório pelo backend)
   */
  async remove(id: string, reason: string): Promise<void> {
    await api.delete<void>(`/services/${id}`, { reason });
  },

  async disable(id: string): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}/disable`, {});
    return response.data;
  },
};
