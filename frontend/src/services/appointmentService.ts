/**
 * Serviço de Agendamentos
 * Integração com API backend real (Prisma + NestJS)
 * 
 * Backend API: /api/appointments
 * Documentação: backend/docs/APPOINTMENTS_API.md
 */

import { api } from './api';
import { Appointment } from '../types';

/**
 * DTO para criar novo agendamento
 * Backend valida identidade contra JWT:
 * - CLIENT: clientId inferido do JWT (omitir)
 * - BARBER: barberId inferido do JWT (omitir), clientId obrigatório
 * - ADMIN: clientId e barberId obrigatórios
 */
export interface CreateAppointmentDto {
  barberId?: string; // Opcional: omitir para BARBER (inferido do JWT)
  serviceIds: string[];
  date: string; // ISO 8601: "2026-02-14T10:00:00.000Z"
  notes?: string;
  clientId?: string; // Opcional: omitir para CLIENT (inferido do JWT), obrigatório para BARBER e ADMIN
  products?: Array<{
    id: string;
    quantity: number;
  }>;
}

/**
 * DTO para cancelar agendamento
 */
export interface CancelAppointmentDto {
  cancelReason: string;
}

/**
 * Filtros para listagem
 */
export interface AppointmentFilters {
  date?: string; // YYYY-MM-DD ou ISO 8601
  startDate?: string;
  endDate?: string;
  barberId?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_BARBER';
}

export const appointmentService = {
  /**
   * Criar novo agendamento
   * POST /appointments
   * 
   * Formato do backend (Swagger):
   * CLIENT: { barberId, serviceIds, date, notes?, products? } (clientId inferido do JWT)
 * BARBER: { clientId, serviceIds, date, notes?, products? } (barberId inferido do JWT)
 * ADMIN/SUPER_ADMIN: { clientId, barberId, serviceIds, date, notes?, products? }
 */
  async create(data: CreateAppointmentDto): Promise<Appointment> {

    // Montar payload conforme esperado pelo backend
    // Para CLIENT: clientId é inferido do JWT pelo backend (omitir)
    // Para BARBER: barberId é inferido do JWT pelo backend (omitir), clientId obrigatório
    // Para ADMIN/SUPER_ADMIN: clientId e barberId são obrigatórios
    const payload = {
      ...(data.barberId && { barberId: data.barberId }),
      serviceIds: data.serviceIds,
      date: data.date,
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.notes && { notes: data.notes }),
      ...(data.products && { products: data.products })
    };


    try {
      const response = await api.post<Appointment>('/appointments', payload);
      return response.data;
    } catch (error: any) {
      // Tratar erro 403 (vínculo) de forma específica
      if (error?.statusCode === 403 || error?.status === 403) {
        const vinculoError = error?.message?.includes('próprio')
          ? 'Você só pode agendar para seu próprio perfil (cliente/barbeiro).'
          : 'Seu usuário não está vinculado ao perfil de cliente/barbeiro nesta barbearia. Contate o administrador.';
        console.warn('Erro de vínculo de identidade (403):', error?.message);
        throw { ...error, message: vinculoError };
      }

      console.error('Erro ao criar agendamento:', {
        status: error?.statusCode || error?.status,
        message: error?.message,
        error: error?.error,
        fullData: error
      });
      throw error;
    }
  },

  /**
   * Listar agendamentos com filtros
   * GET /appointments?date=...&barberId=...&status=...
   */
  async list(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    const response = await api.get<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
    return response.data;
  },

  /**
   * Buscar agendamento por ID
   * GET /appointments/:id
   */
  async getById(id: string): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  /**
   * Cancelar agendamento
   * PATCH /appointments/:id/cancel
   * 
   * @param id - ID do agendamento
   * @param cancelReason - Motivo do cancelamento (obrigatório)
   */
  async cancel(id: string, cancelReason: string): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/cancel`,
      { cancelReason }
    );
    return response.data;
  },

  /**
   * Marcar agendamento como concluído
   * PATCH /appointments/:id/complete
   * 
   * Apenas ADMIN e BARBER podem completar
   * @param id - ID do agendamento
   * @param extraProducts - Produtos adicionados durante o atendimento (Ordem de Serviço)
   */
  async complete(id: string, extraProducts?: Array<{ id: string; quantity: number }>): Promise<Appointment> {
    const body = extraProducts && extraProducts.length > 0 ? { products: extraProducts } : {};
    const response = await api.patch<Appointment>(
      `/appointments/${id}/complete`,
      body
    );
    return response.data;
  },

  /**
   * Cancelar agendamento pelo barbeiro
   * PATCH /appointments/:id/cancel
   * Para BARBER role, o backend define status como CANCELLED_BY_BARBER
   */
  async cancelByBarber(id: string, cancelReason: string): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/cancel`,
      { cancelReason }
    );
    return response.data;
  },

  // ============================================
  // HELPERS PARA DASHBOARDS
  // ============================================

  /**
   * Buscar agenda do barbeiro em uma data específica
   * @param barberId - ID do barbeiro (opcional: se null, backend filtra por JWT)
   * @param date - Data não formato Date
   */
  async getBarberSchedule(barberId: string | null, date: Date): Promise<Appointment[]> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    // Se barberId estiver disponível, filtrar por ele; caso contrário, backend filtra por JWT (BARBER role)
    return this.list(barberId ? { barberId, date: dateStr } : { date: dateStr });
  },

  /**
   * Buscar agendamentos do dia
   * @param date - Data não formato Date
   */
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const dateStr = date.toISOString().split('T')[0];
    return this.list({ date: dateStr });
  },

  /**
   * Buscar agendamentos agendados (não cancelados/concluídos)
   */
  async getScheduledAppointments(): Promise<Appointment[]> {
    return this.list({ status: 'SCHEDULED' });
  },

  /**
   * Buscar agendamentos concluídos
   */
  async getCompletedAppointments(): Promise<Appointment[]> {
    return this.list({ status: 'COMPLETED' });
  },

  /**
   * Buscar agendamentos cancelados
   */
  async getCancelledAppointments(): Promise<Appointment[]> {
    const cancelled = await this.list({ status: 'CANCELLED' });
    const cancelledByBarber = await this.list({ status: 'CANCELLED_BY_BARBER' });
    return [...cancelled, ...cancelledByBarber];
  },

  /**
   * Buscar slots disponíveis de um barbeiro
   * GET /barbers/:id/available-slots?date=YYYY-MM-DD&duration=30
   */
  async getAvailableSlots(barberId: string, date: string, durationMinutes?: number): Promise<string[]> {
    try {
      let formattedDate = date;
      if (date.includes('T')) {
        formattedDate = date.split('T')[0];
      }

      let url = `/barbers/${barberId}/available-slots?date=${formattedDate}`;
      if (durationMinutes && durationMinutes > 0) {
        url += `&duration=${durationMinutes}`;
      }

      const response = await api.get<string[]>(url);
      return response.data;
    } catch (error: any) {
      // Se endpoint não existir, retorna array vazio
      if (error.statusCode === 404 || error.response?.status === 404) {
        console.warn('Endpoint /barbers/:id/available-slots não implementado');
        return [];
      }
      console.error('Erro ao buscar slots disponíveis:', error);
      return [];
    }
  },

  /**
   * Obter contagem de cancelamentos do barbeiro logado (mensal e semanal)
   */
  async getMyCancellationsCount(): Promise<{ monthly: number; weekly: number }> {
    const response = await api.get<{ monthly: number; weekly: number }>('/appointments/my-cancellations-count');
    return response.data;
  },

  /**
   * Enviar lembrete manual ao cliente
   */
  async sendManualReminder(id: string): Promise<{ success: boolean; reason?: string }> {
    const response = await api.post<{ success: boolean; reason?: string }>(`/appointments/${id}/send-reminder`);
    return response.data;
  },

  /**
   * Atualizar preferências do agendamento (ex: lembrete automático)
   */
  async updatePreferences(id: string, data: { reminderEnabled?: boolean }): Promise<Appointment> {
    const response = await api.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },
};
