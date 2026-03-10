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

      // Helpers de ordenação exportados para reuso
      const getAppointmentDate = (apt: Appointment) => {
        const rawDate = apt.date || apt.scheduledFor;
        if (!rawDate) return null;

        if (rawDate && typeof rawDate === 'object' && !((rawDate as any) instanceof Date) && Object.keys(rawDate as any || {}).length === 0) {
          return null;
        }

        let parsed = new Date(rawDate);

        if (Number.isNaN(parsed.getTime()) && typeof rawDate === 'string') {
          const match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4})(?:.*?(\d{2}):(\d{2}))?/);
          if (match) {
            const [_, d, m, y, h, min] = match;
            parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(h || '0'), Number(min || '0'));
          } else if (/^\d+$/.test(rawDate)) {
            parsed = new Date(Number(rawDate));
          }
        }

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const statusPriority = (status: string) => {
        if (status === 'SCHEDULED') return 0;
        if (status === 'COMPLETED') return 1;
        return 2; // CANCELLED variants
      };

      const sortByTime = (a: Appointment, b: Appointment) => {
        const da = getAppointmentDate(a)?.getTime() ?? 0;
        const db = getAppointmentDate(b)?.getTime() ?? 0;
        return da - db;
      };

      const sortByStatusThenTime = (a: Appointment, b: Appointment) => {
        const statusDiff = statusPriority(a.status) - statusPriority(b.status);
        if (statusDiff !== 0) return statusDiff;
        const da = getAppointmentDate(a)?.getTime() ?? 0;
        const db = getAppointmentDate(b)?.getTime() ?? 0;
        // Para agendados, do mais cedo para o mais tarde (ASC)
        if (a.status === 'SCHEDULED') return da - db;
        // Para concluídos/cancelados, do mais recente para o mais antigo (DESC)
        return db - da;
      };

      const now = new Date();
      // Upcoming: Apenas SCHEDULED e que não passaram do horário
      const upcomingList = data.filter(apt => {
        const appointmentDate = getAppointmentDate(apt);
        if (!appointmentDate) return false;
        return apt.status === 'SCHEDULED' && appointmentDate >= now;
      });

      // Past: Tudo que não é Upcoming (concluídos, cancelados, ou agendados expirados)
      const pastList = data.filter(apt => {
        const appointmentDate = getAppointmentDate(apt);
        // Se não tem data ou já passou ou não está agendado
        if (!appointmentDate) return apt.status !== 'SCHEDULED';
        return appointmentDate < now || apt.status !== 'SCHEDULED';
      });

      setUpcoming([...upcomingList].sort(sortByTime));
      setPast([...pastList].sort(sortByStatusThenTime));
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
