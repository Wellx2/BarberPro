import React, { useState, useEffect } from 'react';
import { Plus, Scissors, Eye, EyeOff, Edit3, Power, Trash2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { Modal } from '../../components/feedback';
import { serviceService } from '../../services/serviceService';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { Service } from '../../types';

export const ServicesTab: React.FC = () => {
  const { shop: currentShop } = useShop();
  const { addNotification } = useNotification();
  const [unitServices, setUnitServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [serviceImagePreview, setServiceImagePreview] = useState<string>('');
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: '',
    image: ''
  });

  const fallbackImage = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80';

  useEffect(() => {
    if (!currentShop?.id) return;
    loadServices();
  }, [currentShop?.id]);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const data = await serviceService.list(currentShop.id);
      setUnitServices(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      addNotification('error', 'Erro ao carregar serviços');
    } finally {
      setLoadingServices(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 600;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setServiceForm({ ...serviceForm, image: compressedBase64 });
        setServiceImagePreview(compressedBase64);
      } catch (error) {
        addNotification('error', 'Erro ao processar imagem');
      }
    }
  };

  const handleOpenServiceModal = (service?: Service) => {
    if (service) {
      setEditService(service);
      setServiceForm({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || 30,
        category: service.category || '',
        image: service.image || ''
      });
      setServiceImagePreview(service.image || '');
    } else {
      setEditService(null);
      setServiceForm({ name: '', description: '', price: 0, duration: 30, category: '', image: '' });
      setServiceImagePreview('');
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      addNotification('error', 'Nome do serviço é obrigatório');
      return;
    }
    try {
      if (editService) {
        await serviceService.update(editService.id, serviceForm);
        addNotification('success', 'Serviço atualizado!');
      } else {
        await serviceService.create(serviceForm);
        addNotification('success', 'Serviço criado!');
      }
      setShowServiceModal(false);
      loadServices();
    } catch (error) {
      addNotification('error', 'Erro ao salvar serviço');
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const service = unitServices.find(s => s.id === id);
      if (!service) return;
      await serviceService.update(id, { active: !service.active });
      setUnitServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
      addNotification('success', 'Status atualizado!');
    } catch (error) {
      addNotification('error', 'Erro ao atualizar status');
    }
  };

  const deleteItem = async (id: string, name: string) => {
    const reason = window.prompt(`Tem certeza que deseja excluir ${name}? Por favor, informe o motivo:`);
    if (!reason) return;
    try {
      await serviceService.remove(id, reason);
      setUnitServices(prev => prev.filter(s => s.id !== id));
      addNotification('success', 'Serviço excluído');
    } catch (error) {
      addNotification('error', 'Erro ao excluir serviço');
    }
  };
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
                      onClick={() => toggleActive(service.id)}
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
                      onClick={() => deleteItem(service.id, service.name)}
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

      {/* Service Modal */}
      {showServiceModal && (
        <Modal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          title={editService ? 'Editar Serviço' : 'Novo Serviço'}
          size="lg"
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome do Serviço *</label>
                  <Input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="Ex: Corte de Cabelo" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preço (R$) *</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={serviceForm.price} 
                    onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duração (Minutos)</label>
                  <Input type="number" step="5" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Imagem do Serviço</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      {serviceImagePreview ? (
                        <img src={serviceImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Scissors className="text-gray-300" size={40} />
                      )}
                    </div>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
              <textarea
                value={serviceForm.description}
                onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:border-tenant-primary transition-colors min-h-[100px]"
                placeholder="Descreva o que está incluso no serviço..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={() => setShowServiceModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveService} variant="primary" className="flex-1">
                {editService ? 'Salvar Alterações' : 'Criar Serviço'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
