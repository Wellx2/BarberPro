import React from 'react';
import { Plus, ShoppingBag, Edit3, Power } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface ProductsTabProps {
  products: any[];
  loadingProducts: boolean;
  handleOpenProductModal: (product?: any) => void;
  toggleActive: (id: string, type: 'SERVICE' | 'PRODUCT') => void;
  fallbackImage: string;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  loadingProducts,
  handleOpenProductModal,
  toggleActive,
  fallbackImage
}) => {
  return (
    <Card>
      <Card.Body className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
          <div>
            <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Meus Produtos</h3>
            <p className="text-xs text-gray-500 mt-0.5">Catálogo de produtos para venda e comissionamento</p>
          </div>
          <Button
            size="md"
            variant="primary"
            icon={<Plus size={20} />}
            onClick={() => handleOpenProductModal()}
            className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
            aria-label="Novo Produto"
          >
            <span className="hidden sm:inline">Novo Produto</span>
          </Button>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Carregando catálogo...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="mb-4 flex justify-center">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                <ShoppingBag size={48} className="opacity-40" />
              </div>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Nenhum produto cadastrado</p>
            <p className="text-xs mt-1">Sua prateleira está vazia. Adicione produtos para começar a vender.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Card key={product.id} className="relative overflow-hidden transition-all border dark:border-gray-800">
                {/* Badge de Status */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg text-white ${product.active ? 'bg-green-500' : 'bg-red-500'}`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Imagem */}
                <div className={`h-32 sm:h-40 bg-gray-100 dark:bg-gray-800 ${!product.active ? 'grayscale opacity-60' : ''}`}>
                  <img
                    src={product.image || fallbackImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                  />
                </div>

                <Card.Body className="space-y-2 p-3 sm:p-4">
                  <div className={!product.active ? 'grayscale opacity-60' : ''}>
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 uppercase tracking-tight h-8 sm:h-10">{product.name}</h4>
                    <p className="text-lg sm:text-xl font-black text-tenant-primary">R$ {product.price.toFixed(2)}</p>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="text-gray-500 font-medium">Estoque: {product.stock}</span>
                      {product.stock === 0 && <span className="text-red-500 font-black uppercase tracking-tighter animate-pulse">Esgotado</span>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 border-t dark:border-gray-800">
                    <button
                      onClick={() => handleOpenProductModal(product)}
                      className="w-full sm:flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={14} />
                      <span className="text-[10px] font-black uppercase">Editar</span>
                    </button>
                    <button
                      onClick={() => toggleActive(product.id, 'PRODUCT')}
                      className={`w-full sm:flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${product.active ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}
                    >
                      <Power size={14} />
                      <span className="text-[10px] font-black uppercase">{product.active ? 'Pausar' : 'Ativar'}</span>
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
