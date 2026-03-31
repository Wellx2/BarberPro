import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

/**
 * Service para gerenciar Custos/Despesas Operacionais
 */
@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Cria nova despesa
   */
  async create(requester: any, dto: CreateExpenseDto) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const shopId: string = requester.shopId;

    const expense = await this.prisma.expense.create({
      data: {
        shopId,
        ...dto,
      } as any,
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Despesa criada: ${dto.description} - R$ ${dto.amount}`,
      },
    });

    return expense;
  }

  /**
   * Lista todas as despesas com filtros
   */
  async findAll(
    requester: any,
    filters?: {
      type?: string;
      isPaid?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const where: any = { shopId: requester.shopId };

    if (filters?.type) where.type = filters.type;
    if (filters?.isPaid !== undefined) where.isPaid = filters.isPaid;
    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters.startDate) where.dueDate.gte = filters.startDate;
      if (filters.endDate) where.dueDate.lte = filters.endDate;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { dueDate: 'desc' },
    });
  }

  /**
   * Busca uma despesa específica
   */
  async findOne(requester: any, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!expense) throw new NotFoundException('Despesa não encontrada');
    return expense;
  }

  /**
   * Atualiza despesa
   */
  async update(requester: any, id: string, dto: UpdateExpenseDto) {
    const shopId = requester.shopId;
    if (!shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');

    const expense = await this.prisma.expense.update({
      where: { id, shopId },
      data: dto,
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_EXPENSE',
        entity: 'Expense',
        entityId: id,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Despesa atualizada: ${expense.description}`,
      },
    });

    return expense;
  }

  /**
   * Marca despesa como paga
   */
  async markAsPaid(requester: any, id: string, paidDate?: Date, paymentMethod?: string) {
    const shopId = requester.shopId;
    if (!shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');

    const expense = await this.prisma.expense.update({
      where: { id, shopId },
      data: {
        isPaid: true,
        paidDate: paidDate || new Date(),
        paymentMethod: paymentMethod as any,
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        action: 'MARK_EXPENSE_PAID',
        entity: 'Expense',
        entityId: id,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Despesa marcada como paga: ${expense.description}`,
      },
    });

    return expense;
  }

  /**
   * Remove despesa
   */
  async remove(requester: any, id: string) {
    const shopId = requester.shopId;
    if (!shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');

    await this.prisma.expense.delete({ 
      where: { id, shopId } 
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE_EXPENSE',
        entity: 'Expense',
        entityId: id,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Despesa removida permanentemente: ${id}`,
      },
    });

    return { message: 'Despesa removida com sucesso' };
  }
}
