
import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { MapPin, Navigation, Check, X, ChevronRight, Store, ArrowRight } from 'lucide-react';

export const ShopSelector: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { shops, shop: currentShop, setShop, calculateDistance } = useShop();
    const [distances, setDistances] = useState<Record<string, string>>({});
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Se houver apenas uma unidade, esse componente nem deve ser renderizado.
    // O pai (Home) já cuida disso, mas mantemos aqui por segurança.
    if (shops.length <= 1) return null;

    useEffect(() => {
        handleCheckLocation();
    }, [shops]);

    const handleCheckLocation = async () => {
        setLoadingLocation(true);
        const dists: Record<string, string> = {};
        for (const s of shops) {
            // Fix: Added coordinates to Shop interface in types.ts
            if (s.coordinates) {
                const d = await calculateDistance(s.coordinates.lat, s.coordinates.lng);
                if (d) dists[s.id] = d;
            }
        }
        setDistances(dists);
        setLoadingLocation(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl overflow-hidden max-w-lg w-full mx-auto border border-gray-100 dark:border-gray-700 animate-slide-up">
            <div className="bg-gray-900 p-10 text-white relative">
                <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
                    <X size={28} />
                </button>
                <div className="bg-amber-500 w-14 h-14 rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                    <Store className="text-white" size={28} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Nossas Unidades</h2>
                <p className="text-gray-400 text-sm mt-3 font-medium">Selecione uma barbearia para ver a agenda.</p>
            </div>
            
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto scrollbar-hide">
                {shops.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => { setShop(s); onClose(); }}
                        className={`w-full text-left p-6 rounded-[35px] flex items-center gap-5 transition-all group ${currentShop.id === s.id ? 'bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-500' : 'hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-transparent'}`}
                    >
                        <div className="relative shrink-0">
                            <img src={s.image} alt={s.name} className="w-20 h-20 rounded-[24px] object-cover shadow-lg group-hover:scale-105 transition-transform" />
                            {currentShop.id === s.id && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-800">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base truncate">{s.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 truncate">{s.address}</p>
                            
                            <div className="flex items-center gap-3 mt-3">
                                {distances[s.id] && (
                                    <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                        <Navigation size={12} fill="currentColor" /> {distances[s.id]} km
                                    </span>
                                )}
                            </div>
                        </div>
                        <ArrowRight className={`transition-all ${currentShop.id === s.id ? 'text-amber-500 translate-x-1' : 'text-gray-300 group-hover:text-gray-500'}`} size={24} />
                    </button>
                ))}
            </div>
            
            <div className="p-8 bg-gray-50 dark:bg-gray-900 text-center border-t dark:border-gray-700">
                <button onClick={handleCheckLocation} className="text-xs font-black uppercase text-amber-600 hover:text-amber-500 transition-colors">
                    {loadingLocation ? 'Detectando sua posição...' : 'Recalcular Distâncias'}
                </button>
            </div>
        </div>
    );
};
