import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CompleteServiceOrderDto } from './dto/complete-service-order.dto';
import { OrderStatus, OrderItemType, AppointmentStatus } from '@prisma/client';

/**
 * Service para gerenciar Comandas/Ordens de Serviço
 *
 * Funcionalidades:
 * - Criar comanda vinculada ao agendamento
 * - Adicionar itens (serviços, produtos, extras)
 * - Calcular comissões automaticamente
 * - Finalizar comanda com pagamento
 * - Histórico completo de atendimento
 */
@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionsService: CommissionsService,
  ) { }

  /**
   * Cria uma nova comanda/ordem de serviço
   * Pode ser vinculada a um agendamento ou criada avulsa
   */
  async create(requester: any, dto: CreateServiceOrderDto) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    // ✅ IDEMPOTÊNCIA: Se já existe uma OS para este agendamento, retorna ela diretamente
    // Evita o erro de "Unique constraint failed on appointmentId"
    if (dto.appointmentId) {
      const existingOrder = await this.prisma.serviceOrder.findUnique({
        where: { appointmentId: dto.appointmentId },
        include: {
          client: true,
          barber: true,
          appointment: true,
          items: {
            include: {
              service: true,
              product: true,
            },
          },
        },
      });
      if (existingOrder && existingOrder.shopId === requester.shopId) {
        return existingOrder;
      }
    }

    // Valida cliente e barbeiro pertencem ao shop
    const [client, barber] = await Promise.all([
      this.prisma.client.findFirst({
        where: { id: dto.clientId, shopId: requester.shopId },
      }),
      this.prisma.barber.findFirst({
        where: { id: dto.barberId, shopId: requester.shopId },
      }),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (!barber) throw new NotFoundException('Barbeiro não encontrado');

    // Gera número sequencial da comanda para o shop
    const lastOrder = await this.prisma.serviceOrder.findFirst({
      where: { shopId: requester.shopId },
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Cria a comanda
    const order = await this.prisma.serviceOrder.create({
      data: {
        shopId: requester.shopId,
        clientId: dto.clientId,
        barberId: dto.barberId,
        appointmentId: dto.appointmentId,
        orderNumber,
        status: OrderStatus.OPEN,
        notes: dto.notes,
      },
      include: {
        client: true,
        barber: true,
        items: true,
      },
    });

    // Se foram fornecidos itens iniciais, adiciona
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        await this.addItem(requester, order.id, item);
      }
    }

    // Busca comanda atualizada com itens
    return this.findOne(requester, order.id);
  }

  /**
   * Adiciona um item à comanda (serviço, produto ou extra)
   * Calcula automaticamente a comissão do barbeiro usando CommissionsService
   */
  async addItem(requester: any, orderId: string, dto: AddOrderItemDto) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    if (order.status !== OrderStatus.OPEN && order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Comanda não está aberta para adicionar itens');
    }

    // Calcula comissão usando o serviço de comissões
    const itemTotal = dto.unitPrice * dto.quantity;
    const commission = await this.commissionsService.calculateCommission(
      requester.shopId,
      order.barberId,
      dto.serviceId,
      dto.productId,
      itemTotal,
    );

    // Cria o item
    const item = await this.prisma.orderItem.create({
      data: {
        orderId,
        type: dto.type,
        serviceId: dto.serviceId,
        productId: dto.productId,
        name: dto.name,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        total: itemTotal,
        commissionRate: commission.rate,
        commissionValue: commission.value,
      },
    });

    // Atualiza totais da comanda
    await this.updateOrderTotals(orderId);

    // Se for produto, atualiza estoque
    if (dto.type === OrderItemType.PRODUCT && dto.productId) {
      const updatedProduct = await this.prisma.product.update({
        where: { id: dto.productId },
        data: { stock: { decrement: dto.quantity } },
      });

      // Go-live: Estoque Automático
      if (updatedProduct.stock <= 0 && updatedProduct.active) {
        await this.prisma.product.update({
          where: { id: dto.productId },
          data: { active: false },
        });
      }

      // Registra movimentação de estoque
      await this.prisma.productStockMovement.create({
        data: {
          productId: dto.productId,
          shopId: requester.shopId,
          type: 'DECREASE',
          quantity: dto.quantity,
          reason: `Venda - Comanda #${order.orderNumber}`,
          userId: requester.id,
        },
      });
    }

    return item;
  }

  /**
   * Remove um item da comanda
   */
  async removeItem(requester: any, orderId: string, itemId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    if (order.status !== OrderStatus.OPEN && order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Comanda não está aberta para remover itens');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });

    if (!item) throw new NotFoundException('Item não encontrado');

    // Se for produto, devolve ao estoque
    if (item.type === OrderItemType.PRODUCT && item.productId) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      await this.prisma.productStockMovement.create({
        data: {
          productId: item.productId,
          shopId: requester.shopId,
          type: 'INCREASE',
          quantity: item.quantity,
          reason: `Devolução - Item removido da comanda #${order.orderNumber}`,
          userId: requester.id,
        },
      });
    }

    await this.prisma.orderItem.delete({ where: { id: itemId } });
    await this.updateOrderTotals(orderId);

    return { message: 'Item removido com sucesso' };
  }

  /**
   * Atualiza status para IN_PROGRESS (atendimento iniciado)
   */
  async startService(requester: any, orderId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException('Comanda já foi iniciada');
    }

    return this.prisma.serviceOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.IN_PROGRESS },
      include: {
        client: true,
        barber: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
    });
  }

  /**
   * Finaliza a comanda (fecha a conta)
   * Registra pagamento e atualiza relatórios financeiros
   */
  async complete(requester: any, orderId: string, dto: CompleteServiceOrderDto) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Comanda já foi finalizada');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Comanda foi cancelada');
    }

    // Aplica desconto adicional se fornecido
    const discount = dto.discount || 0;
    const finalTotal = Math.max(0, order.subtotal - discount);

    const completedOrder = await this.prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        discount,
        total: finalTotal,
        paymentMethod: dto.paymentMethod,
        paidAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        client: true,
        barber: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
    });

    // Atualiza appointment relacionado se houver
    if (order.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: order.appointmentId },
        data: { 
          status: AppointmentStatus.COMPLETED,
          totalPrice: finalTotal
        },
      });
    }

    // Calcula total de comissões do pedido
    const totalCommissions = order.items.reduce(
      (sum, item) => sum + (item.commissionValue || 0),
      0,
    );

    // Incrementa o saldo do barbeiro no banco de dados
    if (totalCommissions > 0) {
      await this.prisma.barber.update({
        where: { id: order.barberId },
        data: { balance: { increment: totalCommissions } },
      });
    }

    // Atualiza relatório diário de caixa
    await this.updateDailyCashFlow(requester.shopId, order);

    // Registra log de auditoria
    await this.prisma.auditLog.create({
      data: {
        action: 'COMPLETE_ORDER',
        entity: 'ServiceOrder',
        entityId: orderId,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Comanda #${order.orderNumber} finalizada - Total: R$ ${finalTotal.toFixed(2)}`,
      },
    });

    return completedOrder;
  }

  /**
   * Cancela uma comanda
   */
  async cancel(requester: any, orderId: string, reason: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Não é possível cancelar comanda já finalizada');
    }

    // Devolve produtos ao estoque
    for (const item of order.items) {
      if (item.type === OrderItemType.PRODUCT && item.productId) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await this.prisma.productStockMovement.create({
          data: {
            productId: item.productId,
            shopId: requester.shopId,
            type: 'INCREASE',
            quantity: item.quantity,
            reason: `Cancelamento - Comanda #${order.orderNumber}`,
            userId: requester.id,
          },
        });
      }
    }

    const cancelledOrder = await this.prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        notes: order.notes ? `${order.notes}\n\nCANCELADO: ${reason}` : `CANCELADO: ${reason}`,
      },
      include: {
        client: true,
        barber: true,
        items: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CANCEL_ORDER',
        entity: 'ServiceOrder',
        entityId: orderId,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Comanda #${order.orderNumber} cancelada - Motivo: ${reason}`,
      },
    });

    return cancelledOrder;
  }

  /**
   * Lista todas as comandas do shop com filtros
   */
  async findAll(
    requester: any,
    filters?: {
      status?: OrderStatus;
      clientId?: string;
      barberId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const where: any = { shopId: requester.shopId };

    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.barberId) where.barberId = filters.barberId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { name: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca uma comanda específica
   */
  async findOne(requester: any, orderId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, shopId: requester.shopId },
      include: {
        client: true,
        barber: true,
        appointment: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada');
    return order;
  }

  /**
   * Busca uma comanda específica por ID de agendamento
   */
  async findByAppointmentId(requester: any, appointmentId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { appointmentId, shopId: requester.shopId },
      include: {
        client: true,
        barber: true,
        appointment: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Comanda não encontrada para este agendamento');
    return order;
  }

  /**
   * Histórico de atendimento do cliente (todas as comandas)
   */
  async getClientHistory(requester: any, clientId: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, shopId: requester.shopId },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado');

    return this.prisma.serviceOrder.findMany({
      where: {
        clientId,
        shopId: requester.shopId,
        status: OrderStatus.COMPLETED,
      },
      include: {
        barber: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { name: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  /**
   * Histórico de atendimento do barbeiro
   */
  async getBarberHistory(
    requester: any,
    barberId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id: barberId, shopId: requester.shopId },
    });

    if (!barber) throw new NotFoundException('Barbeiro não encontrado');

    const where: any = {
      barberId,
      shopId: requester.shopId,
      status: OrderStatus.COMPLETED,
    };

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) where.completedAt.gte = filters.startDate;
      if (filters.endDate) where.completedAt.lte = filters.endDate;
    }

    const orders = await this.prisma.serviceOrder.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { name: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calcula estatísticas
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalCommissions = orders.reduce((sum, order) => {
      const orderCommission = order.items.reduce(
        (itemSum, item) => itemSum + (item.commissionValue || 0),
        0,
      );
      return sum + orderCommission;
    }, 0);

    return {
      barber,
      statistics: {
        totalOrders,
        totalRevenue,
        totalCommissions,
        averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      orders,
    };
  }

  /**
   * Atualiza os totais da comanda (subtotal, comissões)
   */
  private async updateOrderTotals(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    await this.prisma.serviceOrder.update({
      where: { id: orderId },
      data: { subtotal },
    });
  }

  /**
   * Atualiza o relatório de caixa diário
   */
  private async updateDailyCashFlow(shopId: string, order: any) {
    const orderDate = new Date(order.completedAt);
    orderDate.setHours(0, 0, 0, 0);

    // Busca ou cria registro do dia
    let cashFlow = await this.prisma.dailyCashFlow.findUnique({
      where: {
        shopId_date: {
          shopId,
          date: orderDate,
        },
      },
    });

    if (!cashFlow) {
      cashFlow = await this.prisma.dailyCashFlow.create({
        data: {
          shopId,
          date: orderDate,
        },
      });
    }

    // Calcula valores dos itens
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    const servicesRevenue = items
      .filter((i) => i.type === OrderItemType.SERVICE)
      .reduce((sum, i) => sum + i.total, 0);

    const productsRevenue = items
      .filter((i) => i.type === OrderItemType.PRODUCT || i.type === OrderItemType.EXTRA)
      .reduce((sum, i) => sum + i.total, 0);

    const totalCommissions = items.reduce((sum, i) => sum + (i.commissionValue || 0), 0);

    // Atualiza valores acumulados do dia
    await this.prisma.dailyCashFlow.update({
      where: { id: cashFlow.id },
      data: {
        totalRevenue: { increment: order.total },
        servicesRevenue: { increment: servicesRevenue },
        productsRevenue: { increment: productsRevenue },
        totalDiscounts: { increment: order.discount },
        totalCommissions: { increment: totalCommissions },
        netRevenue: { increment: order.total - order.discount },
        totalOrders: { increment: 1 },
        // Incrementa pagamentos por método
        ...(order.paymentMethod === 'CASH' && { cashPayments: { increment: order.total } }),
        ...(order.paymentMethod === 'PIX' && { pixPayments: { increment: order.total } }),
        ...((order.paymentMethod === 'CREDIT_CARD' || order.paymentMethod === 'DEBIT_CARD') && {
          cardPayments: { increment: order.total },
        }),
      },
    });

    // Recalcula ticket médio
    const updatedCashFlow = await this.prisma.dailyCashFlow.findUnique({
      where: { id: cashFlow.id },
    });

    if (updatedCashFlow && updatedCashFlow.totalOrders > 0) {
      await this.prisma.dailyCashFlow.update({
        where: { id: cashFlow.id },
        data: {
          averageTicket: updatedCashFlow.totalRevenue / updatedCashFlow.totalOrders,
          profit:
            updatedCashFlow.netRevenue -
            updatedCashFlow.totalExpenses -
            updatedCashFlow.totalCommissions,
        },
      });
    }
  }
}
