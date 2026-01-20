
import React, { useState } from 'react';
// Fix: Import useNavigate from react-router to resolve export errors in some environments
import { useNavigate } from 'react-router';
import { SERVICES, BARBERS, PRODUCTS, MOCK_TESTIMONIALS, UI_STYLE } from '../constants';
import { Star, Calendar, MapPin, ChevronDown, Scissors, ShoppingBag, MessageSquare, Search, X, Clock, Info, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { ShopSelector } from '../components/ShopSelector';
import { PlansSection } from '../components/PlansSection';
import { Service } from '../types';

export const Home: React.FC = () => {
  const { shop } = useShop();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const shopBarbers = BARBERS.filter(b => b.shopId === shop.id && b.active);
  const shopProducts = PRODUCTS.filter(p => p.shopId === shop.id && p.active).slice(0, 4);
  // Fix: Accessing settings.subscriptionEnabled directly as defined in Shop interface
  const subscriptionsActive = shop.settings.subscriptionEnabled;

  const filteredServices = SERVICES.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 3);

  const handleBook = (serviceId?: string) => {
    const state = serviceId ? { preSelectedServiceId: serviceId } : {};
    if (isAuthenticated) navigate('/book', { state });
    else navigate('/login', { state: { from: '/book', ...state } });
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="relative bg-gray-900 text-white h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>

        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center px-4">
            <button 
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl active:scale-95"
            >
                <MapPin size={18} className="text-amber-500" />
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[9px] font-black uppercase text-amber-500/80 mb-1">Unidade</span>
                    <span className="text-sm font-black uppercase tracking-tight">{shop.name}</span>
                </div>
                <ChevronDown size={16} className="text-gray-400 ml-2" />
            </button>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center w-full animate-fade-in">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 uppercase leading-none">
            Estilo &<br/><span className="text-amber-500">Tradição</span>
          </h1>
          <p className="text-base md:text-xl text-gray-300 max-w-xl mx-auto mb-12 font-medium">
            Excelência no atendimento para a unidade {shop.name}.
          </p>
          <button onClick={() => handleBook()} className={UI_STYLE.button.primary + " mx-auto"}>
            <Calendar size={20} /> Agendar Agora
          </button>
        </div>
      </section>

      {/* 2. Services Section (Destaques da Unidade) */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Serviços</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Destaques da Unidade</p>
            </div>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar serviço..." 
                    className={`${UI_STYLE.input} !pl-12 !rounded-[30px] border-amber-500/50 dark:border-amber-500/30`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {filteredServices.map(service => (
              <div key={service.id} className={`${UI_STYLE.card} p-8 flex flex-col group border-gray-100 dark:border-gray-700`}>
                <img src={service.image} className="w-full h-48 rounded-[30px] object-cover mb-6 cursor-pointer" onClick={() => setSelectedService(service)} />
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black uppercase dark:text-white leading-tight">{service.name}</h3>
                    <button onClick={() => setSelectedService(service)} className="text-amber-500"><Info size={20}/></button>
                </div>
                <p className="text-amber-500 font-black text-lg mb-6">R$ {service.price.toFixed(2)}</p>
                <button onClick={() => handleBook(service.id)} className={UI_STYLE.button.primary + " w-full"}>Agendar Agora</button>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => navigate('/services')} className="text-amber-500 font-black uppercase text-xs tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto">Ver Catálogo Completo <ChevronDown size={14}/></button>
          </div>
        </div>
      </section>

      {/* 3. Products Preview (Nossa Loja) */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-16">Nossa Loja</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
                  {shopProducts.map(product => (
                      <div key={product.id} className={`${UI_STYLE.card} group cursor-pointer flex flex-col hover:border-amber-500 transition-all`} onClick={() => navigate('/products')}>
                          <img src={product.image} className="w-full h-56 object-cover shadow-sm" />
                          <div className="p-6">
                            <h4 className="font-black uppercase text-sm dark:text-white mb-2">{product.name}</h4>
                            <p className="text-amber-500 font-black">R$ {product.price.toFixed(2)}</p>
                          </div>
                      </div>
                  ))}
              </div>
              <button onClick={() => navigate('/products')} className={UI_STYLE.button.outline + " mx-auto"}>Ver Loja</button>
          </div>
      </section>

      {/* 4. Testimonials (Avaliações) */}
      <section className="py-24 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="inline-block p-4 bg-amber-500/10 text-amber-500 rounded-2xl mb-8">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-16 dark:text-white text-center">O que dizem os clientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {MOCK_TESTIMONIALS.map(t => (
                      <div key={t.id} className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700">
                          <div className="flex justify-center gap-1 mb-6 text-amber-500">
                              {[...Array(t.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 font-medium italic mb-8 leading-relaxed">"{t.text}"</p>
                          <div className="flex items-center justify-center gap-4">
                              <img src={t.avatar} className="w-10 h-10 rounded-full" />
                              <span className="font-black uppercase text-[10px] tracking-widest dark:text-white">{t.name}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 5. Subscription (Assinatura) */}
      {subscriptionsActive && <PlansSection />}

      {/* 6. Team Section (Nossos Profissionais) */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Nossos Profissionais</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Expertise em cada detalhe</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {shopBarbers.map(barber => (
                    <div key={barber.id} onClick={() => navigate(`/barber/${barber.id}`)} className={`${UI_STYLE.card} group cursor-pointer flex flex-col md:flex-row items-center gap-8 p-10 hover:border-amber-500 border-gray-100 dark:border-gray-700 transition-all bg-white dark:bg-gray-800/40 shadow-xl`}>
                        <div className="relative shrink-0">
                            <img src={barber.avatar} className="w-48 h-48 rounded-[40px] object-cover shadow-2xl group-hover:scale-105 transition-transform" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg border border-white/10">
                                {barber.experience} Exp.
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-3xl font-black uppercase dark:text-white mb-2">{barber.name}</h4>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                                {barber.specialties.map(s => (
                                    <span key={s} className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-amber-500/20">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-base font-bold leading-relaxed line-clamp-2 mb-8">
                                {barber.description}
                            </p>
                            <button className={UI_STYLE.button.primary + " w-full md:w-auto !py-4"}>
                                Ver Perfil Profissional
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {showLocationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
              <ShopSelector onClose={() => setShowLocationModal(false)} />
          </div>
      )}

      {/* Modal de Detalhes do Serviço */}
      {selectedService && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md" onClick={() => setSelectedService(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl max-w-lg w-full overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedService(null)} className="absolute top-6 right-6 z-10 text-white bg-gray-900/50 p-2 rounded-full hover:bg-amber-500 transition-all shadow-lg"><X size={24}/></button>
                    <img src={selectedService.image} className="w-full h-64 object-cover" />
                    <div className="p-10">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-tight">{selectedService.name}</h2>
                            <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{selectedService.category}</div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">{selectedService.description}</p>
                        <div className="flex justify-between items-center mb-10 p-6 bg-gray-50 dark:bg-gray-900 rounded-[25px]">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duração</span>
                                <span className="text-lg font-black dark:text-white flex items-center gap-2"><Clock size={16} className="text-amber-500"/> {selectedService.duration} min</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Investimento</span>
                                <span className="text-2xl font-black text-amber-500">R$ {selectedService.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <button onClick={() => { handleBook(selectedService.id); setSelectedService(null); }} className={UI_STYLE.button.primary + " w-full"}>
                            Confirmar Reserva
                        </button>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};
