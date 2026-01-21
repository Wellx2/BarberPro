
import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { Product, StockMovement } from '../../types';
import { UI_STYLE } from '../../constants';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Trash2, 
  Search, 
  X, 
  Plus, 
  Filter,
  Package,
  Calendar,
  AlertOctagon,
  // Added Save icon import
  Save
} from 'lucide-react';

export const StockMovements: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { shop } = useShop();
  const { addNotification } = useNotification();
  
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [movements, setMovements] = useState<StockMovement[]>(() => JSON.parse(localStorage.getItem('stock_movements') || '[]'));
  
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST' | 'LOSS'>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    type: 'IN' as StockMovement['type'],
    quantity: 0,
    reason: ''
  });

  const shopProducts = useMemo(() => products.filter(p => p.shopId === shop.id), [products, shop.id]);

  const filteredMovements = useMemo(() => {
    return movements
      .filter(m => 
        m.shopId === shop.id && 
        (typeFilter === 'ALL' || m.type === typeFilter) &&
        (m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || m.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [movements, shop.id, typeFilter, searchTerm]);

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) {
      addNotification('error', 'Preencha o produto e a quantidade corretamente.');
      return;
    }

    const targetProduct = shopProducts.find(p => p.id === formData.productId);
    if (!targetProduct) return;

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      shopId: shop.id,
      productId: formData.productId,
      productName: targetProduct.name,
      type: formData.type,
      quantity: formData.quantity,
      reason: formData.reason || (formData.type === 'IN' ? 'Entrada manual' : 'Saída manual'),
      createdAt: new Date().toISOString()
    };

    // Update Product Stock
    const updatedProducts = products.map(p => {
      if (p.id === formData.productId) {
        const change = (formData.type === 'IN' || (formData.type === 'ADJUST' && formData.quantity > 0)) 
          ? formData.quantity 
          : -formData.quantity;
        return { ...p, stock: Math.max(0, p.stock + (formData.type === 'IN' ? formData.quantity : -formData.quantity)) };
      }
      return p;
    });

    const updatedMovements = [newMovement, ...movements];

    setProducts(updatedProducts);
    setMovements(updatedMovements);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    localStorage.setItem('stock_movements', JSON.stringify(updatedMovements));

    addNotification('success', 'Movimentação registrada com sucesso!');
    setShowModal(false);
    setFormData({ productId: '', type: 'IN', quantity: 0, reason: '' });
  };

  const getTypeStyle = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'OUT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOSS': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'ADJUST': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN': return <ArrowDownLeft size={14} />;
      case 'OUT': return <ArrowUpRight size={14} />;
      case 'LOSS': return <AlertOctagon size={14} />;
      case 'ADJUST': return <RefreshCw size={14} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-amber-500 rounded-2xl transition-all">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Movimentações de Estoque</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Histórico de entradas e saídas</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar histórico..." 
              className={UI_STYLE.input + " !pl-12 !py-3 !rounded-2xl"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowModal(true)} className={UI_STYLE.button.primary + " !py-3 !rounded-2xl"}>
            <Plus size={18}/> Nova Movimentação
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['ALL', 'IN', 'OUT', 'ADJUST', 'LOSS'] as const).map(type => (
          <button 
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all shrink-0 ${typeFilter === type ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-amber-500'}`}
          >
            {type === 'ALL' ? 'Todos' : type === 'IN' ? 'Entradas' : type === 'OUT' ? 'Saídas' : type === 'ADJUST' ? 'Ajustes' : 'Perdas'}
          </button>
        ))}
      </div>

      <div className={`${UI_STYLE.card} overflow-hidden border-gray-100 dark:border-gray-700`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Data</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Produto</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipo</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Qtd</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest italic">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold dark:text-white">{new Date(mov.createdAt).toLocaleDateString()}</span>
                        <span className="text-[9px] text-gray-400">{new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                          <Package size={16} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight dark:text-white">{mov.productName}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit ${getTypeStyle(mov.type)}`}>
                        {getTypeIcon(mov.type)}
                        {mov.type === 'IN' ? 'Entrada' : mov.type === 'OUT' ? 'Saída' : mov.type === 'ADJUST' ? 'Ajuste' : 'Perda'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`text-base font-black ${mov.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                        {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-1">{mov.reason}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW MOVEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleSaveMovement} className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border dark:border-gray-700">
            <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <History className="text-amber-500" size={24} />
                <h3 className="font-black uppercase tracking-tighter text-xl">Nova Movimentação</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Produto</label>
                <select 
                  required 
                  className={UI_STYLE.input} 
                  value={formData.productId} 
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                >
                  <option value="">Selecione um produto</option>
                  {shopProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Tipo</label>
                  <select 
                    required 
                    className={UI_STYLE.input} 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="IN">Entrada (+)</option>
                    <option value="OUT">Saída (-)</option>
                    <option value="LOSS">Perda (-)</option>
                    <option value="ADJUST">Ajuste Inventário</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Quantidade</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    className={UI_STYLE.input} 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-2 block tracking-widest">Motivo / Observação</label>
                <textarea 
                  className={UI_STYLE.input + " !p-4 min-h-[100px] font-medium"} 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="Ex: Chegada de lote, Quebra de frasco, etc..."
                />
              </div>

              <div className="pt-4">
                <button type="submit" className={UI_STYLE.button.primary + " w-full !py-6"}>
                  <Save size={20} /> Registrar Movimentação
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
