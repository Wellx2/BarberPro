
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useNotification } from '../context/NotificationContext';
import { Product, Invoice } from '../types';
import { PRODUCTS, PLANS, UI_STYLE } from '../constants';
import { ShoppingBag, X, Plus, Minus, ShoppingCart, Info, MapPin, Check, Lock, ChevronRight, CreditCard, Banknote, QrCode } from 'lucide-react';
// Fix: Import useNavigate from react-router to resolve export errors in some environments
import { useNavigate } from 'react-router';

interface CartItem extends Product {
  quantity: number;
}

export const Products: React.FC = () => {
  const { user } = useAuth();
  const { shop } = useShop();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // UX Toggle
  // Fix: Accessing settings.subscriptionEnabled directly as defined in Shop interface
  const subscriptionsActive = shop.settings.subscriptionEnabled;

  // Load all products then filter, or check local storage
  const [allProducts] = useState<Product[]>(() => {
      const stored = localStorage.getItem('products');
      return stored ? JSON.parse(stored) : PRODUCTS;
  });

  // Filter products specifically for the current shop
  const products = allProducts.filter(p => p.shopId === shop.id && p.active !== false);

  const [cart, setCart] = useState<CartItem[]>(() => {
      const stored = localStorage.getItem('cart_items');
      return stored ? JSON.parse(stored) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  
  // NEW: Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH'>('CREDIT_CARD');

  useEffect(() => {
      localStorage.setItem('cart_items', JSON.stringify(cart));
  }, [cart]);

  // --- LÓGICA DE PREÇO REAL NO CARRINHO ---
  const getActualPrice = (product: Product | CartItem) => {
      // Se o usuário tem plano ativo, aplica o desconto do plano (ou 20% padrão se não especificado)
      if (user?.planId && subscriptionsActive) {
          const plan = PLANS.find(p => p.id === user.planId && p.shopId === shop.id);
          const discount = plan?.discount || 20; 
          return product.price * (1 - discount / 100);
      }
      // Se não tem assinatura, paga o preço cheio
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
      if (viewProduct) setViewProduct(null); // Fecha o modal se estiver aberto
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

  const handleCheckout = () => {
      if (!user) {
          addNotification('info', 'Faça login para finalizar a compra.');
          navigate('/login', { state: { from: '/products' } });
          return;
      }

      setIsProcessing(true);
      setTimeout(() => {
          // Fix: Added pickupStatus to Invoice interface in types.ts
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
              pickupStatus: 'PENDING', // Now valid property
              items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: getActualPrice(i) })),
              paymentMethod: paymentMethod // SAVE SELECTED METHOD
          };

          const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
          localStorage.setItem('invoices', JSON.stringify([...storedInvoices, newInvoice]));

          // Baixa de estoque (globally saved but logic filters by ID)
          const updatedProducts = allProducts.map(p => {
              const item = cart.find(c => c.id === p.id);
              return item ? { ...p, stock: p.stock - item.quantity } : p;
          });
          localStorage.setItem('products', JSON.stringify(updatedProducts));

          setCart([]);
          setIsProcessing(false);
          setIsCartOpen(false);
          setShowConfirmation(true);
      }, 1500);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loja de Produtos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unidade para retirada: <span className="font-bold text-amber-600">{shop.name}</span></p>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-amber-100 dark:hover:bg-gray-600 transition-all">
                    <ShoppingBag className="text-gray-700 dark:text-gray-200" />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{cart.length}</span>}
                </button>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
            {subscriptionsActive && (!user || !user.planId) && (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl text-white mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 rounded-full"><Info size={24} /></div>
                        <div>
                            <h3 className="font-bold text-lg">Benefício de Assinante</h3>
                            <p className="text-gray-400 text-sm">Assine qualquer plano e ganhe até 40% de desconto imediato em todos os produtos.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/plans')} className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-amber-500 hover:text-white transition-all">Ver Planos</button>
                </div>
            )}

            {products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Loja Vazia</h3>
                    <p className="text-gray-500 dark:text-gray-400">Esta unidade ainda não cadastrou produtos para venda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(product => {
                        const visualDiscountPrice = subscriptionsActive ? product.price * 0.8 : product.price;

                        return (
                            <div key={product.id} className={`${UI_STYLE.card} flex flex-col group hover:shadow-xl transition-all border-gray-100 dark:border-gray-700`}>
                                <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => setViewProduct(product)}>
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    {product.stock === 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white uppercase tracking-widest">Esgotado</div>}
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">{product.category}</span>
                                    <h3 className="font-black text-gray-900 dark:text-white text-xl mb-3 cursor-pointer hover:text-amber-500 transition-colors uppercase leading-tight" onClick={() => setViewProduct(product)}>{product.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 font-medium">{product.description}</p>
                                    
                                    <div className="mt-auto flex items-end justify-between">
                                        <div onClick={() => setViewProduct(product)} className="cursor-pointer">
                                            {subscriptionsActive ? (
                                                <>
                                                    <p className="text-xs text-gray-400 line-through font-bold">R$ {product.price.toFixed(2)}</p>
                                                    <p className="text-2xl font-black text-amber-500">R$ {visualDiscountPrice.toFixed(2)}</p>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase mt-1">Preço exclusivo VIP</p>
                                                </>
                                            ) : (
                                                <p className="text-2xl font-black text-amber-500">R$ {product.price.toFixed(2)}</p>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock === 0}
                                            className="bg-gray-900 dark:bg-amber-500 text-white p-4 rounded-[20px] shadow-xl hover:scale-110 transition-transform disabled:opacity-50 disabled:grayscale"
                                            title="Adicionar ao Carrinho"
                                        >
                                            <Plus size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* MODAL DE DETALHES DO PRODUTO */}
        {viewProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl max-w-4xl w-full overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]">
                    <button 
                        onClick={() => setViewProduct(null)} 
                        className="absolute top-6 right-6 z-10 bg-black/20 text-white hover:bg-amber-500 p-3 rounded-full transition-colors shadow-lg"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full md:w-1/2 bg-gray-100 relative">
                        <img src={viewProduct.image} alt={viewProduct.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="w-full md:w-1/2 p-12 flex flex-col overflow-y-auto">
                        <div className="mb-auto">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full mb-6 inline-block">{viewProduct.category}</span>
                            <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white mb-6 leading-none">{viewProduct.name}</h2>
                            
                            <div className="flex items-center gap-4 mb-10">
                                {subscriptionsActive ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-400 line-through font-bold">De R$ {viewProduct.price.toFixed(2)}</p>
                                            <p className="text-5xl font-black text-amber-500 tracking-tighter">R$ {(viewProduct.price * 0.8).toFixed(2)}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Preço para assinantes</p>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <p className="text-5xl font-black text-amber-500 tracking-tighter">R$ {viewProduct.price.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-sm text-gray-600 dark:text-gray-300 mb-12">
                                <h3 className="text-xs font-black uppercase text-gray-900 dark:text-white mb-4 tracking-widest">Sobre o Produto</h3>
                                <p className="text-base leading-relaxed">{viewProduct.description}</p>
                                <p className="mt-6 font-bold flex items-center gap-2">
                                    <MapPin size={16} className="text-amber-500" />
                                    Disponível para retirada em: <span className="text-amber-500">{shop.name}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
                            <button 
                                onClick={() => addToCart(viewProduct)}
                                disabled={viewProduct.stock === 0}
                                className={UI_STYLE.button.primary + " w-full !py-6 !text-sm"}
                            >
                                <ShoppingCart size={22} />
                                Adicionar ao Carrinho
                            </button>
                            <button 
                                onClick={() => setViewProduct(null)}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-500 transition-colors"
                            >
                                Continuar Navegando
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SIDEBAR CARRINHO */}
        {isCartOpen && (
            <div className="fixed inset-0 z-[60] flex justify-end">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
                <div className="relative w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 dark:text-white"><ShoppingBag className="text-amber-500" size={28} /> Carrinho</h2>
                        <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-amber-500 transition-colors"><X size={32} /></button>
                    </div>

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
                                    <div key={item.id} className="flex gap-6 items-center">
                                        <div className="w-24 h-24 rounded-[25px] overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0">
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black uppercase text-sm dark:text-white truncate">{item.name}</h4>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 gap-4">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-amber-500 transition-colors"><Minus size={14} strokeWidth={3}/></button>
                                                    <span className="font-black text-sm dark:text-white">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-amber-500 transition-colors"><Plus size={14} strokeWidth={3}/></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-gray-900 dark:text-white leading-none">R$ {(price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black uppercase text-red-500 hover:underline mt-2 tracking-widest">Remover</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-6">
                            {subscriptionsActive && !user?.planId && (
                                <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-[20px] flex gap-3 border border-amber-500/20">
                                    <Lock size={20} className="text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-800 dark:text-amber-500 font-bold uppercase tracking-tight">Preço normal aplicado. Assine para ter descontos exclusivos de VIP.</p>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <p className="font-black text-[10px] uppercase text-gray-400 tracking-[0.2em]">Forma de Pagamento na Unidade</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['CREDIT_CARD', 'PIX', 'DEBIT_CARD', 'CASH'].map((method) => (
                                        <button 
                                            key={method}
                                            onClick={() => setPaymentMethod(method as any)}
                                            className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-amber-500/30'}`}
                                        >
                                            {method === 'PIX' ? <QrCode size={14} /> : method === 'CASH' ? <Banknote size={14} /> : <CreditCard size={14} />}
                                            {method.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t dark:border-gray-700 space-y-2">
                                {subscriptionsActive && cartSavings > 0 && (
                                    <div className="flex justify-between items-center text-green-500 font-black text-[10px] uppercase tracking-widest">
                                        <span>Economia de Assinante:</span>
                                        <span>- R$ {cartSavings.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total do Pedido</span>
                                    <span className="text-4xl font-black text-gray-900 dark:text-amber-500 tracking-tighter leading-none">R$ {cartTotal.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className={UI_STYLE.button.primary + " w-full !py-6"}
                                >
                                    {isProcessing ? 'Validando Pedido...' : 'Confirmar Reserva'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* CONFIRMAÇÃO MODAL */}
        {showConfirmation && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-[60px] p-12 max-w-sm w-full text-center shadow-2xl">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Check size={48} strokeWidth={4} />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-4">Pedido Reservado!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm font-medium leading-relaxed">
                        Seus produtos estão separados. Dirija-se ao caixa da unidade <span className="font-black text-amber-500 uppercase">{shop.name}</span> para realizar o pagamento e retirar seu kit.
                    </p>
                    <button onClick={() => { setShowConfirmation(false); navigate('/dashboard'); }} className={UI_STYLE.button.primary + " w-full"}>Ver Meus Pedidos</button>
                </div>
            </div>
        )}
    </div>
  );
};
