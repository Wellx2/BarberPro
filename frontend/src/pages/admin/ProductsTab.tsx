import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, Edit3, Power, Trash2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { Modal } from '../../components/feedback';
import { productService } from '../../services/productService';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { Product } from '../../types';

export const ProductsTab: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { addNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    image: '',
    category: '',
    stock: 0,
    unit: 'unidade'
  });

  const fallbackImage = 'https://images.unsplash.com/photo-1512690196236-d5a23223044b?w=800&q=80';

  useEffect(() => {
    if (!currentShop?.id) return;
    loadProducts();
  }, [currentShop?.id]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await productService.list(currentShop.id, true);
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      addNotification('error', 'Erro ao carregar catálogo de produtos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 600;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setProductForm({ ...productForm, image: compressedBase64 });
        addNotification('success', 'Imagem carregada com sucesso!');
      } catch (error) {
        addNotification('error', 'Erro ao processar imagem');
      }
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        costPrice: product.costPrice || 0,
        image: product.image || '',
        category: product.category || '',
        stock: product.stock || 0,
        unit: product.unit || 'unidade'
      });
    } else {
      setEditProduct(null);
      setProductForm({
        name: '', description: '', price: 0, costPrice: 0,
        image: '', category: '', stock: 0, unit: 'unidade'
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      addNotification('error', 'Nome do produto é obrigatório');
      return;
    }
    try {
      if (editProduct) {
        await productService.update(editProduct.id, productForm);
        addNotification('success', 'Produto atualizado!');
      } else {
        await productService.create(productForm);
        addNotification('success', 'Produto criado!');
      }
      setShowProductModal(false);
      loadProducts();
    } catch (error) {
      addNotification('error', 'Erro ao salvar produto');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await productService.update(id, { active: !currentStatus });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
      addNotification('success', 'Status atualizado!');
    } catch (error) {
      addNotification('error', 'Erro ao atualizar status');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    const reason = window.prompt(`Deseja excluir ${name}? Informe o motivo:`);
    if (!reason) return;
    try {
      await productService.remove(id, reason);
      setProducts(prev => prev.filter(p => p.id !== id));
      addNotification('success', 'Produto removido');
    } catch (error) {
      addNotification('error', 'Erro ao remover produto');
    }
  };
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
                      onClick={() => toggleActive(product.id, product.active)}
                      className={`w-full sm:flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${product.active ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}
                    >
                      <Power size={14} />
                      <span className="text-[10px] font-black uppercase">{product.active ? 'Pausar' : 'Ativar'}</span>
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id, product.name)}
                      className="w-full sm:w-10 p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Card.Body>

      {/* Product Modal */}
      {showProductModal && (
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={editProduct ? 'Editar Produto' : 'Novo Produto'}
          size="lg"
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome do Produto *</label>
                  <Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Pomada Efeito Matte" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preço Venda *</label>
                    <Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preço Custo</label>
                    <Input type="number" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estoque Inicial</label>
                    <Input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Unidade</label>
                    <Input value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} placeholder="un, ml, g" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Imagem do Produto</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      {productForm.image ? (
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="text-gray-300" size={40} />
                      )}
                    </div>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
              <textarea
                value={productForm.description}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:border-tenant-primary transition-colors min-h-[100px]"
                placeholder="Detalhes sobre o produto..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={() => setShowProductModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveProduct} variant="primary" className="flex-1">
                {editProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
