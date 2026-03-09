# Separação de Planos - Implementação Backend

## 📋 Resumo

Implementação da distinção entre **dois tipos de planos diferentes**:

### 1️⃣ Plano de Assinatura do BarberPro (SaaS Platform)
**Definido por**: SUPER_ADMIN  
**Pago por**: Barbearia  
**Propósito**: Contratar funcionalidades do sistema BarberPro

**Tiers Disponíveis:**
- `SIMPLE`: 3 membros de equipe, apenas agendamento e caixa
- `PLUS`: 10 membros, + dashboard financeiro e relatórios de comissão
- `PREMIUM`: Ilimitado, + gestão de produtos, inventário, IA e suporte prioritário

**Status Possíveis:**
- `ACTIVE`: Assinatura ativa
- `EXPIRED`: Assinatura expirada
- `SUSPENDED`: Assinatura suspensa
- `CANCELLED`: Assinatura cancelada

---

### 2️⃣ Planos de Fidelização da Barbearia
**Definido por**: ADMIN da barbearia ou SUPER_ADMIN  
**Pago por**: Clientes finais (usuários do app)  
**Propósito**: Fidelizar clientes com benefícios (serviços inclusos, cashback, etc.)

**Características:**
- Cada barbearia pode ter **múltiplos planos**
- Configurável: nome, descrição, preço, benefícios, descontos
- Campos: `benefitMonths`, `benefitServices`, `benefitProducts`, `benefitMoneyback`

---

## 🔧 Implementações Realizadas

### 1. Configuração de Assinatura do BarberPro (SUPER_ADMIN)

#### DTO Criado
**Arquivo**: `src/barbershops/dto/update-subscription.dto.ts`

```typescript
export class UpdateSubscriptionDto {
  subscriptionTier?: SubscriptionTier;      // SIMPLE | PLUS | PREMIUM
  subscriptionStatus?: SubscriptionStatus;  // ACTIVE | EXPIRED | SUSPENDED | CANCELLED
  subscriptionStartDate?: string;           // Data de início
  subscriptionEndDate?: string;             // Data de término
  maxTeamMembers?: number;                  // Limite de membros (validado)
}
```

#### Endpoints

##### ✅ `PATCH /barbershops/:shopId/subscription`
**Permissão**: `SUPER_ADMIN`  
**Propósito**: Configurar assinatura do BarberPro para uma barbearia

**Exemplo de Request:**
```json
{
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE",
  "subscriptionStartDate": "2026-01-01T00:00:00.000Z",
  "subscriptionEndDate": "2026-12-31T23:59:59.999Z",
  "maxTeamMembers": 999
}
```

**Validações Implementadas:**
- ✅ Não permite reduzir `maxTeamMembers` abaixo do número de membros ativos
- ✅ Não permite downgrade de PREMIUM→PLUS se tiver produtos cadastrados
- ✅ Não permite downgrade para SIMPLE se tiver comandas financeiras abertas
- ✅ Retorna `features` disponíveis baseado no tier

##### ✅ `GET /barbershops/:shopId/subscription`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Consultar assinatura atual e features disponíveis

**Response Exemplo:**
```json
{
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE",
  "subscriptionStartDate": "2026-01-01T00:00:00.000Z",
  "subscriptionEndDate": "2026-12-31T23:59:59.999Z",
  "maxTeamMembers": 999,
  "features": {
    "hasAppointments": true,
    "hasCashier": true,
    "maxTeamMembers": 999,
    "hasFinancialDashboard": true,
    "hasCommissionReports": true,
    "commissionReportPeriods": ["WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUAL"],
    "hasProducts": true,
    "hasInventory": true,
    "hasProductReports": true,
    "hasAdvancedReports": true,
    "hasAIAnalysis": true,
    "hasPrioritySupport": true,
    "hasConfigurationSupport": true
  }
}
```

##### ✅ `PATCH /barbershops/:id`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Atualizar perfil da barbearia (nome, CNPJ, endereço, etc.)

**Obs**: ADMIN só pode editar a própria barbearia (validado pelo TenantGuard)

---

### 2. Planos de Fidelização (ADMIN ou SUPER_ADMIN)

#### DTO Atualizado
**Arquivo**: `src/plans/dto/create-plan.dto.ts`

```typescript
export class CreatePlanDto {
  shopId?: string;              // Obrigatório para SUPER_ADMIN
  name: string;                 // Nome do plano
  price: number;                // Preço
  benefits: string[];           // Lista de benefícios
  discount: number;             // Desconto em serviços (%)
  benefitMonths?: number;       // Validade em meses
  benefitServices?: number;     // Quantidade de serviços inclusos
  benefitProducts?: number;     // Quantidade de produtos inclusos
  benefitMoneyback?: number;    // Percentual de cashback
  description?: string;         // Descrição detalhada
  isPopular?: boolean;          // Se é o plano mais popular
  active?: boolean;             // Se está ativo
}
```

#### Endpoints

##### ✅ `POST /plans`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Criar plano de fidelização

**SUPER_ADMIN**: Deve especificar `shopId` no body  
**ADMIN**: Usa automaticamente `shopId` da própria barbearia

**Exemplo SUPER_ADMIN:**
```json
{
  "shopId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Plano Premium",
  "price": 199.90,
  "benefits": ["5 cortes mensais", "20% desconto em produtos"],
  "discount": 20,
  "benefitMonths": 12,
  "benefitServices": 5,
  "benefitMoneyback": 10,
  "isPopular": true
}
```

##### ✅ `GET /plans?shopId=:shopId`
**Permissão**: `SUPER_ADMIN`, `ADMIN`, `BARBER`  
**Propósito**: Listar planos

- **SUPER_ADMIN**: Pode listar todos os planos ou filtrar por `shopId`
- **ADMIN/BARBER**: Lista apenas planos da própria barbearia

**Response Exemplo (SUPER_ADMIN):**
```json
[
  {
    "id": "plan-uuid",
    "shopId": "shop-uuid",
    "name": "Plano Premium",
    "price": 199.90,
    "shop": {
      "id": "shop-uuid",
      "name": "Barbearia Exemplo"
    },
    ...
  }
]
```

##### ✅ `GET /plans/public/shop/:shopId`
**Permissão**: Público (sem autenticação)  
**Propósito**: Listar planos ativos de uma barbearia (para clientes)

##### ✅ `PATCH /plans/:id`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Atualizar plano de fidelização

- **SUPER_ADMIN**: Pode editar qualquer plano
- **ADMIN**: Apenas planos da própria barbearia

##### ✅ `PATCH /plans/:id/toggle-active`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Ativar/desativar plano

##### ✅ `DELETE /plans/:id`
**Permissão**: `SUPER_ADMIN`, `ADMIN`  
**Propósito**: Deletar plano (apenas se inativo e sem usuários vinculados)

---

## 🔒 Validações de Segurança

### Multi-Tenancy
- ✅ ADMIN só acessa dados da própria barbearia
- ✅ SUPER_ADMIN tem bypass e acesso cross-tenant
- ✅ TenantGuard valida `shopId` em todos os endpoints protegidos

### Validações de Negócio

#### Assinatura do BarberPro:
- ✅ Não permite reduzir limite de equipe abaixo do número atual
- ✅ Valida produtos cadastrados antes de downgrade
- ✅ Valida comandas abertas antes de downgrade para SIMPLE
- ✅ Retorna features disponíveis baseado no tier

#### Planos de Fidelização:
- ✅ SUPER_ADMIN deve especificar `shopId` ao criar plano
- ✅ ADMIN cria planos apenas para própria barbearia
- ✅ Apenas planos inativos podem ser deletados
- ✅ Não permite deletar plano com usuários vinculados
- ✅ SUPER_ADMIN pode gerenciar planos de qualquer barbearia

---

## 📊 Estrutura do Banco de Dados

### Modelo Barbershop
```prisma
model Barbershop {
  // Perfil da Barbearia
  name                String
  cnpj                String?    @unique
  phone               String
  address             String?
  logo                String?
  
  // Assinatura do BarberPro (definida pelo SUPER_ADMIN)
  subscriptionTier       SubscriptionTier?   @default(SIMPLE)
  subscriptionStatus     SubscriptionStatus? @default(ACTIVE)
  subscriptionStartDate  DateTime?
  subscriptionEndDate    DateTime?
  maxTeamMembers         Int?               @default(3)
  
  // Módulos habilitados (configurados pelo ADMIN ou SUPER_ADMIN)
  modulesEnabled         Json?  // { products: true, financial: true, ... }
}
```

### Modelo Plan
```prisma
model Plan {
  id                String   @id @default(uuid())
  shopId            String   // Tenant isolation
  name              String
  price             Float
  benefits          String[]
  discount          Float
  benefitMonths     Int      @default(1)
  benefitServices   Int      @default(0)
  benefitProducts   Int      @default(0)
  benefitMoneyback  Float    @default(0)
  description       String?
  isPopular         Boolean  @default(false)
  active            Boolean  @default(true)
}
```

---

## 🚀 Próximos Passos

### 1. Gerar e Aplicar Migration
```bash
cd backend
npm run prisma:migrate
# Nome sugerido: "add_subscription_and_plan_separation"
npm run prisma:generate
```

### 2. Testar Endpoints

#### Configurar Assinatura (SUPER_ADMIN):
```bash
# 1. Login como SUPER_ADMIN
POST /auth/login
{
  "email": "admin@barberpro.com",
  "password": "senha"
}

# 2. Configurar assinatura de uma barbearia
PATCH /barbershops/{shopId}/subscription
Authorization: Bearer {token}
{
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE",
  "maxTeamMembers": 999
}

# 3. Consultar features disponíveis
GET /barbershops/{shopId}/subscription
Authorization: Bearer {token}
```

#### Criar Plano de Fidelização:
```bash
# Como SUPER_ADMIN (especificar shopId)
POST /plans
Authorization: Bearer {token}
{
  "shopId": "shop-uuid-aqui",
  "name": "Plano Gold",
  "price": 149.90,
  "benefits": ["3 cortes mensais", "15% cashback"],
  "discount": 15,
  "benefitMonths": 6,
  "benefitServices": 3,
  "benefitMoneyback": 15,
  "isPopular": true
}

# Como ADMIN (usa shopId automático)
POST /plans
Authorization: Bearer {token-admin}
{
  "name": "Plano Silver",
  "price": 89.90,
  "benefits": ["2 cortes mensais", "10% desconto"],
  "discount": 10,
  "benefitMonths": 3,
  "benefitServices": 2
}
```

#### Listar Planos:
```bash
# SUPER_ADMIN - todos os planos
GET /plans
Authorization: Bearer {token}

# SUPER_ADMIN - filtrar por barbearia
GET /plans?shopId={shopId}
Authorization: Bearer {token}

# ADMIN - apenas da própria barbearia
GET /plans
Authorization: Bearer {token-admin}

# Público - planos ativos de uma barbearia
GET /plans/public/shop/{shopId}
```

---

## 📝 Auditoria

Todas as ações são registradas em `AuditLog`:
- ✅ Criação/atualização de assinatura
- ✅ Criação/atualização/deleção de planos
- ✅ Ativação/desativação de planos

**Campos registrados:**
- `action`: CREATE, UPDATE, DELETE, TOGGLE_ACTIVE
- `entity`: Barbershop, Plan
- `entityId`: ID do registro afetado
- `userId`: Quem executou a ação
- `shopId`: Barbearia relacionada
- `details`: Detalhes da ação

---

## ✅ Checklist de Implementação

- [x] DTO para atualizar assinatura do BarberPro
- [x] Endpoint PATCH /barbershops/:shopId/subscription (SUPER_ADMIN)
- [x] Método updateSubscription com validações de downgrade
- [x] Endpoint PATCH /barbershops/:id atualizado para ADMIN também
- [x] Campo shopId opcional em CreatePlanDto
- [x] PlansService atualizado para SUPER_ADMIN criar planos cross-tenant
- [x] PlansService atualizado para SUPER_ADMIN editar/deletar qualquer plano
- [x] PlansService.findAll() com filtro opcional por shopId
- [x] PlansController atualizado com query param shopId
- [x] Validações de negócio (limites, produtos, comandas)
- [x] Auditoria de todas as ações
- [x] Documentação completa

---

## 🎯 Resumo Para o Frontend

### Fluxo SUPER_ADMIN:
1. Login → Acessa qualquer barbearia
2. Configura assinatura do BarberPro (`PATCH /barbershops/:shopId/subscription`)
3. Atualiza perfil da barbearia (`PATCH /barbershops/:id`)
4. Cria planos de fidelização para qualquer barbearia (`POST /plans` com `shopId`)
5. Gerencia planos de qualquer barbearia (`PATCH`, `DELETE /plans/:id`)

### Fluxo ADMIN:
1. Login → Acessa apenas a própria barbearia
2. Atualiza perfil da barbearia (`PATCH /barbershops/:id`)
3. Consulta assinatura e features (`GET /barbershops/:shopId/subscription`)
4. Cria/edita planos de fidelização (`POST /plans` sem `shopId`)
5. Toggle ativo/inativo de planos (`PATCH /plans/:id/toggle-active`)

### Fluxo Cliente (App):
1. Visualiza barbearias disponíveis
2. Consulta planos de fidelização (`GET /plans/public/shop/:shopId`)
3. Assina um plano (campo `planId` no User)

---

## ⚠️ Importante

- **Assinatura do BarberPro** é gerenciada pelo SUPER_ADMIN e controla funcionalidades
- **Planos de Fidelização** são gerenciados por ADMIN/SUPER_ADMIN e oferecem benefícios aos clientes
- Backend valida todas as features antes de permitir operações (Defense in Depth)
- Frontend deve se adaptar às validações e respostas do backend
