/**
 * Testes Automatizados - Integração Financeira
 * 
 * Execute com: npm test
 * Ou para testes específicos: npm test -- financialService.test.ts
 * 
 * ⚠️ NOTA SOBRE IDs:
 * Os IDs 'shop-1' usados nestes testes são apenas para fins de teste unitário.
 * Em produção, o backend usa UUIDs reais (ex: aa62b19b-f5de-4f04-9354-a06d2c3cb567)
 * gerados automaticamente pelo Prisma via @default(uuid()).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getFinancialAnalytics,
  getDailyCashierAnalytics,
  processInvoicePayment,
  type FinancialAnalytics,
  type DailyCashierAnalytics,
  type AnalyticsPeriod
} from '../financialService';
import { api } from '../api';

// Mock do módulo api
vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  }
}));

describe('Financial Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFinancialAnalytics', () => {
    it('deve buscar analytics com período MONTH', async () => {
      // Arrange
      const mockResponse: FinancialAnalytics = {
        period: 'MONTH',
        startDate: '2026-01-05T00:00:00.000Z',
        endDate: '2026-02-04T23:59:59.999Z',
        gross: 15000,
        serviceRev: 10000,
        productRev: 4000,
        planRev: 1000,
        expenses: 8500,
        totalCommissions: 5000,
        fixedCostsTotal: 3000,
        productCosts: 500,
        net: 6500,
        isLoss: false,
        margin: 43.33,
        avgTicket: 75,
        totalAppointments: 200,
        commissionsByBarber: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getFinancialAnalytics('shop-1', 'MONTH');

      // Assert
      expect(api.get).toHaveBeenCalledWith('/financial/analytics?shopId=shop-1&period=MONTH');
      expect(result).toEqual(mockResponse);
      expect(result.gross).toBe(15000);
      expect(result.net).toBe(6500);
      expect(result.margin).toBe(43.33);
    });

    it('deve incluir startDate e endDate opcionais na query', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {} as FinancialAnalytics
      });

      // Act
      await getFinancialAnalytics(
        'shop-1',
        'ALL',
        '2026-01-01T00:00:00.000Z',
        '2026-01-31T23:59:59.999Z'
      );

      // Assert
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2026-01-01T00%3A00%3A00.000Z')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2026-01-31T23%3A59%3A59.999Z')
      );
    });

    it('deve calcular corretamente se há prejuízo', async () => {
      // Arrange
      const mockResponse: FinancialAnalytics = {
        period: 'WEEK',
        startDate: '2026-01-28T00:00:00.000Z',
        endDate: '2026-02-04T23:59:59.999Z',
        gross: 5000,
        serviceRev: 5000,
        productRev: 0,
        planRev: 0,
        expenses: 6000,
        totalCommissions: 4000,
        fixedCostsTotal: 1500,
        productCosts: 500,
        net: -1000,
        isLoss: true,
        margin: -20,
        avgTicket: 50,
        totalAppointments: 100,
        commissionsByBarber: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getFinancialAnalytics('shop-1', 'WEEK');

      // Assert
      expect(result.isLoss).toBe(true);
      expect(result.net).toBeLessThan(0);
      expect(result.margin).toBeLessThan(0);
    });

    it('deve lançar erro quando API falhar', async () => {
      // Arrange
      const errorMessage = 'Network error';
      vi.mocked(api.get).mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(
        getFinancialAnalytics('shop-1', 'MONTH')
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getDailyCashierAnalytics', () => {
    it('deve buscar analytics do dia especificado', async () => {
      // Arrange
      const mockResponse: DailyCashierAnalytics = {
        date: '2026-02-04',
        isToday: true,
        totalReceived: 3500,
        totalPending: 450,
        totalDay: 3950,
        serviceRevenue: 2800,
        productRevenue: 650,
        planRevenue: 50,
        paymentMethods: {
          PIX: 1500,
          CASH: 800,
          CREDIT_CARD: 900,
          DEBIT_CARD: 300
        },
        totalAppointments: 52,
        completedAppointments: 47,
        avgTicket: 74.47,
        barberCommissions: [],
        totalCommissions: 1750,
        netRevenue: 1750,
        pendingInvoices: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getDailyCashierAnalytics('shop-1', '2026-02-04');

      // Assert
      expect(api.get).toHaveBeenCalledWith(
        '/financial/cashier/daily?shopId=shop-1&date=2026-02-04'
      );
      expect(result).toEqual(mockResponse);
      expect(result.date).toBe('2026-02-04');
      expect(result.isToday).toBe(true);
    });

    it('deve calcular corretamente total do dia', async () => {
      // Arrange
      const mockResponse: DailyCashierAnalytics = {
        date: '2026-02-03',
        isToday: false,
        totalReceived: 2000,
        totalPending: 500,
        totalDay: 2500,
        serviceRevenue: 1800,
        productRevenue: 200,
        planRevenue: 0,
        paymentMethods: {
          PIX: 1000,
          CASH: 600,
          CREDIT_CARD: 400,
          DEBIT_CARD: 0
        },
        totalAppointments: 30,
        completedAppointments: 25,
        avgTicket: 80,
        barberCommissions: [],
        totalCommissions: 1000,
        netRevenue: 1000,
        pendingInvoices: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getDailyCashierAnalytics('shop-1', '2026-02-03');

      // Assert
      expect(result.totalDay).toBe(result.totalReceived + result.totalPending);
      expect(result.totalDay).toBe(2500);
    });

    it('deve validar soma de formas de pagamento', async () => {
      // Arrange
      const mockResponse: DailyCashierAnalytics = {
        date: '2026-02-04',
        isToday: true,
        totalReceived: 3000,
        totalPending: 0,
        totalDay: 3000,
        serviceRevenue: 3000,
        productRevenue: 0,
        planRevenue: 0,
        paymentMethods: {
          PIX: 1200,
          CASH: 800,
          CREDIT_CARD: 700,
          DEBIT_CARD: 300
        },
        totalAppointments: 40,
        completedAppointments: 40,
        avgTicket: 75,
        barberCommissions: [],
        totalCommissions: 1500,
        netRevenue: 1500,
        pendingInvoices: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getDailyCashierAnalytics('shop-1', '2026-02-04');

      // Assert
      const sumPaymentMethods = Object.values(result.paymentMethods).reduce(
        (sum, value) => sum + value,
        0
      );
      expect(sumPaymentMethods).toBe(result.totalReceived);
    });
  });

  describe('processInvoicePayment', () => {
    it('deve processar pagamento via PIX', async () => {
      // Arrange
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      // Act
      await processInvoicePayment('invoice-1', 'PIX');

      // Assert
      expect(api.patch).toHaveBeenCalledWith('/invoices/invoice-1', {
        status: 'PAID',
        paymentMethod: 'PIX',
        paidAt: expect.any(String)
      });
    });

    it('deve processar pagamento via CASH', async () => {
      // Arrange
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      // Act
      await processInvoicePayment('invoice-2', 'CASH');

      // Assert
      expect(api.patch).toHaveBeenCalledWith('/invoices/invoice-2', {
        status: 'PAID',
        paymentMethod: 'CASH',
        paidAt: expect.any(String)
      });
    });

    it('deve processar pagamento via CREDIT_CARD', async () => {
      // Arrange
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      // Act
      await processInvoicePayment('invoice-3', 'CREDIT_CARD');

      // Assert
      expect(api.patch).toHaveBeenCalledWith('/invoices/invoice-3', {
        status: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        paidAt: expect.any(String)
      });
    });

    it('deve processar pagamento via DEBIT_CARD', async () => {
      // Arrange
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      // Act
      await processInvoicePayment('invoice-4', 'DEBIT_CARD');

      // Assert
      expect(api.patch).toHaveBeenCalledWith('/invoices/invoice-4', {
        status: 'PAID',
        paymentMethod: 'DEBIT_CARD',
        paidAt: expect.any(String)
      });
    });

    it('deve incluir paidAt com timestamp atual', async () => {
      // Arrange
      const beforeTimestamp = new Date().toISOString();
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      // Act
      await processInvoicePayment('invoice-5', 'PIX');

      // Assert
      const callArgs = vi.mocked(api.patch).mock.calls[0][1] as any;
      const afterTimestamp = new Date().toISOString();

      expect(callArgs.paidAt).toBeDefined();
      expect(new Date(callArgs.paidAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTimestamp).getTime()
      );
      expect(new Date(callArgs.paidAt).getTime()).toBeLessThanOrEqual(
        new Date(afterTimestamp).getTime()
      );
    });

    it('deve lançar erro quando pagamento falhar', async () => {
      // Arrange
      const errorMessage = 'Payment failed';
      vi.mocked(api.patch).mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(
        processInvoicePayment('invoice-6', 'PIX')
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com valores decimais corretamente', async () => {
      // Arrange
      const mockResponse: FinancialAnalytics = {
        period: 'MONTH',
        startDate: '2026-01-05T00:00:00.000Z',
        endDate: '2026-02-04T23:59:59.999Z',
        gross: 12345.67,
        serviceRev: 10000.50,
        productRev: 2000.17,
        planRev: 345,
        expenses: 8000.33,
        totalCommissions: 5000.25,
        fixedCostsTotal: 2500.08,
        productCosts: 500,
        net: 4345.34,
        isLoss: false,
        margin: 35.19,
        avgTicket: 61.73,
        totalAppointments: 200,
        commissionsByBarber: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getFinancialAnalytics('shop-1', 'MONTH');

      // Assert
      expect(result.gross).toBe(12345.67);
      expect(result.avgTicket).toBe(61.73);
      expect(result.margin).toBe(35.19);
    });

    it('deve lidar com lista vazia de barbeiros', async () => {
      // Arrange
      const mockResponse: FinancialAnalytics = {
        period: 'TODAY',
        startDate: '2026-02-04T00:00:00.000Z',
        endDate: '2026-02-04T23:59:59.999Z',
        gross: 0,
        serviceRev: 0,
        productRev: 0,
        planRev: 0,
        expenses: 0,
        totalCommissions: 0,
        fixedCostsTotal: 0,
        productCosts: 0,
        net: 0,
        isLoss: false,
        margin: 0,
        avgTicket: 0,
        totalAppointments: 0,
        commissionsByBarber: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getFinancialAnalytics('shop-1', 'TODAY');

      // Assert
      expect(result.commissionsByBarber).toEqual([]);
      expect(result.totalAppointments).toBe(0);
      expect(result.avgTicket).toBe(0);
    });

    it('deve lidar com lista vazia de invoices pendentes', async () => {
      // Arrange
      const mockResponse: DailyCashierAnalytics = {
        date: '2026-02-04',
        isToday: true,
        totalReceived: 5000,
        totalPending: 0,
        totalDay: 5000,
        serviceRevenue: 5000,
        productRevenue: 0,
        planRevenue: 0,
        paymentMethods: {
          PIX: 5000,
          CASH: 0,
          CREDIT_CARD: 0,
          DEBIT_CARD: 0
        },
        totalAppointments: 50,
        completedAppointments: 50,
        avgTicket: 100,
        barberCommissions: [],
        totalCommissions: 2500,
        netRevenue: 2500,
        pendingInvoices: []
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await getDailyCashierAnalytics('shop-1', '2026-02-04');

      // Assert
      expect(result.pendingInvoices).toEqual([]);
      expect(result.totalPending).toBe(0);
    });
  });

  describe('Types', () => {
    it('deve aceitar todos os períodos válidos', () => {
      const validPeriods: AnalyticsPeriod[] = [
        'TODAY',
        'WEEK',
        'MONTH',
        'QUARTER',
        'YEAR',
        'ALL'
      ];

      validPeriods.forEach(period => {
        expect(() => {
          // TypeScript validation - se compilar, está ok
          const p: AnalyticsPeriod = period;
          expect(p).toBe(period);
        }).not.toThrow();
      });
    });
  });
});
