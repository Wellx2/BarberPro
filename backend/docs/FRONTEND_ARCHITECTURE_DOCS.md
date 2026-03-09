# BarberPro Frontend Architecture & Documentation

Esta documentação fornece uma visão geral abrangente da arquitetura, funcionalidades, componentes e telas do frontend do BarberPro. O objetivo deste documento é servir como base de conhecimento (contexto) para o Google NotebookLM ou outras ferramentas de IA, permitindo análises de arquitetura, propostas de melhorias e implementação de novas funcionalidades.

---

## 📂 1. Estrutura de Pastas (Folder Tree)

O frontend é organizado de forma modular, separando a lógica de estado global, serviços de API e componentes de UI.

```text
frontend/
├── public/              # Ativos estáticos (ícones, imagens globais)
└── src/
    ├── components/      # Componentes reutilizáveis (UI, Layout, Skeletons)
    ├── context/         # Estado Global (Auth, Shop/Multi-tenant, Theme)
    ├── hooks/           # Hooks customizados para lógica reutilizável
    ├── pages/           # Telas da aplicação (Divididas por Roles)
    │   ├── admin/       # Dashboard Adm, Caixa, Financeiro
    │   ├── barber/      # Agenda e Dashboard do Profissional
    │   └── client/      # Dashboard e Histórico do Cliente
    ├── services/        # Integração com API (Axios/Fetch, Services)
    ├── styles/          # Configurações de tema e CSS Global
    ├── utils/           # Funções utilitárias e ajudantes
    ├── App.tsx          # Roteador central e lógica de inicialização
    ├── types.ts         # Definições de interfaces e Enums globais
    └── index.tsx        # Ponto de entrada da aplicação
```

## 🏗️ 2. Visão Geral e Stack Tecnológico

O projeto é uma Single Page Application (SPA) focada em performance, responsividade e multi-tenancy (múltiplas barbearias).

- **Framework Core**: React 18+ com TypeScript.
- **Build Tool**: Vite (para compilação rápida e HMR).
- **Roteamento**: `react-router` / `react-router-dom` (utilizando `HashRouter` como base atual).
- **Estilização**: CSS modular / utilitário (gerenciado através da pasta `src/styles` e componentes UI).
- **Gerenciamento de Estado**: React Context API (sem a necessidade de bibliotecas externas complexas como Redux, focando em simplicidade e performance).

---

## 🧩 3. Gerenciamento de Estado Global (Context API)

A aplicação utiliza contextos (localizados em `src/context/`) para gerenciar estados globais e regras de negócio essenciais:

1. **`AuthContext.tsx`**:
   - **Responsabilidade**: Gerencia a autenticação do usuário (Login/Logout), armazenamento de tokens JWT e controle de sessão.
   - **Funcionalidade**: Expõe os dados do usuário logado e sua role (`ADMIN`, `SUPER_ADMIN`, `BARBER`, `CLIENT`).

2. **`ShopContext.tsx`**:
   - **Responsabilidade**: Coração da funcionalidade **Multi-tenant**.
   - **Funcionalidade**: Gerencia qual barbearia o usuário atual está visualizando/interagindo. Carrega as configurações específicas da loja selecionada e permite a troca de loja (para admins/superadmins com acesso a múltiplas unidades).

3. **`NotificationContext.tsx`**:
   - **Responsabilidade**: Sistema global de feedback (Toasts/Alertas).
   - **Funcionalidade**: Exibe mensagens de sucesso, erro ou avisos (ex: lembretes de agendamento na próxima 1 hora).

4. **`ThemeContext.tsx`**:
   - **Responsabilidade**: Acessibilidade e visual.
   - **Funcionalidade**: Gerencia a alternância entre temas (Dark Mode / Light Mode).

---

## 🚦 4. Estrutura de Rotas e Telas (`src/pages/`)

A navegação é dividida estritamente por níveis de acesso (Público vs Protegido) e Roles.

### 🟢 Telas Públicas (Sem necessidade de login)
- **`Home.tsx`**: Landing page principal do sistema.
- **`Login.tsx`**: Tela de autenticação de usuários.
- **`Services.tsx` e `Products.tsx`**: Catálogo de serviços e produtos oferecidos.
- **`Plans.tsx`**: Exibição de planos de assinatura/fidelidade disponíveis.
- **`BarberProfile.tsx` (`/barber/:id`)**: Perfil público detalhado de um barbeiro específico (portfólio, avaliações, link direto para agendamento).
- **Telas Institucionais**: `Terms.tsx`, `Privacy.tsx`, `Contact.tsx`.

### 🔵 Telas de Cliente (`CLIENT`)
- **`Dashboard.tsx`**: Roteador interno que redireciona para o dashboard correto baseado na role. Para clientes, renderiza o `src/pages/client/ClientDashboard.tsx`.
- **`UserProfile.tsx`**: Gestão do perfil do usuário, fotos, dados cadastrais e histórico pessoal.
- **`Booking.tsx` (`/book`)**: Tela principal de agendamento. Fluxo com seleção de serviço, barbeiro, data e horário.

### 🟠 Telas de Barbeiro (`BARBER`)
Localizadas em `src/pages/barber/`:
- **`BarberDashboard.tsx`**: Visão do barbeiro com seus agendamentos do dia, métricas de desempenho e comissões.
- **`ScheduleBlocks.tsx`**: Gerenciamento de bloqueios de agenda (horários de almoço, folgas, imprevistos).

### 🔴 Telas Administrativas (`ADMIN` / `SUPER_ADMIN`)
Localizadas em `src/pages/admin/`:
- **`AdminDashboard.tsx`**: Visão gerencial da barbearia selecionada (métricas gerais, faturamento, ocupação).
- **`SuperAdminDashboard.tsx`**: Visão global de todas as franquias/barbearias da rede.
- **`Appointments.tsx`**: Gerenciamento da agenda completa da barbearia (visão de todos os barbeiros).
- **`Cashier.tsx`**: Módulo de PDV / Caixa (abertura/fechamento de caixa, registro de pagamentos, comandas).
- **`SalesHistory.tsx`**: Relatórios de vendas e fluxo de caixa.
- **`StockMovements.tsx`**: Controle de inventário, entrada e saída de produtos.

---

## 🧱 5. Componentes Principais (`src/components/`)

Componentes reutilizáveis que constroem a interface da aplicação:

### Estruturais e de Roteamento
- **`Layout.tsx`**: Wrapper principal que engloba a Sidebar/Navbar e a área de conteúdo (renderiza o `<Outlet>` ou `children`).
- **`ProtectedRoute.tsx`**: Componente de segurança que envolve rotas que exigem login. Verifica o JWT no `AuthContext` e a role do usuário.
- **`LoadingSkeleton.tsx` / `ShopLoadError.tsx`**: Componentes de feedback visual durante o carregamento de APIs (suspense/fallback).

### Funcionais
- **`ShopSelector.tsx`**: Dropdown inteligente que permite usuários multiloja alternarem o contexto (`ShopContext`) dinamicamente.
- **`UserMenu.tsx`**: Menu de perfil (cabeçalho) com opções de configurações e logout.
- **`Calendar.tsx`**: Componente de calendário customizado usado ativamente na tela de reservas (`Booking.tsx`) e dashboards.
- **`QRCodeGenerator.tsx` e `ShareLink.tsx`**: Ferramentas de marketing e utilidade para compartilhamento de perfis de barbeiros e links de agendamento direto.

### UI de Domínio
- **`ServiceGrid.tsx` / `ProductGrid.tsx` / `PlanCard.tsx`**: Componentes de apresentação de catálogos, padronizando a exibição de itens comerciais com imagens e preços.
- **`SectionHeader.tsx`**: Cabeçalhos padronizados para as páginas internas.

---

## 🔌 6. Integração com a API (Services - `src/services/`)

Toda a comunicação com o backend (HTTP Requests) está abstraída dentro de `src/services`, baseada no arquivo central `api.ts` (provavelmente uma instância do Axios configurada com interceptors para injetar o JWT).

Os domínios de negócio separados por serviço:
- **`authService.ts`**: Login, registro, recuperação de senha.
- **`appointmentService.ts`**: CRUD de agendamentos, busca de horários disponíveis.
- **`barbershopService.ts`**: Listagem de lojas e detalhes da franquia.
- **`barberService.ts`**: Listagem de barbeiros, portfólios, métricas individuais.
- **`clientService.ts` / `teamService.ts`**: Gestão de usuários e membros da equipe (painel admin).
- **`productService.ts` / `serviceService.ts` / `planService.ts`**: Gerenciamento de catálogos (criação, edição e exclusão de itens).
- **`financialService.ts` / `expenseService.ts`**: Comunicação com os módulos de Caixa, Histórico de Vendas e Despesas.

---

## 🚀 7. Potenciais Áreas para Análise e Expansão

Com base nesta arquitetura que já possui um MVP robusto funcionado, algumas áreas podem ser exploradas no NotebookLM para novas funcionalidades:

1. **Expansão do Módulo Financeiro**:
   - Integração avançada no `Cashier.tsx` (ex: divisão de pagamentos, gorjetas, integração direta com maquininhas via WebSocket).
   - Relatórios preditivos em `SalesHistory.tsx`.
2. **Engajamento de Clientes (Gamificação/Fidelidade)**:
   - Expandir a lógica de `Plans.tsx` e `UserProfile.tsx` para incluir um sistema de pontos e recompensas rastreável.
3. **Comunicações**:
   - WebPush Notifications nativas ou integração WS no `NotificationContext.tsx` de forma real-time, conectando os status alterados em `appointmentService.ts`.
4. **Performance e Offline**:
   - Transformar a SPA em um **PWA (Progressive Web App)** adicionando Service Workers, permitindo que o `ClientDashboard` e `BarberDashboard` funcionem parcialmente offline (cache via IndexedDB).

---
*Documentação gerada da versão atual da branch principal/startup. Utilize para carregar contexto em motores de LLM estruturados para propor melhorias direcionadas em components, stores ou fluxos específicos.*
