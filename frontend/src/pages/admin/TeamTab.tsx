import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit3, Power, Lock, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/ui';
import { Modal } from '../../components/feedback';
import { 
  TeamMember, 
  TeamMemberRole, 
  TEAM_ROLE_LABELS, 
  BarberWorkModel, 
  WORK_MODEL_LABELS, 
  CreateTeamMemberDto 
} from '../../types';
import { teamService } from '../../services/teamService';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { AgendaLockModal } from '../../components/modals/AgendaLockModal';

export const TeamTab: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { addNotification } = useNotification();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [editTeamMember, setEditTeamMember] = useState<TeamMember | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState<CreateTeamMemberDto>({
    name: '',
    email: '',
    phone: '',
    role: TeamMemberRole.BARBER,
    specialties: [],
    description: '',
    commissionRate: 50,
    workModel: BarberWorkModel.COMMISSION_ONLY,
    active: true,
  });

  const [showLockAgendaModal, setShowLockAgendaModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!currentShop?.id) return;

    const loadTeam = async () => {
      try {
        setLoadingTeam(true);
        const data = await teamService.list(true);
        setTeamMembers(data);
      } catch (error) {
        console.error('Erro ao carregar equipe:', error);
        addNotification('error', 'Erro ao carregar equipe');
      } finally {
        setLoadingTeam(false);
      }
    };

    loadTeam();
  }, [currentShop?.id, addNotification]);

  const handleOpenTeamModal = (member?: TeamMember) => {
    if (member) {
      setEditTeamMember(member);
      setTeamForm({
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        role: member.role as TeamMemberRole,
        specialties: member.specialties || [],
        description: member.description || '',
        commissionRate: member.commissionRate || 50,
        workModel: (member as any).workModel || BarberWorkModel.COMMISSION_ONLY,
        active: member.active,
        avatar: member.avatar
      });
    } else {
      setEditTeamMember(null);
      setTeamForm({
        name: '', email: '', phone: '',
        role: TeamMemberRole.BARBER,
        specialties: [], description: '',
        commissionRate: 50,
        workModel: BarberWorkModel.COMMISSION_ONLY,
        active: true
      });
    }
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async () => {
    if (!teamForm.name.trim()) {
      addNotification('error', 'Nome é obrigatário');
      return;
    }
    try {
      if (editTeamMember) {
        await teamService.update(editTeamMember.id, teamForm);
        addNotification('success', 'Profissional atualizado com sucesso!');
      } else {
        await teamService.create(teamForm);
        addNotification('success', 'Profissional adicionado com sucesso!');
      }
      setShowTeamModal(false);
      const data = await teamService.list(true);
      setTeamMembers(data);
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Erro ao salvar colaborador');
    }
  };

  const handleToggleTeamMemberActive = async (id: string) => {
    try {
      await teamService.toggleActive(id);
      setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
      addNotification('success', 'Status atualizado!');
    } catch (error) {
      addNotification('error', 'Erro ao alterar status');
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    const reason = window.prompt(`Tem certeza que deseja remover ${name}? Por favor, informe o motivo:`);
    if (reason === null) return;
    if (!reason.trim()) {
      addNotification('error', 'O motivo da remoção é obrigatório');
      return;
    }
    try {
      await teamService.remove(id, reason);
      setTeamMembers(prev => prev.filter(m => m.id !== id));
      addNotification('success', 'Profissional removido');
    } catch (error) {
      addNotification('error', 'Erro ao remover profissional');
    }
  };

  const handleOpenLockAgendaModal = (member: TeamMember) => {
    setSelectedTeamMember(member);
    setShowLockAgendaModal(true);
  };
  return (
    <Card>
      <Card.Body className="space-y-4">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Time de Profissionais</h3>
          <Button
            size="md"
            variant="primary"
            icon={<Plus size={20} />}
            onClick={() => handleOpenTeamModal()}
            className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
            aria-label="Adicionar Colaborador"
          >
            <span className="hidden sm:inline">Adicionar Colaborador</span>
          </Button>
        </div>

        {loadingTeam ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando equipe...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum colaborador cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map(member => (
              <Card key={member.id} className={`relative transition-all ${!member.active ? 'opacity-60' : ''}`}>
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.active
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {member.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <Card.Body className="p-4">
                  <div className="flex items-start gap-4 mb-4">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-tenant-primary"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-tenant-primary/10 dark:bg-tenant-primary/20 flex items-center justify-center">
                        <Users size={32} className="text-tenant-primary dark:text-tenant-primary" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{member.name}</h4>
                      <p className="text-sm font-medium text-tenant-primary dark:text-tenant-primary">
                        {TEAM_ROLE_LABELS[member.role] || member.role}
                      </p>
                      {member.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</p>
                      )}
                    </div>
                  </div>

                  {member.specialties && member.specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Especialidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((spec, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.commissionRate !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <strong>Comissão:</strong> {member.commissionRate}%
                    </p>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleOpenTeamModal(member)}
                      className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                      <span className="text-xs font-bold">Editar</span>
                    </button>

                    <button
                      onClick={() => handleToggleTeamMemberActive(member.id)}
                      className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${member.active
                        ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 dark:text-green-400'
                        }`}
                      title={member.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power size={14} />
                      <span className="text-xs font-bold">{member.active ? 'Desativar' : 'Ativar'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenLockAgendaModal(member)}
                      disabled={!member.active}
                      className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed text-purple-600 dark:text-purple-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      title={member.active ? 'Trancar Agenda' : 'Ative para trancar agenda'}
                    >
                      <Lock size={14} />
                      <span className="text-xs font-bold hidden sm:inline">Trancar</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTeamMember(member.id, member.name)}
                      className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center justify-center"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Card.Body>

      {/* Modais */}
      {showTeamModal && (
        <Modal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          size="lg"
          title={editTeamMember ? 'Editar Colaborador' : 'Novo Colaborador'}
        >
          <div className="flex flex-col gap-5 pb-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome Completo *</label>
                <Input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="João Silva" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Função/Cargo *</label>
                <Select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value as TeamMemberRole })}>
                  {Object.entries(TEAM_ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                  <Input type="email" value={teamForm.email || ''} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="joao@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                  <Input type="tel" value={teamForm.phone || ''} onChange={e => setTeamForm({ ...teamForm, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>

              {(teamForm.role === TeamMemberRole.BARBER || teamForm.role === TeamMemberRole.HAIRDRESSER) && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Taxa de Comissão (%)</label>
                    <Input type="number" min="0" max="100" value={teamForm.commissionRate} onChange={e => setTeamForm({ ...teamForm, commissionRate: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Modelo de Trabalho *</label>
                    <Select value={teamForm.workModel} onChange={e => setTeamForm({ ...teamForm, workModel: e.target.value as BarberWorkModel })}>
                      {Object.entries(WORK_MODEL_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL da Foto</label>
                <Input type="url" value={teamForm.avatar || ''} onChange={e => setTeamForm({ ...teamForm, avatar: e.target.value })} placeholder="https://exemplo.com/foto.jpg" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setShowTeamModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveTeamMember} variant="primary" className="flex-1">
                {editTeamMember ? 'Salvar Alterações' : 'Adicionar Colaborador'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showLockAgendaModal && selectedTeamMember && (
        <AgendaLockModal
          memberId={selectedTeamMember.id}
          selectedDate={new Date()}
          shop={currentShop!}
          onClose={() => setShowLockAgendaModal(false)}
          onCheckConflicts={(data) => teamService.checkConflicts(data)}
          onConfirm={async (data) => {
            try {
              await teamService.createLock({ teamMemberId: selectedTeamMember.id, ...data });
              setShowLockAgendaModal(false);
              addNotification('success', 'Agenda bloqueada com sucesso!');
            } catch (error: any) {
              addNotification('error', error.response?.data?.message || 'Erro ao bloquear agenda');
            }
          }}
        />
      )}
    </Card>
  );
};
