import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Invoice } from '../../types';
import financialService from '../../services/financialService';
import { useNotification } from '../../context/NotificationContext';
import {
  History,
  Search,
  X,
  Package,
  Calendar,
  Clock,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Scissors,
  Filter,
  ArrowRight
} from 'lucide-react';

/** Safely parse a date string from the API and return a Date (or null on failure). */
const safeDate = (raw: string | undefined | null): Date | null => {
  if (!raw) return null;
  // If it's a plain YYYY-MM-DD, append T00:00 so it's parsed as local time, not UTC
  const normalised = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const d = new Date(normalised);
  return isNaN(d.getTime()) ? null : d;
};

export const SalesHistory: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { shop } = useShop();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'TODAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'ALL'>('TODAY');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        // Usar a nova API de listagem de faturas
        let startDate: string | undefined;
        const now = new Date();
        
        if (periodFilter === 'TODAY') startDate = now.toISOString().split('T')[0];
        else if (periodFilter === 'WEEK') {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          startDate = d.toISOString().split('T')[0];
        } else if (periodFilter === 'FORTNIGHT') {
          const d = new Date();
          d.setDate(d.getDate() - 15);
          startDate = d.toISOString().split('T')[0];
        } else if (periodFilter === 'MONTH') {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          startDate = d.toISOString().split('T')[0];
        }

        const data = await financialService.listInvoices(shop.id, {
          startDate,
          status: 'PAID' // No histórico mostramos apenas o que foi pago
        });
        
        // Mapear campos se necessário (Invoice vs PendingInvoice)
        setInvoices(data as any);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        addNotification('error', 'Erro ao carregar histórico de vendas');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [shop.id, periodFilter, addNotification]);

  const filteredSales = useMemo(() => {
    return invoices
      .filter(inv => {
        // A API já filtra por shopId e status, mas mantemos buscas locais por nome/id
        const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.id.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, searchTerm]);

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'PIX': return <QrCode size={14} className="text-teal-500" />;
      case 'CASH': return <Banknote size={14} className="text-green-500" />;
      default: return <CreditCard size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-tenant-primary rounded-2xl transition-all">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-nãone">Histórico de Vendas</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Controle de atendimentos e produtos vendidos</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-tenant-primary focus:outline-nãone transition-colors !pl-12 !py-3 !rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'TODAY', label: 'hoje' },
          { id: 'WEEK', label: '7 Dias' },
          { id: 'FORTNIGHT', label: '15 Dias' },
          { id: 'MONTH', label: '30 Dias' },
          { id: 'ALL', label: 'Tudo' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setPeriodFilter(filter.id as any)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all shrink-0 ${periodFilter === filter.id ? 'bg-tenant-primary border-tenant-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-tenant-primary'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[40px] shadow-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Data / Hora</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cliente</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Itens Detalhados</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Pagamento</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-tenant-primary border-t-transparent mb-4"></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Carregando faturas...</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest italic">
                    Nenhuma venda encontrada neste período
                  </td>
                </tr>
              ) : (
                filteredSales.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold dark:text-white">{safeDate(inv.date)?.toLocaleDateString() ?? '—'}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{safeDate(inv.date)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '—'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tenant-primary/5 dark:bg-tenant-primary/10 flex items-center justify-center text-tenant-primary shrink-0">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase tracking-tight dark:text-white">{inv.clientName}</span>
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">ID: {inv.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {inv.items?.map((item, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-[9px] font-bold text-gray-600 dark:text-gray-300">
                            {item.name.toLowerCase().includes('corte') || item.name.toLowerCase().includes('barba') ? <Scissors size={10} className="text-tenant-primary" /> : <Package size={10} className="text-blue-500" />}
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {!inv.items && <span className="text-xs text-gray-400 italic">Venda Direta</span>}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {getMethodIcon(inv.paymentMethod)}
                        {inv.paymentMethod || 'OUTRO'}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-lg font-black text-tenant-primary tracking-tighter">
                        R$ {inv.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 rounded-[35px] p-8 text-white">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 rounded-2xl bg-tenant-primary flex items-center justify-center">
            <History size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-tenant-primary tracking-widest leading-nãone mb-1">Resumo do Período</p>
            <p className="text-sm font-bold opacity-60">Total bruto calculado dos filtros aplicados</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-white tracking-tighter leading-nãone">
            R$ {filteredSales.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
