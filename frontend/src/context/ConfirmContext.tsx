import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Trash2, AlertCircle, HelpCircle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && options && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-700 animate-scale-in">
            <div className="absolute top-6 right-6">
               <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-10 text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${
                options.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                options.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                'bg-tenant-primary/10 text-tenant-primary'
              }`}>
                {options.type === 'danger' ? <Trash2 size={48} /> : 
                 options.type === 'warning' ? <AlertCircle size={48} /> : 
                 <HelpCircle size={48} />}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white mb-4">{options.title}</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 whitespace-pre-wrap leading-relaxed">
                {options.message}
              </p>
            </div>
            <div className="flex border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button 
                onClick={handleCancel}
                className="flex-1 p-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all border-r dark:border-gray-700"
              >
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button 
                onClick={handleConfirm}
                className={`flex-1 p-8 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  options.type === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' :
                  options.type === 'warning' ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' :
                  'text-tenant-primary hover:bg-tenant-primary/10'
                }`}
              >
                {options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
