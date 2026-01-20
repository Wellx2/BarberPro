import React from 'react';
import { useShop } from '../context/ShopContext';

export const Terms: React.FC = () => {
  const { shop } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
        <p className="text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-amber max-w-none text-gray-600 space-y-6">
          <p>
            Bem-vindo ao {shop.name}. Ao acessar ou usar nosso sistema de agendamento e serviços, você concorda em cumprir e estar vinculado aos seguintes termos e condições.
          </p>

          <h3 className="text-xl font-bold text-gray-900">1. Agendamentos</h3>
          <p>
            Os agendamentos realizados através da nossa plataforma são compromissos firmados entre o cliente e o profissional. Solicitamos que cancelamentos sejam feitos com pelo menos 24 horas de antecedência. Cancelamentos tardios ou não comparecimento podem estar sujeitos a taxas ou perda de benefícios de fidelidade.
          </p>

          <h3 className="text-xl font-bold text-gray-900">2. Planos e Assinaturas</h3>
          <p>
            Os planos de assinatura (Básico, Premium, VIP, Ilimitado) são cobrados mensalmente. O cancelamento pode ser realizado a qualquer momento, mas não haverá reembolso proporcional para o mês vigente. Os benefícios não utilizados não acumulam para o mês seguinte.
          </p>

          <h3 className="text-xl font-bold text-gray-900">3. Conduta</h3>
          <p>
            Reservamo-nos o direito de recusar atendimento a qualquer pessoa por qualquer motivo a qualquer momento. Comportamento inadequado, desrespeitoso ou perigoso em nossas instalações resultará no cancelamento imediato de serviços e possível banimento da plataforma.
          </p>

          <h3 className="text-xl font-bold text-gray-900">4. Pagamentos</h3>
          <p>
            Aceitamos pagamentos via cartão de crédito e débito através da plataforma. Todos os preços estão sujeitos a alterações sem aviso prévio, embora honraremos o preço de agendamentos já confirmados.
          </p>

          <h3 className="text-xl font-bold text-gray-900">5. Modificações dos Termos</h3>
          <p>
            Podemos atualizar estes termos de tempos em tempos. Recomendamos que você revise esta página periodicamente para quaisquer alterações. O uso continuado do serviço após a publicação de alterações constitui aceitação dessas alterações.
          </p>
        </div>
      </div>
    </div>
  );
};