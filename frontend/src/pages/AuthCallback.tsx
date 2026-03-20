
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { LoadingSkeletonCompact } from '../components/LoadingSkeleton';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { validateSession } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (accessToken && refreshToken) {
        try {
          // Salvar os tokens e buscar os dados do usuário
          // Vou precisar adaptar o AuthContext para facilitar isso
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          await validateSession();
          
          addNotification('success', 'Login com Google realizado com sucesso!');
          navigate('/dashboard');
        } catch (error) {
          console.error('Erro ao processar tokens do Google:', error);
          addNotification('error', 'Falha ao processar login com Google.');
          navigate('/login');
        }
      } else {
        addNotification('error', 'Tokens não encontrados na resposta do Google.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, addNotification]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <LoadingSkeletonCompact />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
          Finalizando sua autenticação...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
