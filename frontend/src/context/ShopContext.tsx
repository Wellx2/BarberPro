
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Shop } from '../types';
import { barbershopService, Barbershop } from '../services/barbershopService';
import { useAuth } from './AuthContext';

interface ShopContextType {
  shops: Shop[];
  shop: Shop; // Currently selected shop
  setShop: (shop: Shop) => void;
  switchShop: (shopId: string) => Promise<void>; // ← Nova função
  updateShopSettings: (settings: Shop) => void;
  createShop: (newShop: Shop) => void;
  generateTimeSlots: () => string[];
  calculateDistance: (shopLat: number, shopLng: number) => Promise<string | null>;
  isLoadingShops: boolean;
  fetchError: string | null;
  retryFetch: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

/**
 * Converte Barbershop do backend para Shop do frontend
 */
const convertBarbershopToShop = (barbershop: Barbershop): Shop => {
  return {
    id: barbershop.id,
    name: barbershop.name,
    address: barbershop.address,
    phone: barbershop.phone,
    image: barbershop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
    openingTime: '09:00', // Backend pode não ter isso, usar padrão 
    closingTime: '20:00',
    intervalMinutes: 30,
    loyaltyEnabled: false,
    loyaltyProgramTarget: 10,
    coordinates: barbershop.latitude && barbershop.longitude
      ? { lat: barbershop.latitude, lng: barbershop.longitude }
      : { lat: 0, lng: 0 },
    logoUrl: barbershop.logoUrl,
    bannerUrl: barbershop.bannerUrl,
    primaryColor: barbershop.primaryColor,
    settings: {
      showBarbers: true,
      subscriptionEnabled: barbershop.settings?.subscriptionEnabled ?? true, // ✅ Default true para mostrar planos
      allowPayOnLocation: true,
      modulesEnabled: {
        clientPlans: barbershop.settings?.modulesEnabled?.clientPlans ?? barbershop.settings?.subscriptionEnabled ?? true,
        products: barbershop.settings?.modulesEnabled?.products ?? true,
        reviews: barbershop.settings?.modulesEnabled?.reviews ?? true,
        cashier: barbershop.settings?.modulesEnabled?.cashier ?? true,
        financial: barbershop.settings?.modulesEnabled?.financial ?? true,
        reports: barbershop.settings?.modulesEnabled?.reports ?? true
      }
    }
  };
};

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // ← Observar mudanças não usuário autenticado
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetchedShops = useRef(false);
  const fetchFailedPermanently = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSyncedUserId = useRef<string | null>(null);
  const hasSwappedMockShop = useRef(false);

  // Load shops (priorizar localStorage, mas fetch backend SEMPRE)
  const [shops, setShops] = useState<Shop[]>(() => {
    const stored = localStorage.getItem('shops');

    if (stored) {
      try {
        const parsedShops = JSON.parse(stored);

        // Verificar se são dados reais do backend (tem UUIDs, não 'shop-1')
        const hasRealData = parsedShops.length > 0 &&
          parsedShops[0].id.length > 10 &&
          !parsedShops[0].id.startsWith('shop-');


        if (hasRealData) {
          return parsedShops;
        }
      } catch (e) {
        console.error('❌ ShopContext: Erro ao parsear cache:', e);
      }
    }

    return [];
  });

  /**
   * Função central de fetch de barbearias (reutilizável)
   */
  const performFetch = async () => {

    // Criar novo AbortController apenas se não existir
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    setIsLoadingShops(true);
    setFetchError(null);

    try {
      const barbershops = await barbershopService.listPublic();


      if (!barbershops || barbershops.length === 0) {
        console.error('❌ ShopContext: Nenhuma barbearia retornada');
        setFetchError('Nenhuma barbearia encontrada não backend');
        fetchFailedPermanently.current = true;
        setIsLoadingShops(false);
        return;
      }

      const convertedShops = barbershops.map(convertBarbershopToShop);


      setShops(convertedShops);
      localStorage.setItem('shops', JSON.stringify(convertedShops));
      setFetchError(null);

    } catch (error: any) {
      // Ignorar erros de abort (são intencionais)
      if (error.name === 'AbortError') {
        return;
      }

      // Determinar mensagem de erro específica
      let errorMsg = 'Erro ao buscar barbearias';

      if (error.statusCode === 0 || error.message === 'Failed to fetch') {
        errorMsg = 'Backend não está acessível';
      } else if (error.statusCode === 429) {
        errorMsg = 'Muitas requisições. Aguarde alguns segundos';
      } else if (error.statusCode === 404) {
        errorMsg = 'Endpoint /barbershops/public não encontrado';
      } else if (error.message) {
        errorMsg = error.message;
      }

      setFetchError(errorMsg);
      fetchFailedPermanently.current = true;
    } finally {
      setIsLoadingShops(false);
      abortControllerRef.current = null;
    }
  };

  // Buscar barbearias do backend sempre na montagem (cache pode estar desatualizado)
  useEffect(() => {

    // PROTEÇÃO: Se já falhou permanentemente, NÃO tentar novamente
    if (fetchFailedPermanently.current) {
      return;
    }

    // PROTEÇÃO: Verificar se já tentou buscar (não resetar para evitar loop)
    if (hasFetchedShops.current) {
      return;
    }

    // Marcar IMEDIATAMENTE para prevenir duplicatas
    hasFetchedShops.current = true;

    // Executar fetch (sempre busca do backend para garantir IDs atualizados)
    performFetch();

    // Cleanup: Abortar requisição APENAS ao desmontar componente
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // ? Array vazio - executa APENAS uma vez na montagem

  // Load selected shop (vazio inicialmente, backend vai preencher)
  const [shop, setShop] = useState<Shop>(() => {

    // 1. Check if user is logged in and has a shopId (from backend)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.shopId) {
          const stored = localStorage.getItem('shops');
          if (stored) {
            const storedShops = JSON.parse(stored);
            const userShop = storedShops.find((s: Shop) => s.id === user.shopId);

            if (userShop && !userShop.id.startsWith('shop-')) {
              return userShop;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ ShopContext: Erro ao buscar shop do usuário:', error);
    }

    // 2. Check Subdomain (Deep Linking) - paulista.barberpro.com
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    // Slugify function para comparar subdomínios 
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const stored = localStorage.getItem('shops');
    if (stored) {
      try {
        const storedShops = JSON.parse(stored);

        if (subdomain !== 'localhost' && subdomain !== 'www') {
          const foundFromSubdomain = storedShops.find((s: Shop) => slugify(s.name) === subdomain);
          if (foundFromSubdomain && !foundFromSubdomain.id.startsWith('shop-')) {
            return foundFromSubdomain;
          }
        }

        // 3. Check URL Parameters (Deep Linking - ?shopId=xxx)
        const params = new URLSearchParams(window.location.search);
        const urlShopId = params.get('shopId');

        if (urlShopId) {
          const foundFromUrl = storedShops.find((s: Shop) => s.id === urlShopId);
          if (foundFromUrl && !foundFromUrl.id.startsWith('shop-')) {
            return foundFromUrl;
          }
        }

        // 4. Check Local Storage
        const storedId = localStorage.getItem('selected_shop_id');
        const found = storedShops.find((s: Shop) => s.id === storedId);
        if (found && !found.id.startsWith('shop-')) {
          return found;
        }

        // Retornar primeira barbearia válida do cache
        const firstValid = storedShops.find((s: Shop) => !s.id.startsWith('shop-'));
        if (firstValid) {
          return firstValid;
        }
      } catch (e) {
        // Ignorar erro
      }
    }

    // Retornar objeto vazio temporário (backend vai preencher)
    return {
      id: '',
      name: 'Carregando...',
      address: '',
      phone: '',
      image: '',
      openingTime: '09:00',
      closingTime: '20:00',
      intervalMinutes: 30,
      loyaltyEnabled: false,
      loyaltyProgramTarget: 10,
      coordinates: { lat: 0, lng: 0 },
      settings: {
        showBarbers: true,
        subscriptionEnabled: false,
        allowPayOnLocation: true,
        modulesEnabled: {
          clientPlans: false,
          products: false,
          reviews: false,
          cashier: false,
          financial: false,
          reports: false
        }
      }
    };
  });

  // ? useEffect para definir shop quando shops é carregado ou atualizado do backend
  useEffect(() => {
    // Se shops ainda está vazio, aguardar
    if (shops.length === 0) {
      return;
    }

    // ? Verificar se o shop atual EXISTE na nova lista (IDs podem ter mudado no banco)
    const shopExistsInList = shop.id && shops.some(s => s.id === shop.id);

    if (shopExistsInList) {
      // Shop ainda válido - atualizar com dados frescos do backend
      const freshShop = shops.find(s => s.id === shop.id);
      if (freshShop && JSON.stringify(freshShop) !== JSON.stringify(shop)) {
        setShop(freshShop);
      }
      return;
    }

    // Shop inválido (ID não existe não banco) - tentar recuperar seleção anterior por ID salvo
    const storedId = localStorage.getItem('selected_shop_id');
    const savedShop = storedId ? shops.find(s => s.id === storedId) : null;
    const shopToSet = savedShop || shops[0];

    setShop(shopToSet);
    localStorage.setItem('selected_shop_id', shopToSet.id);
  }, [shops, shop.id]); // ? Executa quando shops ou shop.id mudar

  // Sincronizar shopId quando usuário faz login
  useEffect(() => {
    // Se não há usuário autenticado, não faz nada
    if (!user || !user.shopId) {
      lastSyncedUserId.current = null;
      return;
    }

    // Se já sincronizou este usuário, não faz nada
    if (lastSyncedUserId.current === user.id) {
      return;
    }

    // Marcar como processado IMEDIATAMENTE para evitar reprocessamento
    lastSyncedUserId.current = user.id;

    // Buscar a barbearia não localStorage primeiro
    const storedShops = localStorage.getItem('shops');
    if (storedShops) {
      try {
        const parsedShops = JSON.parse(storedShops);
        const userShop = parsedShops.find((s: Shop) => s.id === user.shopId);

        if (userShop) {
          setShop(userShop);
          return;
        }
      } catch (e) {
        console.error('Erro ao parsear shops:', e);
      }
    }

    // Buscar do backend se não encontrou localmente
    barbershopService.getById(user.shopId)
      .then(barbershop => {
        const convertedShop = convertBarbershopToShop(barbershop);
        setShop(convertedShop);
      })
      .catch(error => {
        console.error('Erro ao buscar barbearia:', error);
      });
  }, [user?.id, user?.shopId]); // Dependências específicas apenas

  // Garantir que shop seja definido quando shops carregar (caso esteja vazio/placeholder)
  useEffect(() => {
    if (shops.length > 0 && (!shop.id || shop.id === '' || shop.name === 'Carregando...')) {
      const storedId = localStorage.getItem('selected_shop_id');
      const savedShop = storedId ? shops.find(s => s.id === storedId) : null;
      const shopToSet = savedShop || shops[0];
      setShop(shopToSet);
      localStorage.setItem('selected_shop_id', shopToSet.id);
    }
  }, [shops]);

  // Salvar shop selecionado não localStorage e atualizar título
  useEffect(() => {
    if (shop.id && !shop.id.startsWith('shop-')) {
      localStorage.setItem('selected_shop_id', shop.id);
      document.title = `${shop.name} - Sistema de Agendamento`;
    }
  }, [shop.id, shop.name]);

  useEffect(() => {
    const raw = shop.primaryColor;
    const color = raw && /^#[0-9A-Fa-f]{3,6}$/.test(raw) ? raw : '#f59e0b'; // amber-500 padrão
    document.documentElement.style.setProperty('--tenant-primary', color);
    // Versão translúcida para hover/glassmorphism
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--tenant-primary-rgb', `${r},${g},${b}`);
  }, [shop.primaryColor, shop.id]);

  const updateShopSettings = (updatedShop: Shop) => {
    setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
    if (shop.id === updatedShop.id) {
      setShop(updatedShop);
    }
  };

  const createShop = (newShop: Shop) => {
    setShops(prev => [...prev, newShop]);
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [startHour, startMinute] = shop.openingTime.split(':').map(Number);
    const [endHour, endMinute] = shop.closingTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    while (current < end) {
      const timeString = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + shop.intervalMinutes);
    }

    return slots;
  };

  // Helper to calculate distance in km
  const calculateDistance = async (shopLat: number, shopLng: number): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          const R = 6371; // Radius of the earth in km
          const dLat = deg2rad(shopLat - userLat);
          const dLng = deg2rad(shopLng - userLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(shopLat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
            ;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c; // Distance in km
          resolve(d.toFixed(1));
        },
        () => resolve(null) // Error or denied
      );
    });
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  /**
   * Troca de barbearia (multitenant)
   * Atualiza tokens e dispara evento para recarregar dados
   */
  const switchShop = async (shopId: string): Promise<void> => {
    if (shopId === shop.id) return; // Já está na loja selecionada

    try {
      // 1. Chamar backend para trocar de loja
      const response = await barbershopService.switch(shopId);

      // 2. Atualizar tokens não localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // 3. Atualizar shop atual
      const newShop = shops.find(s => s.id === shopId);
      if (newShop) {
        setShop(newShop);
      }

      // 4. Disparar evento para componentes recarregarem dados
      window.dispatchEvent(new CustomEvent('shop-changed', {
        detail: {
          oldShopId: shop.id,
          newShopId: shopId,
          shop: response.shop
        }
      }));
    } catch (error) {
      console.error('Erro ao trocar de barbearia:', error);
      throw error;
    }
  };

  /**
   * Tentar buscar barbearias novamente (após erro)
   */
  const retryFetch = () => {
    // Reset flags para permitir nova tentativa
    hasFetchedShops.current = false;
    fetchFailedPermanently.current = false;
    setFetchError(null);

    // Executar fetch novamente
    performFetch();
  };

  return (
    <ShopContext.Provider value={{
      shops,
      shop,
      setShop,
      switchShop,
      updateShopSettings,
      createShop,
      generateTimeSlots,
      calculateDistance,
      isLoadingShops,
      fetchError,
      retryFetch
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
