import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Star, Calendar, MapPin, ChevronDown, MessageSquare, Scissors, Award, ArrowRight, Instagram } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { ShopSelector } from '../components/ShopSelector';
import { PlansSection } from '../components/PlansSection';
import { SectionHeader } from '../components/SectionHeader';
import { ServiceGrid } from '../components/ServiceGrid';
import { ProductGrid } from '../components/ProductGrid';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Container } from '../components/layout/Container';
import { Grid } from '../components/layout/Grid';
import { Button, Card } from '../components/ui';
import { barbershopService } from '../services/barbershopService';
import { LocationMap } from '../components/LocationMap';
import { ContactSection } from '../components/ContactSection';
import { QuickReschedule } from '../components/QuickReschedule';
import { api } from '../services/api';
import { Service, Product, Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';
import { Wifi, Car, Accessibility, Coffee, Tv, Gamepad, Wine, Fan } from 'lucide-react'; // Import icons for amenities

export const Home: React.FC = () => {
  const { shop, fetchError, retryFetch } = useShop();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const lastLoadedShopId = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    // ✅ PROTEÇÃO 1: Se ShopContext tem erro, não tentar carregar nada
    if (fetchError) {
      setLoading(false);
      return;
    }

    // ✅ PROTEÇÃO 2: Aguardar shop.id válido
    if (!shop.id || shop.id.startsWith('shop-')) {
      setLoading(false);
      return;
    }

    // ✅ PROTEÇÃO 3: Evitar recarregar para o mesmo shop SE jáá tem dados
    if (lastLoadedShopId.current === shop.id && services.length > 0) {
      return;
    }

    lastLoadedShopId.current = shop.id;
    setReviews([]); // Limpar reviews ao trocar de shop

    const loadPreview = async () => {
      // ✅ PROTEÇÃO 4: Cancelar requisições anteriores
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);

      try {
        // Buscar preview com top 3 de cada categoria (endpoint público)
        const preview = await barbershopService.getPreview(shop.id);
        // ✅ PROTEÇÃO 5: Verificar se foi abortado
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setServices(preview.services || []);
        setProducts(preview.products || []);
        setBarbers(preview.barbers || []);
        setReviews(preview.reviews || []);
      } catch (error) {
        console.error('❌ Home: Erro ao carregar preview:', error);
        setServices([]);
        setProducts([]);
        setBarbers([]);
        setReviews([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    };

    loadPreview();

    // ✅ Cleanup: Abortar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [shop.id, fetchError, isAuthenticated, user]);

  const modulesEnabled = shop.settings.modulesEnabled || {
    clientPlans: true,
    products: true,
    reviews: true,
    cashier: true,
    financial: true,
    reports: true
  };
  const subscriptionsActive = modulesEnabled.clientPlans !== false;
  const showProducts = modulesEnabled.products !== false;
  const showReviews = modulesEnabled.reviews !== false;
  const showBarbers = shop.settings.showBarbers !== false;

  const heroTitleRaw = shop.heroSettings?.title || 'Estilo & Tradição';
  const heroSubtitleRaw = shop.heroSettings?.subtitle || `Excelência no atendimento para a unidade ${shop.name}.`;
  const [heroTitleFirst, heroTitleSecond] = heroTitleRaw?.includes('&') ? heroTitleRaw.split('&') : [heroTitleRaw, null];
  const heroBackgroundImage = shop.heroSettings?.backgroundImage || shop.bannerUrl || shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80';

  const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const shopSlug = shop.slug || slugify(shop.name);

  // Função auxiliar para verificar login antes de navegar
  const navigateWithAuth = (path: string) => {
    const fullPath = path.startsWith('/') ? `/${shopSlug}${path}` : `/${shopSlug}/${path}`;
    if (isAuthenticated) {
      navigate(fullPath);
    } else {
      navigate('/login', { state: { from: fullPath } });
    }
  };

  const handleBook = (serviceId?: string) => {
    const state = serviceId ? { preSelectedServiceId: serviceId } : {};
    const path = `/${shopSlug}/agendar`;
    if (isAuthenticated) navigate(path, { state });
    else navigate('/login', { state: { from: path, ...state } });
  };

  // Helper to map amenity strings to icons and labels
  const getAmenityInfo = (amenity: string) => {
    const map: Record<string, { icon: React.ReactNode; label: string }> = {
      wifi: { icon: <Wifi size={24} />, label: 'Wi-Fi' },
      parking: { icon: <Car size={24} />, label: 'Estacionamento' },
      accessibility: { icon: <Accessibility size={24} />, label: 'Acessibilidade' },
      coffee: { icon: <Coffee size={24} />, label: 'Café Cortesia' },
      tv: { icon: <Tv size={24} />, label: 'TV' },
      games: { icon: <Gamepad size={24} />, label: 'Video Game' },
      bar: { icon: <Wine size={24} />, label: 'Bar/Bebidas' },
      ac: { icon: <Fan size={24} />, label: 'Ar Condicionado' }
    };
    return map[amenity.toLowerCase()] || { icon: <Star size={24} />, label: amenity };
  };

  // Removing invasive fetchError block. Handled by Layout banner and Skeletons nãow.

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* 1. Hero Section */}
      <section className="relative bg-gray-900 text-white h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBackgroundImage}
            alt={shop.name}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>

        <button
          onClick={() => setShowLocationModal(true)}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-[20px] bg-gray-800/80 backdrop-blur-xl border border-gray-700/60 text-white hover:bg-gray-700/80 transition-all shadow-2xl group"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <MapPin size={18} className="text-tenant-primary shrink-0" />
            <div className="hidden md:flex flex-col items-start gap-0.5">
              <span className="text-[10px] font-black uppercase text-[#f59e0b] text-tenant-primary tracking-widest">Unidade Selecionada</span>
              <span className="text-base font-black uppercase tracking-tight text-white">{shop.name}</span>
            </div>
            <span className="md:hidden text-sm font-black uppercase tracking-tight text-white">{shop.name}</span>
          </div>
          <ChevronDown size={18} className="text-gray-400 group-hover:text-tenant-primary transition-colors ml-0 md:ml-2 shrink-0" />
        </button>

        <div className="relative max-w-7xl mx-auto px-4 text-center w-full animate-fade-in">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 uppercase leading-none">
            {heroTitleSecond !== null ? (
              <>
                {heroTitleFirst.trim()} &<br /><span className="text-tenant-primary">{heroTitleSecond.trim()}</span>
              </>
            ) : (
              heroTitleFirst
            )}
          </h1>
          <p className="text-base md:text-xl text-gray-300 max-w-xl mx-auto mb-12 font-medium">
            {heroSubtitleRaw}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <PrimaryButton onClick={() => handleBook()} className="w-full sm:w-auto">
              Agendar Agora
            </PrimaryButton>

            <QuickReschedule shopId={shop.id} />
          </div>

          {/* Social Links (Marketing) */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {shop.socialInstagram && (
              <a 
                href={`https://instagram.com/${shop.socialInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold text-sm hover:bg-white/20 transition-all hover:scale-105"
              >
                <Instagram size={20} className="text-pink-500" />
                Nosso Instagram
              </a>
            )}
            {shop.socialGoogleReview && (
              <a 
                href={shop.socialGoogleReview}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold text-sm hover:bg-white/20 transition-all hover:scale-105"
              >
                <Star size={20} className="text-yellow-400" fill="currentColor" />
                Avaliações Google
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 1.5 Amenities Section */}
      {shop.amenities && shop.amenities.length > 0 && (
        <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <Container size="xl">
            <div className="mb-8 pl-4 lg:pl-0">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Comodidades</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Conforto para o seu atendimento</p>
            </div>

            <div className="flex flex-wrap gap-4 scrollbar-hide">
              {shop.amenities.map((amenity, index) => {
                const info = getAmenityInfo(amenity);
                return (
                  <div key={index} className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 min-w-[120px] transition-transform hover:-translate-y-1">
                    <div className="text-gray-700 dark:text-gray-300 mb-2">
                      {info.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight text-center">
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* 2. Services Section (Destaques da Unidade) */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <Container size="xl">
          <SectionHeader
            title="Nossos Serviços"
            subtitle="Destaques da Unidade"
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando preview...</p>
            </div>
          ) : services.length > 0 ? (
            <>
              <ServiceGrid
                services={services}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                showSearch={true}
                maxItems={3}
              />

              <div className="text-center mt-16">
                <button
                  onClick={() => navigateWithAuth('/servicos')}
                  className="inline-flex items-center gap-2 text-tenant-primary hover:opacity-80 font-bold uppercase text-sm tracking-wider transition-colors group"
                >
                  Ver Catálogo Completo
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Nenhum serviço disponível não momento.</p>
            </div>
          )}
        </Container>
      </section>

      {/* 3. Products Preview (Nossa Loja) */}
      {showProducts && (
        <section className="py-24 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
          <Container size="xl">
            <SectionHeader title="Nossa Loja" />

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando preview...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <ProductGrid
                  products={products}
                  subscriptionsActive={subscriptionsActive}
                  userHasPlan={!!user?.planId}
                  onAddToCart={() => navigate(`/${shopSlug}/produtos`)}
                  onViewDetails={() => navigate(`/${shopSlug}/produtos`)}
                  maxItems={3}
                />
                <div className="text-center mt-12">
                  <button
                    onClick={() => navigateWithAuth('/produtos')}
                    className="inline-flex items-center gap-2 text-tenant-primary hover:opacity-80 font-bold uppercase text-sm tracking-wider transition-colors group"
                  >
                    Ver Loja
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Nenhum produto disponível não momento.</p>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* 4. Team Section (Nossos Profissionais) */}
      {showBarbers && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <Container size="xl">
            <SectionHeader
              title="Nossos Profissionais"
              subtitle="Expertise em cada detalhe"
            />
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando profissionais...</p>
              </div>
            ) : barbers.length > 0 ? (
              <>
                <Grid
                  cols={barbers.length === 1 ? 1 : 2}
                  gap="lg"
                  className={barbers.length === 1 ? 'max-w-3xl mx-auto' : ''}
                >
                  {barbers.map(barber => (
                    <Card key={barber.id} hover className="flex flex-col md:flex-row overflow-hidden !p-0">
                      <div
                        className="relative w-full md:w-48 h-64 md:h-full flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/barber/${barber.id}`)}
                      >
                        <img
                          src={barber.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(barber.name) + '&background=f59e0b&color=fff&size=512'}
                          alt={barber.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-tenant-primary text-white px-3 py-1 rounded-full text-xs font-black">
                          {barber.role === 'BARBER' ? 'BARBEIRO' : barber.role === 'HAIRDRESSER' ? 'CABELEIREIRO' : 'PROFISSIONAL'}
                        </div>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-2xl font-black uppercase dark:text-white cursor-pointer hover:text-tenant-primary transition-colors" onClick={() => navigate(`/barber/${barber.id}`)}>
                            {barber.name}
                          </h3>
                        </div>
                        {barber.nickname && (
                          <p className="text-sm text-tenant-primary font-bold mb-2">({barber.nickname})</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic line-clamp-2">
                          {barber.description || 'Profissional experiente dedicado à excelência não atendimento.'}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {barber.specialties?.map((spec: string, idx: number) => (
                            <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-6 mb-6">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-tenant-primary" fill="currentColor" />
                            <span className="font-bold dark:text-white">{barber.rating?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleBook()}
                            className="flex-1 gap-2"
                            icon={<Calendar size={16} />}
                          >
                            Agendar
                          </Button>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => navigate(`/barber/${barber.id}`)}
                            className="px-4"
                          >
                            Perfil
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Grid>

                <div className="text-center mt-12">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {isAuthenticated
                      ? 'Conheça todos os nossos profissionais'
                      : 'Conheça todos os nossos profissionais'}
                  </p>
                  <button
                    onClick={() => navigateWithAuth('/servicos')}
                    className="inline-flex items-center gap-2 text-tenant-primary hover:opacity-80 dark:text-tenant-primary dark:hover:opacity-90 font-bold text-sm transition-colors"
                  >
                    {isAuthenticated ? 'Ver Todos os Profissionais' : 'Ver Todos os Profissionais'}
                    <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Nenhum profissional disponível não momento.</p>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* 5. Testimonials (Avaliações) */}
      {showReviews && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <Container size="xl">
            <SectionHeader
              title="O que dizem os clientes"
              icon={<MessageSquare size={32} />}
            />
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-tenant-primary border-t-transparent"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                {reviews.map((review: any) => (
                  <div key={review.id} className="bg-white dark:bg-gray-800 rounded-[35px] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 relative flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-300">
                    <div className="absolute top-8 right-8 text-gray-200 dark:text-gray-700 pointer-events-none">
                      <MessageSquare size={48} className="rotate-12 opacity-50" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            className={i < review.rating ? 'text-tenant-primary fill-tenant-primary' : 'text-gray-200 dark:text-gray-600'}
                          />
                        ))}
                      </div>

                      {review.comment && (
                        <p className="text-gray-700 dark:text-gray-300 font-medium leading-loose mb-8 relative z-10 text-lg">
                          "{review.comment}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-[18px] bg-tenant-primary/10 flex items-center justify-center text-tenant-primary font-black text-lg">
                        {(review.client?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none mb-1">
                          {review.client?.name || 'Cliente da Loja'}
                        </p>
                        {review.barber && (
                          <p className="text-[10px] font-bold text-tenant-primary uppercase tracking-widest">
                            Atendido por {review.barber?.name?.split(' ')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Ainda não há avaliações disponíveis.</p>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* 6. Subscription (Assinatura) */}
      {subscriptionsActive && <PlansSection />}

      {/* 7. Location Map */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <Container size="xl">
          <LocationMap shop={shop} />
        </Container>
      </section>

      {/* 8. Contact Section */}
      <ContactSection 
        whatsapp={shop.socialWhatsapp || shop.whatsapp} 
        email={shop.email} 
        phone={shop.phone}
        instagram={shop.socialInstagram}
        googleReview={shop.socialGoogleReview}
      />

      {showLocationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
          <ShopSelector onClose={() => setShowLocationModal(false)} />
        </div>
      )}
    </div>
  );
};
