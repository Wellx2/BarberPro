import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { DisableBarberDto } from './dto/disable-barber.dto';
import { RemoveBarberDto } from './dto/remove-barber.dto';
import { UpdateBarberWorkModelDto } from './dto/update-barber-work-model.dto';
import { CreateAgendaLockDto } from './dto/create-agenda-lock.dto';
import { CheckConflictsDto } from './dto/check-conflicts.dto';
import {
  BarberWorkModel,
  BlockedType,
  BlockedBy,
  AppointmentStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class BarbersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateBarberDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Verificar limite de colaboradores baseado no plano
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: requester.shopId },
      include: { barbers: { where: { active: true } } },
    });

    if (shop && shop.maxTeamMembers) {
      const activeBarbers = shop.barbers.length;
      if (activeBarbers >= shop.maxTeamMembers) {
        throw new BadRequestException(
          `Limite de ${shop.maxTeamMembers} colaboradores atingido para seu plano. Faça upgrade para adicionar mais colaboradores.`,
        );
      }
    }

    let linkedUserId: string | undefined;
    if (dto.email || dto.phone) {
      const candidateUser = await this.prisma.user.findFirst({
        where: {
          shopId: requester.shopId,
          role: UserRole.BARBER,
          OR: [
            ...(dto.email ? [{ email: dto.email }] : []),
            ...(dto.phone ? [{ phone: dto.phone }] : []),
          ],
        },
        select: { id: true },
      });

      if (candidateUser) {
        const alreadyLinked = await this.prisma.barber.findFirst({
          where: { userId: candidateUser.id },
          select: { id: true },
        });

        if (!alreadyLinked) {
          linkedUserId = candidateUser.id;
        }
      }
    }

    const barber = await this.prisma.barber.create({
      data: {
        shopId: requester.shopId,
        userId: linkedUserId,
        name: dto.name,
        nickname: dto.nickname,
        email: dto.email,
        phone: dto.phone,
        description: dto.description,
        bio: dto.bio,
        specialties: dto.specialties,
        avatar: dto.avatar,
        experienceYears: dto.experienceYears,
        services: dto.services,
        role: dto.role,
        commissionRate: dto.commissionRate,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        active: true,
      },
    });
    await this.logAction('CREATE', barber.id, requester.id, requester.shopId, 'Barbeiro criado');
    return barber;
  }

  async findAll(requester: any, active?: boolean) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    return this.prisma.barber.findMany({
      where: {
        shopId: requester.shopId,
        ...(active !== undefined ? { active } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPublicByShop(shopId: string) {
    return this.prisma.barber.findMany({
      where: {
        shopId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        description: true,
        specialties: true,
        rating: true,
        role: true,
      },
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(requester: any, id: string) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    return barber;
  }

  async update(requester: any, id: string, dto: UpdateBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    // Barbeiro só pode editar o próprio perfil
    if (requester.role === 'BARBER' && requester.id !== id) {
      throw new ForbiddenException('Você só pode editar seu próprio perfil');
    }
    const updated = await this.prisma.barber.update({
      where: { id },
      data: { ...dto },
    });
    await this.logAction('UPDATE', id, requester.id, requester.shopId, 'Barbeiro atualizado');
    return updated;
  }

  async disable(requester: any, id: string, dto: DisableBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    const updated = await this.prisma.barber.update({
      where: { id },
      data: { active: false },
    });
    await this.logAction('DISABLE', id, requester.id, requester.shopId, dto.reason);
    return updated;
  }

  async remove(requester: any, id: string, dto: RemoveBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    await this.prisma.barber.update({ where: { id }, data: { active: false } });
    await this.logAction('REMOVE', id, requester.id, requester.shopId, dto.reason);
    // Soft delete: marca como inativo, não remove fisicamente
    return { message: 'Barbeiro removido (soft delete)' };
  }

  /**
   * Atualizar modelo de trabalho e remuneração do barbeiro
   */
  async updateWorkModel(requester: any, id: string, dto: UpdateBarberWorkModelDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Validações baseadas no modelo de trabalho
    if (dto.workModel === BarberWorkModel.CHAIR_RENT && !dto.chairRentalFee) {
      throw new BadRequestException('Aluguel de cadeira requer valor de chairRentalFee');
    }

    if (
      (dto.workModel === BarberWorkModel.SALARY ||
        dto.workModel === BarberWorkModel.SALARY_COMMISSION) &&
      !dto.monthlySalary
    ) {
      throw new BadRequestException('Modelo com salário requer valor de monthlySalary');
    }

    const updated = await this.prisma.barber.update({
      where: { id },
      data: {
        workModel: dto.workModel,
        monthlySalary: dto.monthlySalary,
        chairRentalFee: dto.chairRentalFee,
      },
    });

    await this.logAction(
      'UPDATE_WORK_MODEL',
      id,
      requester.id,
      requester.shopId,
      `Modelo atualizado para ${dto.workModel}`,
    );

    return updated;
  }

  /**
   * Verificar conflitos de agenda antes de bloquear
   */
  async checkAgendaConflicts(requester: any, dto: CheckConflictsDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Verificar se o barbeiro existe e pertence a esta barbearia
    const barber = await this.prisma.barber.findUnique({ where: { id: dto.barberId } });
    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Buscar agendamentos no período especificado
    const startDateTime = new Date(`${dto.date}T${dto.startTime}`);
    const endDateTime = new Date(`${dto.date}T${dto.endTime}`);

    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId: dto.barberId,
        shopId: requester.shopId,
        date: {
          gte: startDateTime,
          lt: endDateTime,
        },
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      hasConflicts: conflictingAppointments.length > 0,
      conflictCount: conflictingAppointments.length,
      conflictingAppointments,
    };
  }

  /**
   * Criar bloqueio de agenda (tranca agenda)
   */
  async createAgendaLock(requester: any, dto: CreateAgendaLockDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Verificar se o barbeiro existe e pertence a esta barbearia
    const barber = await this.prisma.barber.findUnique({ where: { id: dto.barberId } });
    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const startDateTime = new Date(`${dto.date}T${dto.startTime}`);
    const endDateTime = new Date(`${dto.date}T${dto.endTime}`);

    // Criar o bloqueio
    const blockedTime = await this.prisma.blockedTime.create({
      data: {
        shopId: requester.shopId,
        barberId: dto.barberId,
        date: startDateTime,
        type: BlockedType.TIME,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        blockedBy: BlockedBy.ADMIN,
      },
    });

    // Se houver conflitos confirmados, cancelar os agendamentos
    if (dto.conflictingAppointmentIds && dto.conflictingAppointmentIds.length > 0) {
      await this.prisma.appointment.updateMany({
        where: {
          id: { in: dto.conflictingAppointmentIds },
          shopId: requester.shopId,
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelReason: `Agenda bloqueada: ${dto.reason}`,
        },
      });

      // TODO: Implementar notificação aos clientes afetados
      // Isso pode ser feito via email, SMS ou push notification
    }

    await this.logAction(
      'CREATE_AGENDA_LOCK',
      blockedTime.id,
      requester.id,
      requester.shopId,
      `Agenda bloqueada: ${dto.reason}. ${dto.conflictingAppointmentIds?.length || 0} agendamentos cancelados`,
    );

    return {
      blockedTime,
      cancelledAppointments: dto.conflictingAppointmentIds?.length || 0,
    };
  }

  /**
   * Listar bloqueios de agenda de um barbeiro
   */
  async getAgendaLocks(requester: any, barberId: string) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Verificar se o barbeiro existe e pertence a esta barbearia
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Buscar bloqueios futuros ou dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.blockedTime.findMany({
      where: {
        barberId,
        shopId: requester.shopId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Toggle active status do barbeiro
   */
  async toggleActive(requester: any, id: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Sem barbearia vinculada');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const updated = await this.prisma.barber.update({
      where: { id },
      data: { active: !barber.active },
    });

    await this.logAction(
      'TOGGLE_ACTIVE',
      id,
      requester.id,
      requester.shopId,
      `Status alterado para ${updated.active ? 'ativo' : 'inativo'}`,
    );

    return updated;
  }

  /**
   * Busca horários disponíveis de um barbeiro em uma data específica
   */
  async getAvailableSlots(requester: any, id: string, date: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Sem barbearia vinculada');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const shop = await this.prisma.barbershop.findUnique({
      where: { id: requester.shopId },
    });

    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // Buscar agendamentos do dia
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        barberId: id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Buscar bloqueios de agenda
    const locks = await this.prisma.agendaLock.findMany({
      where: {
        teamMemberId: id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // Buscar horários bloqueados (BlockedTime)
    const blockedTimes = await this.prisma.blockedTime.findMany({
      where: {
        barberId: id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // Gerar todos os slots possíveis do dia
    const openingTime = shop.openingTime || '09:00';
    const closingTime = shop.closingTime || '20:00';
    const intervalMinutes = shop.intervalMinutes || 30;

    const allSlots = this.generateTimeSlots(openingTime, closingTime, intervalMinutes);

    // Marcar slots ocupados por agendamentos
    const occupiedSlots = new Set<string>();
    appointments.forEach((apt) => {
      const time = apt.date.toTimeString().substring(0, 5);
      occupiedSlots.add(time);

      // Marcar slots seguintes baseado na duração total
      const totalDuration = apt.services.reduce((sum, s) => sum + (s.service?.duration || 0), 0);
      const slotsNeeded = Math.ceil(totalDuration / intervalMinutes);
      for (let i = 1; i < slotsNeeded; i++) {
        const nextSlot = this.addMinutes(time, i * intervalMinutes);
        occupiedSlots.add(nextSlot);
      }
    });

    // Marcar slots bloqueados por AgendaLock
    locks.forEach((lock) => {
      const slotsInRange = allSlots.filter((slot) => slot >= lock.startTime && slot < lock.endTime);
      slotsInRange.forEach((slot) => occupiedSlots.add(slot));
    });

    // Marcar slots bloqueados por BlockedTime
    blockedTimes.forEach((blocked) => {
      if (blocked.startTime && blocked.endTime) {
        const slotsInRange = allSlots.filter(
          (slot) => slot >= blocked.startTime! && slot < blocked.endTime!,
        );
        slotsInRange.forEach((slot) => occupiedSlots.add(slot));
      }
    });

    // Retornar apenas slots disponíveis
    const availableSlots = allSlots.filter((slot) => !occupiedSlots.has(slot));

    return {
      barberId: id,
      barberName: barber.name,
      date,
      openingTime,
      closingTime,
      intervalMinutes,
      totalSlots: allSlots.length,
      availableSlots,
      occupiedSlots: Array.from(occupiedSlots),
    };
  }

  /**
   * Gera lista de horários baseado no intervalo
   */
  private generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
    const slots: string[] = [];
    let current = start;

    while (current < end) {
      slots.push(current);
      current = this.addMinutes(current, intervalMinutes);
    }

    return slots;
  }

  /**
   * Adiciona minutos a um horário no formato HH:mm
   */
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.toTimeString().substring(0, 5);
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'BARBER',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
