import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  CreditCard,
  Copy,
  Clock,
  ExternalLink,
  Scissors
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Button, Input } from '../../components/ui';
import { useNotification } from '../../context/NotificationContext';
import { onboardingService } from '../../services/onboardingService';
import { ShopSubscriptionTier } from '../../types';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    cnpj: '',
    subscriptionTier: ShopSubscriptionTier.BASIC as ShopSubscriptionTier
  });

  const tiers = [
    { 
      id: ShopSubscriptionTier.BASIC, 
      name: 'BASIC', 
      price: 65.00, 
      features: ['Até 3 profissionais', 'Agenda online', 'Gestão básica'] 
    },
    { 
      id: ShopSubscriptionTier.PLUS, 
      name: 'PLUS', 
      price: 75.00, 
      features: ['Até 5 profissionais', 'Fidelidade', 'Gestão financeira', 'Relatórios'] 
    },
    { 
      id: ShopSubscriptionTier.PRO, 
      name: 'PRO', 
      price: 115.00, 
      features: ['Profissionais ilimitados', 'Marketing automatizado', 'Dashboard avançado', 'Suporte VIP'] 
    },
    { 
      id: ShopSubscriptionTier.MASTER, 
      name: 'MASTER', 
      price: 0, 
      features: ['Customizado', 'Multifiliais', 'Consultoria de negócio'],
      isContact: true 
    },
  ];

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmitRequest = async () => {
    try {
      setLoading(true);
      await onboardingService.requestOnboarding(formData);
      handleNext(); // Move to success step
    } catch (error: any) {
      addNotification('error', error.message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText('39449089000103');
    addNotification('success', 'Chave PIX (CNPJ) copiada!');
  };

  const renderStep = () => {
    switch(step) {
      case 1: // Shop Info
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Abra sua Unidade</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Conte-nos um pouco sobre a sua barbearia</p>
            </div>
            <div className="space-y-4">
              <Input 
                label="Nome da Barbearia" 
                required 
                icon={<Building2 size={18} />}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Barber Prime"
              />
              <Input 
                label="Telefone Comercial" 
                required 
                icon={<Phone size={18} />}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
              <Input 
                label="Endereço Completo" 
                required 
                icon={<MapPin size={18} />}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Rua, Número, Bairro, Cidade"
              />
              <Input 
                label="CNPJ (Opcional)" 
                icon={<Building2 size={18} />}
                value={formData.cnpj}
                onChange={e => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <Button 
              fullWidth 
              variant="primary" 
              size="lg" 
              onClick={handleNext}
              disabled={!formData.name || !formData.phone || !formData.address}
              suffix={<ArrowRight size={18} />}
            >
              Escolher Plano
            </Button>
          </div>
        );

      case 2: // Plan Selection
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Escolha seu Plano</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Selecione o que melhor atende ao seu negócio</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {tiers.map(tier => (
                <div 
                  key={tier.id}
                  onClick={() => !tier.isContact && setFormData({...formData, subscriptionTier: tier.id})}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    formData.subscriptionTier === tier.id && !tier.isContact
                    ? 'border-tenant-primary bg-tenant-primary/5' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-tenant-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg text-gray-900 dark:text-white">{tier.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        {tier.isContact ? (
                          <span className="text-tenant-primary font-bold">Sob consulta</span>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">R$ {tier.price.toFixed(2)}</span>
                            <span className="text-gray-500 text-xs">/mês</span>
                          </>
                        )}
                      </div>
                    </div>
                    {formData.subscriptionTier === tier.id && !tier.isContact && (
                      <CheckCircle2 className="text-tenant-primary" size={24} />
                    )}
                    {tier.isContact && <ExternalLink className="text-gray-400" size={20} />}
                  </div>
                  <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="text-[10px] text-gray-500 flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" size="lg" onClick={handlePrev} icon={<ArrowLeft size={18} />} />
              <Button 
                fullWidth 
                variant="primary" 
                size="lg" 
                onClick={handleNext}
                suffix={<ArrowRight size={18} />}
              >
                Pagar com PIX
              </Button>
            </div>
          </div>
        );

      case 3: // PIX Payment
        return (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pagamento PIX</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Realize a transferência para ativar sua conta</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl inline-block shadow-lg border border-gray-100 mb-4">
              <QRCodeSVG 
                value={`00020126330014BR.GOV.BCB.PIX0114394490890001035204000053039865802BR5910KlypBarber6009Sao Paulo62070503***6304CA20`} 
                size={200}
                includeMargin={true}
                level="M"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-left">
              <div className="mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Chave CNPJ (Copia e Cola)</label>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                  <span className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-300">39.449.089/0001-03</span>
                  <button onClick={copyPixKey} className="p-2 text-tenant-primary hover:bg-tenant-primary/10 rounded-lg transition-colors">
                    <Copy size={20} />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl">
                <Clock className="text-orange-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                  <strong>Atenção:</strong> Após o pagamento, nossa equipe validará o crédito em até <strong>2 horas</strong>. O acesso completo será liberado no máximo em 24 horas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" size="lg" onClick={handlePrev} icon={<ArrowLeft size={18} />} />
              <Button 
                fullWidth 
                variant="primary" 
                size="lg" 
                onClick={handleSubmitRequest}
                loading={loading}
              >
                Já realizei o pagamento
              </Button>
            </div>
          </div>
        );

      case 4: // Success message
        return (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={56} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Solicitação Recebida!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-sm mx-auto mb-10">
              Estamos validando o seu pagamento. Você receberá um e-mail assim que sua barbearia estiver pronta para uso.
            </p>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              fullWidth
            >
              Voltar ao Meu Painel
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-tenant-primary shadow-xl">
            <Scissors size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">
            KLYP<span className="text-tenant-primary">BARBER</span>
          </h1>
        </div>

        {/* Wizard Main Card */}
        <Card className="shadow-2xl border-none overflow-hidden relative">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-800">
            <div 
              className="h-full bg-tenant-primary transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          
          <Card.Body className="p-8 md:p-12">
            {renderStep()}
          </Card.Body>
        </Card>

        {/* Footer info */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Precisa de ajuda? <a href="#" className="text-tenant-primary font-bold hover:underline">Fale com nosso suporte</a>
        </p>
      </div>
    </div>
  );
};
