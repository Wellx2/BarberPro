import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateInvoiceDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    // Valida que cliente pertence ao shop
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client || client.shopId !== requester.shopId) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Se tipo PLAN, valida planId
    if (dto.type === InvoiceType.PLAN) {
      if (!dto.planId) {
        throw new BadRequestException('planId é obrigatório para tipo PLAN');
      }
      const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) {
        throw new NotFoundException('Plano não encontrado');
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        shopId: requester.shopId,
        clientId: dto.clientId,
        planId: dto.planId,
        amount: dto.amount,
        type: dto.type,
        paymentMethod: dto.paymentMethod,
        status: InvoiceStatus.PENDING,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        plan: {
          select: { id: true, name: true, price: true },
        },
      },
    });

    await this.logAction('CREATE', invoice.id, requester.id, requester.shopId, 'Fatura criada');

    return invoice;
  }

  async findAll(requester: any, clientId?: string, status?: string) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const whereClause: any = {
      shopId: requester.shopId,
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.status = status as InvoiceStatus;
    }

    return this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        plan: {
          select: { id: true, name: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(requester: any, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        plan: {
          select: { id: true, name: true, price: true, benefits: true },
        },
      },
    });

    if (!invoice || invoice.shopId !== requester.shopId) {
      throw new NotFoundException('Fatura não encontrada');
    }

    return invoice;
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
        entity: 'Invoice',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
