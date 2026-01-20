import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ClientDashboard } from './client/ClientDashboard';
import { BarberDashboard } from './barber/BarberDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { Navigate } from 'react-router';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [viewAsClient, setViewAsClient] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    if (viewAsClient) return <ClientDashboard />;
    switch (user.role) {
      case UserRole.CLIENT: return <ClientDashboard />;
      case UserRole.BARBER: return <BarberDashboard />;
      case UserRole.ADMIN: return <AdminDashboard onViewVisitor={() => setViewAsClient(!viewAsClient)} isVisitorMode={viewAsClient} />;
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