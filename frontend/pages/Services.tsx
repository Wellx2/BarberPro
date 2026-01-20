
import React, { useState } from 'react';
// Fix: Import useNavigate from react-router to resolve export errors in some environments
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../constants';
import { Service } from '../types';
import { Clock, Search, Info, X, Calendar } from 'lucide-react';

export const Services: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const filteredServices = SERVICES.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleScheduleClick = (serviceId: string) => {
        if (isAuthenticated) {
            navigate('/book', { state: { preSelectedServiceId: serviceId } });
        } else {
            navigate('/login', { state: { from: '/book', preSelectedServiceId: serviceId } });
        }
    };

    return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 pt-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-6">Catálogo Completo</h1>
                <p className="text-gray-400 uppercase font-bold text-[10px] tracking-[0.4em]">Explore nossa gama de excelência</p>
            </div>

            <div className="max-w-md mx-auto mb-16 relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-6 py-4 border-none rounded-[25px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 shadow-lg transition-all font-medium"
                    placeholder="O que você procura hoje?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredServices.map((service) => (
                    <div 
                        key={service.id} 
                        className="bg-white dark:bg-gray-800 rounded-[35px] shadow-sm overflow-hidden hover:shadow-2xl transition-all group border border-transparent dark:border-gray-700 flex flex-col"
                    >
                        <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => setSelectedService(service)}>
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                                {service.category}
                            </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{service.name}</h3>
                                <span className="text-amber-600 dark:text-amber-500 font-black text-lg">R$ {service.price}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 flex-1">
                                {service.description}
                            </p>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <div className="flex items-center gap-2"><Clock size={14} className="text-amber-500"/>{service.duration} min</div>
                                    <button onClick={() => setSelectedService(service)} className="text-amber-500 flex items-center gap-1">Saiba Mais <Info size={14}/></button>
                                </div>
                                <button 
                                    onClick={() => handleScheduleClick(service.id)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                                >
                                    <Calendar size={18} /> Reservar Agora
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {selectedService && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md" onClick={() => setSelectedService(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl max-w-lg w-full overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedService(null)} className="absolute top-6 right-6 z-10 bg-gray-900/40 text-white p-3 rounded-full hover:bg-amber-500 transition-colors"><X size={24} /></button>
                    <img src={selectedService.image} alt={selectedService.name} className="h-72 w-full object-cover" />
                    <div className="p-10">
                        <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white mb-4">{selectedService.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-8">{selectedService.description}</p>
                        <div className="flex justify-between items-center mb-10">
                             <div className="text-gray-400 font-black uppercase text-xs tracking-widest flex items-center gap-2"><Clock size={20} className="text-amber-500" />{selectedService.duration} min</div>
                             <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">R$ {selectedService.price}</div>
                        </div>
                        <button 
                            onClick={() => { handleScheduleClick(selectedService.id); setSelectedService(null); }}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Calendar size={20} /> Reservar Agora
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};
