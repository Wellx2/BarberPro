
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { Appointment, BlockedPeriod, Product, Invoice, Service, User } from '../../types';
import { MOCK_APPOINTMENTS, SERVICES, PRODUCTS, UI_STYLE } from '../../constants';
import { Calendar, PlusCircle, Lock, X, ShoppingBag, Check, UserCheck, Search, Plus, UserPlus, Phone, Calendar as CalendarIcon, Save } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { shop } = useShop();
  const { addNotification } = useNotification();

  const [appointments, setAppointments] = useState<Appointment[]>(() => JSON.parse(localStorage.getItem('appointments') || JSON.stringify(MOCK_APPOINTMENTS)));
  const [showOSModal, setShowOSModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [selectedAptForOS, setSelectedAptForOS] = useState<Appointment | null>(null);
  
  // Dados do novo cliente manual
  const [walkInData, setWalkInData] = useState({
      name: '',
      phone: '',
      birthDate: '',
      serviceIds: [] as string[],
      productIds: [] as string[]
  });

  useEffect(() => { localStorage.setItem('appointments', JSON.stringify(appointments)); }, [appointments]);

  const myAppointments = useMemo(() => 
    appointments.filter(a => a.barberId === user?.id && a.shopId === shop.id && a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime()),
  [appointments, user?.id, shop.id]);

  const handleCreateWalkIn = () => {
      if (!walkInData.name || !walkInData.phone || walkInData.serviceIds.length === 0) {
          addNotification('error', 'Preencha nome, telefone e ao menos um serviço.');
          return;
      }

      const totalServicePrice = walkInData.serviceIds.reduce((acc, sid) => acc + (SERVICES.find(s => s.id === sid)?.price || 0), 0);
      const totalProductPrice = walkInData.productIds.reduce((acc, pid) => acc + (PRODUCTS.find(p => p.id === pid)?.price || 0), 0);

      const newApt: Appointment = {
          id: `manual-${Date.now()}`,
          shopId: shop.id,
          clientId: `guest-${Date.now()}`,
          clientName: walkInData.name,
          clientPhone: walkInData.phone,
          barberId: user?.id || '',
          serviceIds: walkInData.serviceIds,
          date: new Date().toISOString(),
          status: 'SCHEDULED',
          totalPrice: totalServicePrice + totalProductPrice,
          isManual: true,
          products: walkInData.productIds.map(pid => {
              const p = PRODUCTS.find(prod => prod.id === pid);
              return { id: pid, name: p?.name || '', price: p?.price || 0, quantity: 1 };
          })
      };

      setAppointments(prev => [newApt, ...prev]);
      setShowWalkInModal(false);
      setWalkInData({ name: '', phone: '', birthDate: '', serviceIds: [], productIds: [] });
      addNotification('success', 'Atendimento manual iniciado!');
  };

  const handleFinishService = (apt: Appointment) => {
    const updatedApts = appointments.map(a => a.id === apt.id ? { ...a, status: 'COMPLETED' as const } : a);
    setAppointments(updatedApts);

    const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        shopId: shop.id,
        clientId: apt.clientId,
        clientName: apt.clientName || 'Cliente Externo',
        description: `Serviços Manuais: ${apt.serviceIds.map(s => SERVICES.find(sv => sv.id === s)?.name).join(', ')}`,
        amount: apt.totalPrice,
        date: new Date().toISOString(),
        status: 'PENDING',
        type: 'SERVICE',
        items: [
            ...apt.serviceIds.map(s => {
                const service = SERVICES.find(sv => sv.id === s);
                return { name: service?.name || 'Serviço', quantity: 1, price: service?.price || 0 };
            }),
            ...(apt.products || []).map(p => ({ name: p.name, quantity: p.quantity, price: p.price }))
        ]
    };

    const currentInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    localStorage.setItem('invoices', JSON.stringify([...currentInvoices, newInvoice]));

    setShowOSModal(false);
    addNotification('success', 'Finalizado e enviado ao caixa!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Minha Agenda</h1>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                   {new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'})}
                </p>
            </div>
            <button onClick={() => setShowWalkInModal(true)} className={UI_STYLE.button.primary}>
                <PlusCircle size={20}/> Atendimento Manual
            </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {myAppointments.length === 0 ? (
                <div className="p-20 text-center bg-white dark:bg-gray-800 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum atendimento para hoje</p>
                </div>
            ) : (
                myAppointments.map(apt => (
                    <div key={apt.id} className={`bg-white dark:bg-gray-800 p-8 rounded-[40px] border transition-all ${apt.status === 'COMPLETED' ? 'opacity-50 grayscale' : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center font-black shrink-0">
                                    <span className="text-2xl leading-none">{new Date(apt.date).getHours()}:{String(new Date(apt.date).getMinutes()).padStart(2, '0')}</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-2">{apt.clientName || 'Cliente App'}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {apt.serviceIds.map(sid => (
                                            <span key={sid} className="text-[9px] font-black uppercase px-3 py-1 bg-gray-100 dark:bg-gray-900 dark:text-gray-400 rounded-full">
                                                {SERVICES.find(s => s.id === sid)?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-gray-50 dark:border-gray-700">
                                <p className="text-2xl font-black text-amber-500 tracking-tighter">R$ {apt.totalPrice.toFixed(2)}</p>
                                <div className="flex gap-2">
                                    {apt.status !== 'COMPLETED' && (
                                        <>
                                            <button onClick={() => { setSelectedAptForOS(apt); setShowOSModal(true); }} className="p-4 bg-gray-900 dark:bg-amber-500 text-white rounded-2xl shadow-lg"><ShoppingBag size={20}/></button>
                                            <button onClick={() => handleFinishService(apt)} className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-green-500 rounded-2xl transition-colors"><UserCheck size={20}/></button>
                                        </>
                                    )}
                                    {apt.status === 'COMPLETED' && <div className="p-4 bg-green-500 text-white rounded-2xl"><Check size={20}/></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* MODAL WALK-IN (NOVO CLIENTE MANUAL) */}
      {showWalkInModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-[50px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-10 border-b dark:border-gray-700 flex justify-between items-center bg-gray-900 text-white">
                      <div className="flex items-center gap-4">
                          <UserPlus size={32} className="text-amber-500" />
                          <div>
                              <h2 className="text-2xl font-black uppercase tracking-tighter">Novo Atendimento Manual</h2>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cadastro Rápido de Balcão</p>
                          </div>
                      </div>
                      <button onClick={() => setShowWalkInModal(false)} className="text-gray-400 hover:text-white"><X size={32}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
                      <div className="p-10 space-y-8 border-r dark:border-gray-700">
                          <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest">1. Identificação do Cliente</h4>
                          <div className="space-y-4">
                              <div className="relative">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">Nome Completo</label>
                                  <input type="text" placeholder="Ex: Marcos Oliveira" className={UI_STYLE.input} value={walkInData.name} onChange={e => setWalkInData({...walkInData, name: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">WhatsApp</label>
                                      <div className="relative">
                                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                          <input type="tel" placeholder="(11) 99999-9999" className={UI_STYLE.input + " !pl-12"} value={walkInData.phone} onChange={e => setWalkInData({...walkInData, phone: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-1 block">Nascimento</label>
                                      <div className="relative">
                                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                          <input type="date" className={UI_STYLE.input + " !pl-12"} value={walkInData.birthDate} onChange={e => setWalkInData({...walkInData, birthDate: e.target.value})} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="p-10 space-y-8 bg-gray-50 dark:bg-gray-900/40">
                          <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest">2. Seleção de Itens</h4>
                          <div className="space-y-6">
                              <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Serviços</p>
                                  <div className="flex flex-wrap gap-2">
                                      {SERVICES.map(s => (
                                          <button 
                                            key={s.id} 
                                            onClick={() => setWalkInData(prev => ({ ...prev, serviceIds: prev.serviceIds.includes(s.id) ? prev.serviceIds.filter(id => id !== s.id) : [...prev.serviceIds, s.id] }))}
                                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${walkInData.serviceIds.includes(s.id) ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}
                                          >
                                              {s.name}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Produtos</p>
                                  <div className="flex flex-wrap gap-2">
                                      {PRODUCTS.map(p => (
                                          <button 
                                            key={p.id} 
                                            onClick={() => setWalkInData(prev => ({ ...prev, productIds: prev.productIds.includes(p.id) ? prev.productIds.filter(id => id !== p.id) : [...prev.productIds, p.id] }))}
                                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${walkInData.productIds.includes(p.id) ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}
                                          >
                                              {p.name}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-10 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                      <button onClick={handleCreateWalkIn} className={UI_STYLE.button.primary + " w-full !py-6"}>
                          <Save size={20} /> Iniciar Atendimento Agora
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
