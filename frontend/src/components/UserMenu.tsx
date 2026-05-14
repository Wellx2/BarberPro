import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  UserCircle2,
  Shield,
  Scissors,
  CalendarDays,
  LayoutDashboard,
  Gift
} from 'lucide-react';
import { UserRole } from '../types';

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

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

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Botão de perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-800 transition-all group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-tenant-primary transition-colors flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-tenant-primary to-tenant-primary flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Nome e role - desktop only */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-bold text-white truncate max-w-[120px]">
            {user.name?.split(' ')[0]}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {roleLabels[user.role]}
          </span>
        </div>

        {/* Ícone dropdown */}
        <ChevronDown
          size={18}
          className={`hidden md:block text-gray-400 group-hover:text-tenant-primary transition-all ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in">
          {/* Header do Dropdown */}
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {/* Avatar grande */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-tenant-primary flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-tenant-primary to-tenant-primary flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info do usuário */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <RoleIcon size={14} className="text-tenant-primary flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-medium">
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>
            </div>

            {/* Email */}
            {user.email && (
              <p className="text-xs text-gray-400 mt-2 truncate">{user.email}</p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Meu Perfil */}
            <button
              onClick={handleProfile}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-tenant-primary flex items-center justify-center transition-colors">
                <User size={18} className="text-gray-300 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Meu Perfil</p>
                <p className="text-xs text-gray-400">Ver e editar perfil</p>
              </div>
            </button>

            {/* Dashboard - BARBER */}
            {user.role === UserRole.BARBER && (
              <button
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-tenant-primary flex items-center justify-center transition-colors">
                  <CalendarDays size={18} className="text-gray-300 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Minha Agenda</p>
                  <p className="text-xs text-gray-400">Ver agendamentos do dia</p>
                </div>
              </button>
            )}

            {/* Dashboard - CLIENT */}
            {user.role === UserRole.CLIENT && (
              <button
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-tenant-primary flex items-center justify-center transition-colors">
                  <LayoutDashboard size={18} className="text-gray-300 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Meus Agendamentos</p>
                  <p className="text-xs text-gray-400">Ver meus agendamentos</p>
                </div>
              </button>
            )}

            {/* Configurações - apenas para ADMIN/SUPER_ADMIN */}
            {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
              <>
                <button
                  onClick={() => {
                    navigate('/admin/referral');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-tenant-primary flex items-center justify-center transition-colors">
                    <Gift size={18} className="text-gray-300 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Indique e Ganhe</p>
                    <p className="text-xs text-gray-400">Recompensas por indicação</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-tenant-primary flex items-center justify-center transition-colors">
                    <Settings size={18} className="text-gray-300 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Configurações</p>
                    <p className="text-xs text-gray-400">Painel administrativo</p>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-700 mx-2"></div>

          {/* Sair */}
          <div className="py-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                <LogOut size={18} className="text-gray-300 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white group-hover:text-red-400">Sair</p>
                <p className="text-xs text-gray-400">Encerrar sessão</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
