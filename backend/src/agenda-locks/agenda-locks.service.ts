import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaLockDto } from './dto/create-agenda-lock.dto';
import { UpdateAgendaLockDto } from './dto/update-agenda-lock.dto';
import { CheckConflictsDto } from './dto/check-conflicts.dto';
import { AppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AgendaLocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Verifica se há conflitos de agendamentos no período especificado
   */
  async checkConflicts(dto: CheckConflictsDto, requester: any) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    // Validar se o teamMember pertence ao shop
    const teamMember = await this.prisma.barber.findFirst({
      where: {
        id: dto.teamMemberId,
        shopId: requester.shopId,
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Validar horários
    this.validateTimes(dto.startTime, dto.endTime);
    this.validateDateTime(dto.date, dto.startTime);

    // Buscar agendamentos conflitantes
    const conflicts = await this.findConflictingAppointments(
      dto.teamMemberId,
      dto.date,
      dto.startTime,
      dto.endTime,
      requester.shopId,
    );

    return {
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map((apt) => ({
        id: apt.id,
        clientName: apt.client.name,
        clientPhone: apt.client.phone,
        scheduledFor: apt.date,
        serviceIds: apt.services.map((s) => s.serviceId),
      })),
      message:
        conflicts.length > 0
          ? `Existem ${conflicts.length} agendamento(s) neste horário`
          : 'Nenhum conflito encontrado',
    };
  }

  /**
   * Cria um bloqueio de agenda
   */
  async create(dto: CreateAgendaLockDto, requester: any) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    // Validar se o teamMember pertence ao shop
    const teamMember = await this.prisma.barber.findFirst({
      where: {
        id: dto.teamMemberId,
        shopId: requester.shopId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Validar horários e data
    this.validateTimes(dto.startTime, dto.endTime);
    this.validateDateTime(dto.date, dto.startTime);

    // Buscar agendamentos conflitantes
    const conflicts = await this.findConflictingAppointments(
      dto.teamMemberId,
      dto.date,
      dto.startTime,
      dto.endTime,
      requester.shopId,
    );

    let notifiedClients: string[] = [];

    // Se forceOverride = true, cancelar agendamentos
    if (dto.forceOverride && conflicts.length > 0) {
      const appointmentIds = conflicts.map((apt) => apt.id);
      const clientIds = conflicts.map((apt) => apt.clientId);

      // Cancelar agendamentos
      await this.prisma.appointment.updateMany({
        where: {
          id: { in: appointmentIds },
        },
        data: {
          status: AppointmentStatus.CANCELLED_BY_BARBER,
          cancelReason: `Agenda bloqueada: ${dto.reason}`,
        },
      });

      notifiedClients = clientIds;

      // Notificar clientes
      for (const apt of conflicts) {
        try {
          await this.notificationsService.notifyCancellationByBarber(
            apt,
            apt.barber,
            apt.client,
            `Agenda trancada: ${dto.reason}`,
          );
        } catch (error) {
          console.error(`Erro ao notificar cliente ${apt.clientId}:`, error);
        }
      }
    } else if (conflicts.length > 0 && !dto.forceOverride) {
      throw new BadRequestException(
        `Existem ${conflicts.length} agendamento(s) conflitante(s). Use forceOverride=true para cancelá-los.`,
      );
    }

    // Criar bloqueio
    const agendaLock = await this.prisma.agendaLock.create({
      data: {
        shopId: requester.shopId,
        teamMemberId: dto.teamMemberId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        lockedBy: requester.id,
        forceOverride: dto.forceOverride || false,
        notifiedClients,
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Buscar agendamentos cancelados para retornar no response
    const conflictingAppointments =
      dto.forceOverride && conflicts.length > 0
        ? conflicts.map((apt) => ({
          id: apt.id,
          clientName: apt.client.name,
          scheduledFor: apt.date,
        }))
        : [];

    return {
      id: agendaLock.id,
      teamMemberId: agendaLock.teamMemberId,
      teamMemberName: agendaLock.barber.name,
      date: agendaLock.date.toISOString().split('T')[0],
      startTime: agendaLock.startTime,
      endTime: agendaLock.endTime,
      reason: agendaLock.reason,
      lockedBy: agendaLock.lockedBy,
      lockedByName: agendaLock.lockedByUser.name,
      conflictingAppointments,
      notifiedClients: agendaLock.notifiedClients,
      createdAt: agendaLock.createdAt,
      updatedAt: agendaLock.updatedAt,
    };
  }

  /**
   * Lista todos os bloqueios de agenda
   */
  async findAll(
    requester: any,
    filters?: {
      teamMemberId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const where: any = {
      shopId: requester.shopId,
    };

    if (filters?.teamMemberId) {
      where.teamMemberId = filters.teamMemberId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const locks = await this.prisma.agendaLock.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });

    return locks.map((lock) => ({
      id: lock.id,
      teamMemberId: lock.teamMemberId,
      teamMemberName: lock.barber.name,
      date: lock.date.toISOString().split('T')[0],
      startTime: lock.startTime,
      endTime: lock.endTime,
      reason: lock.reason,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByUser.name,
      notifiedClients: lock.notifiedClients,
      createdAt: lock.createdAt,
      updatedAt: lock.updatedAt,
    }));
  }

  /**
   * Busca um bloqueio por ID
   */
  async findOne(id: string, requester: any) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const lock = await this.prisma.agendaLock.findFirst({
      where: {
        id,
        shopId: requester.shopId,
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lock) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return {
      id: lock.id,
      teamMemberId: lock.teamMemberId,
      teamMemberName: lock.barber.name,
      date: lock.date.toISOString().split('T')[0],
      startTime: lock.startTime,
      endTime: lock.endTime,
      reason: lock.reason,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByUser.name,
      notifiedClients: lock.notifiedClients,
      createdAt: lock.createdAt,
      updatedAt: lock.updatedAt,
    };
  }

  /**
   * Atualiza um bloqueio
   */
  async update(id: string, dto: UpdateAgendaLockDto, requester: any) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const existingLock = await this.prisma.agendaLock.findFirst({
      where: {
        id,
        shopId: requester.shopId,
      },
    });

    if (!existingLock) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    // Validar horários se fornecidos
    if (dto.startTime && dto.endTime) {
      this.validateTimes(dto.startTime, dto.endTime);
    }

    // Validar data se fornecida
    if (dto.date) {
      this.validateDateTime(dto.date, dto.startTime || existingLock.startTime);
    }

    const updated = await this.prisma.agendaLock.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.reason && { reason: dto.reason }),
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      teamMemberId: updated.teamMemberId,
      teamMemberName: updated.barber.name,
      date: updated.date.toISOString().split('T')[0],
      startTime: updated.startTime,
      endTime: updated.endTime,
      reason: updated.reason,
      lockedBy: updated.lockedBy,
      lockedByName: updated.lockedByUser.name,
      notifiedClients: updated.notifiedClients,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Remove um bloqueio
   */
  async remove(id: string, requester: any) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const existingLock = await this.prisma.agendaLock.findFirst({
      where: {
        id,
        shopId: requester.shopId,
      },
    });

    if (!existingLock) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    await this.prisma.agendaLock.delete({
      where: { id },
    });

    return { message: 'Bloqueio removido com sucesso' };
  }

  /**
   * Busca agendamentos conflitantes
   */
  private async findConflictingAppointments(
    barberId: string,
    date: string,
    startTime: string,
    endTime: string,
    shopId: string,
  ) {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        shopId,
        barberId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
        services: {
          select: {
            serviceId: true,
            service: {
              select: {
                duration: true
              }
            }
          },
        },
      },
    });

    // Filtrar por horário
    return appointments.filter((apt) => {
      const aptStart = apt.date.toTimeString().substring(0, 5);

      // Calcular duração total para saber o fim do agendamento
      const totalDuration = apt.services.reduce((sum, s) => {
        // Precisamos do objeto service para pegar a duração
        // No findMany usamos apenas serviceId, vamos ajustar para incluir a duração
        return sum + ((s as any).service?.duration || 30); // Fallback 30 min
      }, 0);

      const [h, m] = aptStart.split(':').map(Number);
      const endAt = new Date(apt.date.getTime() + totalDuration * 60000);
      const aptEnd = endAt.toTimeString().substring(0, 5);

      return this.timeOverlaps(startTime, endTime, aptStart, aptEnd);
    });
  }

  /**
   * Verifica se dois intervalos de tempo se sobrepõem
   */
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Valida se endTime > startTime
   */
  private validateTimes(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('Hora de término deve ser maior que hora de início');
    }
  }

  /**
   * Valida se a data e hora não são passadas
   */
  private validateDateTime(date: string, startTime: string) {
    const targetDate = new Date(date);
    const [hours, minutes] = startTime.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (targetDate < now) {
      if (targetDate.toDateString() === now.toDateString()) {
        throw new BadRequestException('Não é possível criar bloqueio em horário passado');
      }
      throw new BadRequestException('Não é possível criar bloqueio em data passada');
    }
  }
}
