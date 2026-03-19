import React, { useState } from 'react';
import { Palette, Share2, Shield, Lock, Bell, Store } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { ShareLink } from '../../components/ShareLink';
import { barbershopService } from '../../services/barbershopService';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';

export const SettingsTab: React.FC = () => {
  const { shop: currentShop, setShop: setCurrentShop } = useShop();
  const { addNotification } = useNotification();
  const [wlPrimaryColor, setWlPrimaryColor] = useState(currentShop.primaryColor || '#f59e0b');
  const [isSavingWl, setIsSavingWl] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  const handleSaveWhiteLabel = async () => {
    try {
      setIsSavingWl(true);
      await barbershopService.update(currentShop.id, {
        primaryColor: wlPrimaryColor
      });
      
      setCurrentShop({
        ...currentShop,
        primaryColor: wlPrimaryColor
      });

      // Persistir no localStorage para manter após reload
      const savedShops = JSON.parse(localStorage.getItem('user_shops') || '[]');
      const updatedShops = savedShops.map((s: any) => 
        s.id === currentShop.id ? { ...s, primaryColor: wlPrimaryColor } : s
      );
      localStorage.setItem('user_shops', JSON.stringify(updatedShops));

      addNotification('success', 'Configurações de aparência salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar aparência:', error);
      addNotification('error', 'Erro ao salvar as configurações de aparência.');
    } finally {
      setIsSavingWl(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* White Label / Appearance */}
      <Card>
        <Card.Body className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="p-2 bg-tenant-primary/10 rounded-lg text-tenant-primary">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Personalização (White Label)</h3>
              <p className="text-xs text-gray-500">Ajuste a identidade visual da sua barbearia no app do cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Cor Primária do App</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={wlPrimaryColor}
                    onChange={(e) => setWlPrimaryColor(e.target.value)}
                    className="w-16 h-16 rounded-xl cursor-pointer border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                  <div className="flex-1">
                    <Input
                      value={wlPrimaryColor}
                      onChange={(e) => setWlPrimaryColor(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">
                  Esta cor será aplicada em botões, ícones e destaques no seu catálogo online.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleSaveWhiteLabel}
                loading={isSavingWl}
                className="w-full sm:w-auto"
              >
                Salvar Alterações
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Store size={18} className="text-tenant-primary" />
                Preview em tempo real
              </h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: wlPrimaryColor }}></div>
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div className="w-full h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm uppercase tracking-widest shadow-lg" style={{ backgroundColor: wlPrimaryColor }}>
                  Botão Exemplo
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Share / Marketing */}
      <Card>
        <Card.Body className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Compartilhamento</h3>
                <p className="text-xs text-gray-500">Link direto para seu catálogo de agendamentos</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Seu link exclusivo está pronto! Use-o na bio do Instagram ou envie pelo WhatsApp para seus clientes.
            </p>
            <ShareLink shop={currentShop} />
          </div>
        </Card.Body>
      </Card>

      {/* System info / Other */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Body className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs">Acesso e Segurança</h4>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Gerencie quem pode acessar o painel administrativo.</p>
              <Button size="sm" variant="outline" className="mt-2 h-8 text-[10px] font-black uppercase">Configurar</Button>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500">
              <Bell size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs">Notificações</h4>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Avisos de novos agendamentos e cancelamentos.</p>
              <Button size="sm" variant="outline" className="mt-2 h-8 text-[10px] font-black uppercase">Configurar</Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};
