# QA Testing Checklist - Klypbarber PWA & Routing

Este checklist serve como um "Scratchpad" para validar a estabilidade das novas implementações de roteamento, PWA e segurança.

## 📱 1. PWA & Mobile Experience
- [ ] **Instalação**: O banner de "Adicionar à tela de início" aparece em dispositivos mobile?
- [ ] **Service Worker**: O Service Worker é registrado com sucesso (Verificar no DevTools > Application)?
- [x] **Manifesto**: Nome (Klypbarber), ícones e cores de tema estão corretos no `manifest.json`? *(Corrigido no vite.config.ts)*
- [ ] **Offline**: A "App Shell" carrega sem internet? Os dados de serviços/produtos estão sendo cacheados (`api-cache`)?
- [ ] **Standalone**: O app abre sem a barra de endereços do navegador quando iniciado pela homescreen?

## 🔗 2. Roteamento Dinâmico (Slugs)
- [x] **Identificação**: Acessar `klypbarber.com.br/shop-aleatorio` carrega os dados dessa loja específica?
- [x] **Sincronização**: Ao mudar o slug manualmente na URL para outra loja existente, a página atualiza os dados instantaneamente?
- [x] **Redirecionamentos**: O acesso a `/servicos` redireciona corretamente para `/:current-shop/servicos`?
- [x] **Traducão**: Todos os links internos estão usando os novos caminhos em português (`/agendar`, `/planos`, etc.)?

## 🛡️ 3. Segurança & Multi-tenancy
- [x] **Isolamento Admin**: Um Admin da 'Loja A' consegue acessar o painel (`/admin/appointments`) da 'Loja B' mudando o slug? (Expectativa: Redirecionamento para sua própria dashboard). *(Validado via backend TenantInterceptor)*
- [x] **Isolamento Barbeiro**: Um Barbeiro vê apenas sua própria agenda mesmo se tentar mudar o ID na URL? *(Validado via backend AppointmentsController)*
- [x] **Google Auth**: O login via Google retorna para a URL correta com o slug da loja correspondente?

## 🎨 4. White-Label & Temas
- [x] **Branding**: O logotipo e cores mudam ao alternar entre diferentes barbearias?
- [x] **Hero Section**: O título e subtítulo da Home refletem as configurações do banco de dados?
- [x] **Cores**: A cor `--tenant-primary` está sendo aplicada corretamente em botões e ícones?

## 📊 5. Dashboards Administrativos
- [ ] **Financeiro**: Os cálculos de comissão batem com o esperado? Relatórios DRE carregam?
- [ ] **Estoque**: O histórico de movimentações registra entradas (IN) e saídas (OUT) corretamente? O saldo é atualizado?
- [ ] **Team**: Ativação/Desativação de membros do time reflete na agenda?
- [ ] **Responsividade**: As novas abas modulares do admin funcionam bem em tablets e celulares?

## 🛠️ 6. CRUD Operações (Gestão)
- [ ] **Serviços**:
    - [ ] Criar novo serviço com imagem.
    - [ ] Editar preço e duração (Reflete no Booking?).
    - [ ] Marcar como 'Destaque' e validar na Home.
    - [ ] Desativar serviço (Remove do Booking?).
- [ ] **Produtos**:
    - [ ] Cadastro de produto com categoria e estoque inicial.
    - [ ] Venda de produto avulso no Caixa.
    - [ ] Ajuste manual de estoque com justificativa.
- [ ] **Agenda & Bloqueios**:
    - [ ] Bloquear horário específico para um barbeiro.
    - [ ] Bloquear dia inteiro (Folga).
    - [ ] Verificar se clientes conseguem agendar em horários bloqueados.

## 💰 7. Fluxo de Caixa & Vendas
- [ ] **Abertura/Fechamento**: O fluxo de abertura e fechamento de caixa registra o saldo inicial/final?
- [ ] **Service Orders**: Ao finalizar um agendamento, uma ordem de serviço é gerada corretamente?
- [ ] **Comissões**: A comissão do barbeiro é calculada automaticamente baseada no `%` configurado no perfil dele?

## 👤 8. Perfil & Conta
- [ ] **Cadastro**: Novo cliente consegue se cadastrar via `/login`?
- [ ] **Esqueci Senha**: O fluxo de recuperação de senha envia o e-mail (simulado ou real)?
- [ ] **Avatar**: Upload de avatar funciona e persiste?

---
*Status Atual: 🛠️ Aguardando Validação Final*
