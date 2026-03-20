import React from 'react';
import { useShop } from '../context/ShopContext';

export const Privacy: React.FC = () => {
  const { shop } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>

        <div className="prose prose-amber max-w-nãone text-gray-600 space-y-6">
          <p>
            No {shop.name}, a sua privacidade é uma prioridade. Esta Política de Privacidade descreve de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>

          <h3 className="text-xl font-bold text-gray-900">1. Coleta e Finalidade de Informações</h3>
          <p>
            Coletamos informações estritamente necessárias fornecidas diretamente por você (como nome, endereço de e-mail e número de telefone) ao criar uma conta, bem como dados gerados ao utilizar nossos serviços (como histórico de agendamentos). Os dados são utilizados para:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Identificação e autenticação na Plataforma.</li>
            <li>Processamento e gestão de agendamentos e assinaturas.</li>
            <li><strong>Comunicações e Notificações Push/PWA:</strong> envio de mensagens sistêmicas e lembretes essenciais relacionados aos seus agendamentos, mediante consentimento através do dispositivo.</li>
            <li>Melhoria contínua da funcionalidade e segurança da Plataforma.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900">2. Notificações, Web Push e "Opt-Out"</h3>
          <p>
            O envio de Web Push Notifications e e-mails baseia-se no legítimo interesse da Plataforma de garantir o seu comparecimento ao serviço contratado. No entanto, respeitamos seu direito de controle: você pode ativar ou desativar os alertas no seu Perfil de Usuário na aba "Configurações de Notificação", bem como revogar permissões de Push Notification diretamente no seu navegador ou sistema operacional a qualquer momento.
          </p>

          <h3 className="text-xl font-bold text-gray-900">3. Armazenamento e Proteção de Dados</h3>
          <p>
            Implementamos medidas de segurança técnicas e administrativas alinhadas aos padrões de mercado para proteger seus dados pessoais contra acessos não autorizados, vazamentos ou destruição. Seus dados financeiros (como cartões de crédito) não são armazenados em nossos servidores, mas sim processados criptografados diretamente por plataformas de gateways de pagamento terceirizadas certificadas (PCI-DSS).
          </p>

          <h3 className="text-xl font-bold text-gray-900">4. Compartilhamento de Informações</h3>
          <p>
            Garantimos a não comercialização ou aluguel de seus dados. O compartilhamento ocorre apenas com prestadores de serviços de infraestrutura (provedores de nuvem, envios automáticos de e-mail) estritamente essenciais à operação do negócio, sob contratos de confidencialidade vinculativos. A Plataforma Klypbarber atua como processadora tecnãológica das informações.
          </p>

          <h3 className="text-xl font-bold text-gray-900">5. Seus Direitos (LGPD)</h3>
          <p>
            Você possui o direito garantido por lei de confirmar a existência de tratamento, acessar seus dados, solicitar correção de informações incompletas, anãonimização, ou a exclusão de seus dados pessoais, salvo quando houver base legal para a retenção (como obrigações fiscais ou prevenção de fraudes).
          </p>
          <p>
            Para exercer esses direitos, ou esclarecer dúvidas sobre esta Política, entre em contato através dos canais de atendimento oficiais do nosso Aplicativo Klypbarber.
          </p>
        </div>
      </div>
    </div>
  );
};