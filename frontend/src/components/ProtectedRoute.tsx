
import React from 'react';
// Fix: Import Navigate and useLocation from react-router to resolve export errors in some environments
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redireciona para login mantendo a origem para retornão posterior
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
    // Se o usuário não tem a role necessária, manda para o dashboard padrão dele
    return <Navigate to="/dashboard" replace />;
  }

  // Se user existe mas não tem role, redireciona para login
  if (user && !user.role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
