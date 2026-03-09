import { useState, useCallback, useEffect } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<GeoLocation | null>(() => {
    try {
      const stored = localStorage.getItem('user_geolocation');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoLocation: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        
        setLocation(geoLocation);
        localStorage.setItem('user_geolocation', JSON.stringify(geoLocation));
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Erro ao obter localização';
        
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Permissão de localização negada. Ative no navegador.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Localização indisponível';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Timeout ao obter localização';
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache de 5 minutos
      }
    );
  }, []);

  return { location, loading, error, requestLocation };
};

/**
 * Calcula distância entre duas coordenadas usando Haversine
 * Retorna distância em km
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Encontra unidades próximas à localização do usuário
 */
export const findNearbyShops = (
  shops: Array<{ id: string; name: string; coordinates?: { lat: number; lng: number } }>,
  userLat: number,
  userLon: number,
  radiusKm: number = 2
) => {
  return shops
    .filter(shop => shop.coordinates)
    .map(shop => ({
      ...shop,
      distance: calculateDistance(userLat, userLon, shop.coordinates!.lat, shop.coordinates!.lng),
    }))
    .filter(shop => shop.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};
