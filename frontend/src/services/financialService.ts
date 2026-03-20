import { api } from './api';

// ─── Período ───────────────────────────────────────────────────────────────────
export type AnalyticsPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

// ─── Tipos tipados (substituindo `any`) ────────────────────────────────────────
export interface SalesOpportunity {
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  productPrice: number;
  avgRecurrenceDays: number;
  daysSinceLastPurchase: number;
  lastPurchaseDate: string;
  urgency: 'NORMAL' | 'HIGH';
  suggestion: string;
}

export interface RetentionMetrics {
  retentionRate: number;
  retainedClients: number;
  newClients: number;
  totalActiveClients: number;
  churnedClients: number;
  evaluationPeriod: string;
}

export interface AssetWithDepreciation {
  id: string;
  name: string;
  description: string | null;
  purchaseDate: string;
  purchasePrice: number;
  usefulLifeMonths: number;
  monthsElapsed: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  currentValue: number;
  depreciationPercentage: number;
  needsReplacement: boolean;
  monthsUntilReplacement: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'NEEDS_REPLACEMENT';
  isActive: boolean;
}

// ─── Comissão por barbeiro ──────────────────────────────────────────────────
export interface BarberCommission {
  id: string;
  name: string;
  avatar: string | null;
  appointments: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  serviceRate?: number;
  productRate?: number;
  netForShop: number;
}

// ─── Analytics financeiros (Saúde Financeira — /financial/analytics) ──────────
export interface FinancialAnalytics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  gross: number;
  serviceRev: number;
  productRev: number;
  planRev: number;
  expenses: number;
  totalCommissions: number;
  fixedCostsTotal: number;
  supplyCostsTotal: number;   // ⭐ custo de insumos (novo backend)
  cardFees: number;           // ⭐ taxas de cartão (novo backend)
  productCosts: number;
  net: number;                // Lucro Líquido Real
  isLoss: boolean;
  margin: number;             // % de margem real
  avgTicket: number;
  totalAppointments: number;
  commissionsByBarber: BarberCommission[];
}

// ─── Invoice pendente (Caixa) ──────────────────────────────────────────────
export interface PendingInvoice {
  id: string;
  shopId: string;
  clientName: string;
  amount: number;
  type: 'SERVICE' | 'PRODUCT' | 'PLAN';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  description?: string;
  date: string;
}

// ─── Analytics diários do Caixa (/financial/cashier/daily) ─────────────────
export interface DailyCashierAnalytics {
  date: string;
  isToday: boolean;
  totalReceived: number;
  totalPending: number;
  totalDay: number;
  serviceRevenue: number;
  productRevenue: number;
  planRevenue: number;
  cardFees: number;           // ⭐ novo backend
  supplyCostsTotal: number;   // ⭐ novo backend
  netRevenue: number;
  paymentMethods: {
    PIX: number;
    CASH: number;
    CREDIT_CARD: number;
    DEBIT_CARD: number;
  };
  totalAppointments: number;
  completedAppointments: number;
  avgTicket: number;
  barberCommissions: BarberCommission[];
  totalCommissions: number;
  pendingInvoices: PendingInvoice[];
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/**
 * Lista faturas (invoices) filtradas por loja e período.
 */
export const listInvoices = async (
  shopId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    clientId?: string;
    status?: string;
  }
): Promise<PendingInvoice[]> => {
  const queryParams = new URLSearchParams({ shopId });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  const response = await api.get<PendingInvoice[]>(`/invoices?${queryParams.toString()}`);
  return response.data;
};

/**
 * Analytics financeiros para o período especificado.
 */
export const getFinancialAnalytics = async (
  shopId: string,
  period: AnalyticsPeriod,
  startDate?: string,
  endDate?: string
): Promise<FinancialAnalytics> => {
  const params = new URLSearchParams({ shopId, period });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get<FinancialAnalytics>(`/financial/analytics?${params.toString()}`);
  return response.data;
};

/**
 * Analytics diários do caixa operacional.
 */
export const getDailyCashierAnalytics = async (
  shopId: string,
  date: string
): Promise<DailyCashierAnalytics> => {
  const params = new URLSearchParams({ shopId, date });
  const response = await api.get<DailyCashierAnalytics>(`/financial/cashier/daily?${params.toString()}`);
  return response.data;
};

/**
 * Processa pagamento de uma invoice.
 * ⚠️ Fase 2 — pode não estar implementado não backend (404 → aviso gracioso).
 */
export const processInvoicePayment = async (
  invoiceId: string,
  paymentMethod: 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'
): Promise<void> => {
  try {
    await api.patch(`/invoices/${invoiceId}`, {
      status: 'PAID',
      paymentMethod,
      paidAt: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.response?.status === 404) {
      throw {
        statusCode: 404,
        message: 'Endpoint de processamento de pagamento ainda não implementado (Fase 2)',
        originalError: error,
      };
    }
    throw error;
  }
};

/**
 * Oportunidades preditivas de venda.
 */
export const getSalesOpportunities = async (): Promise<SalesOpportunity[]> => {
  const response = await api.get<SalesOpportunity[]>('/financial/opportunities');
  return response.data;
};

/**
 * Métricas de retenção de clientes (últimos 90 dias).
 */
export const getRetentionMetrics = async (): Promise<RetentionMetrics> => {
  const response = await api.get<RetentionMetrics>('/financial/retention');
  return response.data;
};

/**
 * Lista ativos físicos da barbearia com depreciação calculada.
 */
export const getAssets = async (): Promise<AssetWithDepreciation[]> => {
  const response = await api.get<AssetWithDepreciation[]>('/financial/assets');
  return response.data;
};

export default {
  getFinancialAnalytics,
  getDailyCashierAnalytics,
  listInvoices,
  processInvoicePayment,
  getSalesOpportunities,
  getRetentionMetrics,
  getAssets,
};
