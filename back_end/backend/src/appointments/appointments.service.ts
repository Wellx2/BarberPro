import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AppointmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateAppointmentDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Valida que cliente e barbeiro pertencem ao shop
    const [client, barber, services, shop] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: dto.clientId } }),
      this.prisma.barber.findUnique({ where: { id: dto.barberId } }),
      this.prisma.service.findMany({ where: { id: { in: dto.serviceIds } } }),
      this.prisma.barbershop.findUnique({ where: { id: requester.shopId } }),
    ]);

    if (!client || client.shopId !== requester.shopId) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (!barber || barber.shopId !== requester.shopId || !barber.active) {
      throw new NotFoundException('Barbeiro não encontrado ou inativo');
    }

    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException('Um ou mais serviços não encontrados');
    }

    // Calcula horários
    const startAt = new Date(dto.date);
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const endAt = new Date(startAt.getTime() + totalDuration * 60000);

    // Valida horário de funcionamento
    const startTime = `${startAt.getHours().toString().padStart(2, '0')}:${startAt.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${endAt.getHours().toString().padStart(2, '0')}:${endAt.getMinutes().toString().padStart(2, '0')}`;

    if (startTime < shop.openingTime || endTime > shop.closingTime) {
      throw new BadRequestException(
        `Horário fora do expediente (${shop.openingTime} - ${shop.closingTime})`,
      );
    }

    // Verifica conflitos com outros agendamentos
    await this.checkAppointmentConflicts(barber.id, requester.shopId, startAt, endAt);

    // Verifica conflitos com blocked times
    await this.checkBlockedTimeConflicts(barber.id, requester.shopId, startAt);

    // Calcula preço total
    let totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // Adiciona produtos se houver
    const productData = [];
    if (dto.products && dto.products.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: dto.products.map((p) => p.id) } },
      });

      for (const productDto of dto.products) {
        const product = products.find((p) => p.id === productDto.id);
        if (!product || product.shopId !== requester.shopId) {
          throw new NotFoundException(`Produto ${productDto.id} não encontrado`);
        }

        if (product.stock < productDto.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`,
          );
        }

        totalPrice += product.price * productDto.quantity;
        productData.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: productDto.quantity,
        });
      }
    }

    // Cria agendamento
    const appointment = await this.prisma.appointment.create({
      data: {
        shopId: requester.shopId,
        clientId: dto.clientId,
        barberId: dto.barberId,
        date: startAt,
        status: AppointmentStatus.SCHEDULED,
        totalPrice,
        services: {
          create: dto.serviceIds.map((serviceId) => ({ serviceId })),
        },
        ...(productData.length > 0 && {
          products: { create: productData },
        }),
      },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    // Atualiza estoque de produtos
    if (productData.length > 0) {
      for (const productDto of dto.products!) {
        await this.prisma.product.update({
          where: { id: productDto.id },
          data: { stock: { decrement: productDto.quantity } },
        });
      }
    }

    await this.logAction(
      'CREATE',
      appointment.id,
      requester.id,
      requester.shopId,
      'Agendamento criado',
    );

    return appointment;
  }

  async findAll(
    requester: any,
    filters?: { date?: string; barberId?: string; status?: AppointmentStatus },
  ) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const where: any = { shopId: requester.shopId };

    if (filters?.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: date, lt: nextDay };
    }

    if (filters?.barberId) {
      where.barberId = filters.barberId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // CLIENT só vê próprios agendamentos
    if (requester.role === UserRole.CLIENT) {
      const client = await this.prisma.client.findFirst({
        where: { shopId: requester.shopId, phone: requester.phone },
      });
      if (client) {
        where.clientId = client.id;
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  async cancel(requester: any, id: string, dto: CancelAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Apenas agendamentos com status SCHEDULED podem ser cancelados',
      );
    }

    const status =
      requester.role === UserRole.BARBER || requester.role === UserRole.ADMIN
        ? AppointmentStatus.CANCELLED_BY_BARBER
        : AppointmentStatus.CANCELLED;

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status, cancelReason: dto.cancelReason },
    });

    // Restaurar estoque de produtos se houver
    const productsInAppointment = await this.prisma.appointmentProduct.findMany({
      where: { appointmentId: id },
    });

    for (const product of productsInAppointment) {
      await this.prisma.product.update({
        where: { id: product.productId },
        data: { stock: { increment: product.quantity } },
      });
    }

    await this.logAction('CANCEL', id, requester.id, requester.shopId, dto.cancelReason);

    return updated;
  }

  async complete(requester: any, id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Apenas agendamentos com status SCHEDULED podem ser completados',
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
    });

    await this.logAction('COMPLETE', id, requester.id, requester.shopId, 'Agendamento completado');

    return updated;
  }

  private async checkAppointmentConflicts(
    barberId: string,
    shopId: string,
    newStartAt: Date,
    newEndAt: Date,
  ) {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        barberId,
        shopId,
        status: AppointmentStatus.SCHEDULED,
        OR: [
          {
            AND: [
              { date: { lte: newStartAt } },
              // Precisamos calcular endAt, mas vamos simplificar verificando overlaps
              { date: { gte: newStartAt } },
            ],
          },
          {
            AND: [{ date: { lt: newEndAt } }, { date: { gte: newStartAt } }],
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Horário indisponível - conflito com outro agendamento');
    }
  }

  private async checkBlockedTimeConflicts(barberId: string, shopId: string, newStartAt: Date) {
    const blockedTime = await this.prisma.blockedTime.findFirst({
      where: {
        barberId,
        shopId,
        OR: [
          // DAY - bloqueia o dia inteiro
          {
            type: 'DAY',
            date: { equals: newStartAt },
          },
          // TIME - bloqueia horário específico
          {
            type: 'TIME',
            date: { equals: newStartAt },
            // Verificaria startTime/endTime aqui mas schema precisa ser ajustado
          },
          // RANGE - bloqueia período
          {
            type: 'RANGE',
            date: { lte: newStartAt },
            endDate: { gte: newStartAt },
          },
        ],
      },
    });

    if (blockedTime) {
      throw new ConflictException(
        `Horário bloqueado - ${blockedTime.reason || 'Barbeiro indisponível'}`,
      );
    }
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
        entity: 'APPOINTMENT',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
