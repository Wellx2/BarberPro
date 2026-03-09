# BarberPro: Análise Técnica e Documentação para MVP

Este documento detalha a arquitetura, lógica de negócio e estrutura do backend BarberPro, visando orientar o desenvolvimento do MVP e futuras expansões.

## 1. Estrutura de Pastas (Folder Tree)

O projeto segue uma arquitetura modular baseada no framework **NestJS**, facilitando a escalabilidade e separação de responsabilidades.

```text
backend/
├── prisma/
│   └── schema.prisma        # Definição do banco de dados (Prisma)
└── src/
    ├── agenda-locks/        # Bloqueios manuais de agenda
    ├── appointments/        # Gestão de agendamentos (Core)
    ├── auth/                # Autenticação (JWT, Google OAuth)
    ├── barbers/             # Gestão de profissionais/barbeiros
    ├── barbershops/         # Gestão de unidades (Tenants)
    ├── clients/             # Cadastro de clientes
    ├── common/              # Recursos compartilhados (Guards, Decorators)
    │   ├── guards/          # JwtAuth, Tenant, roles, ModuleAccess
    │   └── decorators/      # CurrentUser, Roles, Public
    ├── commissions/         # Cálculo de comissões
    ├── expenses/            # Fluxo de despesas
    ├── financial/           # Relatórios financeiros e analytics
    ├── invoices/            # Faturamento e assinaturas
    ├── products/            # Gestão de estoque e vendas de produtos
    ├── service-orders/      # Comandas (Ordens de serviço)
    ├── services/            # Gestão de catálogo de serviços
    └── users/               # Gestão de usuários do sistema
```

---

## 2. Documentação de Backend (API)

### A. Definição do Banco de Dados e Multi-tenancy
O sistema utiliza **PostgreSQL** com **Prisma ORM**. O isolamento de dados (multi-tenancy) é implementado através do modelo de **Shared Database, Shared Schema**, onde cada registro é vinculado a um "Tenant".

*   **Entidade Tenant:** `Barbershop`
*   **Identificador de Isolamento:** `shopId` (ou `barbershopId` em algumas tabelas)
*   **Mecanismo de Segurança:** Quase todos os modelos (`User`, `Barber`, [Appointment](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/appointments/appointments.controller.ts#15-91), [Service](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/services/services.controller.ts#26-121), etc.) possuem a FK `shopId`. A validação é feita via [TenantGuard](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/common/guards/tenant.guard.ts#3-22) que extrai o ID do token JWT e injeta no fluxo da requisição.

### B. Rotas Principais (Endpoints)

#### Autenticação (`/auth`)
- `POST /auth/register-shop`: Registro de nova unidade.
- `POST /auth/login`: Autenticação e geração de tokens.
- `GET /auth/google`: Login social.
- `GET /auth/me`: Verificação de sessão (debug).

#### Agendamentos (`/appointments`)
- `POST /appointments`: Criar novo horário.
- `GET /appointments`: Listar agendamentos (filtro por data/profissional).
- `PATCH /appointments/:id/reschedule`: Alterar horário.
- `PATCH /appointments/:id/cancel`: Cancelamento (com motivo).

#### Financeiro e Serviços
- `GET /financial/analytics`: Dashboard de faturamento por período.
- `GET /services/public/shop/:shopId`: Catálogo para clientes finais (rota pública).
- `POST /service-orders`: Abertura de comandas/vendas presenciais.

### C. Controllers e Middlewares (Lógica de Negócio)

#### Middlewares de Segurança (Guards)
1.  **JwtAuthGuard**: Valida a assinatura do token e injeta o `user` no objeto `req`.
2.  **TenantGuard**: Garante que o usuário só acesse recursos da sua própria `Barbershop`. Bloqueia o acesso caso o `shopId` seja inconsistente.
3.  **RolesGuard**: Controle granular de acesso (`ADMIN`, `BARBER`, `CLIENT`).
4.  **ModuleAccessGuard**: Verifica se o módulo específico (ex: Financeiro Premium) está habilitado para o plano daquela barbearia.

#### Lógica de Agendamento
Implementada no `AppointmentsService`, a lógica garante que:
- Não existam conflitos de horário para o mesmo barbeiro.
- O período solicitado esteja dentro do horário de funcionamento da barbearia.
- O serviço não esteja "desativado" para aquela data específica.

---

## 3. Análise e Estratégia para o MVP

### Foco Inicial (Prioridades)
1.  **Agendamento Simplificado:** Manter `appointments` e `services` como core.
2.  **Controle Financeiro Básico:** Priorizar o `DailyCashFlow` (Caixa Diário) para que o barbeiro saiba quanto ganhou no dia.
3.  **Gestão de Clientes:** Manter o histórico de agendamentos por `Client`.

### Funções para Expansion (Pós-MVP)
- **Cálculo de Comissões Complexo:** Pode ser simplificado no início para uma taxa fixa global.
- **Gestão de Estoque Avançada:** Manter apenas produtos básicos antes de habilitar alertas de estoque baixo.

### Sugestões de Melhorias (Roadmap)
- **PDV Integrado (Comandas):** Evoluir o módulo de `service-orders` para um checkout rápido via Tablet.
- **WhatsApp Reminders:** Integração com API (ex: Twilio ou Evolution API) para envio automático de lembretes 2h antes.
- **iCal (RFC 5545):** Gerar feeds dinâmicos para sincronizar a agenda do BarberPro com Google Calendar/iPhone.
- **Categorias de Serviços Avançadas:** Tags dinâmicas para facilitação de busca no frontend.
