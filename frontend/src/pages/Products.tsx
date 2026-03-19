import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useNotification } from '../context/NotificationContext';
import { Product, Invoice, Plan } from '../types';
import { productService } from '../services/productService';
import { planService } from '../services/planService';
import { ShoppingBag, X, Plus, Minus, ShoppingCart, Trash2, AlertCircle, MapPin, Check, CreditCard, Banknote, QrCode, Percent, Info, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button, Card, Input } from '../components/ui';
import { Container } from '../components/layout/Container';
import { ProductGrid } from '../components/ProductGrid';
import { Modal } from '../components/feedback';

interface CartItem extends Product {
  quantity: number;
}

export const Products: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { shop, fetchError } = useShop();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const subscriptionsActive = shop.settings.modulesEnabled?.clientPlans !== false;
  const productsEnabled = shop.settings.modulesEnabled?.products !== false;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(8);
  const lastLoadedShopId = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Verificar autenticação ANTES de carregar dados
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/products' } });
    }
  }, [isAuthenticated, navigate]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart_items');
    if (stored) {
      const items = JSON.parse(stored);
      // Filtrar apenas itens da loja atual
      return items.filter((item: CartItem) => item.shopId === shop.id);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH'>('CREDIT_CARD');

  // Carregar produtos do backend
  useEffect(() => {
    // ✅ PROTEÇÃO 1: Se ShopContext tem erro, não tentar carregar
    if (fetchError) {
      setLoading(false);
      return;
    }

    // ✅ PROTEÇÃO 2: Aguardar shop.id válido
    if (!shop.id || shop.id.startsWith('shop-')) {
      setLoading(false);
      return;
    }

    // ✅ PROTEÇÃO 3: Evitar recarregar para o mesmo shop SE já tem dados
    if (lastLoadedShopId.current === shop.id && products.length > 0) {
      return;
    }

    lastLoadedShopId.current = shop.id;

    const loadProducts = async () => {
      // ✅ PROTEÇÃO 4: Cancelar requisições anteriores
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const data = await productService.list(shop.id);

        // ✅ PROTEÇÃO 5: Verificar se foi abortado
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setProducts(data.filter(p => p.active !== false));
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        addNotification('error', 'Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    };

    loadProducts();

    // ✅ Cleanup: Abortar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [shop.id, fetchError, addNotification]);

  // Limpar carrinho quando trocar de barbearia
  useEffect(() => {
    // Só limpar e notificar se houver itens no carrinho
    if (cart.length > 0) {
      setCart([]);
      localStorage.removeItem('cart_items');
      addNotification('info', `Carrinho limpo. Você está agora na loja ${shop.name}.`, 'Loja Alterada');
    }
  }, [shop.id]);

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const loadActivePlan = async () => {
      if (!user?.planId || !subscriptionsActive) {
        setActivePlan(null);
        return;
      }

      try {
        const plan = await planService.getById(user.planId);
        setActivePlan(plan);
      } catch (error) {
        setActivePlan(null);
      }
    };

    loadActivePlan();
  }, [user?.planId, subscriptionsActive]);

  const getActualPrice = (product: Product | CartItem) => {
    if (user?.planId && subscriptionsActive) {
      const discount = activePlan?.discount || 0;
      return product.price * (1 - discount / 100);
    }
    return product.price;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addNotification('warning', 'Limite de estoque atingido.');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    if (viewProduct) setViewProduct(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (getActualPrice(item) * item.quantity), 0);
  const cartSavings = cart.reduce((acc, item) => acc + ((item.price - getActualPrice(item)) * item.quantity), 0);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProducts = searchTerm ? filteredProducts : filteredProducts.slice(0, displayCount);
  const hasMore = !searchTerm && displayCount < filteredProducts.length;

  const handleCheckout = () => {
    if (!user) {
      addNotification('info', 'Faça login para finalizar a compra.');
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newInvoice: Invoice = {
        id: `order-${Date.now()}`,
        shopId: shop.id,
        clientId: user.id,
        clientName: user.name,
        description: 'Compra de Produtos (Retirada)',
        amount: cartTotal,
        date: new Date().toISOString(),
        status: 'PAID',
        type: 'PRODUCT',
        pickupStatus: 'PENDING',
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: getActualPrice(i) })),
        paymentMethod: paymentMethod
      };

      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      localStorage.setItem('invoices', JSON.stringify([...storedInvoices, newInvoice]));

      const updatedProducts = products.map(p => {
        const item = cart.find(c => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      setCart([]);
      setIsProcessing(false);
      setIsCartOpen(false);
      setShowConfirmation(true);

      // Redirecionar para área do cliente após 2 segundos
      setTimeout(() => {
        navigate('/client-dashboard');
      }, 2000);
    }, 1500);
  };

  if (!productsEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Loja indisponível</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta barbearia desativou a loja de produtos.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-30 transition-colors border-b border-gray-100 dark:border-gray-700">
        <Container size="xl" className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Loja de Produtos</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Retirada: <span className="font-black text-tenant-primary">{shop.name}</span></p>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-tenant-primary/10 dark:hover:bg-gray-600 transition-all">
            <ShoppingBag className="text-gray-700 dark:text-gray-200" size={24} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-tenant-primary text-white text-xs font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{cart.length}</span>}
          </button>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="xl" className="py-8">
        {/* Subscription Alert */}
        {subscriptionsActive && (!user || !user.planId) && (
          <div className="bg-tenant-primary/10 border border-tenant-primary/20 p-6 rounded-[30px] mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-tenant-primary rounded-full"><Info size={24} className="text-white" /></div>
              <div>
                <h3 className="font-black text-lg dark:text-white">Benefício de Assinante</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Assine qualquer plano e ganhe até 40% de desconto imediato em todos os produtos.</p>
              </div>
            </div>
            <Button onClick={() => navigate('/plans')} variant="primary">Ver Planos</Button>
          </div>
        )}

        {/* Search Bar */}
        {products.length > 0 && (
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Buscar produtos por nome, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tenant-primary border-t-transparent"></div>
            <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-20">
            <div className="flex flex-col items-center">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Loja Vazia</h3>
              <p className="text-gray-500 dark:text-gray-400">Esta unidade ainda não cadastrou produtos para venda.</p>
            </div>
          </Card>
        ) : (
          <>
            <ProductGrid
              products={displayedProducts}
              subscriptionsActive={subscriptionsActive}
              userHasPlan={!!user?.planId}
              onAddToCart={addToCart}
              onViewDetails={setViewProduct}
            />

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setDisplayCount(prev => prev + 8)}
                  className="px-8 py-3 bg-tenant-primary hover:opacity-90 text-white font-bold uppercase text-sm tracking-wider rounded-full transition-colors"
                >
                  Carregar Mais Produtos
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Product Detail Modal */}
      {viewProduct && (
        <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)} size="lg">
          <div className="flex flex-col md:flex-row gap-8 max-h-[85vh]">
            {/* Image */}
            <div className="w-full md:w-1/2 h-80 md:h-auto bg-gray-100 rounded-[25px] overflow-hidden">
              <img src={viewProduct.image} alt={viewProduct.name} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 flex flex-col overflow-y-auto">
              <div className="mb-auto">
                <span className="text-[10px] font-black text-tenant-primary uppercase tracking-widest bg-tenant-primary/10 px-3 py-1.5 rounded-full mb-6 inline-block">{viewProduct.category}</span>
                <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white mb-6 leading-none">{viewProduct.name}</h2>

                <div className="mb-10">
                  {subscriptionsActive ? (
                    <div>
                      <p className="text-sm text-gray-400 line-through font-bold">De R$ {viewProduct.price.toFixed(2)}</p>
                      <p className="text-5xl font-black text-tenant-primary tracking-tighter">R$ {(viewProduct.price * 0.8).toFixed(2)}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Preço para assinantes</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-5xl font-black text-tenant-primary tracking-tighter">R$ {viewProduct.price.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="mb-10">
                  <h3 className="text-xs font-black uppercase text-gray-900 dark:text-white mb-4 tracking-widest">Sobre o Produto</h3>
                  <p className="text-base leading-relaxed dark:text-gray-300">{viewProduct.description}</p>
                  <p className="mt-6 font-bold flex items-center gap-2 dark:text-gray-300">
                    <MapPin size={16} className="text-tenant-primary" />
                    Retirada em: <span className="text-tenant-primary">{shop.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => { addToCart(viewProduct); setViewProduct(null); }}
                  disabled={viewProduct.stock === 0}
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={<ShoppingBag size={16} strokeWidth={2.5} />}
                  className="!py-4"
                >
                  Adicionar ao Carrinho
                </Button>
                <Button
                  onClick={() => setViewProduct(null)}
                  variant="ghost"
                  fullWidth
                  className="!py-4"
                >
                  Continuar Navegando
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Shopping Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 dark:text-white">
                <ShoppingBag className="text-tenant-primary" size={28} /> Carrinho
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-tenant-primary transition-colors p-2">
                <X size={28} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <ShoppingCart size={80} className="mb-6 opacity-20" />
                  <p className="font-black uppercase text-xs tracking-widest">Sua sacola está vazia</p>
                </div>
              ) : (
                cart.map(item => {
                  const price = getActualPrice(item);
                  return (
                    <div key={item.id} className="flex gap-6 items-start">
                      <div className="w-24 h-24 rounded-[20px] overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1599351431247-f10b21ce9e13?q=80&w=2670&auto=format&fit=crop'} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431247-f10b21ce9e13?q=80&w=2670&auto=format&fit=crop';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black uppercase text-sm dark:text-white truncate">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 gap-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-tenant-primary transition-colors">
                              <Minus size={12} strokeWidth={3} />
                            </button>
                            <span className="font-black text-xs dark:text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-tenant-primary transition-colors">
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-gray-900 dark:text-white leading-none">R$ {(price * item.quantity).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black uppercase text-red-500 hover:underline mt-2 tracking-widest">
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Checkout Section */}
            {cart.length > 0 && (
              <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-6">
                {subscriptionsActive && !user?.planId && (
                  <div className="bg-tenant-primary/10 dark:bg-tenant-primary/5 p-4 rounded-[20px] flex gap-3 border border-tenant-primary/20">
                    <Lock size={18} className="text-tenant-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-tenant-primary dark:text-tenant-primary font-bold uppercase tracking-tight">Preço normal aplicado. Assine para descontos de VIP.</p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="font-black text-[10px] uppercase text-gray-400 tracking-[0.2em]">Pagamento na Unidade</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['CREDIT_CARD', 'PIX', 'DEBIT_CARD', 'CASH'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method as any)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-tenant-primary border-tenant-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-tenant-primary/30'}`}
                      >
                        {method === 'PIX' ? <QrCode size={14} /> : method === 'CASH' ? <Banknote size={14} /> : <CreditCard size={14} />}
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-gray-700 space-y-3">
                  {subscriptionsActive && cartSavings > 0 && (
                    <div className="flex justify-between items-center text-green-500 font-black text-[10px] uppercase tracking-widest">
                      <span>Economia:</span>
                      <span>- R$ {cartSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</span>
                    <span className="text-4xl font-black text-tenant-primary dark:text-tenant-primary tracking-tighter leading-none">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    variant="primary"
                    fullWidth
                    className="!py-5 mt-2"
                  >
                    {isProcessing ? 'Processando...' : 'Confirmar Compra'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showConfirmation && (
        <Modal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} size="sm">
          <div className="text-center py-4">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Check size={48} strokeWidth={4} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-4">Pedido Confirmado!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium leading-relaxed">
              Seus produtos estão separados. Dirijá-se ao caixa de <span className="font-black text-tenant-primary">{shop.name}</span> para pagamento e retirada.
            </p>
            <Button onClick={() => { setShowConfirmation(false); navigate('/dashboard'); }} variant="primary" fullWidth>
              Ver Meus Pedidos
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
