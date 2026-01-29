import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { BlockedType, BlockedBy } from '@prisma/client';

@Injectable()
export class BlockedTimesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateBlockedTimeDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Valida que barbeiro pertence ao shop
    const barber = await this.prisma.barber.findUnique({
      where: { id: dto.barberId },
    });

    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Validações por tipo
    const startDate = new Date(dto.date);
    let endDate: Date | null = null;

    if (dto.type === BlockedType.RANGE) {
      if (!dto.endDate) {
        throw new BadRequestException('endDate é obrigatório para tipo RANGE');
      }
      endDate = new Date(dto.endDate);
      if (endDate <= startDate) {
        throw new BadRequestException('endDate deve ser posterior a date');
      }
    }

    if (dto.type === BlockedType.TIME) {
      if (!dto.startTime || !dto.endTime) {
        throw new BadRequestException('startTime e endTime são obrigatórios para tipo TIME');
      }
      if (dto.startTime >= dto.endTime) {
        throw new BadRequestException('endTime deve ser posterior a startTime');
      }
    }

    // Verifica agendamentos conflitantes
    const conflicts = await this.checkAppointmentConflicts(
      dto.barberId,
      requester.shopId,
      startDate,
      endDate,
      dto.startTime,
      dto.endTime,
      dto.type,
    );

    // Se houver conflitos, retornar para confirmação
    if (conflicts.length > 0) {
      return {
        conflicts,
        message: 'Existem agendamentos conflitantes. Confirme o bloqueio para cancelá-los.',
        conflictCount: conflicts.length,
      };
    }

    // Cria bloqueio
    const blockedTime = await this.prisma.blockedTime.create({
      data: {
        shopId: requester.shopId,
        barberId: dto.barberId,
        type: dto.type,
        date: startDate,
        endDate: endDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        blockedBy: requester.role === 'ADMIN' ? BlockedBy.ADMIN : BlockedBy.BARBER,
      },
      include: {
        barber: {
          select: { id: true, name: true },
        },
      },
    });

    await this.logAction(
      'CREATE',
      blockedTime.id,
      requester.id,
      requester.shopId,
      'Bloqueio criado',
    );

    return blockedTime;
  }

  async findAll(requester: any, barberId?: string, date?: string) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const whereClause: any = {
      shopId: requester.shopId,
    };

    if (barberId) {
      whereClause.barberId = barberId;
    }

    if (date) {
      const filterDate = new Date(date);
      whereClause.date = {
        gte: new Date(filterDate.setHours(0, 0, 0, 0)),
        lte: new Date(filterDate.setHours(23, 59, 59, 999)),
      };
    }

    return this.prisma.blockedTime.findMany({
      where: whereClause,
      include: {
        barber: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const blockedTime = await this.prisma.blockedTime.findUnique({
      where: { id },
      include: {
        barber: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!blockedTime || blockedTime.shopId !== requester.shopId) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return blockedTime;
  }

  async remove(requester: any, id: string) {
    const blockedTime = await this.prisma.blockedTime.findUnique({
      where: { id },
    });

    if (!blockedTime || blockedTime.shopId !== requester.shopId) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    await this.prisma.blockedTime.delete({ where: { id } });

    await this.logAction('DELETE', id, requester.id, requester.shopId, 'Bloqueio deletado');

    return { message: 'Bloqueio deletado com sucesso' };
  }

  private async checkAppointmentConflicts(
    barberId: string,
    shopId: string,
    startDate: Date,
    endDate: Date | null,
    startTime?: string,
    endTime?: string,
    type?: BlockedType,
  ) {
    const whereClause: any = {
      barberId,
      shopId,
      status: { in: ['SCHEDULED'] },
    };

    if (type === BlockedType.DAY) {
      // Bloqueia o dia inteiro
      whereClause.date = {
        gte: new Date(startDate.setHours(0, 0, 0, 0)),
        lte: new Date(startDate.setHours(23, 59, 59, 999)),
      };
    } else if (type === BlockedType.RANGE && endDate) {
      // Bloqueia intervalo de dias
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (type === BlockedType.TIME && startTime && endTime) {
      // Bloqueia horário específico do dia
      const dayStart = new Date(startDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(startDate.setHours(23, 59, 59, 999));
      whereClause.date = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: { select: { name: true, phone: true } },
        services: {
          include: {
            service: { select: { name: true, duration: true } },
          },
        },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      date: apt.date,
      clientName: apt.client.name,
      clientPhone: apt.client.phone,
      services: apt.services.map((s) => s.service.name),
    }));
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'BlockedTime',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
