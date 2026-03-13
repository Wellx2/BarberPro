import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ClientDashboard } from './client/ClientDashboard';
import { BarberDashboard } from './barber/BarberDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { SuperAdminDashboard } from './admin/SuperAdminDashboard';
import { Navigate } from 'react-router';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [viewAsClient, setViewAsClient] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Validação adicional de segurança
  if (!user.role) {
    console.error('Usuário sem permissões definidas');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="nãone" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Erro de Autenticação
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Não foi possível identificar suas permissões. Por favor, faça login novamente.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-gradient-to-r from-tenant-primary to-tenant-primary text-white font-bold rounded-lg hover:from-tenant-primary hover:to-tenant-primary transition-all"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (viewAsClient) return <ClientDashboard />;
    switch (user.role) {
      case UserRole.CLIENT: return <ClientDashboard />;
      case UserRole.BARBER: return <BarberDashboard />;
      case UserRole.ADMIN: return <AdminDashboard onViewVisitor={() => setViewAsClient(!viewAsClient)} isVisitorMode={viewAsClient} />;
      case UserRole.SUPER_ADMIN: return <SuperAdminDashboard />;
      default: return <Navigate to="/" replace />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};