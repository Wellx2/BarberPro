import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderItemType } from '@prisma/client';

/**
 * Service para Relatórios Financeiros Completos
 *
 * Fornece análises detalhadas:
 * - Faturamento bruto e líquido por período
 * - Comissões por barbeiro
 * - Custos operacionais
 * - Produtos/Serviços mais vendidos
 * - Performance por barbeiro
 * - Análise de pagamentos
 */
@Injectable()
export class FinancialReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Relatório Financeiro Consolidado
   * Mostra visão geral com todos os indicadores principais
   */
  async getConsolidatedReport(requester: any, startDate: Date, endDate: Date) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    // Busca todas as comandas finalizadas no período
    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        shopId: requester.shopId,
        status: OrderStatus.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
        barber: { select: { id: true, name: true } },
      },
    });

    // Busca despesas do período
    const expenses = await this.prisma.expense.findMany({
      where: {
        shopId: requester.shopId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // === CÁLCULOS FINANCEIROS ===

    // Faturamento Bruto (total vendido)
    const grossRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);

    // Descontos aplicados
    const totalDiscounts = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

    // Faturamento Líquido (bruto - descontos)
    const netRevenue = grossRevenue - totalDiscounts;

    // Comissões pagas aos barbeiros
    const totalCommissions = orders.reduce((sum, order) => {
      const orderCommissions = order.items.reduce(
        (itemSum, item) => itemSum + (item.commissionValue || 0),
        0,
      );
      return sum + orderCommissions;
    }, 0);

    // Custos operacionais
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = expenses.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = totalExpenses - paidExpenses;

    // Lucro (faturamento líquido - comissões - despesas pagas)
    const profit = netRevenue - totalCommissions - paidExpenses;

    // Margem de lucro
    const profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    // === RECEITAS POR CATEGORIA ===
    const allItems = orders.flatMap((o) => o.items);

    const servicesRevenue = allItems
      .filter((i) => i.type === OrderItemType.SERVICE)
      .reduce((sum, i) => sum + i.total, 0);

    const productsRevenue = allItems
      .filter((i) => i.type === OrderItemType.PRODUCT)
      .reduce((sum, i) => sum + i.total, 0);

    const extrasRevenue = allItems
      .filter((i) => i.type === OrderItemType.EXTRA)
      .reduce((sum, i) => sum + i.total, 0);

    // === MÉTODOS DE PAGAMENTO ===
    const paymentMethods = {
      cash: orders.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0),
      pix: orders.filter((o) => o.paymentMethod === 'PIX').reduce((sum, o) => sum + o.total, 0),
      creditCard: orders
        .filter((o) => o.paymentMethod === 'CREDIT_CARD')
        .reduce((sum, o) => sum + o.total, 0),
      debitCard: orders
        .filter((o) => o.paymentMethod === 'DEBIT_CARD')
        .reduce((sum, o) => sum + o.total, 0),
    };

    // === ESTATÍSTICAS ===
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? netRevenue / totalOrders : 0;

    // Performance por barbeiro
    const barberStats = this.calculateBarberStats(orders);

    // Despesas por categoria
    const expensesByCategory = this.groupExpensesByCategory(expenses);

    return {
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
      revenue: {
        gross: grossRevenue,
        net: netRevenue,
        discounts: totalDiscounts,
        byCategory: {
          services: servicesRevenue,
          products: productsRevenue,
          extras: extrasRevenue,
        },
      },
      costs: {
        commissions: totalCommissions,
        expenses: {
          total: totalExpenses,
          paid: paidExpenses,
          pending: pendingExpenses,
        },
        byCategory: expensesByCategory,
      },
      profit: {
        value: profit,
        margin: profitMargin,
      },
      orders: {
        total: totalOrders,
        averageTicket,
      },
      payments: paymentMethods,
      barbers: barberStats,
    };
  }

  /**
   * Relatório Diário Detalhado
   */
  async getDailyReport(requester: any, date: Date) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getConsolidatedReport(requester, startOfDay, endOfDay);
  }

  /**
   * Relatório Semanal
   */
  async getWeeklyReport(requester: any, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.getConsolidatedReport(requester, weekStart, weekEnd);
  }

  /**
   * Relatório Quinzenal
   */
  async getFortnightlyReport(requester: any, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 15);
    return this.getConsolidatedReport(requester, startDate, endDate);
  }

  /**
   * Relatório Mensal
   */
  async getMonthlyReport(requester: any, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return this.getConsolidatedReport(requester, startDate, endDate);
  }

  /**
   * Relatório Anual
   */
  async getAnnualReport(requester: any, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const report = await this.getConsolidatedReport(requester, startDate, endDate);

    // Adiciona breakdown mensal
    const monthlyBreakdown = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const month = i + 1;
        const monthReport = await this.getMonthlyReport(requester, year, month);
        return {
          month,
          name: new Date(year, i).toLocaleString('pt-BR', { month: 'long' }),
          revenue: monthReport.revenue.net,
          profit: monthReport.profit.value,
          orders: monthReport.orders.total,
        };
      }),
    );

    return {
      ...report,
      monthlyBreakdown,
    };
  }

  /**
   * Produtos e Serviços Mais Vendidos
   * Análise dos itens mais populares no período
   */
  async getTopSellingItems(requester: any, startDate: Date, endDate: Date, limit: number = 10) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    // Busca todos os itens vendidos no período
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          shopId: requester.shopId,
          status: OrderStatus.COMPLETED,
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        service: true,
        product: true,
        order: { select: { completedAt: true } },
      },
    });

    // Agrupa por serviço/produto
    const itemsMap = new Map<string, any>();

    items.forEach((item) => {
      const key = item.serviceId || item.productId || item.name;

      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          id: item.serviceId || item.productId,
          name: item.name,
          type: item.type,
          totalSold: 0,
          totalRevenue: 0,
          totalQuantity: 0,
        });
      }

      const data = itemsMap.get(key);
      data.totalSold += 1;
      data.totalRevenue += item.total;
      data.totalQuantity += item.quantity;
    });

    // Ordena por faturamento e pega top N
    const sortedItems = Array.from(itemsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return {
      period: { start: startDate, end: endDate },
      topServices: sortedItems.filter((i) => i.type === OrderItemType.SERVICE),
      topProducts: sortedItems.filter((i) => i.type === OrderItemType.PRODUCT),
      topExtras: sortedItems.filter((i) => i.type === OrderItemType.EXTRA),
    };
  }

  /**
   * Performance Detalhada de um Barbeiro
   */
  async getBarberPerformance(requester: any, barberId: string, startDate: Date, endDate: Date) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id: barberId, shopId: requester.shopId },
    });

    if (!barber) {
      throw new ForbiddenException('Barbeiro não encontrado');
    }

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        barberId,
        shopId: requester.shopId,
        status: OrderStatus.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { items: true },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    const totalCommissions = orders.reduce((sum, order) => {
      const orderCommissions = order.items.reduce(
        (itemSum, item) => itemSum + (item.commissionValue || 0),
        0,
      );
      return sum + orderCommissions;
    }, 0);

    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const commissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;

    // Serviços mais realizados
    const serviceStats = this.analyzeBarberServices(orders);

    return {
      barber,
      period: { start: startDate, end: endDate },
      performance: {
        totalOrders,
        totalRevenue,
        averageTicket,
        totalCommissions,
        commissionRate,
        revenuePerOrder: averageTicket,
        commissionsPerOrder: totalOrders > 0 ? totalCommissions / totalOrders : 0,
      },
      services: serviceStats,
    };
  }

  /**
   * Análise de Custos Detalhada
   */
  async getCostsAnalysis(requester: any, startDate: Date, endDate: Date) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    const expenses = await this.prisma.expense.findMany({
      where: {
        shopId: requester.shopId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const byType = this.groupExpensesByCategory(expenses);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = expenses.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
    const pending = total - paid;

    // Despesas recorrentes vs não recorrentes
    const recurring = expenses.filter((e) => e.isRecurring).reduce((sum, e) => sum + e.amount, 0);
    const oneTime = total - recurring;

    return {
      period: { start: startDate, end: endDate },
      summary: {
        total,
        paid,
        pending,
        recurring,
        oneTime,
      },
      byType,
      details: expenses.map((e) => ({
        id: e.id,
        type: e.type,
        category: e.category,
        description: e.description,
        amount: e.amount,
        dueDate: e.dueDate,
        paidDate: e.paidDate,
        isPaid: e.isPaid,
        isRecurring: e.isRecurring,
      })),
    };
  }

  // === MÉTODOS AUXILIARES ===

  private calculateBarberStats(orders: any[]) {
    const barberMap = new Map<string, any>();

    orders.forEach((order) => {
      if (!barberMap.has(order.barberId)) {
        barberMap.set(order.barberId, {
          id: order.barber.id,
          name: order.barber.name,
          totalOrders: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        });
      }

      const stats = barberMap.get(order.barberId);
      stats.totalOrders += 1;
      stats.totalRevenue += order.total;

      const orderCommissions = order.items.reduce(
        (sum, item) => sum + (item.commissionValue || 0),
        0,
      );
      stats.totalCommissions += orderCommissions;
    });

    return Array.from(barberMap.values()).map((stats) => ({
      ...stats,
      averageTicket: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
      commissionRate:
        stats.totalRevenue > 0 ? (stats.totalCommissions / stats.totalRevenue) * 100 : 0,
    }));
  }

  private groupExpensesByCategory(expenses: any[]) {
    const byType = new Map<string, number>();

    expenses.forEach((expense) => {
      const current = byType.get(expense.type) || 0;
      byType.set(expense.type, current + expense.amount);
    });

    return Object.fromEntries(byType);
  }

  private analyzeBarberServices(orders: any[]) {
    const serviceMap = new Map<string, any>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.type === OrderItemType.SERVICE) {
          const key = item.serviceId || item.name;

          if (!serviceMap.has(key)) {
            serviceMap.set(key, {
              name: item.name,
              count: 0,
              revenue: 0,
              commissions: 0,
            });
          }

          const stats = serviceMap.get(key);
          stats.count += item.quantity;
          stats.revenue += item.total;
          stats.commissions += item.commissionValue || 0;
        }
      });
    });

    return Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue);
  }
}
