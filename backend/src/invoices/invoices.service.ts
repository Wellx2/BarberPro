import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
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
        clientName: client.name,
        amount: dto.amount,
        type: dto.type,
        paymentMethod: dto.paymentMethod,
        status: InvoiceStatus.PENDING,
        description: dto.description,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    await this.logAction('CREATE', invoice.id, requester.id, requester.shopId, 'Fatura criada');

    return invoice;
  }

  async findAll(requester: any, startDate?: string, endDate?: string, clientId?: string, status?: string) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const whereClause: any = {
      shopId: requester.shopId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.status = status as InvoiceStatus;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(inv => ({
      ...inv,
      date: inv.createdAt.toISOString()
    }));
  }

  async findOne(requester: any, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: true,
      },
    });

    if (!invoice || invoice.shopId !== requester.shopId) {
      throw new NotFoundException('Fatura não encontrada');
    }

    return invoice;
  }

  async update(requester: any, id: string, dto: UpdateInvoiceDto) {
    // 1. Buscar invoice e validar tenant
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.shopId !== requester.shopId) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // 2. Validações de negócio
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Não é possível alterar fatura já paga');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Não é possível alterar fatura cancelada');
    }

    // 3. Se está marcando como PAID, paymentMethod é obrigatório
    if (dto.status === InvoiceStatus.PAID) {
      if (!dto.paymentMethod) {
        throw new BadRequestException('paymentMethod é obrigatório ao marcar como PAID');
      }
      if (!dto.paidAt) {
        dto.paidAt = new Date().toISOString();
      }
    }

    // 4. Atualizar invoice
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        description: dto.description,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
    });

    // 5. Auditoria
    await this.logAction(
      'UPDATE',
      id,
      requester.id,
      requester.shopId,
      `Status alterado para ${dto.status || invoice.status}`,
    );

    return updated;
  }

  async cancel(requester: any, id: string, reason?: string) {
    // 1. Buscar invoice e validar tenant
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.shopId !== requester.shopId) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // 2. Validações
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Não é possível cancelar fatura já paga. Use estorno.');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Fatura já está cancelada');
    }

    // 3. Cancelar
    const cancelled = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        description: reason
          ? `${invoice.description || ''} | Cancelado: ${reason}`
          : invoice.description,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
    });

    // 4. Auditoria
    await this.logAction(
      'CANCEL',
      id,
      requester.id,
      requester.shopId,
      reason || 'Fatura cancelada',
    );

    return {
      message: 'Fatura cancelada com sucesso',
      status: cancelled.status,
      invoice: cancelled,
    };
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
