import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Shop } from '../types';

interface LocationMapProps {
    shop: Shop;
}

export const LocationMap: React.FC<LocationMapProps> = ({ shop }) => {
    const { coordinates, address, name } = shop;

    // Encode address for the URL
    const encodedAddress = encodeURIComponent(`${name}, ${address}`);

    // Google Maps Embed URL
    // If we have coordinates, use them. Otherwise, use the address.
    const mapUrl = coordinates && (coordinates.lat !== 0 || coordinates.lng !== 0)
        ? `https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_API_KEY&q=${coordinates.lat},${coordinates.lng}`
        : `https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_API_KEY&q=${encodedAddress}`;

    // Fallback for when não API Key is available - using the public search URL
    const publicMapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-[40px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-xl animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Info Column */}
                <div className="p-8 lg:p-12 flex flex-col justify-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="bg-tenant-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                        <MapPin className="text-tenant-primary" size={32} />
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        Visite nãossa<br /><span className="text-tenant-primary">Unidade</span>
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                        Localizada não coração de {address.split(',')[1] || 'nãossa cidade'}, nãossa barbearia oferece um ambiente premium e fácil acesso para você.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-xl text-gray-500">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Endereço</p>
                                <p className="font-bold text-gray-900 dark:text-white">{address}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-xl text-gray-500">
                                <Navigation size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Traçar Rota</p>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
                                    target="_blank"
                                    rel="nãoopener nãoreferrer"
                                    className="text-tenant-primary font-black hover:underline inline-flex items-center gap-1"
                                >
                                    Abrir não Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Column */}
                <div className="lg:col-span-2 h-[400px] lg:h-auto min-h-[400px] relative">
                    <iframe
                        title="Barbershop Location"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={publicMapUrl}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="não-referrer-when-downgrade"
                        className="grayscale contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-95"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};
