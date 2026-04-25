import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  X,
  Shield,
  Scissors,
  UserCircle2,
  ArrowLeft,
  LogOut,
  Eye,
  EyeOff,
  Bell,
  BellOff
} from 'lucide-react';
import { UserRole } from '../types';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

export const UserProfile: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // 🛡️ LGPD: Global notification preference (synced to API)
  const [globalPushEnabled, setGlobalPushEnabled] = useState<boolean>(
    (user as any)?.globalPushEnabled !== false // default true
  );
  const [isSavingPush, setIsSavingPush] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Mapear roles para labels em português
  const roleLabels = {
    [UserRole.CLIENT]: 'Cliente',
    [UserRole.BARBER]: 'Barbeiro(a)',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.SUPER_ADMIN]: 'Super Admin',
  };

  // Ícone baseado não role
  const RoleIcon = user.role === UserRole.BARBER ? Scissors :
    user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN ? Shield :
      UserCircle2;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification('error', 'A imagem deve ter não máximo 5MB', 'Erro');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Validações
    if (!formData.name.trim()) {
      addNotification('error', 'O nome é obrigatório', 'Erro de Validação');
      return;
    }

    if (!formData.email.trim()) {
      addNotification('error', 'O email é obrigatório', 'Erro de Validação');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addNotification('error', 'Email inválido', 'Erro de Validação');
      return;
    }

    // Se está tentando mudar a senha
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        addNotification('error', 'Informe a senha atual para alterar a senha', 'Erro de Validação');
        return;
      }

      if (formData.newPassword.length < 6) {
        addNotification('error', 'A nova senha deve ter não mínimo 6 caracteres', 'Erro de Validação');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        addNotification('error', 'As senhas não coincidem', 'Erro de Validação');
        return;
      }
    }

    // Atualizar usuário não backend
    setIsSaving(true);

    // Preparar DTO para o backend
    const profileData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    if (formData.newPassword) {
      profileData.password = formData.newPassword;
      profileData.currentPassword = formData.currentPassword;
    }

    updateUserProfile(profileData)
      .then(() => {
        addNotification('success', 'Perfil atualizado com sucesso!', 'Sucesso');
        setIsEditing(false);
        setAvatarPreview(null);

        // Limpar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      })
      .catch((error) => {
        addNotification('error', error.message || 'Erro ao atualizar perfil', 'Erro');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const displayAvatar = avatarPreview || user.avatar;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl font-bold"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Cover & Avatar Section */}
          <div className="relative h-32 bg-gradient-to-br from-tenant-primary to-orange-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div
                  className={`w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={handleAvatarClick}
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={user?.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-tenant-primary to-tenant-primary flex items-center justify-center">
                      <User size={48} className="text-white" />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-2 right-2 bg-tenant-primary text-white rounded-full p-2 shadow-lg hover:opacity-90 transition-colors"
                  >
                    <Camera size={18} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="absolute top-4 right-4">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <User size={18} />
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 pb-8 px-8">
            {/* Name & Role */}
            <div className="mb-8">
              {!isEditing ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {user.name}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <RoleIcon size={20} className="text-tenant-primary" />
                    <span className="font-semibold">{roleLabels[user.role]}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                {!isEditing ? (
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Mail size={18} className="text-gray-400" />
                    <span>{user.email || 'Não informado'}</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                {!isEditing ? (
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>{user.phone || 'Não informado'}</span>
                  </div>
                ) : (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="(00) 00000-0000"
                  />
                )}
              </div>
            </div>

            {/* Change Password Section - Only when editing */}
            {isEditing && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Lock size={24} className="text-tenant-primary" />
                  Alterar Senha
                </h3>

                <div className="grid md:grid-cols-1 gap-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-tenant-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  * Deixe em branco se não deseja alterar a senha
                </p>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Informações da Conta
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tipo de Conta:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{user ? roleLabels[user.role] : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID Público:</span>
                  <span className="font-mono text-gray-900 dark:text-white">#{user?.id?.split('-')[0].toUpperCase() || '---'}</span>
                </div>
                {user?.shopId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID Barbearia:</span>
                    <span className="font-mono text-gray-900 dark:text-white">#{user.shopId.split('-')[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preferências LGPD */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {globalPushEnabled ? <Bell size={18} className="text-tenant-primary" /> : <BellOff size={18} className="text-gray-400" />}
                Preferências de Privacidade
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Notificações & Lembretes</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {globalPushEnabled ? 'Você receberá lembretes de agendamentos (LGPD)' : 'Notificações desativadas globalmente'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={globalPushEnabled}
                    disabled={isSavingPush}
                    onChange={async (e) => {
                      const newVal = e.target.checked;
                      setGlobalPushEnabled(newVal);
                      setIsSavingPush(true);
                      try {
                        await api.put('/auth/profile', { globalPushEnabled: newVal });
                        // Pedir permissão do browser se ativar
                        if (newVal && 'Notification' in window && Notification.permission !== 'granted') {
                          Notification.requestPermission();
                        }
                        addNotification('success', newVal ? 'Notificações ativadas' : 'Notificações desativadas', 'Preferências salvas');
                      } catch {
                        setGlobalPushEnabled(!newVal); // revert on error
                        addNotification('error', 'Erro ao salvar preferência. Tente novamente.', 'Erro');
                      } finally {
                        setIsSavingPush(false);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-tenant-primary disabled:opacity-50"></div>
                </label>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Você pode alterar individualmente por agendamento no seu painel de clientes.
              </p>
            </div>

            {/* Ações de Edição (Botões no final) */}
            {isEditing && (
              <div className="flex gap-4 mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-4 rounded-2xl font-black uppercase tracking-[0.1em] shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 bg-tenant-primary hover:bg-tenant-primary/90 text-white py-4 rounded-2xl font-black uppercase tracking-[0.1em] shadow-lg shadow-tenant-primary/20 transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
