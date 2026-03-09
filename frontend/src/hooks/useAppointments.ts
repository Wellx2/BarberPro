/**
 * Hook para gerenciar agendamentos
 * Facilita o uso do appointmentService em componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { appointmentService, AppointmentFilters } from '../services/appointmentService';
import { Appointment } from '../types';
import { useToast } from '../components/feedback';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createAppointment: (data: any) => Promise<Appointment | null>;
  cancelAppointment: (id: string, cancelReason: string) => Promise<boolean>;
  markAsCompleted: (id: string) => Promise<boolean>;
}

/**
 * Hook para gerenciar lista de agendamentos com filtros
 */
export function useAppointments(filters?: AppointmentFilters): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Carregar agendamentos
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.list(filters);
      setAppointments(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao carregar agendamentos';
      setError(errorMsg);
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  // Carregar na montagem e quando filtros mudarem
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Criar agendamento
  const createAppointment = async (data: any): Promise<Appointment | null> => {
    try {
      const newAppointment = await appointmentService.create(data);
      addToast({ type: 'success', message: 'Agendamento criado com sucesso!' });
      await loadAppointments(); // Recarregar lista
      return newAppointment;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao criar agendamento';
      addToast({ type: 'error', message: errorMsg });
      console.error('Erro ao criar agendamento:', err);
      return null;
    }
  };

  // Cancelar agendamento
  const cancelAppointment = async (id: string, cancelReason: string): Promise<boolean> => {
    try {
      await appointmentService.cancel(id, cancelReason);
      addToast({ type: 'success', message: 'Agendamento cancelado' });
      await loadAppointments();
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao cancelar agendamento';
      addToast({ type: 'error', message: errorMsg });
      console.error('Erro ao cancelar agendamento:', err);
      return false;
    }
  };

  // Marcar como concluído
  const markAsCompleted = async (id: string): Promise<boolean> => {
    try {
      await appointmentService.complete(id);
      addToast({ type: 'success', message: 'Serviço marcado como concluído!' });
      await loadAppointments();
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao marcar serviço como concluído';
      addToast({ type: 'error', message: errorMsg });
      console.error('Erro:', err);
      return false;
    }
  };

  return {
    appointments,
    loading,
    error,
    refresh: loadAppointments,
    createAppointment,
    cancelAppointment,
    markAsCompleted
  };
}

/**
 * Hook para buscar um agendamento específico
 */
export function useAppointment(id: string | null) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setAppointment(null);
      setLoading(false);
      return;
    }

    const loadAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getById(id);
        setAppointment(data);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Erro ao carregar agendamento';
        setError(errorMsg);
        console.error('Erro ao carregar agendamento:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id]);

  return { appointment, loading, error };
}

/**
 * Hook para agenda do barbeiro
 */
export function useBarberSchedule(barberId: string | null, date: Date) {
  const [schedule, setSchedule] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Passa barberId se disponível; caso contrário o backend filtra pelo JWT
      const data = await appointmentService.getBarberSchedule(barberId, date);
      setSchedule(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err?.message || 'Erro ao carregar agenda';
      setError(errorMsg);
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [barberId, date.toISOString()]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Retornar função refresh para recarregar agenda
  const refresh = useCallback(() => loadSchedule(), [loadSchedule]);

  return { schedule, loading, error, refresh };
}

/**
 * Hook para agendamentos do cliente
 * Nota: Backend filtra automaticamente por clientId baseado no JWT
 */
export function useClientAppointments(clientId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClientAppointments = useCallback(async () => {
    if (!clientId) {
      setAppointments([]);
      setUpcoming([]);
      setPast([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Backend filtra automaticamente por clientId
      const data = await appointmentService.list();
      setAppointments(data);

      // Separar futuros e passados
      const getAppointmentDate = (apt: Appointment) => {
        const rawDate = apt.date || apt.scheduledFor;
        if (!rawDate) return null;

        let parsed = new Date(rawDate);

        // Fallback para datas salvas incorretamente como texto (ex: "04/03/2026 Às 09:30")
        if (Number.isNaN(parsed.getTime()) && typeof rawDate === 'string') {
          const match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
          if (match) {
            const [_, d, m, y, h, min] = match;
            parsed = new Date(`${y}-${m}-${d}T${h}:${min}:00.000Z`);
          }
        }

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const now = new Date();
      const upcomingList = data.filter(apt => {
        const appointmentDate = getAppointmentDate(apt);
        if (!appointmentDate) return false;
        return appointmentDate >= now && apt.status === 'SCHEDULED';
      });
      const pastList = data.filter(apt => {
        const appointmentDate = getAppointmentDate(apt);

        if (!appointmentDate) {
          return apt.status === 'COMPLETED' || apt.status.includes('CANCELLED');
        }

        return appointmentDate < now || apt.status === 'COMPLETED' || apt.status.includes('CANCELLED');
      });

      setUpcoming(upcomingList);
      setPast(pastList);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao carregar agendamentos';
      setError(errorMsg);
      console.error('Erro ao carregar agendamentos do cliente:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientAppointments();
  }, [loadClientAppointments]);

  return {
    appointments,
    upcoming,
    past,
    loading,
    error,
    refresh: loadClientAppointments
  };
}
