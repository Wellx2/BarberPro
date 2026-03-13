import { api } from './api';
import { Plan, CreatePlanDto } from '../types';

/**
 * Serviço de Planos de Assinatura
 * 
 * Gerencia os planos que a barbearia oferece aos seus clientes.
 * O shopId é automaticamente inferido no backend através do JWT (TenantGuard).
 */
export const planService = {
  /**
   * Buscar planos públicos de uma barbearia específica (sem autenticação)
   */
  async listPublic(shopId: string): Promise<Plan[]> {
    const response = await api.get<Plan[]>(`/plans/public/${shopId}`);
    return response.data;
  },

  /**
   * Alias para compatibilidade com componentes antigos
   */
  async getPublicPlans(shopId: string): Promise<Plan[]> {
    return this.listPublic(shopId);
  },

  /**
   * Buscar todos os planos da loja atual
   */
  async list(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans');
    return response.data;
  },

  /**
   * Alias para compatibilidade com componentes antigos
   */
  async getAll(): Promise<Plan[]> {
    return this.list();
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
  async update(id: string, data: Partial<CreatePlanDto>): Promise<Plan> {
    const response = await api.put<Plan>(`/plans/${id}`, data);
    return response.data;
  },

  /**
   * Excluir plano (requer autenticação ADMIN)
   * Apenas planos inativos podem ser excluídos
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/plans/${id}`);
  },

  /**
   * Ativar/Desativar plano (requer autenticação ADMIN)
   */
  async toggleActive(id: string): Promise<Plan> {
    const response = await api.patch<Plan>(`/plans/${id}/toggle-active`);
    return response.data;
  },
};
