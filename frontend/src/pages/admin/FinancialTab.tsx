import React from 'react';
import { 
  TrendingUp, DollarSign, BarChart3, PieChart, Eye, EyeOff, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Card, Button, Input } from '../../components/ui';
import { FinancialAnalytics, AnalyticsPeriod } from '../../services/financialService';

interface FinancialTabProps {
  analytics: FinancialAnalytics | null;
  loadingAnalytics: boolean;
  showFinancialValues: boolean;
  setShowFinancialValues: (show: boolean) => void;
  financialPeriod: AnalyticsPeriod;
  setFinancialPeriod: (period: AnalyticsPeriod) => void;
  useCustomRange: boolean;
  setUseCustomRange: (use: boolean) => void;
  customRange: { startDate: string; endDate: string };
  setCustomRange: (range: { startDate: string; endDate: string }) => void;
  minRangeDate: string;
  maxRangeDate: string;
  setRollingRange: (days: number) => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({
  analytics,
  loadingAnalytics,
  showFinancialValues,
  setShowFinancialValues,
  financialPeriod,
  setFinancialPeriod,
  useCustomRange,
  setUseCustomRange,
  customRange,
  setCustomRange,
  minRangeDate,
  maxRangeDate,
  setRollingRange
}) => {
  if (loadingAnalytics) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest">Carregando inteligência financeira...</p>
      </div>
    );
  }

  if (!analytics) return null;

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
        {(['TODAY', 'WEEK', 'MONTH', 'QUARTER'] as AnalyticsPeriod[]).map((period) => (
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
            {period === 'TODAY' ? 'Hoje' : period === 'WEEK' ? '7 Dias' : period === 'MONTH' ? '30 Dias' : '90 Dias'}
          </button>
        ))}
        <button
          onClick={() => setRollingRange(15)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange && customRange.startDate && customRange.endDate
            ? 'bg-tenant-primary text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          15 Dias
        </button>
        <button
          onClick={() => setUseCustomRange(true)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${useCustomRange
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

        <Card className="bg-gradient-to-br from-tenant-primary to-tenant-primary text-white p-6">
          <div className="flex justify-between items-start mb-3">
            <PieChart size={28} className="opacity-70" />
            <span className="text-xs font-bold opacity-80 uppercase">Margem</span>
          </div>
          <p className="text-3xl font-black mb-1">
            {showFinancialValues ? analytics.margin.toFixed(1) : '***'}<span className="text-2xl">%</span>
          </p>
          <p className="text-xs opacity-80 font-bold">Lucro / Receita</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowUpRight className="text-green-500" size={20} />
            <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Composição de Receita</h3>
          </div>
          <div className="h-[250px] w-full">
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
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-red-500" size={20} />
            <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Fatia de Despesas</h3>
          </div>
          <div className="h-[250px] w-full">
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
          </div>
        </Card>
      </div>

      {(analytics.cardFees > 0 || analytics.supplyCostsTotal > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {analytics.cardFees > 0 && (
            <Card className="p-5 border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Taxas de Cartão</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                R$ {showFinancialValues ? analytics.cardFees.toFixed(2) : '***'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Crédito 4% Débito 2%</p>
            </Card>
          )}
          {analytics.supplyCostsTotal > 0 && (
            <Card className="p-5 border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Custo de Insumos</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                R$ {showFinancialValues ? analytics.supplyCostsTotal.toFixed(2) : '***'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gasto proporcional ao volume de serviços</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
