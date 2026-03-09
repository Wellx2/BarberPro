/**
 * Serviço de Planos de Assinatura
 * 
 * Gerencia os planos que a barbearia oferece aos seus clientes.
 * O shopId é automaticamente inferido no backend através do JWT (TenantGuard).
 */

import { api } from './api';
import { Plan, CreatePlanDto, UpdatePlanDto } from '../types';

export const planService = {
  /**
   * Buscar planos públicos de uma barbearia específica (sem autenticação)
   */
  async getPublicPlans(shopId: string): Promise<Plan[]> {
    const response = await api.get<Plan[]>(`/plans/public/shop/${shopId}`);
    return response.data;
  },

  /**
   * Buscar todos os planos da loja atual
   * Backend filtra automaticamente por shopId do usuário logado (TenantGuard)
   */
  async getAll(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans');
    return response.data;
  },

  /**
   * Buscar plano por ID
   */
  async getById(id: string): Promise<Plan> {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  },

  /**
   * Criar novo plano (requer autenticação ADMIN)
   * O shopId é automaticamente adicionado pelo backend baseado no JWT
   */
  async create(data: CreatePlanDto): Promise<Plan> {
    const response = await api.post<Plan>('/plans', data);
    return response.data;
  },

  /**
   * Atualizar plano existente (requer autenticação ADMIN)
   */
  async update(id: string, data: UpdatePlanDto): Promise<Plan> {
    const response = await api.patch<Plan>(`/plans/${id}`, data);
    return response.data;
  },

  /**
   * Excluir plano (requer autenticação ADMIN)
   * Apenas planos inativos podem ser excluídos
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/plans/${id}`);
    return response.data;
  },

  /**
   * Ativar/Desativar plano (requer autenticação ADMIN)
   */
  async toggleActive(id: string): Promise<Plan> {
    const response = await api.patch<Plan>(`/plans/${id}/toggle-active`);
    return response.data;
  },
};
