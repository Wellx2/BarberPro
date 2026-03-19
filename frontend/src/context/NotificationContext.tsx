import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
}

interface NotificationContextType {
  addNotification: (type: NotificationType, message: string, title?: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Solicitar permissão de Web Push Notifications ao montar
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Web Push Notifications ativadas
        }
      });
    }
  }, []);

  const addNotification = useCallback((type: NotificationType, message: string, title?: string) => {
    // Diparar Web Push Notification de verdade (API do Navegador)
    if ('Notification' in window && Notification.permission === 'granted') {
      // Disparar Web Push apenas acompanhado de um aviso visual se necessário.
      // E evitar duplicatas
      try {
        new Notification(title || 'Klypbarber', {
          body: message,
          icon: '/pwa-192x192.svg',
          badge: '/pwa-192x192.svg'
        });
      } catch (e) {
        // Fallback for mobile browsers that require Service Worker registration to show notifications
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title || 'Klypbarber', {
              body: message,
              icon: '/pwa-192x192.svg',
              badge: '/pwa-192x192.svg'
            });
          });
        }
      }
    }

    setNotifications((prev) => {
      const existingNotification = prev.find(
        n => n.type === type && n.message === message && n.title === title
      );

      // Se já existe uma notificação igual, remover ela primeiro para dar feedback visual
      if (existingNotification) {
        const existingTimeout = timeoutRefs.current.get(existingNotification.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          timeoutRefs.current.delete(existingNotification.id);
        }

        // Remover a notificação existente
        const withoutExisting = prev.filter((n) => n.id !== existingNotification.id);

        // Adicionar nova notificação após pequeno delay para animação
        setTimeout(() => {
          const id = Math.random().toString(36).substr(2, 9);
          const newNotification = { id, type, message, title };

          setNotifications((current) => [...current, newNotification]);

          // Auto remove after 5 seconds
          const timeout = setTimeout(() => {
            setNotifications((current) => current.filter((n) => n.id !== id));
            timeoutRefs.current.delete(id);
          }, 5000);

          timeoutRefs.current.set(id, timeout);
        }, 100); // Pequenão delay para animação

        return withoutExisting;
      }

      // Adicionar nova notificação
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { id, type, message, title };

      // Auto remove after 5 seconds
      const timeout = setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== id));
        timeoutRefs.current.delete(id);
      }, 5000);

      timeoutRefs.current.set(id, timeout);

      return [...prev, newNotification];
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Limpar timeout ao remover manualmente
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Limpar todos os timeouts ao desmontar
  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}

      {/* Notification Container - Fixed Position */}
      <div className="fixed top-4 right-0 left-0 md:left-auto md:right-4 z-[100] flex flex-col items-center md:items-end gap-2 px-4 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto w-full max-w-sm bg-white rounded-xl shadow-2xl border-l-4 p-4 flex items-start gap-3 animate-fade-in transition-all transform translate-y-0 opacity-100 ${notification.type === 'success' ? 'border-green-500' :
              notification.type === 'error' ? 'border-red-500' :
                notification.type === 'warning' ? 'border-tenant-primary' : 'border-blue-500'
              }`}
          >
            <div className={`mt-0.5 ${notification.type === 'success' ? 'text-green-500' :
              notification.type === 'error' ? 'text-red-500' :
                notification.type === 'warning' ? 'text-tenant-primary' : 'text-blue-500'
              }`}>
              {notification.type === 'success' && <CheckCircle size={20} />}
              {notification.type === 'error' && <AlertCircle size={20} />}
              {notification.type === 'warning' && <Bell size={20} />}
              {notification.type === 'info' && <Info size={20} />}
            </div>
            <div className="flex-1">
              {notification.title && <h4 className="font-bold text-gray-900 text-sm">{notification.title}</h4>}
              <p className="text-sm text-gray-600 leading-snug">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};