
import React, { useState, useEffect } from 'react';
import { SERVICES, BARBERS, MOCK_APPOINTMENTS } from '../constants';
// Fix: Import useNavigate and useLocation from react-router to resolve export errors in some environments
import { useNavigate, useLocation } from 'react-router';
import { Calendar as CalendarIcon, Clock, Check, User, AlertCircle, ChevronLeft, Scissors, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Appointment, Service, Barber, BlockedPeriod } from '../types';
import { useShop } from '../context/ShopContext';
import { Calendar } from '../components/Calendar';

export const Booking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { shop, generateTimeSlots } = useShop();
  
  const [allBarbers] = useState<Barber[]>(() => JSON.parse(localStorage.getItem('barbers') || JSON.stringify(BARBERS)));
  const [allServices] = useState<Service[]>(() => JSON.parse(localStorage.getItem('services') || JSON.stringify(SERVICES)));
  const [blockedPeriods] = useState<BlockedPeriod[]>(() => JSON.parse(localStorage.getItem('blocked_periods') || '[]'));
  
  const shopBarbers = allBarbers.filter(b => b.shopId === shop.id && b.active !== false);
  const activeServices = allServices.filter(s => s.active !== false);
  
  const timeSlots = generateTimeSlots();
  
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    if (location.state) {
        const { preSelectedBarberId, preSelectedDate, preSelectedTime, preSelectedServiceId } = location.state;
        if (preSelectedServiceId) setSelectedServices(Array.isArray(preSelectedServiceId) ? preSelectedServiceId : [preSelectedServiceId]);
        if (preSelectedBarberId) setSelectedBarber(preSelectedBarberId);
        if (preSelectedDate) setSelectedDate(preSelectedDate);
        if (preSelectedTime) setSelectedTime(preSelectedTime);
    }
  }, [location.state]);

  const isBlocked = (date: string, time: string, barberId: string) => {
      if (barberId === 'any') return false;
      const dayBlock = blockedPeriods.some(b => b.barberId === barberId && b.date === date && b.type === 'DAY');
      const timeBlock = blockedPeriods.some(b => b.barberId === barberId && b.date === date && b.type === 'TIME' && time >= (b.startTime||'') && time < (b.endTime||''));
      const hasApt = JSON.parse(localStorage.getItem('appointments') || '[]').some((a: any) => a.barberId === barberId && a.date.startsWith(date) && a.date.includes(time) && a.status !== 'CANCELLED');
      return dayBlock || timeBlock || hasApt;
  };

  const handleConfirm = () => {
    if (!user) { navigate('/login', { state: { from: '/book' } }); return; }
    let finalBarberId = selectedBarber === 'any' ? shopBarbers[0].id : selectedBarber;
    const finalPrice = activeServices.filter(s => selectedServices.includes(s.id)).reduce((acc, curr) => acc + curr.price, 0);
    
    const newApt: Appointment = { id: `apt-${Date.now()}`, shopId: shop.id, clientId: user.id, barberId: finalBarberId, serviceIds: selectedServices, date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(), status: 'SCHEDULED', totalPrice: finalPrice };
    const current = JSON.parse(localStorage.getItem('appointments') || JSON.stringify(MOCK_APPOINTMENTS));
    localStorage.setItem('appointments', JSON.stringify([...current, newApt]));
    
    addNotification('success', `Agendado para às ${selectedTime}h!`, 'Sucesso');
    navigate('/dashboard');
  };

  const visibleServices = showAllServices ? activeServices : activeServices.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <div className="flex justify-between items-center mb-10 px-4">
        {[1, 2, 3, 4].map(s => (<div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${step >= s ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>{s}</div>))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border dark:border-gray-700 overflow-hidden min-h-[550px]">
        {step === 1 && (
            <div className="p-8 md:p-12 animate-fade-in">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">O que vamos fazer hoje?</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Selecione um ou mais serviços</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {visibleServices.map(s => (
                        <button key={s.id} onClick={() => setSelectedServices(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} className={`p-6 rounded-[30px] border-2 transition-all flex items-center gap-5 text-left group ${selectedServices.includes(s.id) ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-50 dark:border-gray-700 hover:border-amber-500/30'}`}>
                            <div className="w-16 h-16 rounded-[20px] overflow-hidden shrink-0 group-hover:scale-110 transition-transform"><img src={s.image} className="w-full h-full object-cover" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm dark:text-white uppercase leading-tight mb-1">{s.name}</p>
                                <p className="text-xs text-amber-600 font-black">R$ {s.price.toFixed(2)}</p>
                            </div>
                            {selectedServices.includes(s.id) && <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
                        </button>
                    ))}
                </div>

                {!showAllServices && activeServices.length > 3 && (
                    <button 
                        onClick={() => setShowAllServices(true)}
                        className="w-full mt-6 py-4 rounded-[22px] border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-amber-500 hover:border-amber-500 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                        <ChevronDown size={16} /> Ver todos os serviços
                    </button>
                )}

                <div className="mt-12 flex justify-end"><button disabled={selectedServices.length === 0} onClick={() => setStep(2)} className="bg-amber-500 text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-500/30 disabled:opacity-30 transition-all active:scale-95">Próximo Passo</button></div>
            </div>
        )}

        {step === 2 && (
            <div className="p-8 md:p-12 animate-fade-in text-center">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase mb-10 tracking-tighter">Escolha o Profissional</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                    <button onClick={() => setSelectedBarber('any')} className={`p-8 rounded-[35px] border-2 transition-all group ${selectedBarber === 'any' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-50 dark:border-gray-700 hover:border-amber-500/30'}`}>
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-[28px] mx-auto mb-4 flex items-center justify-center text-gray-400 group-hover:bg-amber-500 group-hover:text-white transition-all"><User size={32}/></div>
                        <p className="font-black uppercase text-[10px] tracking-widest dark:text-white leading-none">Qualquer um</p>
                    </button>
                    {shopBarbers.map(b => (
                        <button key={b.id} onClick={() => setSelectedBarber(b.id)} className={`p-8 rounded-[35px] border-2 transition-all group ${selectedBarber === b.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-50 dark:border-gray-700 hover:border-amber-500/30'}`}>
                            <img src={b.avatar} className="w-20 h-20 rounded-[28px] mx-auto mb-4 object-cover shadow-xl border-4 border-white dark:border-gray-700 group-hover:scale-105 transition-transform" />
                            <p className="font-black uppercase text-[10px] tracking-widest dark:text-white leading-none truncate">{b.name.split(' ')[0]}</p>
                        </button>
                    ))}
                </div>
                <div className="mt-16 flex justify-between px-4"><button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-500 transition-colors">Voltar</button><button disabled={!selectedBarber} onClick={() => setStep(3)} className="bg-amber-500 text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Continuar</button></div>
            </div>
        )}

        {step === 3 && (
            <div className="p-8 md:p-12 animate-fade-in bg-[#111827]">
                <div className="text-center mb-10">
                    <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mb-2">Horários Para</h4>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                        {selectedDate ? new Date(selectedDate+'T00:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'numeric'}).toUpperCase() : 'Selecione uma data'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-[#1f2937] p-6 rounded-[40px] border border-gray-700 shadow-inner">
                        <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} isDateDisabled={(d) => blockedPeriods.some(b => b.barberId === selectedBarber && b.date === d.toISOString().split('T')[0] && b.type === 'DAY')} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 auto-rows-max">
                        {timeSlots.map(time => {
                            const blocked = isBlocked(selectedDate, time, selectedBarber);
                            const isSelected = selectedTime === time;
                            return (
                                <button 
                                    key={time} 
                                    disabled={blocked || !selectedDate} 
                                    onClick={() => setSelectedTime(time)} 
                                    className={`py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all relative ${
                                        blocked 
                                        ? 'bg-[#1a222f] text-gray-700 opacity-20 cursor-not-allowed' 
                                        : isSelected 
                                            ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/40 z-10 scale-105' 
                                            : 'bg-[#1a222f] text-white hover:bg-amber-500/10 hover:text-amber-500 hover:-translate-y-0.5 active:scale-95'
                                    }`}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-16 flex justify-between"><button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-500">Voltar</button><button disabled={!selectedTime} onClick={() => setStep(4)} className="bg-amber-500 text-white px-12 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Revisar</button></div>
            </div>
        )}

        {step === 4 && (
            <div className="p-8 md:p-12 animate-fade-in">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase mb-10 text-center tracking-tighter">Confirmação</h2>
                <div className="max-w-md mx-auto bg-gray-900 rounded-[50px] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center border-b border-white/10 pb-5">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Data & Hora</span>
                            <span className="font-black text-amber-500 uppercase tracking-tight">{new Date(selectedDate+'T00:00:00').toLocaleDateString()} às {selectedTime}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-5">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Barbeiro</span>
                            <span className="font-black text-white uppercase tracking-tight">{shopBarbers.find(b => b.id === selectedBarber)?.name || 'Profissional'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Investimento</span>
                            <span className="text-4xl font-black text-amber-500 tracking-tighter leading-none">R$ {activeServices.filter(s => selectedServices.includes(s.id)).reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <button onClick={handleConfirm} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 rounded-[25px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-amber-500/40 flex items-center justify-center gap-4 transition-all active:scale-95">
                        <Check size={24} strokeWidth={3} /> Confirmar Agora
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
