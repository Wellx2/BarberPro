
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { BlockedPeriod, Barber, UserRole } from '../../types';
import { BARBERS } from '../../constants';
import { 
  Lock, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Plus, 
  X, 
  ChevronLeft, 
  CalendarRange,
  Check,
  Scissors
} from 'lucide-react';
import { Calendar } from '../../components/Calendar';

export const ScheduleBlocks: React.FC<{ onBack: () => void, targetBarberId?: string }> = ({ onBack, targetBarberId }) => {
  const { user } = useAuth();
  const { shop } = useShop();
  const { addNotification } = useNotification();
  
  const [blocks, setBlocks] = useState<BlockedPeriod[]>(() => JSON.parse(localStorage.getItem('blocked_periods') || '[]'));
  const [allBarbers] = useState<Barber[]>(() => JSON.parse(localStorage.getItem('barbers') || JSON.stringify(BARBERS)));
  
  const [selectedBarberId] = useState(targetBarberId || (user?.role === UserRole.BARBER ? user.id : ''));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  
  const [blockType, setBlockType] = useState<'DAY' | 'TIME' | 'RANGE'>('DAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const currentBarber = useMemo(() => allBarbers.find(b => b.id === selectedBarberId), [allBarbers, selectedBarberId]);
  const timeSlots = useShop().generateTimeSlots();

  const myBlocks = useMemo(() => {
    return blocks.filter(b => b.barberId === selectedBarberId)
                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [blocks, selectedBarberId]);

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberId) return;

    if (blockType === 'RANGE' && (!selectedDate || !endDate)) {
        addNotification('error', 'Selecione o período completo.');
        return;
    }

    const newBlock: BlockedPeriod = {
      id: `block-${Date.now()}`,
      barberId: selectedBarberId,
      date: selectedDate,
      endDate: blockType === 'RANGE' ? endDate : undefined,
      type: blockType,
      startTime: blockType === 'TIME' ? startTime : undefined,
      endTime: blockType === 'TIME' ? endTime : undefined,
      blockedBy: user?.role === UserRole.ADMIN ? 'ADMIN' : 'BARBER'
    };

    const updatedBlocks = [newBlock, ...blocks];
    setBlocks(updatedBlocks);
    localStorage.setItem('blocked_periods', JSON.stringify(updatedBlocks));
    
    addNotification('success', 'Ausência registrada com sucesso!');
    // Reset apenas das datas após salvar
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
  };

  const removeBlock = (id: string) => {
    if (!window.confirm("Remover este bloqueio?")) return;
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    localStorage.setItem('blocked_periods', JSON.stringify(updated));
    addNotification('info', 'Bloqueio removido.');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-32 animate-fade-in">
      
      {/* TÍTULO E VOLTAR - REMOVIDO HEADER DUPLICADO */}
      <div className="max-w-xl mx-auto w-full p-6 pt-10 space-y-8">
          <div className="flex items-center gap-6">
              <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5 shadow-xl">
                  <ChevronLeft size={28} />
              </button>
              <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Ausências</h1>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Configuração de Horários e Férias</p>
              </div>
          </div>

          {/* CARD DO PROFISSIONAL - IGUAL AO PRINT */}
          <div className="bg-[#1e293b]/50 border border-white/5 rounded-[50px] p-10 flex flex-col items-center text-center shadow-2xl">
                <div className="relative mb-6">
                    <img src={currentBarber?.avatar} className="w-28 h-28 rounded-full border-4 border-[#0f172a] shadow-2xl object-cover" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{currentBarber?.name}</h3>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">{shop.name}</p>
          </div>

          {/* FORMULÁRIO DIRETO - SEM MODAL (CLIQUE ÚNICO) */}
          <div className="space-y-8 bg-gray-900/50 p-8 rounded-[40px] border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Lock size={18}/></div>
                  <h2 className="text-sm font-black uppercase tracking-widest">Novo Bloqueio</h2>
              </div>

              <div className="space-y-6">
                  {/* SELEÇÃO DE TIPO */}
                  <div className="grid grid-cols-3 gap-2">
                      {[
                          { id: 'TIME', label: 'Hora', icon: Clock },
                          { id: 'DAY', label: 'Dia', icon: CalendarIcon },
                          { id: 'RANGE', label: 'Férias', icon: CalendarRange }
                      ].map(t => (
                          <button 
                            key={t.id} 
                            type="button" 
                            onClick={() => { setBlockType(t.id as any); setEndDate(''); }} 
                            className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${blockType === t.id ? 'bg-amber-500 border-amber-500 text-white shadow-xl' : 'bg-gray-800 border-white/5 text-gray-500'}`}
                          >
                              <t.icon size={20} className="mb-2" />
                              <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                          </button>
                      ))}
                  </div>

                  {/* CALENDÁRIO INTEGRADO */}
                  <div className="bg-gray-800 rounded-[35px] p-4 border border-white/5">
                      <Calendar 
                          selectedDate={selectedDate} 
                          selectedEndDate={blockType === 'RANGE' ? endDate : undefined}
                          onDateSelect={setSelectedDate} 
                          onEndDateSelect={blockType === 'RANGE' ? setEndDate : undefined}
                          isRangeMode={blockType === 'RANGE'}
                      />
                  </div>

                  {/* SELEÇÃO DE HORA SE NECESSÁRIO */}
                  {blockType === 'TIME' && (
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[9px] font-black uppercase text-gray-500 ml-2 mb-1 block">Início</label>
                              <select className="w-full bg-gray-800 border-none p-4 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-amber-500" value={startTime} onChange={e => setStartTime(e.target.value)}>
                                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-[9px] font-black uppercase text-gray-500 ml-2 mb-1 block">Fim</label>
                              <select className="w-full bg-gray-800 border-none p-4 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-amber-500" value={endTime} onChange={e => setEndTime(e.target.value)}>
                                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                      </div>
                  )}

                  <button 
                    onClick={handleSaveBlock}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                      <Check size={20} strokeWidth={4} /> Confirmar Bloqueio
                  </button>
              </div>
          </div>

          {/* EXPLICAÇÃO */}
          <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
              <p className="text-gray-400 text-[11px] font-medium leading-relaxed">
                  Os bloqueios impedem que clientes agendem nestes horários. Use "Dia" para folgas pontuais e "Férias" para períodos longos.
              </p>
          </div>

          {/* HISTÓRICO DE AUSÊNCIAS (ARQUIVO) - RESTAURADO E FIXO NO FINAL */}
          <div className="pt-10 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                      <CalendarRange size={14}/> Arquivo de Bloqueios
                  </h4>
                  <span className="text-[10px] font-bold text-amber-500/50">{myBlocks.length} registros</span>
              </div>

              <div className="space-y-4">
                  {myBlocks.length === 0 ? (
                      <div className="py-12 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10 opacity-30">
                          <p className="text-[10px] font-black uppercase tracking-widest">Sem bloqueios ativos</p>
                      </div>
                  ) : (
                      myBlocks.map(block => (
                          <div key={block.id} className="bg-white/5 p-6 rounded-[30px] border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                              <div className="flex items-center gap-5">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${block.type === 'RANGE' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                      {block.type === 'RANGE' ? <CalendarRange size={20} /> : <CalendarIcon size={20} />}
                                  </div>
                                  <div>
                                      <p className="font-black uppercase text-xs leading-none mb-1.5">
                                          {new Date(block.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                          {block.endDate && ` a ${new Date(block.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                                      </p>
                                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                          {block.type === 'TIME' ? `${block.startTime}h às ${block.endTime}h` : block.type === 'RANGE' ? 'Férias / Licença' : 'Indisponibilidade Total'}
                                      </p>
                                  </div>
                              </div>
                              <button onClick={() => removeBlock(block.id)} className="p-3 text-gray-600 hover:text-red-500 transition-colors">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
