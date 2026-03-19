import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import {
  getDailyCashierAnalytics,
  processInvoicePayment,
  getSalesOpportunities,
  getRetentionMetrics,
  type DailyCashierAnalytics,
  type SalesOpportunity,
  type RetentionMetrics,
  type PendingInvoice,
} from '../../services/financialService';
import {
  Banknote, CreditCard, QrCode, X, Check, Clock, Calendar as CalendarIcon,
  AlertCircle, ChevronRight, Search, History, DollarSign, TrendingUp,
  Users, Scissors, ShoppingBag, Eye, EyeOff, Printer, BrainCircuit,
  Target, HeartPulse, Plus, Minus, Percent
} from 'lucide-react';
import { SalesHistory } from './SalesHistory';
import { Card } from '../../components/ui';
import { Grid } from '../../components/layout/Grid';

// ─── Card Fee Config ──────────────────────────────────────────────────────────
const CARD_FEES: Record<string, number> = {
  CREDIT_CARD: 4,
  DEBIT_CARD: 2,
  PIX: 0,
  CASH: 0,
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
};

// ─── Cross-Sell Map (serviço → produtos recomendados) ─────────────────────────
const CROSS_SELL_MAP: Record<string, { label: string; emoji: string }[]> = {
  corte: [
    { label: 'Pomada Modeladora', emoji: '💈' },
    { label: 'Finalizador Capilar', emoji: '✨' },
    { label: 'Shampoo Premium', emoji: '🧴' },
  ],
  barba: [
    { label: 'Óleo de Barba', emoji: '🛢️' },
    { label: 'Balm Pós-Barba', emoji: '🌿' },
    { label: 'Escova de Barba', emoji: '🪥' },
  ],
  sobrancelha: [
    { label: 'Gel Fixador', emoji: '💎' },
    { label: 'Pomada de Sobrancelha', emoji: '✏️' },
  ],
};

function getCrossSellSuggestions(description?: string) {
  if (!description) return [];
  const lower = description.toLowerCase();
  for (const [key, items] of Object.entries(CROSS_SELL_MAP)) {
    if (lower.includes(key)) return items;
  }
  return CROSS_SELL_MAP.corte; // default
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`} />
);

const CashierSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-9 w-56" />
      <SkeletonBox className="h-11 w-36" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-10 w-40" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
        <SkeletonBox className="h-6 w-40" />
        {[...Array(3)].map((_, i) => <SkeletonBox key={i} className="h-14 w-full" />)}
      </div>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
        <SkeletonBox className="h-6 w-40" />
        {[...Array(3)].map((_, i) => <SkeletonBox key={i} className="h-14 w-full" />)}
      </div>
    </div>
  </div>
);

// ─── Split Payment State ──────────────────────────────────────────────────────
interface SplitEntry {
  method: 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';
  amount: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const Cashier: React.FC = () => {
  const { shop } = useShop();
  const { addNotification } = useNotification();

  // Data state
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyCashierAnalytics | null>(null);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [retention, setRetention] = useState<RetentionMetrics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [splitMode, setSplitMode] = useState(false);
  const [splitEntries, setSplitEntries] = useState<SplitEntry[]>([
    { method: 'PIX', amount: '' },
  ]);

  // Load analytics
  const loadDailyAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const isToday = selectedDate === new Date().toISOString().split('T')[0];

      if (isToday) {
        const [data, opps, ret] = await Promise.all([
          getDailyCashierAnalytics(shop.id, selectedDate),
          getSalesOpportunities(),
          getRetentionMetrics(),
        ]);
        setDailyAnalytics(data);
        setOpportunities(opps);
        setRetention(ret);
      } else {
        const data = await getDailyCashierAnalytics(shop.id, selectedDate);
        setDailyAnalytics(data);
        setOpportunities([]);
        setRetention(null);
      }
    } catch (error: any) {
      if (error?.statusCode === 401 || error?.response?.status === 401) {
        addNotification('error', 'Sessão expirada. Faça login novamente.');
        setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 2000);
        return;
      }
      addNotification('error', 'Erro ao carregar dados do caixa');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [shop.id, selectedDate, addNotification]);

  useEffect(() => { loadDailyAnalytics(); }, [loadDailyAnalytics]);

  // ─── Payment handlers ──────────────────────────────────────────────────────
  const openPayment = (invoice: PendingInvoice) => {
    setSelectedInvoice(invoice);
    setSplitMode(false);
    setSplitEntries([{ method: 'PIX', amount: '' }]);
    setShowPaymentModal(true);
  };

  const closePayment = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleSinglePayment = async (method: SplitEntry['method']) => {
    if (!selectedInvoice) return;
    try {
      setLoading(true);
      await processInvoicePayment(selectedInvoice.id, method);
      await loadDailyAnalytics();
      addNotification('success', `Pagamento via ${PAYMENT_LABELS[method]} recebido!`, 'Venda Finalizada');
      closePayment();
    } catch (error: any) {
      if (error?.statusCode === 404) {
        addNotification('warning', 'Processamento de pagamentos disponível na Fase 2.', '⚠️ Em breve');
        return;
      }
      if (error?.statusCode === 401) {
        addNotification('error', 'Sessão expirada.');
        return;
      }
      addNotification('error', 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  // Split payment helpers
  const splitTotal = useMemo(
    () => splitEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
    [splitEntries]
  );

  const splitFees = useMemo(
    () =>
      splitEntries.reduce((sum, e) => {
        const amt = parseFloat(e.amount) || 0;
        return sum + (amt * (CARD_FEES[e.method] ?? 0)) / 100;
      }, 0),
    [splitEntries]
  );

  const remainingAmount = useMemo(
    () => (selectedInvoice ? selectedInvoice.amount - splitTotal : 0),
    [selectedInvoice, splitTotal]
  );

  const addSplitEntry = () => {
    setSplitEntries(prev => [...prev, { method: 'CASH', amount: '' }]);
  };

  const removeSplitEntry = (idx: number) => {
    setSplitEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSplitEntry = (idx: number, field: keyof SplitEntry, value: string) => {
    setSplitEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  // Filtered pending invoices
  const filteredInvoices = useMemo(
    () =>
      (dailyAnalytics?.pendingInvoices ?? []).filter(
        inv =>
          inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.id.includes(searchTerm.toLowerCase())
      ),
    [dailyAnalytics?.pendingInvoices, searchTerm]
  );

  // Cross-sell suggestions for selected invoice
  const crossSellItems = useMemo(
    () => (selectedInvoice?.type === 'SERVICE' ? getCrossSellSuggestions(selectedInvoice.description) : []),
    [selectedInvoice]
  );

  // ─── Render guards ─────────────────────────────────────────────────────────
  if (showHistory) return <SalesHistory onBack={() => setShowHistory(false)} />;
  if (loadingAnalytics) return <CashierSkeleton />;

  if (!dailyAnalytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle size={64} className="text-red-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Erro ao carregar dados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifique sua conexão e tente novamente.</p>
            <button
              onClick={loadDailyAnalytics}
              className="px-6 py-3 bg-tenant-primary text-white rounded-xl font-bold hover:opacity-90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white">Caixa Operacional</h2>
              {selectedDate > new Date().toLocaleDateString('en-CA') && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                  Previsão
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
              {dailyAnalytics.isToday
                ? 'Operação de hoje'
                : `Relatório de ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>

        {/* Date Navigator + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-stretch bg-gray-900 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-800 dark:border-gray-700">
            <button
              onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="px-4 py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <ChevronRight size={20} className="rotate-180 text-white" />
            </button>
            <div className="flex items-center px-6 py-3 bg-gray-800 min-w-[180px] justify-center gap-3">
              <CalendarIcon size={18} className="text-tenant-primary" />
              <span className="text-white font-black text-base">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })}
              </span>
            </div>
            <button
              onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="px-4 py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA'))}
            disabled={dailyAnalytics.isToday}
            className="px-6 py-3 text-sm font-bold uppercase bg-tenant-primary text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            hoje
          </button>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-tenant-primary transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const content = `
                    <html>
                      <head>
                        <title>Recibo de Caixa - ${shop.name}</title>
                        <style>
                          body { font-family: sans-serif; padding: 20px; color: #333; }
                          h1 { text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 10px; }
                          .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                          .kpi-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                          .label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; }
                          .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
                          .total-row { font-weight: bold; background: #f9f9f9; }
                        </style>
                      </head>
                      <body>
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h1 style="margin-bottom: 5px;">${shop.name}</h1>
                          <p style="font-weight: bold; color: #666;">RELATÓRIO DE CAIXA OPERACIONAL</p>
                          <p>Data: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        <div class="kpi-grid">
                          <div class="kpi-item">
                            <div class="label">Total Recebido</div>
                            <div class="value">R$ ${dailyAnalytics.totalReceived.toFixed(2)}</div>
                          </div>
                          <div class="kpi-item">
                            <div class="label">Pendente</div>
                            <div class="value">R$ ${dailyAnalytics.totalPending.toFixed(2)}</div>
                          </div>
                          <div class="kpi-item">
                            <div class="label">Total Bruto</div>
                            <div class="value">R$ ${dailyAnalytics.totalDay.toFixed(2)}</div>
                          </div>
                          <div class="kpi-item">
                            <div class="label">Ticket Médio</div>
                            <div class="value">R$ ${dailyAnalytics.avgTicket.toFixed(2)}</div>
                          </div>
                        </div>

                        <h2>Comissões dos Profissionais</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Profissional</th>
                              <th>Atendimentos</th>
                              <th>Comissão</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${dailyAnalytics.barberCommissions.map(b => `
                              <tr>
                                <td>${b.name}</td>
                                <td>${b.appointments}</td>
                                <td>R$ ${b.commission.toFixed(2)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        
                        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
                          <p style="font-size: 10px; color: #999;">Gerado por KlypBarber em ${new Date().toLocaleString('pt-BR')}</p>
                        </div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `;
                  printWindow.document.write(content);
                  printWindow.document.close();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-tenant-primary transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <Printer size={18} /> Imprimir
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-tenant-primary transition-colors flex items-center gap-2 font-bold text-sm uppercase text-gray-700 dark:text-gray-300"
            >
              <History size={18} /> Histórico
            </button>
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente FECHAR O CAIXA de hoje? Isso gerará o relatório final consolidado.')) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const content = `
                      <html>
                        <head>
                          <title>FECHAMENTO DE CAIXA - ${shop.name}</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
                            .header { text-align: center; border-bottom: 4px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
                            h1 { margin: 0; text-transform: uppercase; letter-spacing: -1px; }
                            .meta { font-weight: bold; color: #666; text-transform: uppercase; font-size: 12px; margin-top: 5px; }
                            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
                            .summary-item { background: #f9fafb; border: 1px solid #e5e7eb; padding: 25px; border-radius: 20px; }
                            .label { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; }
                            .value { font-size: 28px; font-weight: 900; color: #111827; margin-top: 5px; }
                            .net-profit { border-left: 10px solid #10b981; }
                            h2 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px; text-transform: uppercase; font-size: 18px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                            th { text-align: left; background: #f3f4f6; padding: 12px; font-size: 12px; text-transform: uppercase; }
                            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                            .footer { margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 30px; }
                            .signature { margin-top: 40px; border-top: 1px solid #333; width: 250px; margin-left: auto; margin-right: auto; padding-top: 10px; font-size: 12px; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>${shop.name}</h1>
                            <div class="meta">RELATÓRIO DE FECHAMENTO DE CAIXA</div>
                            <div class="meta">Data: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                          </div>

                          <div class="summary-grid">
                            <div class="summary-item">
                              <div class="label">Total Bruto</div>
                              <div class="value">R$ ${dailyAnalytics.totalDay.toFixed(2)}</div>
                            </div>
                            <div class="summary-item">
                              <div class="label">Total Recebido</div>
                              <div class="value">R$ ${dailyAnalytics.totalReceived.toFixed(2)}</div>
                            </div>
                            <div class="summary-item">
                              <div class="label">Total Pendente</div>
                              <div class="value">R$ ${dailyAnalytics.totalPending.toFixed(2)}</div>
                            </div>
                            <div class="summary-item net-profit">
                              <div class="label">Lucro Líquido Real</div>
                              <div class="value" style="color: #059669;">R$ ${dailyAnalytics.netRevenue.toFixed(2)}</div>
                            </div>
                          </div>

                          <h2>Resumo por Categoria</h2>
                          <table>
                            <tr><td>Receita de Serviços</td><td style="text-align: right; font-weight: bold;">R$ ${dailyAnalytics.serviceRevenue.toFixed(2)}</td></tr>
                            <tr><td>Receita de Produtos</td><td style="text-align: right; font-weight: bold;">R$ ${dailyAnalytics.productRevenue.toFixed(2)}</td></tr>
                            <tr><td>Venda de Planos</td><td style="text-align: right; font-weight: bold;">R$ ${dailyAnalytics.planRevenue.toFixed(2)}</td></tr>
                            <tr style="background: #fffbeb;"><td>Total de Comissões (Saída)</td><td style="text-align: right; font-weight: bold; color: #b45309;">- R$ ${dailyAnalytics.totalCommissions.toFixed(2)}</td></tr>
                            <tr style="background: #fff5f5;"><td>Taxas de Cartão (Saída)</td><td style="text-align: right; font-weight: bold; color: #dc2626;">- R$ ${(dailyAnalytics.cardFees || 0).toFixed(2)}</td></tr>
                          </table>

                          <h2>Comissões de Profissionais</h2>
                          <table>
                            <thead>
                              <tr>
                                <th>Barbeiro</th>
                                <th>Atendimentos</th>
                                <th>Faturamento</th>
                                <th>Comissão</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${dailyAnalytics.barberCommissions.map(b => `
                                <tr>
                                  <td>${b.name}</td>
                                  <td>${b.appointments}</td>
                                  <td>R$ ${b.revenue.toFixed(2)}</td>
                                  <td style="font-weight: bold;">R$ ${b.commission.toFixed(2)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>

                          <div class="footer">
                            <p>Relatório gerado automaticamente pelo sistema KlypBarber.</p>
                            <p style="font-size: 11px; color: #999;">ID da Operação: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
                            
                            <div class="signature">RESPONSÁVEL PELO FECHAMENTO</div>
                          </div>
                          
                          <script>window.print();</script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(content);
                    printWindow.document.close();
                    addNotification('success', 'Relatório de fechamento gerado com sucesso!', 'Caixa Fechado');
                  }
                }
              }}
              className="px-6 py-2 rounded-xl bg-tenant-primary text-white hover:opacity-90 transition-all flex items-center gap-2 font-black text-sm uppercase shadow-lg shadow-tenant-primary/20"
            >
              <Check size={18} /> Fechar Caixa
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid cols={4} gap="lg" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <Check size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Recebido</span>
          </div>
          <p className="text-3xl font-black mb-1">R$ {showValues ? dailyAnalytics.totalReceived.toFixed(2) : '••••'}</p>
          <p className="text-xs opacity-80 font-bold">{dailyAnalytics.completedAppointments} vendas</p>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <Clock size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Pendente</span>
          </div>
          <p className="text-3xl font-black mb-1">R$ {showValues ? dailyAnalytics.totalPending.toFixed(2) : '••••'}</p>
          <p className="text-xs opacity-80 font-bold">{dailyAnalytics.pendingInvoices.length} pagamentos</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <DollarSign size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Total Bruto</span>
          </div>
          <p className="text-3xl font-black mb-1">R$ {showValues ? dailyAnalytics.totalDay.toFixed(2) : '••••'}</p>
          <p className="text-xs opacity-80 font-bold">{dailyAnalytics.totalAppointments} atendimentos</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <TrendingUp size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Ticket Médio</span>
          </div>
          <p className="text-3xl font-black mb-1">R$ {showValues ? dailyAnalytics.avgTicket.toFixed(2) : '••••'}</p>
          <p className="text-xs opacity-80 font-bold">Por atendimento</p>
        </Card>
      </Grid>

      {/* Lucro Real + Taxas (novos campos backend) */}
      {(dailyAnalytics.netRevenue !== undefined || dailyAnalytics.cardFees !== undefined) && (
        <Grid cols={2} gap="lg" className="grid-cols-1 sm:grid-cols-2">
          <Card className="p-6 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Lucro Líquido Real</p>
            <p className={`text-4xl font-black ${dailyAnalytics.netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {showValues ? `R$ ${dailyAnalytics.netRevenue.toFixed(2)}` : 'R$ ••••'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Após comissões, insumos e taxas</p>
          </Card>

          {dailyAnalytics.cardFees > 0 && (
            <Card className="p-6 border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-1">
                <Percent size={12} /> Taxas de Cartão (Operadora)
              </p>
              <p className="text-4xl font-black text-orange-500">
                {showValues ? `R$ ${dailyAnalytics.cardFees.toFixed(2)}` : 'R$ ••••'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Crédito 4% · Débito 2%</p>
            </Card>
          )}
        </Grid>
      )}

      {/* BI — Inteligência de Vendas */}
      {dailyAnalytics.isToday && (opportunities.length > 0 || retention) && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-3 bg-gradient-to-r from-tenant-primary to-tenant-primary p-4 rounded-2xl text-white shadow-lg">
            <BrainCircuit size={28} />
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Inteligência de Vendas</h3>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Algoritmo preditivo de recorrência de consumo</p>
            </div>
          </div>

          <Grid cols={2} gap="lg" className="grid-cols-1 lg:grid-cols-2">
            {/* Oportunidades preditivas */}
            <Card className="border-2 border-tenant-primary/20">
              <Card.Body className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                    <Target size={20} className="text-tenant-primary" />
                    Sugestões Preditivas
                  </h3>
                  <span className="px-3 py-1 bg-tenant-primary/10 dark:bg-tenant-primary/15 text-tenant-primary dark:text-tenant-primary text-xs font-bold rounded-full">
                    {opportunities.length} sugestões
                  </span>
                </div>
                {opportunities.length > 0 ? (
                  <div className="space-y-3 h-[280px] overflow-y-auto pr-1">
                    {opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-l-4 transition-colors ${opp.urgency === 'HIGH'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                          : 'bg-tenant-primary/5 dark:bg-tenant-primary/10 border-tenant-primary'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight text-sm">
                            💡 Oferecer <span className="text-tenant-primary dark:text-tenant-primary">{opp.productName}</span> para {opp.clientName}
                          </p>
                          <span className="font-black text-tenant-primary dark:text-tenant-primary text-sm shrink-0 ml-2">
                            R$ {opp.productPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Compra a cada {opp.avgRecurrenceDays} dias ·{' '}
                          <span className={opp.urgency === 'HIGH' ? 'text-red-500 font-bold' : ''}>
                            {opp.daysSinceLastPurchase} dias sem comprar
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-10 text-sm">Nenhuma sugestão não momento.</p>
                )}
              </Card.Body>
            </Card>

            {/* Retenção */}
            <Card>
              <Card.Body className="space-y-4">
                <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                  <HeartPulse size={20} className="text-rose-500" />
                  Retenção (90 dias)
                </h3>
                {retention ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="80" fill="nãone" stroke="currentColor" strokeWidth="14" className="text-gray-200 dark:text-gray-700" />
                        <circle
                          cx="88" cy="88" r="80" fill="nãone" stroke="currentColor" strokeWidth="14"
                          strokeDasharray="502.65"
                          strokeDashoffset={502.65 - (502.65 * retention.retentionRate) / 100}
                          className="text-rose-500 transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{retention.retentionRate.toFixed(0)}%</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Retenção</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-800">
                        <p className="text-2xl font-black text-green-500">{retention.retainedClients}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase">Fiéis</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-800">
                        <p className="text-2xl font-black text-red-500">{retention.churnedClients}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase">Churn</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Grid>
        </div>
      )}

      {/* Receitas + Pagamentos */}
      <Grid cols={2} gap="lg" className="grid-cols-1 lg:grid-cols-2">
        <Card>
          <Card.Body className="space-y-4">
            <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase">Receitas por Fonte</h3>
            <div className="space-y-3">
              {[
                { label: 'Serviços', value: dailyAnalytics.serviceRevenue, icon: Scissors, color: 'purple' },
                { label: 'Produtos', value: dailyAnalytics.productRevenue, icon: ShoppingBag, color: 'orange' },
                { label: 'Planos', value: dailyAnalytics.planRevenue, icon: Users, color: 'blue' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`flex items-center justify-between p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/40 rounded-lg`}>
                      <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    R$ {showValues ? value.toFixed(2) : '••••'}
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="space-y-4">
            <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase">Formas de Pagamento</h3>
            <div className="space-y-3">
              {Object.entries(dailyAnalytics.paymentMethods).map(([method, amount]) => {
                const icons: Record<string, React.ElementType> = { PIX: QrCode, CASH: Banknote, CREDIT_CARD: CreditCard, DEBIT_CARD: CreditCard };
                const Icon = icons[method] ?? DollarSign;
                const fee = CARD_FEES[method] ?? 0;
                return (
                  <div key={method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">{PAYMENT_LABELS[method] ?? method}</span>
                        {fee > 0 && <span className="text-xs text-orange-500 font-medium">taxa {fee}%</span>}
                      </div>
                    </div>
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      R$ {showValues ? (amount as number).toFixed(2) : '••••'}
                    </span>
                  </div>
                );
              })}
              {Object.keys(dailyAnalytics.paymentMethods).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">Nenhum pagamento recebido</p>
              )}
            </div>
          </Card.Body>
        </Card>
      </Grid>

      {/* Comissões */}
      <Card>
        <Card.Body className="space-y-4">
          <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
            <Users size={20} className="text-tenant-primary" />
            Comissões do Dia
          </h3>
          {dailyAnalytics.barberCommissions.length > 0 ? (
            <div className="space-y-2">
              {dailyAnalytics.barberCommissions.map((barber, index) => (
                <div key={barber.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white text-sm ${index === 0 ? 'bg-tenant-primary' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>{index + 1}</div>
                    {barber.avatar && <img src={barber.avatar} alt={barber.name} className="w-10 h-10 rounded-full object-cover" />}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{barber.name}</p>
                      <p className="text-xs text-gray-500">{barber.appointments} atendimentos · {barber.commissionRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-tenant-primary">R$ {showValues ? barber.commission.toFixed(2) : '••••'}</p>
                    <p className="text-xs text-gray-500">de R$ {showValues ? barber.revenue.toFixed(2) : '••••'}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-xl border-2 border-tenant-primary mt-2">
                <span className="font-black text-gray-900 dark:text-white uppercase">Total Comissões</span>
                <span className="text-2xl font-black text-tenant-primary dark:text-tenant-primary">
                  R$ {showValues ? dailyAnalytics.totalCommissions.toFixed(2) : '••••'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-2 border-emerald-500">
                <span className="font-black text-gray-900 dark:text-white uppercase">Lucro Líquido</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  R$ {showValues ? dailyAnalytics.netRevenue.toFixed(2) : '••••'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">Nenhum atendimento não dia selecionado</p>
          )}
        </Card.Body>
      </Card>

      {/* Pagamentos Pendentes */}
      {filteredInvoices.length > 0 || searchTerm ? (
        <Card className="border-l-4 border-yellow-500">
          <Card.Body className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase flex items-center gap-2">
                <AlertCircle size={20} className="text-yellow-500" />
                Pendentes ({dailyAnalytics.pendingInvoices.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-tenant-primary focus:outline-nãone"
                />
              </div>
            </div>
            <div className="space-y-3">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-yellow-500 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-lg shrink-0 ${inv.type === 'SERVICE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                      {inv.type === 'SERVICE' ? <Scissors size={20} /> : <ShoppingBag size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{inv.clientName}</p>
                      <p className="text-xs text-gray-500 truncate">{inv.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">#{inv.id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                      R$ {showValues ? inv.amount.toFixed(2) : '••••'}
                    </p>
                    <button
                      onClick={() => openPayment(inv)}
                      className="px-5 py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold uppercase text-xs transition-all flex items-center gap-2"
                    >
                      <Check size={16} /> Receber
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      ) : null}

      {/* ─── PAYMENT MODAL ──────────────────────────────────────────────────────── */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border dark:border-gray-700/50">
            <button
              onClick={closePayment}
              className="absolute top-6 right-6 text-gray-400 hover:text-tenant-primary transition-colors z-20"
            >
              <X size={28} />
            </button>

            {/* Modal header */}
            <div className="p-8 bg-gray-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tenant-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 relative z-10">Finalizar Recebimento</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest relative z-10">Cliente: {selectedInvoice.clientName}</p>
              <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-tenant-primary tracking-widest">Valor Total</span>
                <span className="text-3xl font-black">R$ {selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 space-y-5 dark:bg-gray-800 overflow-y-auto max-h-[70vh]">

              {/* Cross-sell suggestion */}
              {crossSellItems.length > 0 && (
                <div className="p-4 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-2xl border border-tenant-primary/20 dark:border-tenant-primary/30">
                  <p className="text-xs font-black uppercase tracking-widest text-tenant-primary dark:text-tenant-primary mb-3 flex items-center gap-2">
                    <BrainCircuit size={14} /> Venda Casada — Recomendado para o serviço
                  </p>
                  <div className="space-y-2">
                    {crossSellItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.emojái} {item.label}</span>
                        <button className="text-xs font-bold text-tenant-primary dark:text-tenant-primary hover:underline">
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment mode toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Forma de Pagamento</p>
                <button
                  onClick={() => setSplitMode(!splitMode)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${splitMode
                    ? 'bg-tenant-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-tenant-primary/10'
                    }`}
                >
                  {splitMode ? '✓ Dividindo' : '÷ Dividir pagamento'}
                </button>
              </div>

              {splitMode ? (
                /* ── Split mode ── */
                <div className="space-y-3">
                  {splitEntries.map((entry, idx) => {
                    const amt = parseFloat(entry.amount) || 0;
                    const fee = (amt * (CARD_FEES[entry.method] ?? 0)) / 100;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <select
                          value={entry.method}
                          onChange={(e) => updateSplitEntry(idx, 'method', e.target.value)}
                          className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm font-bold focus:border-tenant-primary focus:outline-nãone"
                        >
                          <option value="PIX">PIX</option>
                          <option value="CASH">Dinheiro</option>
                          <option value="CREDIT_CARD">Crédito</option>
                          <option value="DEBIT_CARD">Débito</option>
                        </select>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={entry.amount}
                            onChange={(e) => updateSplitEntry(idx, 'amount', e.target.value)}
                            className="pl-9 pr-3 py-2 w-28 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold focus:border-tenant-primary focus:outline-nãone"
                          />
                        </div>
                        {fee > 0 && (
                          <span className="text-xs text-orange-500 shrink-0 font-bold">-R$ {fee.toFixed(2)}</span>
                        )}
                        {splitEntries.length > 1 && (
                          <button onClick={() => removeSplitEntry(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Minus size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={addSplitEntry}
                    className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-tenant-primary hover:text-tenant-primary transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Adicionar método
                  </button>

                  {/* Summary */}
                  <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Parcelas:</span>
                      <span className="font-bold">R$ {splitTotal.toFixed(2)}</span>
                    </div>
                    {splitFees > 0 && (
                      <div className="flex justify-between text-sm text-orange-500">
                        <span>Taxas operadora:</span>
                        <span className="font-bold">-R$ {splitFees.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between text-sm font-black ${remainingAmount < -0.01 ? 'text-red-500' : remainingAmount > 0.01 ? 'text-tenant-primary' : 'text-green-500'}`}>
                      <span>Restante:</span>
                      <span>R$ {remainingAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    disabled={loading || Math.abs(remainingAmount) > 0.01}
                    onClick={() => handleSinglePayment(splitEntries[0].method)}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest transition-colors"
                  >
                    {loading ? 'Processando...' : 'Confirmar Pagamento Dividido'}
                  </button>
                </div>
              ) : (
                /* ── Single method grid ── */
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'PIX' as const, icon: QrCode, label: 'PIX', fee: 0 },
                    { id: 'CASH' as const, icon: Banknote, label: 'Dinheiro', fee: 0 },
                    { id: 'CREDIT_CARD' as const, icon: CreditCard, label: 'Crédito', fee: 4 },
                    { id: 'DEBIT_CARD' as const, icon: CreditCard, label: 'Débito', fee: 2 },
                  ].map((method) => {
                    const feeAmt = (selectedInvoice.amount * method.fee) / 100;
                    return (
                      <button
                        key={method.id}
                        disabled={loading}
                        onClick={() => handleSinglePayment(method.id)}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] border-2 border-gray-100 dark:border-gray-700 hover:border-tenant-primary dark:hover:border-tenant-primary bg-gray-50 dark:bg-gray-900/40 transition-all group"
                      >
                        <div className="p-4 bg-white rounded-2xl shadow-md group-hover:scale-110 transition-transform flex items-center justify-center">
                          <method.icon size={26} className="text-gray-900" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-white">{method.label}</span>
                        {method.fee > 0 && (
                          <span className="text-xs text-orange-500 font-bold">
                            taxa {method.fee}% (-R$ {feeAmt.toFixed(2)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-3 text-tenant-primary font-bold text-xs uppercase tracking-widest animate-pulse">
                  <Clock size={16} className="animate-spin" /> Processando Transação...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
