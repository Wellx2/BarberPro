import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Shop } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Store, Search, Filter, Compass, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { Grid } from '../components/layout/Grid';
import { Container } from '../components/layout/Container';
import { Input } from '../components/ui/Input';
import { useGeolocation, findNearbyShops } from '../hooks/useGeolocation';
import { UserRole } from '../types';

export const Explore: React.FC = () => {
    const { shops, shop: currentShop, setShop, switchShop, calculateDistance } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

    const [searchTerm, setSearchTerm] = useState('');
    const [distances, setDistances] = useState<Record<string, string>>({});
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);
    const [switching, setSwitching] = useState<string | null>(null); // shopId being switched

    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const isClient = !user || user?.role === UserRole.CLIENT;
    const canSelectShop = (shopId: string) => isSuperAdmin || isClient || user?.shopId === shopId;

    useEffect(() => {
        handleCheckLocation();
        if (!location) {
            requestLocation();
        }
    }, [shops]); // Add shops to dependency array to recalculate if shops change

    useEffect(() => {
        let results = shops;
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            results = shops.filter(shop =>
                shop.name.toLowerCase().includes(lowerQuery) ||
                shop.address.toLowerCase().includes(lowerQuery)
            );
        }

        // Sort by distance if available, otherwise by name
        results.sort((a, b) => {
            const distA = distances[a.id] ? parseFloat(distances[a.id]) : 999999;
            const distB = distances[b.id] ? parseFloat(distances[b.id]) : 999999;
            if (distA !== distB) return distA - distB;
            return a.name.localeCompare(b.name);
        });

        setFilteredShops(results);
    }, [searchTerm, shops, distances]);

    const handleCheckLocation = async () => {
        setLoadingLocation(true);
        const dists: Record<string, string> = {};
        for (const s of shops) {
            if (s.coordinates) {
                const d = await calculateDistance(s.coordinates.lat, s.coordinates.lng);
                if (d) dists[s.id] = d;
            }
        }
        setDistances(dists);
        setLoadingLocation(false);
    };

    const handleSelectShop = async (selectedShop: Shop) => {
        if (!canSelectShop(selectedShop.id)) return;

        // Same shop, just navigate
        if (selectedShop.id === currentShop.id) {
            navigate('/');
            return;
        }

        const token = localStorage.getItem('accessToken');

        // Without auth or is CLIENT: local switch (viewing)
        if (!token || isClient) {
            setShop(selectedShop);
            navigate('/');
            return;
        }

        // ADMIN/BARBER accessing own shop
        if (!isSuperAdmin) {
            setShop(selectedShop);
            navigate('/');
            return;
        }

        // SUPER_ADMIN switching to another shop: API call
        setSwitching(selectedShop.id);

        try {
            await switchShop(selectedShop.id);
            setSwitching(null);
            navigate('/');
        } catch (error) {
            console.error('Failed to switch shop', error);
            // Fallback
            setShop(selectedShop);
            navigate('/');
        } finally {
            setSwitching(null);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 pt-8">
            <Container size="xl">
                {/* Header Section */}
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        Encontre uma <span className="text-tenant-primary">Barbearia</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
                        Descubra as melhores opções perto de você. Pesquise por nome ou navegue pelas barbearias disponíveis.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm mb-10 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-nãone">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar estabelecimento ou endereço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-nãone rounded-2xl focus:ring-2 focus:ring-tenant-primary text-gray-900 dark:text-white dark:placeholder-gray-500 font-medium"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCheckLocation}
                                disabled={loadingLocation || geoLoading}
                                className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center gap-2 transition-colors whitespace-nãowrap"
                            >
                                <Navigation size={18} className={loadingLocation ? "animate-spin" : ""} />
                                <span className="hidden sm:inline">Localização</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid of Shops */}
                <Grid cols={1} md={2} lg={3} gap="lg">
                    {filteredShops.length > 0 ? (
                        filteredShops.map((shop) => {
                            const accessible = canSelectShop(shop.id);
                            const isCurrent = currentShop?.id === shop.id;
                            const isSwitchingThis = switching === shop.id;

                            return (
                                <div
                                    key={shop.id}
                                    onClick={() => accessible && !isSwitchingThis ? handleSelectShop(shop) : undefined}
                                    className={`
                                        relative bg-white dark:bg-gray-800 rounded-[35px] overflow-hidden border transition-all duration-300 group
                                        ${accessible ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-tenant-primary/10' : 'opacity-70 cursor-not-allowed'}
                                        ${isCurrent ? 'border-tenant-primary shadow-lg shadow-tenant-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-tenant-primary/50'}
                                    `}
                                >
                                    {/* Image Header */}
                                    <div className="h-48 relative overflow-hidden">
                                        <img
                                            src={shop.bannerUrl || shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                                            alt={shop.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>

                                        {/* Current Tag */}
                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 bg-tenant-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                                                Selecionada
                                            </div>
                                        )}

                                        {/* Lock Tag */}
                                        {!accessible && (
                                            <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                                <Lock size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Acesso Restrito</span>
                                            </div>
                                        )}

                                        {/* Shop Avatar */}
                                        <div className="absolute -bottom-6 left-6 inline-block">
                                            <div className="bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-lg inline-block">
                                                <img
                                                    src={shop.logoUrl || shop.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(shop.name) + '&background=random'}
                                                    alt={shop.name}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="pt-10 p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-tenant-primary transition-colors">
                                                {shop.name}
                                            </h3>
                                        </div>

                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-start text-gray-500 dark:text-gray-400 text-sm">
                                                <MapPin size={16} className="text-tenant-primary mr-2 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2">{shop.address}</span>
                                            </div>

                                            {/* Loading distance/Distance info */}
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm h-5">
                                                {distances[shop.id] ? (
                                                    <>
                                                        <Navigation size={14} className="text-tenant-primary mr-2" />
                                                        <span className="font-bold text-gray-900 dark:text-white">{distances[shop.id]} km</span>
                                                        <span className="ml-1">de distância</span>
                                                    </>
                                                ) : loadingLocation && shop.coordinates ? (
                                                    <>
                                                        <div className="w-3 h-3 rounded-full border-2 border-tenant-primary border-t-transparent animate-spin mr-2" />
                                                        <span className="text-xs">Calculando...</span>
                                                    </>
                                                ) : shop.coordinates ? (
                                                    // Placeholder space if coordinates exist but not calculated yet
                                                    null
                                                ) : null}
                                            </div>
                                        </div>

                                        {isSwitchingThis ? (
                                            <div className="mt-6 w-full py-3 bg-tenant-primary/10 text-tenant-primary rounded-xl font-bold flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-tenant-primary border-t-transparent rounded-full animate-spin" />
                                                Trocando...
                                            </div>
                                        ) : accessible && !isCurrent ? (
                                            <div className="mt-6 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white group-hover:bg-tenant-primary group-hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors uppercase text-xs tracking-widest">
                                                Acessar Unidade
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ) : isCurrent ? (
                                            <div className="mt-6 w-full py-3 border-2 border-tenant-primary/50 text-tenant-primary rounded-xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                                                Você está aqui
                                            </div>
                                        ) : (
                                            <div className="mt-6 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest opacity-50">
                                                Bloqueado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-white dark:bg-gray-800 rounded-[35px] border border-gray-100 dark:border-gray-700">
                            <Store size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase">Nenhuma barbearia encontrada</h3>
                            <p className="text-gray-500 dark:text-gray-400">Tente ajustar seus termos de busca.</p>
                        </div>
                    )}
                </Grid>
            </Container>
        </div>
    );
};
