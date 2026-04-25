import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Service } from '../types';
import { Clock, Search, X, Calendar } from 'lucide-react';
import { PrimaryButton } from '../components/ui/PrimaryButton';

interface ServiceGridProps {
    services: Service[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showSearch?: boolean;
    maxItems?: number;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({
    services,
    searchTerm,
    onSearchChange,
    showSearch = true,
    maxItems
}) => {
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const { isAuthenticated } = useAuth();
    const { shop } = useShop();
    const navigate = useNavigate();

    const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const shopSlug = shop.slug || slugify(shop.name);

    const filteredServices = services
        .filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, maxItems);

    const handleScheduleClick = (serviceId: string) => {
        const path = `/${shopSlug}/agendar`;
        if (isAuthenticated) {
            navigate(path, { state: { preSelectedServiceId: serviceId } });
        } else {
            navigate('/login', { state: { from: path, preSelectedServiceId: serviceId } });
        }
    };

    return (
        <>
            {showSearch && (
                <div className="max-w-md mx-auto mb-16 relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-6 py-4 border-none rounded-[25px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#f59e0b] focus:ring-tenant-primary shadow-lg transition-all font-medium"
                        placeholder="O que você procura hoje?"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredServices.map((service) => (
                    <div
                        key={service.id}
                        className="bg-white dark:bg-gray-800 rounded-[35px] shadow-sm overflow-hidden hover:shadow-2xl transition-all group border border-transparent dark:border-gray-700 flex flex-col"
                    >
                        <div className="h-64 overflow-hidden relative cursor-pointer rounded-t-[35px]" onClick={() => setSelectedService(service)}>
                            <img
                                src={service.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                                {service.category}
                            </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{service.name}</h3>
                                <span className="text-[#f59e0b] text-tenant-primary font-black text-xl">R$ {service.price}</span>
                            </div>
                            {service.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    {service.description}
                                </p>
                            )}
                            <div className="mt-auto space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={18} className="text-tenant-primary" />
                                    <span className="text-sm font-bold">{service.duration} min</span>
                                </div>
                                <PrimaryButton
                                    onClick={() => handleScheduleClick(service.id)}
                                    fullWidth
                                >
                                    Reservar Agora
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedService && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md" onClick={() => setSelectedService(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl max-w-lg w-full overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedService(null)} className="absolute top-6 right-6 z-10 bg-gray-900/40 text-white p-3 rounded-full hover:bg-tenant-primary transition-colors"><X size={24} /></button>
                        <img
                            src={selectedService.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                            alt={selectedService.name}
                            className="h-72 w-full object-cover"
                        />
                        <div className="p-10">
                            <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white mb-4">{selectedService.name}</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-8">{selectedService.description}</p>
                            <div className="flex justify-between items-center mb-10">
                                <div className="text-gray-400 font-black uppercase text-xs tracking-widest flex items-center gap-2"><Clock size={20} className="text-tenant-primary" />{selectedService.duration} min</div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">R$ {selectedService.price}</div>
                            </div>
                            <PrimaryButton
                                onClick={() => { handleScheduleClick(selectedService.id); setSelectedService(null); }}
                                fullWidth
                            >
                                Reservar Agora
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
