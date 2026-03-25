import React, { useState } from 'react';
import { Palette, Share2, Shield, Lock, Bell, Store, Users } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { ShareLink } from '../../components/ShareLink';
import { barbershopService } from '../../services/barbershopService';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';

export const SettingsTab: React.FC = () => {
  const { shop: currentShop, setShop: setCurrentShop } = useShop();
  const { addNotification } = useNotification();
  const [wlPrimaryColor, setWlPrimaryColor] = useState(currentShop.primaryColor || '#f59e0b');
  const [whatsapp, setWhatsapp] = useState(currentShop.whatsapp || '');
  const [email, setEmail] = useState(currentShop.email || '');
  const [heroTitle, setHeroTitle] = useState(currentShop.heroSettings?.title || 'Estilo & Tradição');
  const [heroSubtitle, setHeroSubtitle] = useState(currentShop.heroSettings?.subtitle || `Excelência no atendimento para a unidade ${currentShop.name}.`);
  const [heroImage, setHeroImage] = useState(currentShop.heroSettings?.backgroundImage || '');
  const [shopName, setShopName] = useState(currentShop.name || '');
  const [shopLogo, setShopLogo] = useState(currentShop.logoUrl || currentShop.image || '');
  
  const [debitRate, setDebitRate] = useState((currentShop.settings as any)?.cardFees?.debit ?? 1.99);
  const [creditRate, setCreditRate] = useState((currentShop.settings as any)?.cardFees?.credit ?? 3.49);

  const [isSavingWl, setIsSavingWl] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [barberCanViewTicket, setBarberCanViewTicket] = useState(
    (currentShop as any).modulesEnabled?.barberCanViewTicketMedio ?? true
  );
  const [isSavingBarberPrefs, setIsSavingBarberPrefs] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800; // Maior que os icones
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        if (target === 'logo') setShopLogo(compressedBase64);
        else setHeroImage(compressedBase64);
        addNotification('success', 'Imagem carregada com sucesso!');
      } catch (error) {
        addNotification('error', 'Erro ao processar imagem');
      }
    }
  };

  const handleSaveWhiteLabel = async () => {
    try {
      setIsSavingWl(true);
      
      const updatedSettings = {
        ...currentShop.settings,
        cardFees: {
          debit: debitRate,
          credit: creditRate
        }
      };

      await barbershopService.update(currentShop.id, {
        name: shopName,
        logoUrl: shopLogo,
        primaryColor: wlPrimaryColor,
        whatsapp,
        email,
        settings: updatedSettings
      } as any);

      await barbershopService.updateHeroSettings(currentShop.id, {
        title: heroTitle,
        subtitle: heroSubtitle,
        backgroundImage: heroImage || null
      });
      
      const updatedShopData = {
        ...currentShop,
        name: shopName,
        logoUrl: shopLogo,
        primaryColor: wlPrimaryColor,
        whatsapp,
        email,
        settings: updatedSettings,
        heroSettings: { title: heroTitle, subtitle: heroSubtitle, backgroundImage: heroImage || null }
      };

      setCurrentShop(updatedShopData);

      // Atualizar lista de barbearias no localStorage para persistência local imediata
      const savedShops = JSON.parse(localStorage.getItem('shops') || '[]');
      const updatedShops = savedShops.map((s: any) => 
        s.id === currentShop.id ? { ...s, ...updatedShopData } : s
      );
      localStorage.setItem('shops', JSON.stringify(updatedShops));

      addNotification('success', 'Configurações de White Label salvas!');
    } catch (error: any) {
      console.error('Erro detalhado ao salvar aparência:', error.response?.data || error);
      addNotification('error', error.response?.data?.message || 'Erro ao salvar as configurações.');
    } finally {
      setIsSavingWl(false);
    }
  };

  const handleSaveBarberPrefs = async () => {
    try {
      setIsSavingBarberPrefs(true);
      const currentModules = (currentShop as any).modulesEnabled || {};
      const updatedModules = { ...currentModules, barberCanViewTicketMedio: barberCanViewTicket };
      await barbershopService.update(currentShop.id, { modulesEnabled: updatedModules } as any);
      setCurrentShop({ ...currentShop, ...(({ modulesEnabled: updatedModules } as any)) });
      addNotification('success', 'Preferências do barbeiro salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preferências do barbeiro:', error);
      addNotification('error', 'Erro ao salvar preferências do barbeiro.');
    } finally {
      setIsSavingBarberPrefs(false);
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
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter mb-4">
                  Esta cor será aplicada em botões, ícones e destaques no seu catálogo online.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Nome da Barbearia</label>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: KlypBarber"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Logo da Barbearia</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
                    {shopLogo ? (
                      <img src={shopLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Store className="text-gray-300" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="w-full" />
                    <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Proporção ideal: quadrada (1:1)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">WhatsApp de Contato</label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 11999999999"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Email de Contato</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@barbearia.com"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <h4 className="text-xs font-black text-tenant-primary uppercase tracking-widest mb-4">Configurações Financeiras</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Taxa Débito (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={debitRate}
                      onChange={(e) => setDebitRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Taxa Crédito (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={creditRate}
                      onChange={(e) => setCreditRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">
                  Estas taxas serão descontadas automaticamente no fechamento do caixa para pagamentos em cartão.
                </p>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <h4 className="text-xs font-black text-tenant-primary uppercase tracking-widest mb-4">Personalização da Home</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Título Principal</label>
                    <Input
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="Estilo & Tradição"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Subtítulo</label>
                    <Input
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="Excelência no atendimento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Banner de Fundo (Hero)</label>
                    <div className="space-y-3">
                      <div className="w-full h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        {heroImage ? (
                          <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Palette className="text-gray-300" size={32} />
                        )}
                      </div>
                      <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} className="w-full" />
                    </div>
                  </div>
                </div>
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

      {/* Barber Preferences */}
      <Card>
        <Card.Body className="space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Preferências do Barbeiro</h3>
              <p className="text-xs text-gray-500">Configure o que os barbeiros podem visualizar no painel deles</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Visualizar Ticket Médio</p>
              <p className="text-xs text-gray-500 mt-0.5">Quando ativado, o barbeiro pode ver o seu ticket médio diário no painel</p>
            </div>
            <button
              onClick={() => setBarberCanViewTicket(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                barberCanViewTicket ? 'bg-tenant-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              style={barberCanViewTicket ? { backgroundColor: 'var(--tenant-primary, #f59e0b)' } : {}}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  barberCanViewTicket ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <Button
            variant="primary"
            onClick={handleSaveBarberPrefs}
            loading={isSavingBarberPrefs}
            className="w-full sm:w-auto"
          >
            Salvar Preferências
          </Button>
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
