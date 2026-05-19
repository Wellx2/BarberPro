import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit3, Power, Lock, Trash2, UserCheck } from 'lucide-react';
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
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

export const TeamTab: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { addNotification } = useNotification();
  const { user, updateUserProfile } = useAuth();
  const [isLinking, setIsLinking] = useState(false);

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
        // Clean payload for API (remove frontend specific fields like active, workModel)
        const { active, workModel, ...cleanData } = teamForm;
        await teamService.create(cleanData as any);
        addNotification('success', 'Profissional adicionado com sucesso!');
      }
      setShowTeamModal(false);
      const data = await teamService.list(true);
      setTeamMembers(data);
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Erro ao salvar colaborador');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 600;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setTeamForm({ ...teamForm, avatar: compressedBase64 });
        addNotification('success', 'Foto carregada com sucesso!');
      } catch (error) {
        addNotification('error', 'Erro ao processar imagem');
      }
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

  const handleLinkToMe = async (barberId: string) => {
    if (isLinking) return;
    try {
      setIsLinking(true);
      // Atualiza no banco via userService e reflete no AuthContext
      await userService.update(user!.id, { barberId } as any);
      // Notar: Aqui usamos o userService direto porque o updateProfile do AuthContext 
      // pode ter restrições de DTO no backend.
      addNotification('success', 'Perfil vinculado com sucesso! Sua agenda agora está disponível no painel.');
      
      // Forçar recarregamento do usuário para ativar a aba híbrida
      window.location.reload(); 
    } catch (error: any) {
      addNotification('error', 'Erro ao vincular perfil');
    } finally {
      setIsLinking(false);
    }
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
              <Card key={member.id} className="relative overflow-hidden transition-all">
                {/* Badge de Status - Top Right */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg text-white ${member.active
                    ? 'bg-green-500'
                    : 'bg-red-500'
                    }`}>
                    <Power size={12} />
                    <span>{member.active ? 'Ativo' : 'Inativo'}</span>
                  </span>
                </div>

                <Card.Body className="p-4">
                  <div className={`flex items-start gap-4 mb-4 ${!member.active ? 'grayscale opacity-60' : ''}`}>
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-tenant-primary shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-tenant-primary/10 dark:bg-tenant-primary/20 flex items-center justify-center border-2 border-dashed border-tenant-primary/30">
                        <Users size={32} className="text-tenant-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg uppercase tracking-tight truncate">{member.name}</h4>
                      <p className="text-xs font-black text-tenant-primary uppercase tracking-widest leading-none mb-1">
                        {TEAM_ROLE_LABELS[member.role] || member.role}
                      </p>
                      {member.commissionRate !== undefined && (
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                          Comissão: {member.commissionRate}%
                        </p>
                      )}
                    </div>
                  </div>

                  {member.specialties && member.specialties.length > 0 && (
                    <div className={`mb-4 ${!member.active ? 'grayscale opacity-60' : ''}`}>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.slice(0, 3).map((spec, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-500 rounded-md">
                            {spec}
                          </span>
                        ))}
                        {member.specialties.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-400 rounded-md">
                            +{member.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões Unificados */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleOpenTeamModal(member)}
                      className="flex-1 min-w-[80px] p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                      <span className="text-xs font-bold">Editar</span>
                    </button>

                    <button
                      onClick={() => handleToggleTeamMemberActive(member.id)}
                      className={`flex-1 min-w-[80px] p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${member.active
                        ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 dark:text-green-400'
                        }`}
                      title={member.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power size={14} />
                      <span className="text-xs font-bold">{member.active ? 'Pausar' : 'Ativar'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenLockAgendaModal(member)}
                      disabled={!member.active}
                      className="flex-1 min-w-[80px] p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed text-purple-600 dark:text-purple-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      title={member.active ? 'Trancar Agenda' : 'Ative para trancar agenda'}
                    >
                      <Lock size={14} />
                      <span className="text-xs font-bold">Trancar</span>
                    </button>

                    <button
                      onClick={() => handleLinkToMe(member.id)}
                      disabled={isLinking}
                      className={`flex-1 min-w-[80px] p-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        user?.barberId === member.id
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border border-green-200'
                          : 'bg-tenant-primary/10 hover:bg-tenant-primary text-tenant-primary hover:text-white'
                      }`}
                      title="Vincular este barbeiro ao meu perfil de Administrador"
                    >
                      <UserCheck size={14} />
                      <span className="text-xs font-bold">{user?.barberId === member.id ? 'Meu Perfil' : 'Sou Eu'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTeamMember(member.id, member.name)}
                      disabled={!member.active}
                      className={`p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center justify-center ${!member.active ? 'grayscale opacity-40 cursor-not-allowed' : ''}`}
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
          <div className="flex flex-col gap-5 pb-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Especialidades (separadas por vírgula)</label>
                <Input 
                  value={teamForm.specialties?.join(', ') || ''} 
                  onChange={e => setTeamForm({ ...teamForm, specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })} 
                  placeholder="Corte Social, Barba, Pigmentação" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Breve Descrição / Bio</label>
                <textarea
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent transition-all duration-200"
                  rows={3}
                  value={teamForm.description || ''}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Descreva a experiência e diferenciais do profissional..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Foto do Profissional</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
                    {teamForm.avatar ? (
                      <img src={teamForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-gray-300" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Formatos: JPG, PNG • Max 1MB</p>
                  </div>
                </div>
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
