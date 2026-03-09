import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { BlockedPeriod } from '../../types';
import { Plus, X, Lock, Calendar, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { Button, Card, Input, Select } from '../../components/ui';
import { Container } from '../../components/layout/Container';
import { Grid } from '../../components/layout/Grid';
import { Modal } from '../../components/feedback';

export const ScheduleBlocks: React.FC = () => {
  const { user } = useAuth();
  const { shop } = useShop();
  const { addNotification } = useNotification();

  const [blocks, setBlocks] = useState<BlockedPeriod[]>(() =>
    JSON.parse(localStorage.getItem('blocked_periods') || '[]')
  );

  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedPeriod | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isRecurring: false,
    recurringDays: [] as string[]
  });

  const myBlocks = useMemo(() =>
    (blocks as any[]).filter((b: any) => b.barberId === user?.id)
      .sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()),
    [blocks, user?.id]
  );

  const handleAddBlock = () => {
    if (!formData.startDate || !formData.startTime || !formData.reason) {
      addNotification('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const newBlock: any = {
      id: editingBlock?.id || `block-${Date.now()}`,
      barberId: user?.id || '',
      date: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate || formData.startDate,
      endTime: formData.endTime || '23:59',
      type: 'RANGE',
      reason: formData.reason,
      isRecurring: formData.isRecurring,
      recurringDays: formData.recurringDays,
      createdAt: new Date().toISOString()
    };

    const updated = editingBlock
      ? blocks.map(b => b.id === editingBlock.id ? newBlock : b)
      : [...blocks, newBlock];

    setBlocks(updated);
    localStorage.setItem('blocked_periods', JSON.stringify(updated));

    setShowModal(false);
    setFormData({ reason: '', startDate: '', startTime: '', endDate: '', endTime: '', isRecurring: false, recurringDays: [] });
    setEditingBlock(null);

    addNotification('success', editingBlock ? 'Bloqueio atualizado!' : 'Bloqueio criado com sucesso!');
  };

  const handleEdit = (block: any) => {
    setFormData({
      reason: block.reason || '',
      startDate: block.date,
      startTime: block.startTime || '',
      endDate: block.endDate,
      endTime: block.endTime || '',
      isRecurring: block.isRecurring || false,
      recurringDays: block.recurringDays || []
    });
    setEditingBlock(block);
    setShowModal(true);
  };

  const handleDelete = (blockId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este bloqueio?')) return;
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    localStorage.setItem('blocked_periods', JSON.stringify(updated));
    addNotification('success', 'Bloqueio removido!');
  };

  const openNewModal = () => {
    setFormData({ reason: '', startDate: '', startTime: '', endDate: '', endTime: '', isRecurring: false, recurringDays: [] });
    setEditingBlock(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-20">
      <Container size="xl" className="py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bloqueios de Horários</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Gerencie seus períodos indisponíveis</p>
          </div>
          <Button onClick={openNewModal} variant="primary" className="gap-2">
            <Plus size={20} /> Novo Bloqueio
          </Button>
        </div>

        {/* Blocks Grid */}
        {myBlocks.length === 0 ? (
          <Card className="text-center py-16">
            <Lock size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum bloqueio criado</p>
            <Button onClick={openNewModal} variant="primary" className="mt-6 mx-auto">
              Criar Bloqueio
            </Button>
          </Card>
        ) : (
          <Grid cols={2} gap="lg">
            {myBlocks.map(block => (
              <Card key={block.id} className="relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(block)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Calendar size={18} className="text-amber-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-red-500" />
                  </button>
                </div>

                <Card.Body className="space-y-4">
                  <div className="pr-20">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase mb-2">{(block as any).reason || 'Bloqueio'}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {new Date((block as any).date || block.date).toLocaleDateString('pt-BR')}
                          {(block as any).endDate && (block as any).endDate !== block.date && ` até ${new Date((block as any).endDate).toLocaleDateString('pt-BR')}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={14} />
                        <span>
                          {(block as any).startTime || '00:00'} até {(block as any).endTime || '23:59'}
                        </span>
                      </div>
                      {(block as any).isRecurring && (
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg w-fit mt-2 uppercase">
                          📅 Recorrente: {(block as any).recurringDays?.join(', ') || 'Diariamente'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Criado: {new Date((block as any).createdAt || block.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Grid>
        )}
      </Container>

      {/* Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={e => { e.preventDefault(); handleAddBlock(); }} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase text-gray-900 dark:text-white">
                {editingBlock ? 'Editar Bloqueio' : 'Novo Bloqueio de Horários'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest mt-1">
                Marque os períodos em que você não estará disponível
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Ex: Médico, Almoço, Evento"
                label="Motivo"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
              />

              <Grid cols={2} gap="lg">
                <Input
                  type="date"
                  label="Data Inicial"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
                <Input
                  type="time"
                  label="Hora Inicial"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>

              <Grid cols={2} gap="lg">
                <Input
                  type="date"
                  label="Data Final"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
                <Input
                  type="time"
                  label="Hora Final"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-5 h-5 rounded accent-amber-500"
                  />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Repetir semanalmente?</span>
                </label>

                {formData.isRecurring && (
                  <div className="flex flex-wrap gap-2">
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            recurringDays: prev.recurringDays.includes(day)
                              ? prev.recurringDays.filter(d => d !== day)
                              : [...prev.recurringDays, day]
                          }))
                        }
                        className={`w-10 h-10 rounded-lg font-bold text-xs transition-all ${formData.recurringDays.includes(day)
                          ? 'bg-amber-500 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600'
                          }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" fullWidth className="font-black">
                {editingBlock ? 'Atualizar Bloqueio' : 'Criar Bloqueio'}
              </Button>
              <Button type="button" onClick={() => setShowModal(false)} variant="outline" fullWidth>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
