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

  const addNotification = useCallback((type: NotificationType, message: string, title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, title }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      {/* Notification Container - Fixed Position */}
      <div className="fixed top-4 right-0 left-0 md:left-auto md:right-4 z-[100] flex flex-col items-center md:items-end gap-2 px-4 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto w-full max-w-sm bg-white rounded-xl shadow-2xl border-l-4 p-4 flex items-start gap-3 animate-fade-in transition-all transform translate-y-0 opacity-100 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'error' ? 'border-red-500' :
              notification.type === 'warning' ? 'border-amber-500' : 'border-blue-500'
            }`}
          >
            <div className={`mt-0.5 ${
               notification.type === 'success' ? 'text-green-500' :
               notification.type === 'error' ? 'text-red-500' :
               notification.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
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