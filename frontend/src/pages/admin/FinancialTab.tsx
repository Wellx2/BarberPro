import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, BarChart3, PieChart, Eye, EyeOff, 
  ArrowUpRight, ChevronDown
} from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Card, Button, Input } from '../../components/ui';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { 
  getFinancialAnalytics, 
  FinancialAnalytics, 
  AnalyticsPeriod 
} from '../../services/financialService';
import { Modal, Alert } from '../../components/feedback';
import { AlertCircle } from 'lucide-react';

export const FinancialTab: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [financialPeriod, setFinancialPeriod] = useState<AnalyticsPeriod>('TODAY');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [useCustomRange, setUseCustomRange] = useState(false);
  

  const [showRevenueDetail, setShowRevenueDetail] = useState(false);
  const [showCommissionDetail, setShowCommissionDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  const { shop: shopFromContext } = useShop(); // For details if needed

  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const maxRangeDate = formatDate(new Date());
  const minRangeDate = (() => {
    const min = new Date();
    min.setFullYear(min.getFullYear() - 2);
    return formatDate(min);
  })();

  const setRollingRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setCustomRange({ startDate: formatDate(start), endDate: formatDate(end) });
    setUseCustomRange(true);
    setFinancialPeriod('MONTH');
  };

  // Carregar dados financeiros
  useEffect(() => {
    if (!currentShop?.id) return;

    const loadData = async () => {
      try {
        setLoadingAnalytics(true);
        const startDate = useCustomRange ? customRange.startDate : undefined;
        const endDate = useCustomRange ? customRange.endDate : undefined;
        const data = await getFinancialAnalytics(currentShop.id, financialPeriod, startDate, endDate);
        setAnalytics(data);
      } catch (error: any) {
        console.error('Erro ao carregar analytics:', error);
        if (error?.statusCode === 401 || error?.response?.status === 401) {
          addNotification('error', 'Sessão expirada. Faça login novamente.');
        } else {
          addNotification('error', 'Erro ao carregar dados financeiros');
        }
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadData();
  }, [currentShop?.id, financialPeriod, customRange.startDate, customRange.endDate, useCustomRange, addNotification]);

  useEffect(() => {
    // Carregar dados iniciais
  }, [currentShop?.id]);

  if (loadingAnalytics) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest">Carregando inteligência financeira...</p>
      </div>
    );
  }

  if (!analytics) return (
    <div className="text-center py-20 text-gray-500">
       Nenhum dado financeiro disponível para o período.
    </div>
  );

  const revenueData = [
    { name: 'Serviços', value: analytics.serviceRev, color: '#3b82f6' },
    { name: 'Produtos', value: analytics.productRev, color: '#10b981' },
    { name: 'Assinaturas', value: analytics.planRev, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const expenseData = [
    { name: 'Comissões', value: analytics.totalCommissions, color: '#f59e0b' },
    { name: 'Insumos', value: analytics.supplyCostsTotal, color: '#6366f1' },
    { name: 'Taxas Cartão', value: analytics.cardFees, color: '#f43f5e' },
    { name: 'Custos Fixos', value: analytics.fixedCostsTotal, color: '#64748b' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['TODAY', 'WEEK'] as AnalyticsPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => {
              setUseCustomRange(false);
              setFinancialPeriod(period);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === period && !useCustomRange
              ? 'bg-tenant-primary text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {period === 'TODAY' ? 'Hoje' : '7 Dias'}
          </button>
        ))}
        <button
          onClick={() => setRollingRange(15)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange && (customRange.startDate && customRange.endDate && (new Date(customRange.endDate).getTime() - new Date(customRange.startDate).getTime()) / (1000 * 60 * 60 * 24) === 14)
            ? 'bg-tenant-primary text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          15 Dias
        </button>
        {(['MONTH', 'QUARTER'] as AnalyticsPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => {
              setUseCustomRange(false);
              setFinancialPeriod(period);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${financialPeriod === period && !useCustomRange
              ? 'bg-tenant-primary text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {period === 'MONTH' ? '30 Dias' : '90 Dias'}
          </button>
        ))}
        <button
          onClick={() => setUseCustomRange(true)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange && ! (customRange.startDate && customRange.endDate && (new Date(customRange.endDate).getTime() - new Date(customRange.startDate).getTime()) / (1000 * 60 * 60 * 24) === 14)
            ? 'bg-tenant-primary text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          Personalizado
        </button>
      </div>

      {useCustomRange && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Início</label>
            <Input
              type="date"
              value={customRange.startDate}
              min={minRangeDate}
              max={maxRangeDate}
              onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Fim</label>
            <Input
              type="date"
              value={customRange.endDate}
              min={minRangeDate}
              max={maxRangeDate}
              onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setUseCustomRange(true)}
              variant="primary"
              className="w-full"
              disabled={!customRange.startDate || !customRange.endDate}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {financialPeriod !== 'TODAY' && !useCustomRange && (
        <Card className={`p-6 border-2 ${analytics.margin >= 30
          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-500'
          : analytics.margin >= 15
            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-500'
            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-500'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-2">
                Saúde Financeira: {
                  analytics.margin >= 30 ? 'Excelente' :
                    analytics.margin >= 15 ? 'Atenção' :
                      'Crítico'
                }
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Margem de lucro: <span className="font-black">{analytics.margin.toFixed(1)}%</span>
              </p>
            </div>
            <button
              onClick={() => setShowFinancialValues(!showFinancialValues)}
              className="p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {showFinancialValues ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
          </div>
        </Card>
      )}

      {financialPeriod === 'TODAY' && (
        <div className="flex justify-end p-2">
           <button
            onClick={() => setShowFinancialValues(!showFinancialValues)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-100 dark:border-gray-700"
          >
            {showFinancialValues ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <TrendingUp size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Receita</span>
          </div>
          <p className="text-3xl font-black mb-1">
            R$ {showFinancialValues ? analytics.gross.toFixed(2) : '***'}
          </p>
          <p className="text-xs opacity-80 font-bold">Faturamento Bruto</p>
        </Card>

        <Card className={`p-6 text-white ${analytics.isLoss ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
          <div className="flex justify-between items-start mb-3">
            <DollarSign size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Lucro</span>
          </div>
          <p className="text-3xl font-black mb-1">
            R$ {showFinancialValues ? analytics.net.toFixed(2) : '***'}
          </p>
          <p className="text-xs opacity-80 font-bold">Resultado Final</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <BarChart3 size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Média</span>
          </div>
          <p className="text-3xl font-black mb-1">
            R$ {showFinancialValues ? analytics.avgTicket.toFixed(2) : '***'}
          </p>
          <p className="text-xs opacity-80 font-bold">Ticket Médio</p>
        </Card>

        <Card 
          className="bg-gradient-to-br from-tenant-primary to-tenant-primary text-white p-6 cursor-pointer hover:shadow-xl transition-all active:scale-95"
          onClick={() => setShowRevenueDetail(true)}
        >
          <div className="flex justify-between items-start mb-3">
            <PieChart size={28} className="opacity-70" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold opacity-80 uppercase">Margem</span>
              <ChevronDown size={14} className="opacity-50 mt-1" />
            </div>
          </div>
          <p className="text-3xl font-black mb-1">
            {showFinancialValues ? analytics.margin.toFixed(1) : '***'}<span className="text-2xl">%</span>
          </p>
          <p className="text-xs opacity-80 font-bold">Lucro / Receita</p>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
          onClick={() => setShowRevenueDetail(true)}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="text-green-500" size={20} />
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Composição de Receita</h3>
            </div>
            <ChevronDown size={18} className="text-gray-400" />
          </div>
          <div className="h-[250px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 font-bold uppercase text-sm">Sem Receita no Período</span>
              </div>
            )}
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
          onClick={() => setShowExpenseDetail(true)}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PieChart className="text-red-500" size={20} />
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Fatia de Despesas</h3>
            </div>
            <ChevronDown size={18} className="text-gray-400" />
          </div>
          <div className="h-[250px] w-full">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 font-bold uppercase text-sm">Sem Despesas no Período</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* DRE Simplificado */}
      <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-gray-900">
        <div className="bg-gray-900 dark:bg-black p-4">
          <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
            <BarChart3 size={18} className="text-tenant-primary" />
            Demonstrativo de Resultados (DRE)
          </h3>
        </div>
        <div className="p-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                <td className="py-3 px-6 font-bold text-gray-900 dark:text-white">RECEITA BRUTA TOTAL</td>
                <td className="py-3 px-6 text-right font-black text-blue-600 dark:text-blue-400">
                  R$ {showFinancialValues ? analytics.gross.toFixed(2) : '••••'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 pl-10 text-gray-500 dark:text-gray-400">(-) Taxas de Cartão Operacionais</td>
                <td className="py-3 px-6 text-right text-red-500 font-medium">
                  R$ {showFinancialValues ? analytics.cardFees.toFixed(2) : '••••'}
                </td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className="py-3 px-6 font-bold text-gray-700 dark:text-gray-300">RECEITA LÍQUIDA</td>
                <td className="py-3 px-6 text-right font-bold text-gray-900 dark:text-white">
                  R$ {showFinancialValues ? (analytics.gross - analytics.cardFees).toFixed(2) : '••••'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 pl-10 text-gray-500 dark:text-gray-400">(-) Comissões de Profissionais</td>
                <td className="py-3 px-6 text-right text-red-500 font-medium">
                  R$ {showFinancialValues ? analytics.totalCommissions.toFixed(2) : '••••'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 pl-10 text-gray-500 dark:text-gray-400">(-) Custo de Insumos (Proporcional)</td>
                <td className="py-3 px-6 text-right text-red-500 font-medium">
                  R$ {showFinancialValues ? analytics.supplyCostsTotal.toFixed(2) : '••••'}
                </td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className="py-3 px-6 font-bold text-gray-700 dark:text-gray-300">LUCRO BRUTO (Margem de Contribuição)</td>
                <td className="py-3 px-6 text-right font-bold text-gray-900 dark:text-white">
                  R$ {showFinancialValues ? (analytics.gross - analytics.cardFees - analytics.totalCommissions - analytics.supplyCostsTotal).toFixed(2) : '••••'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 pl-10 text-gray-500 dark:text-gray-400">(-) Custos Fixos & Despesas Adm.</td>
                <td className="py-3 px-6 text-right text-red-500 font-medium">
                  R$ {showFinancialValues ? analytics.fixedCostsTotal.toFixed(2) : '••••'}
                </td>
              </tr>
              <tr className={analytics.isLoss ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}>
                <td className="py-4 px-6 font-black text-gray-900 dark:text-white text-base">RESULTADO LÍQUIDO (LUCRO/PREJUÍZO)</td>
                <td className={`py-4 px-6 text-right font-black text-xl ${analytics.isLoss ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {showFinancialValues ? analytics.net.toFixed(2) : '••••'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>



      {/* Alertas Inteligentes */}
      {financialPeriod !== 'TODAY' && (analytics.margin < 15 || analytics.isLoss || analytics.avgTicket < 50) && (
        <Card className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 mt-6">
          <Card.Body className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              <h3 className="font-black text-lg text-red-900 dark:text-red-100 uppercase">Alertas de Gestão</h3>
            </div>
            <div className="space-y-2">
              {analytics.isLoss && (
                <Alert variant="error" className="text-sm">
                  <strong>Prejuízo identificado:</strong> Suas despesas superam a receita. Revise custos fixos e comissões urgentemente.
                </Alert>
              )}
              {analytics.margin < 15 && !analytics.isLoss && (
                <Alert variant="warning" className="text-sm">
                  <strong>Margem baixa:</strong> Sua margem de lucro está abaixo de 15%. Considere ajustar preços ou reduzir custos.
                </Alert>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
      {/* Modal de Detalhamento de Receita */}
      <Modal
        isOpen={showRevenueDetail}
        onClose={() => setShowRevenueDetail(false)}
        title="Detalhamento de Faturamento"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-purple-600">Serviços</span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-400">R$ {analytics?.serviceRev.toFixed(2)}</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-1000"
                  style={{ width: `${analytics ? (analytics.serviceRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-blue-600">Produtos</span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-400">R$ {analytics?.productRev.toFixed(2)}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-1000"
                  style={{ width: `${analytics ? (analytics.productRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-2xl border border-tenant-primary/10 dark:border-tenant-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-tenant-primary">Planos / Assinaturas</span>
                <span className="text-lg font-black text-tenant-primary dark:text-tenant-primary">R$ {analytics?.planRev.toFixed(2)}</span>
              </div>
              <div className="w-full bg-tenant-primary/20 dark:bg-tenant-primary/20/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-tenant-primary h-full transition-all duration-1000"
                  style={{ width: `${analytics ? (analytics.planRev / Math.max(analytics.gross, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <Alert variant="info" icon={<AlertCircle size={18} />}>
            Estes valores representam o faturamento bruto antes de descontos, taxas de cartão e comissões.
          </Alert>
        </div>
      </Modal>

      {/* Modal de Detalhamento de Comissões */}
      <Modal
        isOpen={showCommissionDetail}
        onClose={() => setShowCommissionDetail(false)}
        title="Extrato de Comissões por Profissional"
      >
        <div className="space-y-4">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {analytics?.commissionsByBarber.map((barber) => (
              <div key={barber.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 font-bold text-gray-400">
                    {barber.avatar ? (
                      <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      barber.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{barber.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{barber.appointments} atendimentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-tenant-primary dark:text-tenant-primary">R$ {barber.commission.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">Faturamento: R$ {barber.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="font-black text-sm uppercase text-gray-500">Total Comissões</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">R$ {analytics?.totalCommissions.toFixed(2)}</span>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhamento de Despesas */}
      <Modal
        isOpen={showExpenseDetail}
        onClose={() => setShowExpenseDetail(false)}
        title="Detalhamento de Custos e Despesas"
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Totais do Período</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-bold text-red-500 uppercase">Custos Fixos</p>
                <p className="text-lg font-black text-red-700 dark:text-red-400">R$ {analytics?.fixedCostsTotal.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <p className="text-xs font-bold text-orange-500 uppercase">Insumos e Taxas</p>
                <p className="text-lg font-black text-orange-700 dark:text-orange-400">R$ {((analytics?.supplyCostsTotal || 0) + (analytics?.cardFees || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Resumo de Saídas</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium dark:text-white">Custos Fixos / Aluguel</span>
                <span className="font-bold dark:text-white">R$ {analytics?.fixedCostsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium dark:text-white">Comissões de Profissionais</span>
                <span className="font-bold dark:text-white">R$ {analytics?.totalCommissions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium dark:text-white">Custo de Insumos</span>
                <span className="font-bold dark:text-white">R$ {analytics?.supplyCostsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium dark:text-white">Taxas de Operação (Cartão)</span>
                <span className="font-bold dark:text-white">R$ {analytics?.cardFees.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-900 -mx-6 -mb-6 p-6">
            <span className="font-black text-sm uppercase text-white">Total de Saídas (Custos + Comissões)</span>
            <span className="text-2xl font-black text-red-500">
              R$ {showFinancialValues ? ((analytics?.fixedCostsTotal || 0) + (analytics?.totalCommissions || 0) + (analytics?.cardFees || 0) + (analytics?.supplyCostsTotal || 0)).toFixed(2) : '••••'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
