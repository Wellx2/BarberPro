import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Check, X, Store, ArrowRight, Compass, AlertCircle, Lock } from 'lucide-react';
import { useGeolocation, findNearbyShops } from '../hooks/useGeolocation';
import { UserRole } from '../types';

export const ShopSelector: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAuth();
    const { shops, shop: currentShop, setShop, switchShop, calculateDistance } = useShop();
    const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
    const [distances, setDistances] = useState<Record<string, string>>({});
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [nearbyShops, setNearbyShops] = useState<any[]>([]);
    const [selectedShop, setSelectedShop] = useState(currentShop);
    const [switching, setSwitching] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Lógica de permissão: apenas SUPER_ADMIN pode trocar de shop via API
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const isClient = !user || user?.role === UserRole.CLIENT;
    const canSelectShop = (shopId: string) =>
        isSuperAdmin || isClient || user?.shopId === shopId;


    // Se não houver barbearias, mostrar mensagem de erro
    if (shops.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Nenhuma Barbearia Disponível
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            O backend não retornãou nenhuma barbearia. Verifique:
                        </p>
                        <div className="text-left bg-gray-100 dark:bg-gray-900 rounded p-4 mb-4 text-xs font-monão">
                            <p className="text-red-600 dark:text-red-400 mb-2">Backend rodando?</p>
                            <code className="text-gray-700 dark:text-gray-300">
                                curl http://localhost:3000/api/barbershops/public
                            </code>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-bold"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Se houver apenas uma unidade, não renderizar (não faz sentido escolher)
    if (shops.length === 1) {
        onClose();
        return null;
    }

    useEffect(() => {
        handleCheckLocation();
        if (!location) {
            requestLocation();
        }
    }, [shops]);

    // Auto-selecionar se houver apenas uma unidade próxima
    useEffect(() => {
        if (nearbyShops.length === 1 && !loadingLocation && !geoLoading) {
            setSelectedShop(nearbyShops[0]);
            setShop(nearbyShops[0]);
            onClose();
        }
    }, [nearbyShops]);

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

    const handleRequestGeolocation = () => {
        requestLocation();
        setTimeout(() => {
            if (location && location.latitude) {
                const nearby = findNearbyShops(shops, location.latitude, location.longitude, 2);
                setNearbyShops(nearby);
            }
        }, 500);
    };

    const handleClickShop = (shop: any) => {
        if (!canSelectShop(shop.id)) {
            setErrorMessage('🔒 Você não tem permissão para acessar esta unidade. Apenas o gestor responsável pode gerenciar outras barbearias.');
            return;
        }
        setSelectedShop(shop);
        setErrorMessage(null);
    };

    const handleContinue = async () => {
        setErrorMessage(null);

        const token = localStorage.getItem('accessToken');

        // Sem auth ou CLIENT: apenas troca local (visualização)
        if (!token || isClient) {
            setShop(selectedShop);
            setTimeout(() => onClose(), 200);
            return;
        }

        // ADMIN/BARBER acessando apenas a própria loja: troca local
        if (!isSuperAdmin) {
            if (selectedShop.id !== user?.shopId) {
                setErrorMessage('🔒 Você não tem permissão para acessar esta barbearia. Apenas o SUPER ADMIN pode gerenciar múltiplas unidades.');
                return;
            }
            setShop(selectedShop);
            setTimeout(() => onClose(), 200);
            return;
        }

        // SUPER_ADMIN ou mesma loja: não precisa de chamada API se for a mesma
        if (selectedShop.id === currentShop.id) {
            onClose();
            return;
        }

        // SUPER_ADMIN trocando para outra loja: chamar API
        setSwitching(true);
        const timeoutId = setTimeout(() => {
            setErrorMessage('⏱️ A requisição está demorando. Verifique sua conexão e tente novamente.');
            setSwitching(false);
        }, 10000);

        try {
            await switchShop(selectedShop.id);
            clearTimeout(timeoutId);
            setSwitching(false);
            onClose();
        } catch (error: any) {
            clearTimeout(timeoutId);
            setSwitching(false);
            const statusCode = error?.statusCode || error?.response?.status;
            if (statusCode === 403) {
                setErrorMessage('🔒 Você não tem permissão para acessar esta barbearia.');
            } else {
                // Fallback silencioso para erros de rede
                console.warn('⚠️ Erro na API, alternando para modo local...');
                setShop(selectedShop);
                setTimeout(() => onClose(), 200);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            {/* Container mais arredondado */}
            <div className="bg-gradient-to-b from-gray-950 to-gray-900 rounded-[40px] shadow-2xl overflow-hidden w-full max-w-2xl border border-gray-800 animate-scale-in">

                {/* Header com título centralizado */}
                <div className="relative p-8 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full"
                    >
                        <X size={24} />
                    </button>

                    {/* Ícone centralizado */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 w-20 h-20 rounded-[28px] flex items-center justify-center shadow-lg shadow-amber-500/40">
                            <Store className="text-white" size={40} />
                        </div>
                    </div>

                    {/* Título centralizado */}
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                        Escolha sua unidade
                    </h1>
                    <p className="text-gray-400 text-sm mt-3 font-medium max-w-md mx-auto">
                        Selecione onde você deseja ser atendido hoje para ver a agenda e serviços disponíveis.
                    </p>
                </div>

                {/* Modal de unidades */}
                <div className="px-6 py-8 bg-gray-900/50 border-t border-gray-800">
                    {/* Título "Nossas Unidades" centralizado */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Store size={20} className="text-amber-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Nossas Unidades</h2>
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Selecione uma barbearia para ver a agenda
                        </p>
                    </div>

                    {/* Lista de lojas */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-hide">
                        {shops.map((shop) => {
                            const accessible = canSelectShop(shop.id);
                            return (
                                <div
                                    key={shop.id}
                                    onClick={() => handleClickShop(shop)}
                                    className={`relative p-5 rounded-[35px] transition-all duration-300 group overflow-hidden
                                    ${accessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                                    ${selectedShop.id === shop.id
                                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500 shadow-lg shadow-amber-500/30'
                                            : accessible
                                                ? 'bg-gray-800/50 border-2 border-gray-700 hover:border-amber-500/50 hover:bg-gray-800'
                                                : 'bg-gray-800/30 border-2 border-gray-800'
                                        }`}
                                >
                                    {/* Efeito de fundo */}
                                    {accessible && (
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${selectedShop.id === shop.id ? 'opacity-100' : ''}`}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent"></div>
                                        </div>
                                    )}

                                    {/* Conteúdo */}
                                    <div className="relative flex items-start gap-4">
                                        {/* Imagem da loja - mais arredondada */}
                                        <div className="relative shrink-0">
                                            <img
                                                src={shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                                                alt={shop.name}
                                                className={`w-24 h-24 rounded-[24px] object-cover shadow-md ${accessible ? 'group-hover:scale-110' : ''} transition-transform duration-300`}
                                            />
                                            {/* Check verde para loja selecionada */}
                                            {selectedShop.id === shop.id && (
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 border-3 border-gray-900 shadow-lg flex items-center justify-center">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                            {/* Lock vermelho para shops inacessíveis */}
                                            {!accessible && (
                                                <div className="absolute -top-2 -right-2 bg-gray-700 text-gray-400 rounded-full p-1.5 border-2 border-gray-900 shadow-lg flex items-center justify-center">
                                                    <Lock size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info da loja */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className={`font-black uppercase text-lg tracking-tight transition-colors ${accessible ? 'text-white group-hover:text-amber-400' : 'text-gray-500'}`}>
                                                {shop.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-semibold uppercase mt-2 flex items-center gap-1">
                                                <MapPin size={14} className="text-amber-500 flex-shrink-0" />
                                                <span>{shop.address}</span>
                                            </p>
                                            {!accessible && (
                                                <p className="text-xs text-gray-600 font-semibold mt-1 flex items-center gap-1">
                                                    <Lock size={11} />
                                                    Acesso restrito
                                                </p>
                                            )}

                                            {/* Distância */}
                                            {distances[shop.id] && (
                                                <div className="mt-3 flex items-center">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black uppercase">
                                                        <Navigation size={13} fill="currentColor" />
                                                        {distances[shop.id]} km
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ícone de seta ou lock */}
                                        {accessible ? (
                                            <ArrowRight className={`flex-shrink-0 transition-all duration-300 ${selectedShop.id === shop.id ? 'text-amber-500 translate-x-1' : 'text-gray-600 group-hover:text-amber-500'}`} size={24} />
                                        ) : (
                                            <Lock className="flex-shrink-0 text-gray-600" size={20} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mensagem de erro (se houver) */}
                    {errorMessage && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 animate-fade-in">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-red-400 text-sm font-medium leading-relaxed">
                                    {errorMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Botão principal "Continuar" - confirma seleção */}
                <div className="px-6 py-6 bg-gray-950/50 border-t border-gray-800 flex flex-col gap-3">
                    <button
                        onClick={handleContinue}
                        disabled={switching}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30 uppercase tracking-tight text-sm group"
                    >
                        {switching ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Trocando de unidade...
                            </>
                        ) : (
                            <>
                                Continuar para {selectedShop.name}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    {/* Botões secundários - mais arredondados */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleRequestGeolocation}
                            disabled={geoLoading}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-[20px] flex items-center justify-center gap-2 transition-all border border-gray-700 text-xs uppercase tracking-tight"
                        >
                            <Compass size={16} />
                            {geoLoading ? 'Detectando...' : 'Meu local'}
                        </button>

                        <button
                            onClick={handleCheckLocation}
                            disabled={loadingLocation}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-[20px] flex items-center justify-center gap-2 transition-all border border-gray-700 text-xs uppercase tracking-tight"
                        >
                            <Navigation size={16} />
                            {loadingLocation ? 'Calculando...' : 'Recalcular'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
