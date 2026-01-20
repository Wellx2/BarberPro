import React from 'react';
import { useShop } from '../context/ShopContext';

export const Privacy: React.FC = () => {
  const { shop } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
        
        <div className="prose prose-amber max-w-none text-gray-600 space-y-6">
          <p>
            No {shop.name}, a sua privacidade é prioridade. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nosso sistema de agendamento.
          </p>

          <h3 className="text-xl font-bold text-gray-900">Coleta de Informações</h3>
          <p>
            Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, número de telefone e dados de pagamento ao criar uma conta, agendar um serviço ou assinar um plano.
          </p>

          <h3 className="text-xl font-bold text-gray-900">Uso das Informações</h3>
          <p>
            Utilizamos suas informações para:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Processar e gerenciar seus agendamentos.</li>
            <li>Processar pagamentos e assinaturas.</li>
            <li>Enviar notificações sobre seus horários, confirmações e lembretes.</li>
            <li>Melhorar nossos serviços e a funcionalidade da plataforma.</li>
            <li>Comunicar promoções ou atualizações (você pode optar por não receber).</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900">Proteção de Dados</h3>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Seus dados de pagamento são processados por gateways seguros e não são armazenados diretamente em nossos servidores.
          </p>

          <h3 className="text-xl font-bold text-gray-900">Compartilhamento de Informações</h3>
          <p>
            Não vendemos nem alugamos suas informações pessoais para terceiros. Podemos compartilhar dados com prestadores de serviços confiáveis que nos auxiliam na operação do nosso negócio (como processadores de pagamento), desde que concordem em manter essas informações confidenciais.
          </p>

          <h3 className="text-xl font-bold text-gray-900">Seus Direitos</h3>
          <p>
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através dos canais de atendimento disponíveis na página de contato.
          </p>
        </div>
      </div>
    </div>
  );
};