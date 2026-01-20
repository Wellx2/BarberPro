
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shop } from '../types';
import { MOCK_SHOPS } from '../constants';

interface ShopContextType {
  shops: Shop[];
  shop: Shop; // Currently selected shop
  setShop: (shop: Shop) => void;
  updateShopSettings: (settings: Shop) => void;
  createShop: (newShop: Shop) => void;
  generateTimeSlots: () => string[];
  calculateDistance: (shopLat: number, shopLng: number) => Promise<string | null>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load ALL shops
  const [shops, setShops] = useState<Shop[]>(() => {
    const stored = localStorage.getItem('shops');
    return stored ? JSON.parse(stored) : MOCK_SHOPS;
  });

  // Load selected shop ID, checking URL params first, then localStorage, then default
  const [shop, setShop] = useState<Shop>(() => {
    // 1. Check URL Parameters (Deep Linking)
    const params = new URLSearchParams(window.location.search);
    const urlShopId = params.get('shopId');
    
    if (urlShopId) {
        const foundFromUrl = shops.find(s => s.id === urlShopId);
        if (foundFromUrl) return foundFromUrl;
    }

    // 2. Check Local Storage
    const storedId = localStorage.getItem('selected_shop_id');
    const found = shops.find(s => s.id === storedId);
    return found || shops[0];
  });

  useEffect(() => {
    localStorage.setItem('shops', JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem('selected_shop_id', shop.id);
    document.title = `${shop.name} - Sistema de Agendamento`;
    
    // Update URL without reloading to reflect current shop (optional, nice for sharing)
    // const params = new URLSearchParams(window.location.search);
    // if (params.get('shopId') !== shop.id) {
    //    const newUrl = window.location.pathname + '?shopId=' + shop.id;
    //    window.history.replaceState({}, '', newUrl);
    // }
  }, [shop]);

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
                      Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(shopLat)) * 
                      Math.sin(dLng/2) * Math.sin(dLng/2)
                      ; 
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                  const d = R * c; // Distance in km
                  resolve(d.toFixed(1));
              },
              () => resolve(null) // Error or denied
          );
      });
  };

  const deg2rad = (deg: number) => {
      return deg * (Math.PI/180);
  };

  return (
    <ShopContext.Provider value={{ shops, shop, setShop, updateShopSettings, createShop, generateTimeSlots, calculateDistance }}>
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
