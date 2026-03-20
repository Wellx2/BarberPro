/**
 * Serviço de Barbeiros
 */

import { api } from './api';

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  avatar?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  barbershopId: string;
  active: boolean;
  commissionRate?: number;
  balance?: number;
}

export const barberService = {
  /**
   * Lista barbeiros por barbearia
   */
  async list(barbershopId?: string): Promise<Barber[]> {
    try {
      // Backend filtra automaticamente por shopId do usuário logado (TenantGuard)
      const response = await api.get<Barber[]>('/barbers');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      return [];
    }
  },

  /**
   * Lista barbeiros públicos de uma barbearia (sem autenticação)
   * Retorna TODOS os barbeiros ativos da loja
   * 
   * Backend: GET /barbers/public/shop/:shopId
   */
  async listPublic(shopId: string): Promise<Barber[]> {
    try {
      const response = await api.get<Barber[]>(`/barbers/public/shop/${shopId}`);
      return response.data.filter((b: any) => b.active !== false);
    } catch (error: any) {
      console.error('barberService.listPublic: Erro', error);
      throw error; // Re-throw para permitir fallback não componente
    }
  },

  /**
   * Busca barbeiro por ID
   */
  async getById(id: string): Promise<Barber> {
    const response = await api.get<Barber>(`/barbers/${id}`);
    return response.data;
  },

  /**
   * Busca barbeiro público por ID (sem autenticação)
   */
  async getPublicById(id: string): Promise<Barber> {
    const response = await api.get<Barber>(`/barbers/public/${id}`);
    return response.data;
  },

  /**
   * Cria novo barbeiro (requer autenticação ADMIN)
   */
  async create(data: Omit<Barber, 'id'>): Promise<Barber> {
    const response = await api.post<Barber>('/barbers', data);
    return response.data;
  },

  /**
   * Atualiza barbeiro (requer autenticação)
   */
  async update(id: string, data: Partial<Barber>): Promise<Barber> {
    const response = await api.patch<Barber>(`/barbers/${id}`, data);
    return response.data;
  },

  /**
   * Remove barbeiro (requer autenticação ADMIN)
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/barbers/${id}`);
  },

  /**
   * Ativa/Desativa barbeiro (requer autenticação ADMIN)
   */
  async toggleActive(id: string): Promise<Barber> {
    const response = await api.patch<Barber>(`/barbers/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Busca horários disponíveis de um barbeiro
   */
  async getAvailableSlots(barberId: string, date: string): Promise<string[]> {
    const response = await api.get<string[]>(`/barbers/${barberId}/available-slots?date=${date}`);
    return response.data;
  },

  /**
   * Verificar conflitos de agenda
   */
  async checkConflicts(data: { barberId: string; date: string; startTime: string; endTime: string }): Promise<{ hasConflicts: boolean; conflictCount: number; conflictingAppointments: any[] }> {
    const response = await api.post<{ hasConflicts: boolean; conflictCount: number; conflictingAppointments: any[] }>(`/barbers/agenda-locks/check-conflicts`, data);
    return response.data;
  },

  /**
   * Trancar agenda do barbeiro
   */
  async createAgendaLock(data: { barberId: string; date: string; startTime: string; endTime: string; reason: string; conflictingAppointmentIds?: string[] }): Promise<any> {
    const response = await api.post(`/barbers/agenda-locks`, data);
    return response.data;
  },

  /**
   * Buscar agenda trancada do barbeiro
   */
  async getAgendaLocks(barberId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/barbers/${barberId}/agenda-locks`);
    return response.data;
  },

  /**
   * Busca avaliações de um barbeiro específico
   */
  async getReviews(barberId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/reviews?barberId=${barberId}`);
    return response.data;
  },

  /**
   * Busca avaliações públicas de um barbeiro (sem autenticação)
   */
  async getPublicReviews(barberId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/reviews/public?barberId=${barberId}`);
    return response.data;
  },
};

