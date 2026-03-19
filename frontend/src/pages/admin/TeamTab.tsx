import React from 'react';
import { Plus, Users, Edit3, Power, Lock, Trash2 } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  avatar?: string;
  active: boolean;
  specialties?: string[];
  commissionRate?: number;
}

interface TeamTabProps {
  teamMembers: TeamMember[];
  loadingTeam: boolean;
  handleOpenTeamModal: (member?: TeamMember) => void;
  handleToggleTeamMemberActive: (id: string) => void;
  handleOpenLockAgendaModal: (member: TeamMember) => void;
  handleDeleteTeamMember: (id: string, name: string) => void;
  TEAM_ROLE_LABELS: Record<string, string>;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  teamMembers,
  loadingTeam,
  handleOpenTeamModal,
  handleToggleTeamMemberActive,
  handleOpenLockAgendaModal,
  handleDeleteTeamMember,
  TEAM_ROLE_LABELS
}) => {
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
    </Card>
  );
};
