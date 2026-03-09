/**
 * Serviço de Gerenciamento de Equipe / Colaboradores
 */

import { api } from './api';
import { 
  TeamMember, 
  CreateTeamMemberDto, 
  UpdateTeamMemberDto,
  AgendaLock,
  CreateAgendaLockDto,
  UpdateAgendaLockDto,
  AgendaLockConflict
} from '../types';

export const teamService = {
  // ============================================================================
  // TEAM MEMBERS (Colaboradores)
  // ============================================================================

  /**
   * Lista todos os colaboradores da loja atual
   * Backend filtra automaticamente por shopId do usuário logado (TenantGuard)
   */
  async list(includeInactive = false): Promise<TeamMember[]> {
    try {
      const queryParam = includeInactive ? '?includeInactive=true' : '';
      const response = await api.get<TeamMember[]>(`/team-members${queryParam}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }
  },

  /**
   * Busca colaborador por ID
   */
  async getById(id: string): Promise<TeamMember> {
    const response = await api.get<TeamMember>(`/team-members/${id}`);
    return response.data;
  },

  /**
   * Cria novo colaborador (requer autenticação ADMIN)
   */
  async create(data: CreateTeamMemberDto): Promise<TeamMember> {
    const response = await api.post<TeamMember>('/team-members', data);
    return response.data;
  },

  /**
   * Atualiza colaborador (requer autenticação ADMIN)
   */
  async update(id: string, data: UpdateTeamMemberDto): Promise<TeamMember> {
    const response = await api.patch<TeamMember>(`/team-members/${id}`, data);
    return response.data;
  },

  /**
   * Remove colaborador (requer autenticação ADMIN)
   * Soft delete - mantém histórico
   */
  async remove(id: string, reason: string): Promise<void> {
    await api.delete(`/team-members/${id}`, { reason });
  },

  /**
   * Ativa/Desativa colaborador (requer autenticação ADMIN)
   */
  async toggleActive(id: string): Promise<TeamMember> {
    const response = await api.patch<TeamMember>(`/team-members/${id}/toggle-active`);
    return response.data;
  },

  // ============================================================================
  // AGENDA LOCKS (Bloqueio de Agenda)
  // ============================================================================

  /**
   * Verifica conflitos antes de bloquear agenda
   */
  async checkConflicts(data: CreateAgendaLockDto): Promise<AgendaLockConflict> {
    const response = await api.post<AgendaLockConflict>('/agenda-locks/check-conflicts', data);
    return response.data;
  },

  /**
   * Cria bloqueio de agenda
   * Se forceOverride = true, cancela agendamentos conflitantes e notifica clientes
   */
  async createLock(data: CreateAgendaLockDto): Promise<AgendaLock> {
    const response = await api.post<AgendaLock>('/agenda-locks', data);
    return response.data;
  },

  /**
   * Lista bloqueios de agenda por colaborador e período
   */
  async listLocks(teamMemberId?: string, startDate?: string, endDate?: string): Promise<AgendaLock[]> {
    try {
      const params = new URLSearchParams();
      if (teamMemberId) params.append('teamMemberId', teamMemberId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const queryString = params.toString();
      const endpoint = `/agenda-locks${queryString ? '?' + queryString : ''}`;
      
      const response = await api.get<AgendaLock[]>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar bloqueios de agenda:', error);
      return [];
    }
  },

  /**
   * Atualiza bloqueio de agenda
   */
  async updateLock(id: string, data: UpdateAgendaLockDto): Promise<AgendaLock> {
    const response = await api.patch<AgendaLock>(`/agenda-locks/${id}`, data);
    return response.data;
  },

  /**
   * Remove bloqueio de agenda
   */
  async removeLock(id: string): Promise<void> {
    await api.delete(`/agenda-locks/${id}`);
  },

  /**
   * Busca horários disponíveis de um colaborador (considerando locks)
   */
  async getAvailableSlots(teamMemberId: string, date: string): Promise<string[]> {
    const response = await api.get<string[]>(`/team-members/${teamMemberId}/available-slots?date=${date}`);
    return response.data;
  }
};
