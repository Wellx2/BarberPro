# BarberPro Backend Architecture & Documentation

Esta documentação detalha a arquitetura, lógica de negócio e estrutura do backend BarberPro, projetado como um sistema SaaS multi-tenant escalável utilizando **NestJS** e **Prisma ORM**.

---

## 🏗️ 1. Estrutura de Pastas e Organização Modular

O backend segue o padrão modular do NestJS, onde cada domínio de negócio possui seu próprio módulo, controller e service.

```text
backend/
├── prisma/
│   └── schema.prisma        # Modelo de Dados (PostgreSQL + Prisma)
└── src/
    ├── agenda-locks/        # Bloqueios manuais de agenda (folgas, intervalos)
    ├── appointments/        # Gestão de agendamentos (Fluxo Core)
    ├── auth/                # Autenticação (JWT, Refresh Token, Google OAuth)
    ├── barbers/             # Gestão de perfis e profissionais
    ├── barbershops/         # Gestão de unidades (Tenants)
    ├── clients/             # Cadastro e histórico de clientes
    ├── common/              # Recursos globais (Guards, Middlewares, Decorators)
    ├── commissions/         # Lógica de cálculo de comissões de barbeiros
    ├── expenses/            # Fluxo de custos e despesas operacionais
    ├── financial/           # Relatórios financeiros e analytics do dashboard
    ├── products/            # Vendas e controle de estoque de produtos
    ├── service-orders/      # Comandas e Ordens de Serviço (Checkout)
    ├── services/            # Catálogo de serviços e tabelas de preços
    └── users/               # Gestão de identidades e acessos
```

---

## 🔒 2. Estratégia de Multi-tenancy

O sistema utiliza a abordagem de **Shared Database, Shared Schema**. O isolamento é garantido via código e restrições de banco:

- **Identificador**: Quase todas as tabelas possuem a coluna `shopId` (FK para [Barbershop](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/context/ShopContext.tsx#23-56)).
- **Segurança**: 
  - O [TenantGuard](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/common/guards/tenant.guard.ts#3-22) extrai o `shopId` do token JWT do usuário.
  - O sistema impede que um usuário de um tenant acesse dados de outro, validando o `shopId` em todas as queries do Prisma Service.
  - **Exceção**: Usuários com a role `SUPER_ADMIN` podem ignorar o filtro de tenant para fins de suporte e gestão global.

---

## 🚦 3. Domínios de Negócio Principais

### A. Autenticação e Autorização (`/auth`)
- Implementação robusta de JWT com **Refresh Token** (armazenado em hash no DB).
- Suporte a Login Social (Google) convertendo automaticamente usuários para a role `CLIENT`.
- Controle de acesso baseado em roles: `SUPER_ADMIN`, `ADMIN`, `BARBER`, `CLIENT`.

### B. Sistema de Agendamento (`/appointments`)
- **Validação de Conflitos**: O sistema impede double-booking para o mesmo profissional.
- **Horário de Funcionamento**: Valida se a reserva respeita o `openingTime` e `closingTime` da unidade.
- **Auditoria**: Registra `createdBy`, `cancelledBy` e `cancelledAt` para rastreabilidade total.

### C. Módulo Financeiro e Comandas (`/service-orders`)
- As comandas vinculam serviços e produtos ao final do atendimento.
- Integrado com o cálculo automático de comissões definido no perfil de cada barbeiro.
- Dashboard financeiro calcula faturamento bruto, líquido e despesas pendentes.

---

## 🚀 4. Roadmap de Evolução Técnica

1. **Notificações**:
   - Implementar disparos de WhatsApp/SMS automatizados baseados em triggers de banco.
   - Webhooks para integração com gateways de pagamento (ex: Mercado Pago/Stripe).
2. **Otimização de Performance**:
   - Implementar Cache (Redis) para rotas públicas de catálogo (`/services/public`).
   - Paginação avançada para logs de auditoria e relatórios financeiros longos.
3. **Escalabilidade**:
   - Preparar a estrutura de banco para migração para **Row Level Security (RLS)** do PostgreSQL se o volume de tenants crescer significativamente.

---
*Documento estruturado para conversão em base de conhecimento para desenvolvimento e suporte avançado.*
