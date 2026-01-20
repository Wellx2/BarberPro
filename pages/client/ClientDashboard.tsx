
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_APPOINTMENTS, SERVICES, PLANS, BARBERS, MOCK_SHOPS } from '../../constants';
import { Appointment, Review, Plan, Invoice } from '../../types';
import { useShop } from '../../context/ShopContext';
import { Calendar, Clock, CreditCard, Plus, User as UserIcon, Edit2, Trash2, X, AlertTriangle, Check, ChevronRight, UserX, Filter, Star, MessageSquare, ChevronLeft, Lock, Heart, Sun, Moon, Award, Gift, RefreshCw, CalendarPlus, Wallet, ShoppingBag, Package, Settings, Camera, LogOut, Save, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { Calendar as ReusableCalendar } from '../../components/Calendar';

export const ClientDashboard: React.FC = () => {
  const { user, deductCredit, updatePlan, toggleFavorite, updateUserProfile, logout } = useAuth();
  const { addNotification } = useNotification();
  const { isDarkMode, toggleTheme } = useTheme();
  const { shop } = useShop(); 
  const navigate = useNavigate();
  
  // Fix: Accessing settings.subscriptionEnabled directly as defined in Shop interface
  const subscriptionsActive = shop.settings.subscriptionEnabled;

  const bgMain = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSec = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-100';

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const stored = localStorage.getItem('appointments');
    return stored ? JSON.parse(stored) : MOCK_APPOINTMENTS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
      const stored = localStorage.getItem('reviews');
      return stored ? JSON.parse(stored) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
      const stored = localStorage.getItem('invoices');
      return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [reviews]);

  const myAppointments = appointments.filter(a => a.clientId === user?.id);
  const myOrders = invoices.filter(i => i.clientId === user?.id && i.type === 'PRODUCT').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const targetCuts = shop.loyaltyProgramTarget || 10;
  const completedCount = myAppointments.filter(a => a.status === 'COMPLETED' && a.shopId === shop.id).length;
  const stamps = completedCount % targetCuts; 
  const rewardsEarned = Math.floor(completedCount / targetCuts);

  const [activeHistoryTab, setActiveHistoryTab] = useState<'APPOINTMENTS' | 'ORDERS'>('APPOINTMENTS');

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'FUTURE' | 'LAST_30' | 'PAST'>('ALL');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
      name: '',
      phone: '',
      bio: '',
      birthDate: '',
      avatar: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (user) {
          setProfileData({
              name: user.name || '',
              phone: user.phone || '',
              bio: user.bio || '',
              birthDate: user.birthDate || '',
              avatar: user.avatar || ''
          });
      }
  }, [user, showProfileModal]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      updateUserProfile({
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          birthDate: profileData.birthDate,
          avatar: profileData.avatar
      });
      addNotification('success', 'Perfil atualizado com sucesso!', 'Perfil');
      setShowProfileModal(false);
  };

  const handleLogout = () => {
      if(window.confirm("Deseja realmente sair do aplicativo?")) {
          logout();
          navigate('/');
      }
  };

  const filteredAppointments = myAppointments.filter(apt => {
    if (statusFilter !== 'ALL') {
        if (statusFilter === 'CANCELLED') {
            if (apt.status !== 'CANCELLED' && apt.status !== 'CANCELLED_BY_BARBER') return false;
        } else if (apt.status !== statusFilter) {
            return false;
        }
    }
    const aptDate = new Date(apt.date);
    const now = new Date();
    if (dateFilter === 'FUTURE') {
        if (aptDate < now) return false;
    } else if (dateFilter === 'PAST') {
        if (aptDate >= now) return false;
    } else if (dateFilter === 'LAST_30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (aptDate < thirtyDaysAgo || aptDate >= now) return false;
    }
    return true;
  }).sort((a, b) => {
      if (dateFilter === 'FUTURE') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);

  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyApt, setEmergencyApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const myPlan = PLANS.find(p => p.id === user?.planId);

  const getServiceName = (id: string) => SERVICES.find(s => s.id === id)?.name;
  const getBarberName = (id: string) => BARBERS.find(b => b.id === id)?.name;
  const getShopName = (id: string) => MOCK_SHOPS.find(s => s.id === id)?.name || 'Unidade Desconhecida';
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const nextAppointment = myAppointments
    .filter(a => a.status === 'SCHEDULED' && new Date(a.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const handleDateSelect = (date: string) => {
      setNewDate(date);
      setNewTime(''); 
  };

  useEffect(() => {
    const cancelledByBarber = myAppointments.find(a => a.status === 'CANCELLED_BY_BARBER');
    if (cancelledByBarber) {
      setEmergencyApt(cancelledByBarber);
      setShowEmergencyModal(true);
    }
  }, []);

  const handleCancelClick = (apt: Appointment) => {
    setSelectedApt(apt);
    setShowCancelModal(true);
  };

  const getCancellationPolicy = (dateStr: string) => {
    const aptDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 1) {
      return { type: 'free', message: 'Cancelamento gratuito.', color: 'text-green-600', bg: 'bg-green-50' };
    } else {
      return { type: 'penalty', message: 'Cancelamento tardio (menos de 1h). Você perderá 1 crédito.', color: 'text-red-600', bg: 'bg-red-50' };
    }
  };

  const confirmCancellation = () => {
    if (!selectedApt) return;
    const aptDate = new Date(selectedApt.date);
    const now = new Date();
    const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1 && selectedApt.status !== 'CANCELLED_BY_BARBER') {
        deductCredit();
        addNotification('warning', 'Crédito descontado por cancelamento tardio.', 'Aviso');
    }
    setAppointments(prev => prev.map(a => a.id === selectedApt.id ? { ...a, status: 'CANCELLED' } : a));
    setShowCancelModal(false);
    setSelectedApt(null);
  };

  const handleRescheduleClick = (apt: Appointment) => {
    setSelectedApt(apt);
    setNewDate('');
    setNewTime('');
    setShowRescheduleModal(true);
  };

  const confirmReschedule = () => {
    if (!selectedApt || !newDate || !newTime) return;
    const newDateTime = new Date(`${newDate}T${newTime}:00`);
    setAppointments(prev => prev.map(a => a.id === selectedApt.id ? { ...a, date: newDateTime.toISOString(), status: 'SCHEDULED' } : a));
    setShowRescheduleModal(false);
    setShowEmergencyModal(false);
    setSelectedApt(null);
    addNotification('success', 'Horário reagendado!', 'Sucesso');
  };

  const handleRebookClick = (apt: Appointment) => {
      navigate('/book', { state: { preSelectedBarberId: apt.barberId } });
  };

  const handleRestoreClick = (apt: Appointment) => {
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'SCHEDULED' } : a));
      addNotification('success', 'Agendamento restaurado!', 'Sucesso');
  };

  const handleSelectPlan = (plan: Plan) => {
      setSelectedPlanForPayment(plan);
      setShowPlanModal(false);
      setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
      if (!selectedPlanForPayment || !user) return;
      setIsProcessingPayment(true);
      setTimeout(() => {
          setIsProcessingPayment(false);
          updatePlan(selectedPlanForPayment.id);
          setShowPaymentModal(false);
          addNotification('success', `Assinado: ${selectedPlanForPayment.name}!`, 'Sucesso');
      }, 2000);
  };

  const handleReviewClick = (apt: Appointment) => {
      setSelectedApt(apt);
      setReviewRating(5);
      setReviewComment('');
      setShowReviewModal(true);
  };

  const submitReview = () => {
      if (!selectedApt || !user) return;
      const newReview: Review = {
          id: `review-${Date.now()}`,
          appointmentId: selectedApt.id,
          barberId: selectedApt.barberId,
          clientId: user.id,
          clientName: user.name,
          rating: reviewRating,
          comment: reviewComment,
          date: new Date().toLocaleDateString('pt-BR')
      };
      setReviews(prev => [...prev, newReview]);
      setShowReviewModal(false);
      setSelectedApt(null);
      addNotification('success', 'Avaliação enviada!', 'Obrigado');
  };

  const hasReview = (aptId: string) => reviews.some(r => r.appointmentId === aptId);
  const handleToggleFavorite = (barberId: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(barberId); };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgMain}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <img src={user?.avatar || 'https://via.placeholder.com/150'} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md transition-transform group-hover:scale-105" />
                <div className="absolute bottom-0 right-0 bg-gray-900 text-white p-1 rounded-full border border-white dark:border-gray-800"><Settings size={12} /></div>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-bold ${textMain}`}>Olá, {user?.name}</h1>
                    <button onClick={() => setShowProfileModal(true)} className="text-gray-400 hover:text-amber-500 transition-colors"><Edit2 size={16} /></button>
                </div>
                <p className={textSec}>Seu painel pessoal BarberPro.</p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button onClick={toggleTheme} className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800 text-amber-400' : 'bg-white text-gray-600 shadow-sm'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <Link to="/book" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"><Plus size={20} /> Agendar</Link>
        </div>
      </div>

      {shop.loyaltyEnabled && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -top-6 -right-6 opacity-10"><Award size={140} /></div>
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 leading-none"><Award size={18} className="text-amber-300" /> Fidelidade</h3>
                        <p className="text-[10px] text-amber-200 mt-1 opacity-80">{shop.name}</p>
                      </div>
                      <div className="bg-white/20 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm border border-white/10 min-w-[70px]"><span className="text-lg font-bold leading-none">{stamps}/{targetCuts}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 justify-start mb-4">
                      {Array.from({ length: targetCuts }).map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/30 transition-all ${i < stamps ? 'bg-white text-amber-600 shadow-md scale-110 border-white' : 'bg-transparent text-white/40'}`}>
                              {i < stamps ? <Check size={16} strokeWidth={4} /> : <span className="text-xs font-bold leading-none">{i + 1}</span>}
                          </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium text-amber-100 border-t border-white/10 pt-3">
                      <p>{targetCuts - stamps} cortes restantes.</p>
                      {rewardsEarned > 0 && <span className="flex items-center gap-1 font-bold text-white bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30"><Gift size={12} /> {rewardsEarned} Prêmio</span>}
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
            {subscriptionsActive && (
                myPlan ? (
                    <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm font-medium">Plano Atual</p>
                            <h3 className="text-2xl font-bold text-amber-500 mb-6">{myPlan.name}</h3>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm"><span className="text-gray-300">Créditos de Corte</span><span className="font-bold">{user?.credits || 0} / 4</span></div>
                                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((user?.credits || 0) / 4) * 100)}%` }}></div></div>
                            </div>
                            <button onClick={() => setShowPlanModal(true)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all">Gerenciar</button>
                        </div>
                    </div>
                ) : (
                    <div className={`${bgCard} rounded-2xl p-6 shadow-sm border ${cardBorder}`}>
                        <h3 className={`text-lg font-bold ${textMain} mb-2`}>Perfil Avulso</h3>
                        <p className={`text-sm ${textSec} mb-6`}>Pague por visita. Assine para ter descontos exclusivos.</p>
                        <button onClick={() => setShowPlanModal(true)} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm transition-all hover:bg-amber-600">Ver Planos</button>
                    </div>
                )
            )}

            <div className={`${bgCard} rounded-2xl p-6 shadow-sm border ${cardBorder}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${textMain}`}><Clock size={20} className="text-amber-500" /> Próximo Agendamento</h3>
                {nextAppointment ? (
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-2"><span className={`font-bold text-lg ${textMain}`}>{new Date(nextAppointment.date).toLocaleDateString()}</span><span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Confirmado</span></div>
                        <p className={`${textSec} mb-1 flex items-center gap-2 text-sm`}><Clock size={14} />{new Date(nextAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className={`${textSec} mb-4 flex items-center gap-2 text-sm`}><UserIcon size={14} />{getBarberName(nextAppointment.barberId)}</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleRescheduleClick(nextAppointment)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-lg text-xs font-bold transition-colors">Reagendar</button>
                            <button onClick={() => handleCancelClick(nextAppointment)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-lg text-xs font-bold transition-colors">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <div className={`text-center py-8 ${textSec}`}><p className="text-sm">Nenhum agendamento futuro.</p><Link to="/book" className="text-amber-500 text-xs font-bold mt-2 inline-block uppercase tracking-widest">Agendar agora</Link></div>
                )}
            </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button onClick={() => setActiveHistoryTab('APPOINTMENTS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeHistoryTab === 'APPOINTMENTS' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Agendamentos</button>
                    <button onClick={() => setActiveHistoryTab('ORDERS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeHistoryTab === 'ORDERS' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Pedidos</button>
                </div>
            </div>

            <div className={`${bgCard} rounded-2xl shadow-sm border ${cardBorder} overflow-hidden`}>
                <div className="p-0">
                    {activeHistoryTab === 'APPOINTMENTS' ? (
                        filteredAppointments.length > 0 ? (
                            <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {filteredAppointments.map((apt) => (
                                    <div key={apt.id} className="p-6 flex flex-col gap-5 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className={`${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'} p-3 rounded-xl`}><Calendar size={20} /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-lg truncate ${textMain}`}>{new Date(apt.date).toLocaleDateString()}</h4>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{apt.status}</span>
                                                </div>
                                                <p className={`text-xs ${textSec} flex items-center gap-2 mb-2`}><Clock size={12} /> {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {getBarberName(apt.barberId)}</p>
                                                <div className="flex flex-wrap gap-1.5">{apt.serviceIds.map(sid => (<span key={sid} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{getServiceName(sid)}</span>))}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 gap-4">
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <span className={`text-lg font-black ${textMain}`}>R$ {apt.totalPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                {apt.status === 'SCHEDULED' && (
                                                    <>
                                                        <button onClick={() => handleRescheduleClick(apt)} className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all">Editar</button>
                                                        <button onClick={() => handleCancelClick(apt)} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all">Excluir</button>
                                                    </>
                                                )}
                                                {apt.status === 'COMPLETED' && !hasReview(apt.id) && (
                                                    <button onClick={() => handleReviewClick(apt)} className="w-full sm:flex-none px-6 py-2.5 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all">Avaliar</button>
                                                )}
                                                {(apt.status === 'CANCELLED' || apt.status === 'CANCELLED_BY_BARBER') && (
                                                    <button onClick={() => handleRestoreClick(apt)} className="w-full sm:flex-none px-6 py-2.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">Reativar</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`p-16 text-center ${textSec}`}><p>Nenhum agendamento encontrado.</p></div>
                        )
                    ) : (
                        myOrders.length > 0 ? (
                            <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {myOrders.map((order) => {
                                    const isCompleted = order.pickupStatus === 'COMPLETED';
                                    return (
                                        <div key={order.id} className="p-6 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className={`${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'} p-3 rounded-xl`}><ShoppingBag size={20} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`font-bold text-lg ${textMain}`}>Pedido #{order.id.slice(-6).toUpperCase()}</h4>
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{isCompleted ? 'Retirado' : 'Pendente'}</span>
                                                    </div>
                                                    <p className={`text-xs ${textSec} mb-3`}>{new Date(order.date).toLocaleDateString()} às {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <div className="space-y-1.5 mb-4">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className={`text-xs font-medium flex items-center justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                <span>{item.quantity}x {item.name}</span>
                                                                <span className="opacity-50">R$ {item.price.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 gap-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Total</span>
                                                            <span className={`text-2xl font-black ${textMain}`}>R$ {order.amount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                            <MapPin size={12} /> {getShopName(order.shopId)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`p-16 text-center ${textSec}`}><p>Você ainda não realizou pedidos.</p></div>
                        )
                    )}
                </div>
            </div>
        </div>
      </div>

      {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
              <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                      <h3 className="font-black uppercase tracking-tighter text-xl">Configurações de Perfil</h3>
                      <button type="button" onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  <div className="p-8 space-y-6 overflow-y-auto">
                      <div className="flex justify-center mb-4">
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <img src={profileData.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 shadow-md transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block tracking-widest">Nome Completo</label><input type="text" required className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm dark:text-white font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block tracking-widest">Telefone</label><input type="tel" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm dark:text-white font-bold" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block tracking-widest">Biografia</label><textarea className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm dark:text-white font-medium resize-none" rows={3} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} /></div>
                      </div>
                      <button type="submit" className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"><Save size={18} /> Salvar Alterações</button>
                      <button type="button" onClick={handleLogout} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[22px] transition-colors flex items-center justify-center gap-2"><LogOut size={16} /> Sair da Conta</button>
                  </div>
              </form>
          </div>
      )}

      {showCancelModal && selectedApt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-sm p-10 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Cancelar Agendamento?</h3>
                  <div className={`p-5 rounded-2xl mb-8 border ${getCancellationPolicy(selectedApt.date).bg} ${getCancellationPolicy(selectedApt.date).color}`}>
                      <p className="text-xs font-bold leading-relaxed">{getCancellationPolicy(selectedApt.date).message}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                      <button onClick={confirmCancellation} className="w-full py-5 bg-red-600 text-white rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-red-600/30 active:scale-95 transition-all">Confirmar Cancelamento</button>
                      <button onClick={() => setShowCancelModal(false)} className="w-full py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">Manter Agendamento</button>
                  </div>
              </div>
          </div>
      )}

      {showRescheduleModal && selectedApt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                      <h3 className="font-black uppercase tracking-tighter text-xl">Novo Horário</h3>
                      <button onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="p-8 overflow-y-auto space-y-10 bg-[#111827]">
                      <div className="p-6 bg-[#1f2937] rounded-[35px] border border-gray-700 shadow-inner">
                          <ReusableCalendar selectedDate={newDate} onDateSelect={handleDateSelect} />
                      </div>
                      
                      {newDate && (
                          <div className="grid grid-cols-3 gap-3">
                              {timeSlots.map(time => {
                                  const isSelected = newTime === time;
                                  return (
                                    <button 
                                        key={time} 
                                        onClick={() => setNewTime(time)} 
                                        className={`py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${
                                            isSelected 
                                            ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/40 scale-105' 
                                            : 'bg-[#1a222f] text-white border border-transparent hover:border-amber-500 hover:text-amber-500'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                  );
                              })}
                          </div>
                      )}
                      <button disabled={!newDate || !newTime} onClick={confirmReschedule} className="w-full py-6 bg-amber-500 text-white rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                          <Check size={18} strokeWidth={3} /> Confirmar Reagendamento
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showReviewModal && selectedApt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-[50px] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 text-center">Como foi sua experiência?</h3>
                  <div className="flex gap-2 mb-10">
                      {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setReviewRating(s)} className="transition-transform active:scale-90"><Star size={36} className={`${s <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`} /></button>
                      ))}
                  </div>
                  <textarea className="w-full p-6 bg-gray-50 dark:bg-gray-900 rounded-[30px] border-none text-sm font-medium dark:text-white resize-none mb-8" rows={4} placeholder="Deixe seu elogio ou sugestão..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                  <button onClick={submitReview} className="w-full py-5 bg-amber-500 text-white rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-500/20 transition-all active:scale-95">Publicar Avaliação</button>
                  <button onClick={() => setShowReviewModal(false)} className="mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Pular por enquanto</button>
              </div>
          </div>
      )}

    </div>
    </div>
  );
};
