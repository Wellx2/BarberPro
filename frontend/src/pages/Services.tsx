import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceGrid } from '../components/ServiceGrid';
import { serviceService } from '../services/serviceService';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Service } from '../types';

export const Services: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(6);
    const { shop, fetchError } = useShop();
    const lastLoadedShopId = React.useRef<string | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Verificar autenticação ANTES de carregar dados
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/services' } });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        // ? Proteção 1: Se ShopContext tem erro, não tentar carregar
        if (fetchError) {
            setLoading(false);
            return;
        }

        // ? Proteção 2: Aguardar shop.id válido
        if (!shop.id || shop.id.startsWith('shop-')) {
            setLoading(false);
            return;
        }

        // ? Proteção 3: Evitar recarregar para o mesmo shop SE já os tem dados
        if (lastLoadedShopId.current === shop.id && services.length > 0) {
            return;
        }

        lastLoadedShopId.current = shop.id;

        const loadServices = async () => {
            // ? Proteção 4: Cancelar requisições anteriores
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            try {
                setLoading(true);
                const data = await serviceService.list(shop.id);

                // ? Proteção 5: Verificar se foi abortado
                if (abortControllerRef.current?.signal.aborted) {
                    return;
                }

                setServices(data.filter((s: Service) => s.active));
            } catch (error) {
                console.error('Erro ao carregar serviços:', error);
                setServices([]);
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
            }
        };

        loadServices();

        // ? Cleanup: Abortar requisição ao desmontar
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [shop.id, fetchError]);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedServices = searchTerm ? filteredServices : filteredServices.slice(0, displayCount);
    const hasMore = !searchTerm && displayCount < filteredServices.length;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors">
            <div className="max-w-7xl mx-auto px-4 pt-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
                        Catálogo Completo
                    </h1>
                    <p className="text-gray-400 uppercase font-bold text-[10px] tracking-[0.4em]">
                        Explore nossa gama de excelência
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tenant-primary border-t-transparent"></div>
                        <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Carregando serviços...</p>
                    </div>
                ) : services.length > 0 ? (
                    <>
                        <ServiceGrid
                            services={displayedServices}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            showSearch={true}
                        />

                        {hasMore && (
                            <div className="text-center mt-12">
                                <button
                                    onClick={() => setDisplayCount(prev => prev + 6)}
                                    className="px-8 py-3 bg-tenant-primary hover:opacity-90 text-white font-bold uppercase text-sm tracking-wider rounded-full transition-colors"
                                >
                                    Carregar Mais Serviços
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum serviço disponível não momento.</p>
                        <p className="text-gray-400 text-sm mt-2">Entre em contato com a barbearia para mais informações.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
