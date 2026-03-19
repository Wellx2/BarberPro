import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui';

interface StockTabProps {
  products: any[];
  setProducts: (products: any[]) => void;
  loadingProducts: boolean;
  currentShopId: string;
  productService: any;
}

export const StockTab: React.FC<StockTabProps> = ({
  products,
  setProducts,
  loadingProducts,
  currentShopId,
  productService
}) => {
  return (
    <Card>
      <Card.Body className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
          <div>
            <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Gestão de Estoque</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ajuste rápido de unidades disponíveis</p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Layers size={48} className="mx-auto opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase">Nenhum produto cadastrado no catálogo</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3 px-2 font-black text-gray-400 text-[10px] uppercase tracking-widest">Produto</th>
                  <th className="text-center py-3 px-2 font-black text-gray-400 text-[10px] uppercase tracking-widest">Qtd</th>
                  <th className="text-center py-3 px-2 font-black text-gray-400 text-[10px] uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        {product.image && <img src={product.image} className="w-10 h-10 rounded-xl object-cover border dark:border-gray-700" alt="" />}
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 dark:text-white text-xs uppercase line-clamp-1">{product.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{product.category || 'Geral'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`text-xl font-black ${product.stock <= 5 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{product.stock}</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const v = Math.max(0, product.stock - 1);
                            productService.update(product.id, { stock: v })
                              .then(() => productService.list(currentShopId, true))
                              .then((d: any) => setProducts(d));
                          }}
                          disabled={product.stock === 0}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 transition-all font-black text-2xl disabled:opacity-20"
                        >
                          -
                        </button>
                        <button
                          onClick={() => {
                            const v = product.stock + 1;
                            productService.update(product.id, { stock: v })
                              .then(() => productService.list(currentShopId, true))
                              .then((d: any) => setProducts(d));
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500 hover:bg-green-100 transition-all font-black text-2xl"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.some(p => p.stock <= 5) && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 shadow-sm">
                 <AlertCircle className="text-red-500 animate-bounce" size={20} />
                 <div>
                   <p className="text-xs font-black text-red-900 dark:text-red-200 uppercase">Estoque Crítico Detectado</p>
                   <p className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase tracking-tight">Reponha os itens em vermelho para evitar falta de produtos.</p>
                 </div>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
