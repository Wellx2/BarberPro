
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import '../constants'; // Import types only
import { Appointment, BlockedPeriod, Review, Barber } from '../types';
import { Star, Scissors, Calendar as CalendarIcon, ChevronLeft, MapPin, Award, Lock, AlertCircle, MessageSquare } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Calendar } from '../components/Calendar';
import { Container } from '../components/layout/Container';
import { Grid } from '../components/layout/Grid';
import { Button } from '../components/ui/Button';
import { barberService } from '../services/barberService';


export const BarberProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { shop: currentShop } = useShop();
    const navigate = useNavigate();
    const { generateTimeSlots } = useShop();

    const [barber, setBarber] = useState<Barber | null>(null);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);


    useEffect(() => {
        if (id) {
            setLoading(true);
            Promise.all([
                barberService.getPublicById(id),
                barberService.getPublicReviews(id).catch(() => [])
            ])
                .then(([barberData, reviewsData]) => {
                    setBarber(barberData);
                    setReviews(reviewsData);
                })
                .catch(err => {
                    console.error('Erro ao buscar dados do barbeiro:', err);
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111827]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tenant-primary"></div>
            </div>
        );
    }

    if (!barber) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#111827] text-white">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">Barbeiro não encontrado</h2>
                <p className="text-gray-400 mb-6 text-sm">O perfil deste profissional não está disponível não momento.</p>
                <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
            </div>
        );
    }

    const timeSlots = generateTimeSlots();

    const isSlotBooked = (date: Date, time: string) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.some(apt => {
            if (apt.barberId !== barber.id) return false;
            if (apt.status === 'CANCELLED' || apt.status === 'CANCELLED_BY_BARBER') return false;
            const aptDate = new Date(apt.date);
            const aptDateStr = aptDate.toISOString().split('T')[0];
            const aptTime = aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return aptDateStr === dateStr && aptTime === time;
        });
    };

    const isSlotBlocked = (date: Date, time: string) => {
        const dateStr = date.toISOString().split('T')[0];
        return blockedPeriods.some(block => {
            if (block.barberId !== barber.id) return false;
            const isDateInRange = block.type === 'RANGE' && block.endDate
                ? (dateStr >= block.date && dateStr <= block.endDate)
                : block.date === dateStr;
            if (!isDateInRange) return false;
            if (block.type === 'DAY' || block.type === 'RANGE') return true;
            if (block.type === 'TIME' && block.startTime && block.endTime) {
                return time >= block.startTime && time < block.endTime;
            }
            return false;
        });
    };

    const isDayBlocked = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return blockedPeriods.some(block => {
            if (block.barberId !== barber.id) return false;
            if (block.type === 'RANGE' && block.endDate) {
                return dateStr >= block.date && dateStr <= block.endDate;
            }
            return block.date === dateStr && block.type === 'DAY';
        });
    };

    const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const handleBookClick = (date?: Date, time?: string) => {
        const shopSlug = slugify(currentShop.name);
        
        const state: any = { preSelectedBarberId: barber.id };
        if (date && time) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            state.preSelectedDate = `${year}-${month}-${day}`;
            state.preSelectedTime = time;
        }
        navigate(`/${shopSlug}/agendar`, { state });
    };

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const isSunday = selectedDateObj.getDay() === 0;
    const isCurrentDayBlocked = isDayBlocked(selectedDateObj);
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="bg-[#111827] min-h-screen pb-12 transition-colors duration-300">
            {/* Header / Cover */}
            <div className="bg-gray-900 h-48 md:h-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1350&auto=format&fit=crop&q=80"
                    alt="Barbershop Background"
                    className="w-full h-full object-cover opacity-30"
                />
                <Link to={currentShop.id ? `/${slugify(currentShop.name)}` : "/"} className="absolute top-6 left-6 z-20 text-white flex items-center gap-2 bg-gray-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-tenant-primary hover:text-white transition-all shadow-lg active:scale-95 group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-tight">Voltar</span>
                </Link>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="bg-[#1f2937] rounded-[50px] shadow-2xl overflow-hidden border border-gray-700/50">
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="mb-8 relative">
                            <img
                                src={barber.avatar}
                                alt={barber.name}
                                className="w-40 h-40 rounded-[45px] border-4 border-[#1f2937] shadow-2xl object-cover relative z-10"
                            />
                            <div className="absolute -inset-1 bg-gradient-to-tr from-tenant-primary to-tenant-primary/80 rounded-[46px] blur-sm opacity-30"></div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">{barber.name}</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 mb-6">
                            <Scissors size={14} className="text-tenant-primary" />
                            Profissional de Elite
                        </p>

                        <div className="bg-[#2d1e16] border border-[#3d2b1f] px-6 py-3 rounded-full flex items-center justify-center gap-3 mb-8 shadow-inner">
                            <Star size={18} className="text-tenant-primary fill-current" />
                            <div className="flex items-center gap-1.5 leading-none">
                                <span className="text-xl font-black text-white">{barber.rating}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ 5.0</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {barber.specialties.map((spec, index) => (
                                <div key={index} className="flex items-center px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-900/50 text-gray-400 border border-gray-700 shadow-sm">
                                    <Scissors size={12} className="mr-2 text-tenant-primary" />
                                    {spec}
                                </div>
                            ))}
                        </div>

                        <p className="text-gray-400 mb-10 max-w-sm text-sm leading-relaxed font-medium">
                            {barber.description || "Especialista em transformar visual com técnica e precisão."}
                        </p>

                        <div className="w-full max-w-md">
                            <Button
                                onClick={() => handleBookClick()}
                                variant="primary"
                                fullWidth
                                className="gap-3"
                            >
                                <CalendarIcon size={18} />
                                Agendar com {barber.name.split(' ')[0]}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-700/50 divide-y sm:divide-y-0 sm:divide-x divide-gray-700/50 bg-[#111827]/50">
                        <div className="p-8 text-center group">
                            <div className="text-3xl font-black text-white leading-none">{barber.totalCuts ? `${barber.totalCuts}+` : '1k+'}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Cortes Realizados</div>
                        </div>
                        <div className="p-8 text-center group">
                            <div className="text-3xl font-black text-white leading-none">{barber.experience || '5 Anos'}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Experiência</div>
                        </div>
                        <div className="p-8 text-center group">
                            <div className="text-3xl font-black text-white leading-nãone truncate px-2">{barber.unit || 'Klypbarber'}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Unidade Sede</div>
                        </div>
                    </div>
                </div>

                {/* Seção de Avaliações */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Avaliações dos Clientes</h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">O que dizem sobre o trabalho de {barber.name.split(' ')[0]}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-tenant-primary/10 px-4 py-2 rounded-full border border-tenant-primary/20">
                            <Star size={16} className="text-tenant-primary fill-current" />
                            <span className="text-tenant-primary font-black">{barber.rating}</span>
                        </div>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-[#1f2937] p-6 rounded-[30px] border border-gray-700/50 shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-tenant-primary flex items-center justify-center text-white font-black text-sm">
                                                {(review.client?.name || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{review.client?.name || 'Cliente'}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cliente Verificado</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < review.rating ? 'text-tenant-primary fill-current' : 'text-gray-700'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed italic">
                                        "{review.comment || 'Nenhum comentário deixado, apenas avaliação por estrelas.'}"
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                                            {new Date(review.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#1f2937] p-12 rounded-[40px] border border-dashed border-gray-700 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Ainda não há avaliações para este profissional.</p>
                            <p className="text-gray-600 text-xs mt-2">Agende um horário e sejá o primeiro a avaliar!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
