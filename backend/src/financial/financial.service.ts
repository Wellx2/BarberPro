import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsPeriod } from './dto/get-analytics.dto';
import { InvoiceStatus, AppointmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retorna analytics financeiros para o período especificado
   */
  async getAnalytics(
    requester: any,
    shopId: string,
    period: AnalyticsPeriod,
    startDate?: string,
    endDate?: string,
  ) {
    const targetShopId = this.resolveTargetShopId(requester, shopId);

    // Calcular range de datas
    const dateRange = this.calculateDateRange(period, startDate, endDate);

    // Buscar dados paralelos
    const [invoices, appointments, commissions, fixedCosts] = await Promise.all([
      this.getInvoices(targetShopId, dateRange.start, dateRange.end),
      this.getAppointments(targetShopId, dateRange.start, dateRange.end),
      this.getCommissions(targetShopId, dateRange.start, dateRange.end),
      this.getFixedCosts(targetShopId),
    ]);

    // Calcular receitas
    const serviceRev = this.calculateServiceRevenue(appointments);
    const productRev = this.calculateProductRevenue(invoices);
    const planRev = this.calculatePlanRevenue(invoices);
    const gross = serviceRev + productRev + planRev;

    // Calcular Lucro Líquido Real (Precision Financial Management)
    // 1. Taxas de Cartão
    const cardFees = this.calculateCardFees(invoices);

    // 2. Custos Variáveis de Insumos (Supply Costs dos serviços)
    const supplyCostsTotal = appointments.reduce((sum, apt) => {
      return sum + apt.services.reduce((sSum, aptService) => sSum + ((aptService.service as any)?.supplyCost || 0), 0);
    }, 0);

    // 3. Comissões (agora já considerando a granularidade de serviços e produtos)
    const totalCommissions = this.calculateTotalCommissions(commissions);

    // 4. Rateio de Custos Fixos (Pró-rata)
    const fixedCostsTotal = this.calculateFixedCostsForPeriod(fixedCosts, period);

    // Custo fixo de produto assumido em 30% do valor de revenda (Pode ser refinado pelo costPrice depois se quiser)
    const productCosts = productRev * 0.3;

    const expenses = totalCommissions + fixedCostsTotal + productCosts + supplyCostsTotal + cardFees;

    // Calcular resultado Real
    const net = gross - expenses;
    const isLoss = net < 0;
    const margin = gross > 0 ? (net / gross) * 100 : 0;

    // Calcular KPIs
    const totalAppointments = appointments.length;
    const avgTicket = totalAppointments > 0 ? gross / totalAppointments : 0;

    // Agrupar comissões por barbeiro
    const commissionsByBarber = await this.getCommissionsByBarber(
      targetShopId,
      dateRange.start,
      dateRange.end,
    );

    return {
      period,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      gross: Number(gross.toFixed(2)),
      serviceRev: Number(serviceRev.toFixed(2)),
      productRev: Number(productRev.toFixed(2)),
      planRev: Number(planRev.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      totalCommissions: Number(totalCommissions.toFixed(2)),
      fixedCostsTotal: Number(fixedCostsTotal.toFixed(2)),
      supplyCostsTotal: Number(supplyCostsTotal.toFixed(2)), // Custo com insumos
      cardFees: Number(cardFees.toFixed(2)), // Taxas de cartão
      productCosts: Number(productCosts.toFixed(2)),
      net: Number(net.toFixed(2)),
      isLoss,
      margin: Number(margin.toFixed(2)),
      avgTicket: Number(avgTicket.toFixed(2)),
      totalAppointments,
      commissionsByBarber,
    };
  }

  /**
   * Retorna analytics diários para o caixa operacional
   */
  async getDailyCashier(requester: any, shopId: string, date: string) {
    const targetShopId = this.resolveTargetShopId(requester, shopId);

    // Parse da data e range do dia
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Verificar se é hoje
    const today = new Date();
    const isToday = startOfDay.toDateString() === today.toDateString();

    // Buscar dados do dia
    const [invoicesPaid, invoicesPending, appointments, commissions] = await Promise.all([
      this.getInvoicesByStatus(targetShopId, startOfDay, endOfDay, InvoiceStatus.PAID),
      this.getInvoicesByStatus(targetShopId, startOfDay, endOfDay, InvoiceStatus.PENDING),
      this.getAppointments(targetShopId, startOfDay, endOfDay),
      this.getCommissions(targetShopId, startOfDay, endOfDay),
    ]);

    // Calcular totais recebidos
    const totalReceived = this.sumInvoicesAmount(invoicesPaid);
    const totalPending = this.sumInvoicesAmount(invoicesPending);
    const totalDay = totalReceived + totalPending;

    // Receitas por fonte
    const serviceRevenue = this.calculateServiceRevenueFromInvoices(invoicesPaid);
    const productRevenue = this.calculateProductRevenueFromInvoices(invoicesPaid);
    const planRevenue = this.calculatePlanRevenueFromInvoices(invoicesPaid);

    // Formas de pagamento
    const paymentMethods = this.groupByPaymentMethod(invoicesPaid);

    // KPIs operacionais
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    ).length;
    const avgTicket = completedAppointments > 0 ? totalReceived / completedAppointments : 0;

    // Calcular Lucro Líquido Real (Precision Financial Management)
    // 1. Taxas de Cartão
    const cardFees = this.calculateCardFees(invoicesPaid);

    // 2. Custos Variáveis de Insumos (Supply Costs dos serviços)
    const supplyCostsTotal = appointments.reduce((sum, apt) => {
      return sum + apt.services.reduce((sSum, aptService) => sSum + ((aptService.service as any)?.supplyCost || 0), 0);
    }, 0);

    // Comissões por barbeiro
    const barberCommissions = await this.getCommissionsByBarber(targetShopId, startOfDay, endOfDay);
    const totalCommissions = this.calculateTotalCommissions(commissions);

    // Custo fixo de produto assumido em 30% do valor de revenda
    const productCosts = productRevenue * 0.3;

    // Receita Liquida Real descontando custos operacionais do dia
    const netRevenue = totalReceived - totalCommissions - cardFees - supplyCostsTotal - productCosts;

    return {
      date,
      isToday,
      totalReceived: Number(totalReceived.toFixed(2)),
      totalPending: Number(totalPending.toFixed(2)),
      totalDay: Number(totalDay.toFixed(2)),
      serviceRevenue: Number(serviceRevenue.toFixed(2)),
      productRevenue: Number(productRevenue.toFixed(2)),
      planRevenue: Number(planRevenue.toFixed(2)),
      paymentMethods: this.formatPaymentMethods(paymentMethods),
      totalAppointments,
      completedAppointments,
      avgTicket: Number(avgTicket.toFixed(2)),
      barberCommissions,
      totalCommissions: Number(totalCommissions.toFixed(2)),
      cardFees: Number(cardFees.toFixed(2)),
      supplyCostsTotal: Number(supplyCostsTotal.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      pendingInvoices: invoicesPending.map((inv) => ({
        id: inv.id,
        shopId: inv.shopId,
        clientName: inv.clientName,
        amount: Number(inv.amount),
        type: inv.type,
        status: inv.status,
        description: inv.description,
        date: inv.createdAt.toISOString(),
      })),
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  private calculateDateRange(period: AnalyticsPeriod, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    const end: Date = new Date(now.setHours(23, 59, 59, 999));

    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }

    switch (period) {
      case AnalyticsPeriod.TODAY:
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case AnalyticsPeriod.WEEK:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.MONTH:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.QUARTER:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.YEAR:
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.ALL:
        start = new Date('2000-01-01');
        break;
      default:
        start = new Date(now.setHours(0, 0, 0, 0));
    }

    return { start, end };
  }

  private async getInvoices(shopId: string, start: Date, end: Date) {
    return this.prisma.invoice.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end },
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: {
        items: true,
      },
    });
  }

  private async getInvoicesByStatus(shopId: string, start: Date, end: Date, status: InvoiceStatus) {
    return this.prisma.invoice.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end },
        status,
      },
      include: {
        items: true,
      },
    });
  }

  private async getAppointments(shopId: string, start: Date, end: Date) {
    return this.prisma.appointment.findMany({
      where: {
        shopId,
        date: { gte: start, lte: end },
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        barber: true,
      },
    });
  }

  private async getCommissions(shopId: string, start: Date, end: Date) {
    // Buscar appointments completados do período (Serviços)
    const appointments = await this.getAppointments(shopId, start, end);

    // Buscar faturas pagas (Produtos e outros)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        shopId,
        barberId: { not: null },
        status: InvoiceStatus.PAID,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
    });

    const barberIds = [...new Set([
      ...appointments.map((a) => a.barberId),
      ...invoices.map((i) => i.barberId).filter(Boolean) as string[],
    ])];

    const commissionsConfig = await this.prisma.barberCommission.findMany({
      where: {
        barberId: { in: barberIds },
        active: true,
      },
    });

    const results = [];

    // Comissões sobre Serviços
    for (const apt of appointments) {
      const config = commissionsConfig.find((c) => c.barberId === apt.barberId && c.applyOnServices);
      const commissionRate = config?.value || 0;
      const commission = (Number(apt.totalPrice) * commissionRate) / 100;

      results.push({
        barberId: apt.barberId,
        appointmentId: apt.id,
        amount: commission,
        rate: commissionRate,
        type: 'SERVICE'
      });
    }

    // Comissões sobre Produtos
    for (const inv of invoices) {
      const config = commissionsConfig.find((c) => c.barberId === inv.barberId && c.applyOnProducts);
      const commissionRate = config?.value || 0;

      const productTotal = inv.items
        .filter(item => item.type === 'PRODUCT')
        .reduce((sum, item) => sum + Number(item.price * item.quantity), 0);

      if (productTotal > 0 && commissionRate > 0) {
        const commission = (productTotal * commissionRate) / 100;
        results.push({
          barberId: inv.barberId!,
          invoiceId: inv.id,
          amount: commission,
          rate: commissionRate,
          type: 'PRODUCT'
        });
      }
    }

    return results;
  }

  private async getFixedCosts(shopId: string) {
    return this.prisma.expense.findMany({
      where: {
        shopId,
        isPaid: false, // Custos ainda não pagos
      },
    });
  }

  private calculateServiceRevenue(appointments: any[]): number {
    return appointments.reduce((sum, apt) => sum + Number(apt.totalPrice), 0);
  }

  private calculateProductRevenue(invoices: any[]): number {
    return invoices
      .filter((inv) => inv.type === 'PRODUCT' && inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private calculatePlanRevenue(invoices: any[]): number {
    return invoices
      .filter((inv) => inv.type === 'PLAN' && inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private calculateTotalCommissions(commissions: any[]): number {
    return commissions.reduce((sum, c) => sum + c.amount, 0);
  }

  private calculateFixedCostsForPeriod(fixedCosts: any[], period: AnalyticsPeriod): number {
    const total = fixedCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);

    const divider = {
      TODAY: 30,
      WEEK: 4.3,
      MONTH: 1,
      QUARTER: 1 / 3,
      YEAR: 1 / 12,
      ALL: 1,
    };

    return total / (divider[period] || 1);
  }

  private async getCommissionsByBarber(shopId: string, start: Date, end: Date) {
    const rawCommissions = await this.getCommissions(shopId, start, end);
    const appointments = await this.getAppointments(shopId, start, end);

    // Obter dados básicos de todos os barbeiros referenciados
    const barberIds = [...new Set([
      ...appointments.map(a => a.barberId),
      ...rawCommissions.map(c => c.barberId)
    ])];

    const barbers = await this.prisma.barber.findMany({
      where: { id: { in: barberIds } },
      select: { id: true, name: true, avatar: true }
    });

    // Agrupar por barbeiro
    const barberMap = new Map();

    // 1. Inicializa o map com nome/avatar e zera contas
    for (const barber of barbers) {
      // Find rules
      const configs = await this.prisma.barberCommission.findMany({
        where: { barberId: barber.id, active: true },
      });
      const serviceRate = configs.find(c => c.applyOnServices)?.value || 0;
      const productRate = configs.find(c => c.applyOnProducts)?.value || 0;

      barberMap.set(barber.id, {
        id: barber.id,
        name: barber.name,
        avatar: barber.avatar,
        appointments: 0,
        revenue: 0,
        commission: 0,
        serviceRate,
        productRate,
        netForShop: 0,
      });
    }

    // 2. Contabiliza serviços (revenue e appointments)
    for (const apt of appointments) {
      const barberData = barberMap.get(apt.barberId);
      if (barberData) {
        barberData.appointments += 1;
        barberData.revenue += Number(apt.totalPrice);
      }
    }

    // 3. Contabiliza receitas de produtos vendidos por barbeiros
    const invoices = await this.prisma.invoice.findMany({
      where: {
        shopId,
        barberId: { in: barberIds },
        status: InvoiceStatus.PAID,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
    });

    for (const inv of invoices) {
      const barberData = barberMap.get(inv.barberId!);
      if (barberData) {
        const productTotal = inv.items
          .filter(item => item.type === 'PRODUCT')
          .reduce((sum, item) => sum + Number(item.price * item.quantity), 0);
        barberData.revenue += productTotal;
      }
    }

    // 4. Soma as comissões apuradas (produto + serviço)
    for (const comm of rawCommissions) {
      const barberData = barberMap.get(comm.barberId);
      if (barberData) {
        barberData.commission += comm.amount;
      }
    }

    // 5. Finaliza as contas de todos os barbeiros
    for (const barberData of barberMap.values()) {
      barberData.netForShop = barberData.revenue - barberData.commission;
    }

    return Array.from(barberMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((barber) => ({
        ...barber,
        revenue: Number(barber.revenue.toFixed(2)),
        commission: Number(barber.commission.toFixed(2)),
        netForShop: Number(barber.netForShop.toFixed(2)),
      }));
  }

  private calculateCardFees(invoices: any[]): number {
    return invoices.reduce((sum, inv) => {
      let feeRate = 0;
      if (inv.paymentMethod === 'CREDIT_CARD') feeRate = 0.04; // 4% Crédito
      else if (inv.paymentMethod === 'DEBIT_CARD') feeRate = 0.02; // 2% Débito

      const feePpt = Number(inv.amount) * feeRate;
      return sum + feePpt;
    }, 0);
  }

  private sumInvoicesAmount(invoices: any[]): number {
    return invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private calculateServiceRevenueFromInvoices(invoices: any[]): number {
    return invoices
      .filter((inv) => inv.type === 'SERVICE')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private calculateProductRevenueFromInvoices(invoices: any[]): number {
    return invoices
      .filter((inv) => inv.type === 'PRODUCT')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private calculatePlanRevenueFromInvoices(invoices: any[]): number {
    return invoices
      .filter((inv) => inv.type === 'PLAN')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  private groupByPaymentMethod(invoices: any[]): Record<string, number> {
    const methods: Record<string, number> = {};

    for (const inv of invoices) {
      if (inv.paymentMethod) {
        methods[inv.paymentMethod] = (methods[inv.paymentMethod] || 0) + Number(inv.amount);
      }
    }

    return methods;
  }

  private formatPaymentMethods(methods: Record<string, number>): Record<string, number> {
    const formatted: Record<string, number> = {};

    for (const [method, amount] of Object.entries(methods)) {
      formatted[method] = Number(amount.toFixed(2));
    }

    return formatted;
  }

  private resolveTargetShopId(requester: any, requestedShopId?: string): string {
    if (requester.role === UserRole.SUPER_ADMIN) {
      if (!requestedShopId) {
        throw new BadRequestException('shopId é obrigatório para SUPER_ADMIN');
      }

      return requestedShopId;
    }

    if (!requester.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia');
    }

    if (requestedShopId && requestedShopId !== requester.shopId) {
      throw new ForbiddenException('Acesso negado a dados de outra barbearia');
    }

    return requester.shopId;
  }

  // ===============================================
  // 🚀 MÓDULO PREDITIVO E BI DE VENDAS
  // ===============================================

  /**
   * Identifica oportunidades de vendas preditivas
   * Baseado no histórico de compras repetidas de produtos
   */
  async getSalesOpportunities(requester: any) {
    const targetShopId = this.resolveTargetShopId(requester);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const appointmentsWithProducts = await this.prisma.appointment.findMany({
      where: {
        shopId: targetShopId,
        status: AppointmentStatus.COMPLETED,
        date: { gte: sixMonthsAgo },
        products: { some: {} }
      },
      include: {
        client: true,
        products: { include: { product: true } }
      },
      orderBy: { date: 'asc' }
    });

    const consumptionMap = new Map<string, { client: any; product: any; purchases: Date[] }>();

    for (const apt of appointmentsWithProducts) {
      if (!apt.client) continue;

      for (const aptProduct of apt.products) {
        if (!aptProduct.product) continue;

        const key = `${apt.clientId}_${aptProduct.productId}`;
        if (!consumptionMap.has(key)) {
          consumptionMap.set(key, {
            client: apt.client,
            product: aptProduct.product,
            purchases: []
          });
        }
        consumptionMap.get(key)!.purchases.push(new Date(apt.date));
      }
    }

    const opportunities = [];
    const now = new Date();

    for (const [key, data] of consumptionMap.entries()) {
      const purchases = data.purchases;
      // Se comprou pelo menos 2 vezes, podemos calcular a recorrência
      if (purchases.length >= 2) {
        let totalDays = 0;
        for (let i = 1; i < purchases.length; i++) {
          const diffTime = Math.abs(purchases[i].getTime() - purchases[i - 1].getTime());
          totalDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        const avgRecurrenceDays = Math.round(totalDays / (purchases.length - 1));
        const lastPurchase = purchases[purchases.length - 1];

        const daysSinceLastPurchase = Math.ceil(Math.abs(now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

        // Sugerir venda se já passou 80% do tempo de recorrência (ex: recorrencia 30 dias, sugere no dia 24)
        if (daysSinceLastPurchase >= (avgRecurrenceDays * 0.8)) {
          let urgency = 'NORMAL';
          if (daysSinceLastPurchase > avgRecurrenceDays) urgency = 'HIGH';

          opportunities.push({
            clientId: data.client.id,
            clientName: data.client.name,
            productId: data.product.id,
            productName: data.product.name,
            productPrice: Number(data.product.price),
            avgRecurrenceDays,
            daysSinceLastPurchase,
            lastPurchaseDate: lastPurchase.toISOString(),
            urgency,
            suggestion: `Sugerir ${data.product.name}`
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
  }

  /**
   * Calcula métricas de retenção (Churn e Retorno)
   */
  async getRetentionMetrics(requester: any) {
    const targetShopId = this.resolveTargetShopId(requester);

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const appointmentsCurrent = await this.prisma.appointment.findMany({
      where: { shopId: targetShopId, status: 'COMPLETED', date: { gte: ninetyDaysAgo } },
      select: { clientId: true }
    });

    const appointmentsPrevious = await this.prisma.appointment.findMany({
      where: { shopId: targetShopId, status: 'COMPLETED', date: { gte: oneEightyDaysAgo, lt: ninetyDaysAgo } },
      select: { clientId: true }
    });

    const currentClients = new Set(appointmentsCurrent.map(a => a.clientId));
    const previousClients = new Set(appointmentsPrevious.map(a => a.clientId));

    let retainedCount = 0;
    for (const clientId of previousClients) {
      if (currentClients.has(clientId)) retainedCount++;
    }

    const retentionRate = previousClients.size > 0 ? (retainedCount / previousClients.size) * 100 : 0;
    const totalActiveClients = currentClients.size;
    const newClients = totalActiveClients - retainedCount;

    return {
      retentionRate: Number(retentionRate.toFixed(1)),
      retainedClients: retainedCount,
      newClients,
      totalActiveClients,
      churnedClients: previousClients.size - retainedCount,
      evaluationPeriod: 'Últimos 90 dias'
    };
  }

  // ===============================================
  // 🔧 GESTÃO DE ATIVOS FÍSICOS (Assets)
  // ===============================================

  /**
   * Lista todos os ativos físicos da barbearia com cálculo de depreciação
   * e alertas de necessidade de troca
   */
  async getAssets(requester: any) {
    const targetShopId = this.resolveTargetShopId(requester);

    const assets = await (this.prisma as any).barbershopAsset.findMany({
      where: { shopId: targetShopId },
      orderBy: { purchaseDate: 'asc' }
    });

    const now = new Date();

    return assets.map((asset: any) => {
      const purchaseDate = new Date(asset.purchaseDate);
      const monthsElapsed = Math.floor(
        (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );

      const monthlyDepreciation = asset.purchasePrice / asset.usefulLifeMonths;
      const accumulatedDepreciation = Math.min(monthsElapsed * monthlyDepreciation, asset.purchasePrice);
      const currentValue = Math.max(asset.purchasePrice - accumulatedDepreciation, 0);
      const needsReplacement = monthsElapsed >= asset.usefulLifeMonths;
      const monthsUntilReplacement = Math.max(asset.usefulLifeMonths - monthsElapsed, 0);

      return {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        purchaseDate: asset.purchaseDate,
        purchasePrice: Number(asset.purchasePrice.toFixed(2)),
        usefulLifeMonths: asset.usefulLifeMonths,
        monthsElapsed,
        monthlyDepreciation: Number(monthlyDepreciation.toFixed(2)),
        accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        depreciationPercentage: Number(((accumulatedDepreciation / asset.purchasePrice) * 100).toFixed(1)),
        needsReplacement,
        monthsUntilReplacement,
        status: needsReplacement ? 'NEEDS_REPLACEMENT' : monthsUntilReplacement <= 3 ? 'EXPIRING_SOON' : 'ACTIVE',
        isActive: asset.isActive,
      };
    });
  }
}
