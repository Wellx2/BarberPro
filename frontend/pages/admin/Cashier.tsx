
import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { Invoice } from '../../types';
import { UI_STYLE } from '../../constants';
import { 
  Banknote, 
  CreditCard, 
  QrCode, 
  X, 
  Check, 
  Clock, 
  User, 
  Hash, 
  Calendar as CalendarIcon, 
  AlertCircle,
  ChevronRight,
  ArrowDownCircle,
  Search,
  History
} from 'lucide-react';
import { SalesHistory } from './SalesHistory';

export const Cashier: React.FC = () => {
  const { shop } = useShop();
  const { addNotification } = useNotification();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para alternar entre Pendentes e Histórico
  const [showHistory, setShowHistory] = useState(false);

  // Carregar invoices do localStorage
  useEffect(() => {
    const loadInvoices = () => {
      const stored = localStorage.getItem('invoices');
      if (stored) {
        setInvoices(JSON.parse(stored));
      }
    };
    loadInvoices();
    window.addEventListener('storage', loadInvoices);
    return () => window.removeEventListener('storage', loadInvoices);
  }, []);

  const pendingInvoices = useMemo(() => {
    return invoices
      .filter(inv => 
        inv.shopId === shop.id && 
        inv.status === 'PENDING' &&
        (inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         inv.id.includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, shop.id, searchTerm]);

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = (method: Invoice['paymentMethod']) => {
    if (!selectedInvoice) return;
    
    setLoading(true);
    setTimeout(() => {
      const updatedInvoices = invoices.map(inv => 
        inv.id === selectedInvoice.id 
          ? { ...inv, status: 'PAID' as const, paymentMethod: method, date: new Date().toISOString() } 
          : inv
      );
      
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      addNotification('success', `Pagamento de R$ ${selectedInvoice.amount.toFixed(2)} recebido via ${method}!`, 'Venda Finalizada');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setLoading(false);
    }, 800);
  };

  const handleCancelInvoice = (invoice: Invoice) => {
    const reason = prompt('Motivo do cancelamento:');
    if (reason === null) return;

    const updatedInvoices = invoices.map(inv => 
      inv.id === invoice.id 
        ? { ...inv, status: 'CANCELLED' as const, description: `${inv.description} (Cancelado: ${reason})` } 
        : inv
    );
    
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    addNotification('warning', 'A venda foi cancelada e estornada do caixa.', 'Venda Cancelada');
  };

  if (showHistory) {
      return <SalesHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Caixa Operacional</h2>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Aguardando Recebimentos
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className={UI_STYLE.input + " !pl-12 !py-3 !rounded-2xl"}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={() => setShowHistory(true)} className={UI_STYLE.button.outline + " !py-3 !rounded-2xl"}>
                <History size={18} /> Histórico de Vendas
            </button>
        </div>
      </div>

      {pendingInvoices.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
          <Banknote size={48} className="mx-auto text-gray-300 mb-4 opacity-20" />
          <p className="text-sm font-black uppercase text-gray-400 tracking-widest">Nenhum pagamento pendente no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingInvoices.map((inv) => (
            <div key={inv.id} className={`${UI_STYLE.card} p-8 flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-amber-500/50 transition-all group dark:bg-gray-800/60`}>
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className={`p-5 rounded-[22px] shadow-inner shrink-0 ${inv.type === 'SERVICE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'}`}>
                  {inv.type === 'SERVICE' ? <Clock size={28} /> : <ArrowDownCircle size={28} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${inv.type === 'SERVICE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                      {inv.type === 'SERVICE' ? 'Serviço' : 'Produto'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Hash size={10} /> {inv.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-black uppercase text-base md:text-lg dark:text-white truncate">{inv.clientName}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-medium mt-1">{inv.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                    <span className="flex items-center gap-1"><CalendarIcon size={12}/> {new Date(inv.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(inv.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto border-t lg:border-t-0 pt-6 lg:pt-0 border-gray-100 dark:border-gray-700">
                <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                  <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 leading-none mb-1">Total a Receber</p>
                  <div className="flex items-baseline gap-1">
                     <span className="text-lg font-bold text-amber-500">R$</span>
                     <span className="text-4xl font-black text-amber-500 tracking-tighter">{inv.amount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto justify-center">
                  <button 
                    onClick={() => handleCancelInvoice(inv)}
                    className="p-5 bg-gray-50 dark:bg-gray-750 text-gray-400 hover:text-red-500 rounded-3xl transition-all"
                    title="Cancelar Fatura"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => handleOpenPayment(inv)}
                    className="flex-1 md:flex-none bg-gray-900 dark:bg-amber-500 text-white px-8 py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 whitespace-nowrap"
                  >
                    <Check size={20} strokeWidth={3} /> Receber
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE PAGAMENTO PERMANECE IGUAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border dark:border-gray-700/50">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-amber-500 transition-colors z-20"
            >
              <X size={32} />
            </button>

            <div className="p-10 bg-gray-900 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 relative z-10">Finalizar Recebimento</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest relative z-10">Cliente: {selectedInvoice.clientName}</p>
               
               <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Valor Total</span>
                  <span className="text-4xl font-black tracking-tighter">R$ {selectedInvoice.amount.toFixed(2)}</span>
               </div>
            </div>

            <div className="p-10 space-y-8 dark:bg-gray-800">
              <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest text-center">Selecione o Meio de Pagamento</p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'PIX', icon: QrCode, label: 'PIX' },
                  { id: 'CASH', icon: Banknote, label: 'Dinheiro' },
                  { id: 'CREDIT_CARD', icon: CreditCard, label: 'Crédito' },
                  { id: 'DEBIT_CARD', icon: CreditCard, label: 'Débito' }
                ].map((method) => (
                  <button 
                    key={method.id}
                    disabled={loading}
                    onClick={() => handleProcessPayment(method.id as any)}
                    className="flex flex-col items-center justify-center gap-4 p-8 rounded-[35px] border-2 border-gray-100 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 bg-gray-50 dark:bg-gray-900/40 transition-all group"
                  >
                    <div className="p-4 bg-white rounded-2xl shadow-md group-hover:scale-110 transition-transform flex items-center justify-center">
                      <method.icon size={28} className="text-gray-900" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-white">{method.label}</span>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-3 text-amber-500 font-bold text-xs uppercase tracking-widest animate-pulse mt-4">
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
