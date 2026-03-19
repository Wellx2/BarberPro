import React from 'react';
import { useShop } from '../context/ShopContext';

export const Terms: React.FC = () => {
  const { shop } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
        <p className="text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-amber max-w-nãone text-gray-600 space-y-6">
          <p>
            Bem-vindo ao {shop.name}. Ao acessar ou usar nãosso sistema de agendamento (incluindo o aplicativo PWA) e serviços associados (doravante, a "Plataforma"), você concorda em cumprir e estar vinculado aos seguintes termos e condições. Caso discorde de qualquer parte destes termos, você não deve utilizar a Plataforma.
          </p>

          <h3 className="text-xl font-bold text-gray-900">1. Agendamentos e Política de Cancelamento</h3>
          <p>
            Os agendamentos realizados através da nãossa Plataforma são compromissos firmados entre o cliente e o profissional. Solicitamos que cancelamentos ou remarcações sejám feitos com pelo menãos 2 horas de antecedência. Cancelamentos tardios ou o não comparecimento ("não-show") podem resultar na cobrança de taxas compensatórias, perda de benefícios de fidelidade ou até bloqueio temporário de agendamentos futuros.
          </p>

          <h3 className="text-xl font-bold text-gray-900">2. Planos de Assinatura</h3>
          <p>
            Os planos de assinatura oferecidos são cobrados mensalmente de forma recorrente. O cancelamento da assinatura pode ser realizado a qualquer momento pelo usuário, entretanto, não haverá reembolso proporcional para o ciclo vigente jáá pago. Os benefícios contidos na assinatura não são cumulativos e expiram ao final de cada período em caso de não utilização.
          </p>

          <h3 className="text-xl font-bold text-gray-900">3. Comunicações e Notificações (PWA, E-mail, SMS, Push)</h3>
          <p>
            Ao utilizar a Plataforma, você consente em receber comunicações transacionais e promocionais (como confirmações e lembretes de agendamento) via E-mail, SMS, WhatsApp e Push Notifications (Notificações do Navegador/PWA).
          </p>
          <p>
            <strong>Isenção de Responsabilidade sobre Notificações:</strong> Os sistemas de notificação operam em regime de "melhor esforço". O {shop.name} <strong>NÃO</strong> garante a entrega ininterrupta, pontual ou livre de falhas de e-mails, SMS, Web Push ou mensagens via WhatsApp, pois estas dependem das operadoras de telefonia, provedores de e-mail e configurações de bateria e permissões do dispositivo do usuário. O não recebimento de um lembrete <strong>não</strong> isenta o cliente da responsabilidade de comparecer ao agendamento ou das penalidades por não comparecimento.
          </p>

          <h3 className="text-xl font-bold text-gray-900">4. Conduta do Usuário</h3>
          <p>
            O {shop.name} se reserva o direito de recusar atendimento, suspender ou encerrar contas de usuários por qualquer motivo, inclusive, sem limitação, em casos de comportamento inadequado, desrespeitoso ou violação destes Termos. A segurança de nossos profissionais e clientes é prioritária.
          </p>

          <h3 className="text-xl font-bold text-gray-900">5. Pagamentos e Tarifas</h3>
          <p>
            Aceitamos pagamentos via métodos digitais parceiros. Os preços dos serviços e planos estão sujeitos a alterações mediante aviso prévio razoável em nossa Plataforma. Agendamentos já confirmados e pagos terão seu valor integralmente honrado.
          </p>

          <h3 className="text-xl font-bold text-gray-900">6. Limitação de Responsabilidade da Plataforma de Software</h3>
          <p>
            A Plataforma é fornecida no estado em que se encontra ("as is"). Na máxima extensão permitida pela lei aplicável, o {shop.name} e os desenvolvedores do software Klypbarber não se responsabilizam por danãos indiretos, incidentais, especiais ou punitivos decorrentes de (i) sua incapacidade de acesso ou uso da Plataforma; (ii) falhas técnicas, interrupções ou indisponibilidade temporária do serviço (PWA ou Web); ou (iii) qualquer conduta inadequada de terceiros dentro das dependências do estabelecimento.
          </p>

          <h3 className="text-xl font-bold text-gray-900">7. Modificações dos Termos</h3>
          <p>
            Estes Termos podem ser atualizados periodicamente para refletir mudanças legais ou operacionais. A data de atualização será destacada não topo. O uso contínuo da Plataforma após tais alterações constitui sua aceitação tácita e integral.
          </p>
        </div>
      </div>
    </div>
  );
};