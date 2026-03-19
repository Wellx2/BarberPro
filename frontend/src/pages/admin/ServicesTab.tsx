import React from 'react';
import { Plus, Scissors, Eye, EyeOff, Edit3, Power, Trash2 } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface ServiceTabProps {
  unitServices: any[];
  loadingServices: boolean;
  handleOpenServiceModal: (service?: any) => void;
  toggleActive: (id: string, type: 'SERVICE' | 'PRODUCT') => void;
  deleteItem: (id: string, type: 'SERVICE' | 'PRODUCT') => void;
  fallbackImage: string;
}

export const ServicesTab: React.FC<ServiceTabProps> = ({
  unitServices,
  loadingServices,
  handleOpenServiceModal,
  toggleActive,
  deleteItem,
  fallbackImage
}) => {
  return (
    <Card>
      <Card.Body className="space-y-4">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Catálogo de serviços</h3>
          <Button
            size="md"
            variant="primary"
            icon={<Plus size={20} />}
            onClick={() => handleOpenServiceModal()}
            className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
            aria-label="Novo serviço"
          >
            <span className="hidden sm:inline">Novo serviço</span>
          </Button>
        </div>

        {loadingServices ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando serviços...</p>
          </div>
        ) : unitServices.length === 0 ? (
          <div className="text-center py-12">
            <Scissors size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unitServices.map(service => (
              <Card key={service.id} className="relative overflow-hidden transition-all">
                {/* Badge de Status - Sempre colorido (não afetado por grayscale) */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${service.active
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {service.active ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className="hidden sm:inline">{service.active ? 'Ativo' : 'Inativo'}</span>
                  </span>
                </div>

                {/* Imagem - fica em grayscale quando inativo */}
                <div className={`h-32 bg-gray-100 dark:bg-gray-800 ${!service.active ? 'grayscale' : ''}`}>
                  <img
                    src={service.image || fallbackImage}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                </div>

                <Card.Body className="space-y-2 p-4">
                  {/* Informações do serviço - fica em grayscale quando inativo */}
                  <div className={!service.active ? 'grayscale opacity-60' : ''}>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{service.name}</h4>
                    <p className="text-2xl font-black text-tenant-primary">R$ {service.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.duration}min</p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Botão Editar - SEMPRE ativo e colorido */}
                    <button
                      onClick={() => handleOpenServiceModal(service)}
                      className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 active:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                      title="Editar serviço"
                    >
                      <Edit3 size={14} />
                      <span className="text-xs font-bold">Editar</span>
                    </button>

                    {/* Botão Ativar/Desativar - SEMPRE colorido */}
                    <button
                      onClick={() => toggleActive(service.id, 'SERVICE')}
                      className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${service.active
                        ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 active:bg-orange-200 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 active:bg-green-200 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}
                      title={service.active ? 'Desativar serviço (ocultar das vendas)' : 'Ativar serviço'}
                    >
                      <Power size={14} />
                      <span className="text-xs font-bold">{service.active ? 'Desativar' : 'Ativar'}</span>
                    </button>

                    <button
                      onClick={() => deleteItem(service.id, 'SERVICE')}
                      disabled={!service.active}
                      className={`flex-1 p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${!service.active ? 'grayscale opacity-40 cursor-not-allowed' : ''}`}
                      title={service.active ? 'Excluir permanentemente' : 'Ative o serviço para poder excluir'}
                    >
                      <Trash2 size={14} />
                      <span className="text-xs font-bold">Excluir</span>
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
