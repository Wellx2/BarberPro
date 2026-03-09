# Sistema de Assinaturas e Equipe Completa - Documentação para Frontend

## 📋 Índice

1. [Visão Geral das Alterações](#visão-geral-das-alterações)
2. [Tipos de Planos](#tipos-de-planos)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Endpoints Disponíveis](#endpoints-disponíveis)
5. [Exemplos de Requisições](#exemplos-de-requisições)
6. [Dados de Teste Disponíveis](#dados-de-teste-disponíveis)
7. [Guia de Integração Frontend](#guia-de-integração-frontend)
8. [Fluxos de Trabalho](#fluxos-de-trabalho)

---

## 🎯 Visão Geral das Alterações

### O que foi implementado?

1. **Sistema de Assinaturas BarberPro (SaaS)**
   - 3 tiers: SIMPLE, PLUS, PREMIUM
   - Gerenciado exclusivamente por SUPER_ADMIN
   - Controla recursos disponíveis para as barbearias

2. **Planos de Fidelidade para Clientes**
   - Gerenciado por ADMIN de cada barbearia
   - Isolamento multi-tenant (cada barbearia tem seus próprios planos)
   - SUPER_ADMIN pode criar planos para qualquer barbearia

3. **Sistema de Equipe Completa**
   - Novos roles: BARBER, HAIRDRESSER, MANICURIST, RECEPTIONIST, CASHIER, CLEANER
   - Sistema de comissões configurável por membro
   - Diferentes modelos de trabalho (salário, comissão, aluguel de cadeira)

4. **Banco de Dados Populado**
   - 2 barbearias PREMIUM configuradas
   - 11 membros de equipe com diferentes roles
   - 6 planos de fidelidade (3 por barbearia)
   - 42 agendamentos variados
   - 15 comandas com comissões
   - Dados financeiros completos

---

## 📦 Tipos de Planos

### 1. Assinatura BarberPro (SaaS)

**Quem gerencia:** SUPER_ADMIN  
**Onde fica:** Campo `subscriptionTier` na tabela `Barbershop`

#### Tiers Disponíveis

| Tier | Membros | Módulos | Preço Sugerido |
|------|---------|---------|----------------|
| **SIMPLE** | Até 3 | Básico (agendamentos, clientes) | R$ 79,90/mês |
| **PLUS** | Até 10 | + Financeiro, Produtos, Comissões | R$ 149,90/mês |
| **PREMIUM** | Ilimitado | Todos os recursos | R$ 249,90/mês |

**Status Possíveis:**
- `ACTIVE` - Assinatura ativa
- `EXPIRED` - Assinatura expirada
- `SUSPENDED` - Assinatura suspensa
- `CANCELLED` - Assinatura cancelada

### 2. Planos de Fidelidade (Clientes)

**Quem gerencia:** ADMIN da barbearia  
**Onde fica:** Tabela `Plan` (isolada por `shopId`)

**Estrutura:**
- Nome do plano
- Descrição
- Preço mensal
- Lista de benefícios (array)
- Desconto percentual
- Cashback
- Meses de benefício
- Flag de destaque (popular)

---

## 🏗️ Estrutura de Dados

### Barbershop (com campos de assinatura)

```typescript
interface Barbershop {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  
  // Campos de Assinatura BarberPro
  subscriptionTier: 'SIMPLE' | 'PLUS' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  maxTeamMembers: number;
  modulesEnabled: {
    appointments: boolean;
    clients: boolean;
    products: boolean;
    financial: boolean;
    reports: boolean;
    commissions: boolean;
    inventory: boolean;
  };
  
  // Campos de geolocalização e visual
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  description?: string;
  openingHours?: any;
  active: boolean;
}
```

### Plan (Plano de Fidelidade para Clientes)

```typescript
interface Plan {
  id: string;
  shopId: string; // Isolamento multi-tenant
  name: string;
  description: string;
  price: number;
  benefits: string[]; // Array de benefícios
  discount: number; // Desconto percentual
  cashback: number; // Cashback em reais
  benefitMonths: number; // Duração em meses
  featured: boolean; // Destacar como "popular"
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Team Member (Barber extends to other roles)

```typescript
interface Barber {
  id: string;
  shopId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  imageUrl?: string;
  
  // Campos de trabalho
  workModel: 'COMMISSION_ONLY' | 'SALARY' | 'SALARY_COMMISSION' | 'CHAIR_RENT';
  monthlySalary?: number; // Para SALARY ou SALARY_COMMISSION
  chairRentalFee?: number; // Para CHAIR_RENT
  
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relações
  user?: User;
  commissions?: BarberCommission[];
  appointments?: Appointment[];
  serviceOrders?: ServiceOrder[];
}
```

### Commission Configuration

```typescript
interface BarberCommission {
  id: string;
  barberId: string;
  shopId: string;
  
  type: 'PERCENTAGE' | 'FIXED' | 'TIERED';
  value: number; // Percentual ou valor fixo
  
  // Aplicação
  applyOnServices: boolean;
  applyOnProducts: boolean;
  
  // Comissões específicas (opcional)
  serviceId?: string;
  productId?: string;
  
  // Comissões escalonadas (para TIERED)
  minTarget?: number;
  maxTarget?: number;
  
  active: boolean;
}
```

---

## 🔌 Endpoints Disponíveis

### 1. Assinatura BarberPro (SUPER_ADMIN)

#### Configurar/Atualizar Assinatura

```http
PATCH /barbershops/:shopId/subscription
Authorization: Bearer {SUPER_ADMIN_TOKEN}
Content-Type: application/json

{
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE",
  "subscriptionStartDate": "2026-02-01",
  "subscriptionEndDate": "2027-02-01",
  "maxTeamMembers": 999
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "BarberPro Centro",
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE",
  "subscriptionStartDate": "2026-02-01T00:00:00.000Z",
  "subscriptionEndDate": "2027-02-01T00:00:00.000Z",
  "maxTeamMembers": 999,
  "modulesEnabled": {
    "appointments": true,
    "clients": true,
    "products": true,
    "financial": true,
    "reports": true,
    "commissions": true,
    "inventory": true
  },
  "featuresDescription": [
    "Membros da equipe ilimitados",
    "Todos os módulos habilitados",
    "Relatórios avançados",
    "Sistema de comissões completo",
    "Gestão de estoque",
    "Suporte prioritário"
  ]
}
```

#### Validações de Downgrade

O sistema **impede** downgrade de tier se:
- Número de barbeiros ativos > limite do novo tier
- Existem produtos cadastrados (new tier = SIMPLE)
- Existem comandas abertas (new tier = SIMPLE)

**Exemplo de erro:**
```json
{
  "statusCode": 400,
  "message": "Não é possível fazer downgrade: 6 barbeiros ativos excedem o limite de 3 do plano SIMPLE",
  "error": "Bad Request"
}
```

---

### 2. Planos de Fidelidade (ADMIN/SUPER_ADMIN)

#### Listar Planos

**ADMIN (lista apenas da própria barbearia):**
```http
GET /plans
Authorization: Bearer {ADMIN_TOKEN}
```

**SUPER_ADMIN (lista todos ou filtra por barbearia):**
```http
GET /plans?shopId={shopId}
Authorization: Bearer {SUPER_ADMIN_TOKEN}
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "shopId": "shop-uuid",
    "name": "Plano Prata",
    "description": "Plano intermediário com benefícios extras",
    "price": 129.90,
    "benefits": [
      "3 cortes ou barbas mensais",
      "15% de desconto em produtos",
      "1 hidratação capilar grátis",
      "Agendamento online prioritário"
    ],
    "discount": 15,
    "cashback": 10.00,
    "benefitMonths": 1,
    "featured": true,
    "active": true,
    "createdAt": "2026-02-13T00:00:00.000Z",
    "updatedAt": "2026-02-13T00:00:00.000Z"
  }
]
```

#### Criar Plano

**ADMIN (cria para própria barbearia - shopId automático):**
```http
POST /plans
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Plano Ouro",
  "description": "Plano premium com benefícios ilimitados",
  "price": 199.90,
  "benefits": [
    "Cortes ilimitados",
    "20% de desconto em produtos",
    "2 hidratações grátis",
    "Agendamento prioritário",
    "Bebida de cortesia"
  ],
  "discount": 20,
  "cashback": 15.00,
  "benefitMonths": 1,
  "featured": false
}
```

**SUPER_ADMIN (deve especificar shopId):**
```http
POST /plans
Authorization: Bearer {SUPER_ADMIN_TOKEN}
Content-Type: application/json

{
  "shopId": "shop-uuid", // OBRIGATÓRIO para SUPER_ADMIN
  "name": "Plano Executivo",
  "description": "Plano para profissionais",
  "price": 149.90,
  "benefits": ["..."],
  "discount": 15,
  "cashback": 10.00,
  "benefitMonths": 1,
  "featured": true
}
```

#### Atualizar Plano

```http
PATCH /plans/:id
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "price": 139.90,
  "featured": true
}
```

#### Ativar/Desativar Plano

```http
PATCH /plans/:id/toggle
Authorization: Bearer {ADMIN_TOKEN}
```

#### Remover Plano (Soft Delete)

```http
DELETE /plans/:id
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "reason": "Plano descontinuado por baixa adesão"
}
```

---

### 3. Equipe (Team Members)

#### Listar Membros da Equipe

```http
GET /barbers
Authorization: Bearer {ADMIN_TOKEN}
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "shopId": "shop-uuid",
    "name": "Marina Silva",
    "email": "marina@barberpro.com",
    "phone": "(11) 98888-3333",
    "specialty": "HAIRDRESSER",
    "workModel": "SALARY_COMMISSION",
    "monthlySalary": 2500.00,
    "active": true,
    "imageUrl": "https://...",
    "user": {
      "id": "user-uuid",
      "role": "BARBER"
    },
    "commissions": [
      {
        "id": "comm-uuid",
        "type": "PERCENTAGE",
        "value": 35,
        "applyOnServices": true,
        "applyOnProducts": false
      }
    ]
  }
]
```

#### Criar Membro da Equipe

```http
POST /barbers
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Patricia Costa",
  "email": "patricia@barberpro.com",
  "phone": "(11) 98888-5555",
  "specialty": "HAIRDRESSER",
  "workModel": "COMMISSION_ONLY",
  "password": "senha123"
}
```

---

### 4. Comissões

#### Criar Configuração de Comissão

```http
POST /commissions
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "barberId": "barber-uuid",
  "type": "PERCENTAGE",
  "value": 40,
  "applyOnServices": true,
  "applyOnProducts": false
}
```

#### Comissão Específica para um Serviço

```http
POST /commissions
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "barberId": "barber-uuid",
  "serviceId": "service-uuid", // Comissão específica
  "type": "FIXED",
  "value": 15.00,
  "applyOnServices": true,
  "applyOnProducts": false
}
```

---

## 📊 Dados de Teste Disponíveis

### Credenciais de Login

#### Administração
```
Super Admin:
  Email: superadmin@barberpro.com
  Senha: senha123
  Role: SUPER_ADMIN
  Acesso: Cross-tenant (todas as barbearias)

Admin Shop 1 (BarberPro Centro):
  Email: admin@barberpro.com
  Senha: senha123
  Role: ADMIN
  ShopId: {shop1-uuid}

Admin Shop 2 (BarberPro Zona Sul):
  Email: maria@barberpro.com
  Senha: senha123
  Role: ADMIN
  ShopId: {shop2-uuid}
```

#### Equipe Shop 1
```
Barbeiro João:
  Email: joao@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: Cortes clássicos

Barbeiro Pedro:
  Email: pedro@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: Barbas e degradês

Cabeleireira Marina:
  Email: marina@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: HAIRDRESSER
  Comissão: 35% em serviços

Manicure Juliana:
  Email: juliana@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: MANICURIST
  Comissão: 60% em serviços

Recepcionista Carla:
  Email: carla@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: RECEPTIONIST

Caixa Roberto:
  Email: roberto.almeida@barberpro.com
  Senha: senha123
  Role: BARBER
  Specialty: CASHIER
```

#### Cliente
```
Roberto Santos:
  Email: roberto@email.com
  Senha: senha123
  Role: CLIENT
```

### Planos de Fidelidade Cadastrados

#### Barbearia 1 - BarberPro Centro
1. **Plano Bronze** - R$ 79,90
   - 2 serviços mensais
   - 10% desconto
   
2. **Plano Prata** - R$ 129,90 ⭐ (Popular)
   - 3 serviços mensais
   - 15% desconto
   - 1 hidratação grátis
   
3. **Plano Ouro** - R$ 199,90
   - Serviços ilimitados
   - 20% desconto
   - 2 hidratações grátis

#### Barbearia 2 - BarberPro Zona Sul
1. **Plano Essencial** - R$ 89,90
   - 2 cortes/barbas mensais
   - 10% desconto
   
2. **Plano Executivo** - R$ 149,90 ⭐ (Popular)
   - 4 cortes/barbas mensais
   - 15% desconto
   - Agendamento prioritário
   
3. **Plano Black** - R$ 249,90
   - Serviços ilimitados
   - 25% desconto
   - Acesso VIP

### Estatísticas do Banco

- **2 Barbearias** (ambas PREMIUM)
- **22 Usuários** (1 Super Admin + 2 Admins + 11 equipe + 8 clientes)
- **11 Membros da Equipe** (barbeiros, cabeleireiras, manicure, etc.)
- **6 Planos de Fidelidade** (3 por barbearia)
- **46 Serviços** cadastrados
- **15 Produtos** cadastrados
- **15 Clientes** cadastrados
- **42 Agendamentos** (passados, presentes, futuros, cancelados)
- **15 Comandas/Ordens de Serviço**
- **7 Configurações de Comissão**
- **17 Avaliações**

---

## 🛠️ Guia de Integração Frontend

### 1. Estrutura de Dados TypeScript/Interface

```typescript
// types/subscription.ts
export enum SubscriptionTier {
  SIMPLE = 'SIMPLE',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

export interface BarbershopSubscription {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxTeamMembers: number;
  modulesEnabled: {
    appointments: boolean;
    clients: boolean;
    products: boolean;
    financial: boolean;
    reports: boolean;
    commissions: boolean;
    inventory: boolean;
  };
}

// types/plan.ts
export interface CustomerPlan {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  benefits: string[];
  discount: number;
  cashback: number;
  benefitMonths: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// types/team.ts
export enum WorkModel {
  COMMISSION_ONLY = 'COMMISSION_ONLY',
  SALARY = 'SALARY',
  SALARY_COMMISSION = 'SALARY_COMMISSION',
  CHAIR_RENT = 'CHAIR_RENT'
}

export enum Specialty {
  BARBER = 'Barbeiro',
  HAIRDRESSER = 'Cabeleireiro(a)',
  MANICURIST = 'Manicure/Pedicure',
  RECEPTIONIST = 'Recepcionista',
  CASHIER = 'Caixa',
  CLEANER = 'Auxiliar de Limpeza'
}

export interface TeamMember {
  id: string;
  shopId: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  workModel: WorkModel;
  monthlySalary?: number;
  chairRentalFee?: number;
  active: boolean;
  imageUrl?: string;
  commissions?: Commission[];
}

export interface Commission {
  id: string;
  barberId: string;
  type: 'PERCENTAGE' | 'FIXED' | 'TIERED';
  value: number;
  applyOnServices: boolean;
  applyOnProducts: boolean;
  serviceId?: string;
  productId?: string;
  active: boolean;
}
```

### 2. Serviços de API (Axios/Fetch)

```typescript
// services/api/subscriptions.ts
import { api } from './client';

export const subscriptionService = {
  // SUPER_ADMIN: Atualizar assinatura de uma barbearia
  updateSubscription: async (shopId: string, data: {
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    maxTeamMembers: number;
  }) => {
    const response = await api.patch(
      `/barbershops/${shopId}/subscription`,
      data
    );
    return response.data;
  },
  
  // Obter dados da barbearia atual
  getCurrentBarbershop: async () => {
    const response = await api.get('/barbershops/me');
    return response.data;
  }
};

// services/api/plans.ts
export const plansService = {
  // Listar planos (ADMIN: própria barbearia, SUPER_ADMIN: todas ou filtrar)
  list: async (shopId?: string) => {
    const params = shopId ? { shopId } : {};
    const response = await api.get<CustomerPlan[]>('/plans', { params });
    return response.data;
  },
  
  // Criar plano
  create: async (data: {
    shopId?: string; // Apenas para SUPER_ADMIN
    name: string;
    description: string;
    price: number;
    benefits: string[];
    discount: number;
    cashback: number;
    benefitMonths: number;
    featured: boolean;
  }) => {
    const response = await api.post<CustomerPlan>('/plans', data);
    return response.data;
  },
  
  // Atualizar plano
  update: async (id: string, data: Partial<CustomerPlan>) => {
    const response = await api.patch<CustomerPlan>(`/plans/${id}`, data);
    return response.data;
  },
  
  // Ativar/Desativar plano
  toggle: async (id: string) => {
    const response = await api.patch(`/plans/${id}/toggle`);
    return response.data;
  },
  
  // Remover plano (soft delete)
  remove: async (id: string, reason: string) => {
    const response = await api.delete(`/plans/${id}`, {
      data: { reason }
    });
    return response.data;
  }
};

// services/api/team.ts
export const teamService = {
  // Listar membros da equipe
  list: async () => {
    const response = await api.get<TeamMember[]>('/barbers');
    return response.data;
  },
  
  // Criar membro da equipe
  create: async (data: {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    workModel: WorkModel;
    monthlySalary?: number;
    chairRentalFee?: number;
    password: string;
  }) => {
    const response = await api.post<TeamMember>('/barbers', data);
    return response.data;
  },
  
  // Atualizar membro
  update: async (id: string, data: Partial<TeamMember>) => {
    const response = await api.patch<TeamMember>(`/barbers/${id}`, data);
    return response.data;
  },
  
  // Desativar membro
  disable: async (id: string, reason: string) => {
    const response = await api.patch(`/barbers/${id}/disable`, { reason });
    return response.data;
  }
};

// services/api/commissions.ts
export const commissionsService = {
  // Criar configuração de comissão
  create: async (data: {
    barberId: string;
    type: 'PERCENTAGE' | 'FIXED' | 'TIERED';
    value: number;
    applyOnServices: boolean;
    applyOnProducts: boolean;
    serviceId?: string;
    productId?: string;
  }) => {
    const response = await api.post('/commissions', data);
    return response.data;
  },
  
  // Listar comissões de um barbeiro
  listByBarber: async (barberId: string) => {
    const response = await api.get(`/commissions/barber/${barberId}`);
    return response.data;
  }
};
```

### 3. Componentes React Exemplo

#### Listar Planos de Fidelidade

```tsx
// components/Plans/PlansList.tsx
import React, { useEffect, useState } from 'react';
import { plansService } from '@/services/api/plans';
import { CustomerPlan } from '@/types/plan';

export const PlansList: React.FC = () => {
  const [plans, setPlans] = useState<CustomerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadPlans();
  }, []);
  
  const loadPlans = async () => {
    try {
      const data = await plansService.list();
      setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggle = async (planId: string) => {
    try {
      await plansService.toggle(planId);
      loadPlans(); // Recarrega lista
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div className="plans-grid">
      {plans.map(plan => (
        <div 
          key={plan.id} 
          className={`plan-card ${plan.featured ? 'featured' : ''}`}
        >
          {plan.featured && <span className="badge">POPULAR</span>}
          
          <h3>{plan.name}</h3>
          <p className="price">R$ {plan.price.toFixed(2)}/mês</p>
          <p className="description">{plan.description}</p>
          
          <ul className="benefits">
            {plan.benefits.map((benefit, index) => (
              <li key={index}>✓ {benefit}</li>
            ))}
          </ul>
          
          <div className="details">
            <span>Desconto: {plan.discount}%</span>
            <span>Cashback: R$ {plan.cashback.toFixed(2)}</span>
          </div>
          
          <div className="actions">
            <button onClick={() => handleToggle(plan.id)}>
              {plan.active ? 'Desativar' : 'Ativar'}
            </button>
            <button>Editar</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Dashboard de Assinatura (SUPER_ADMIN)

```tsx
// components/Admin/SubscriptionDashboard.tsx
import React, { useState } from 'react';
import { subscriptionService } from '@/services/api/subscriptions';
import { SubscriptionTier, SubscriptionStatus } from '@/types/subscription';

interface Props {
  shopId: string;
  currentSubscription: BarbershopSubscription;
}

export const SubscriptionDashboard: React.FC<Props> = ({ 
  shopId, 
  currentSubscription 
}) => {
  const [tier, setTier] = useState(currentSubscription.subscriptionTier);
  const [status, setStatus] = useState(currentSubscription.subscriptionStatus);
  const [saving, setSaving] = useState(false);
  
  const handleUpdate = async () => {
    setSaving(true);
    try {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      await subscriptionService.updateSubscription(shopId, {
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: endDate.toISOString(),
        maxTeamMembers: tier === 'PREMIUM' ? 999 : tier === 'PLUS' ? 10 : 3
      });
      
      alert('Assinatura atualizada com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="subscription-dashboard">
      <h2>Gerenciar Assinatura BarberPro</h2>
      
      <div className="current-plan">
        <h3>Plano Atual: {currentSubscription.subscriptionTier}</h3>
        <p>Status: {currentSubscription.subscriptionStatus}</p>
        <p>Membros: {currentSubscription.maxTeamMembers}</p>
        <p>
          Válido até: {new Date(currentSubscription.subscriptionEndDate)
            .toLocaleDateString('pt-BR')}
        </p>
      </div>
      
      <div className="form">
        <label>
          Tier:
          <select value={tier} onChange={(e) => setTier(e.target.value as SubscriptionTier)}>
            <option value="SIMPLE">Simple</option>
            <option value="PLUS">Plus</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </label>
        
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
            <option value="ACTIVE">Ativo</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="EXPIRED">Expirado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </label>
        
        <button onClick={handleUpdate} disabled={saving}>
          {saving ? 'Salvando...' : 'Atualizar Assinatura'}
        </button>
      </div>
      
      <div className="modules-enabled">
        <h4>Módulos Habilitados:</h4>
        <ul>
          {Object.entries(currentSubscription.modulesEnabled).map(([key, value]) => (
            <li key={key}>
              {value ? '✓' : '✗'} {key}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

#### Lista de Equipe com Comissões

```tsx
// components/Team/TeamList.tsx
import React, { useEffect, useState } from 'react';
import { teamService } from '@/services/api/team';
import { TeamMember } from '@/types/team';

export const TeamList: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTeam();
  }, []);
  
  const loadTeam = async () => {
    try {
      const data = await teamService.list();
      setTeam(data);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getSpecialtyLabel = (specialty: string) => {
    const labels: Record<string, string> = {
      'BARBER': 'Barbeiro',
      'HAIRDRESSER': 'Cabeleireiro(a)',
      'MANICURIST': 'Manicure/Pedicure',
      'RECEPTIONIST': 'Recepcionista',
      'CASHIER': 'Caixa',
      'CLEANER': 'Auxiliar de Limpeza'
    };
    return labels[specialty] || specialty;
  };
  
  if (loading) return <div>Carregando equipe...</div>;
  
  return (
    <div className="team-list">
      <h2>Equipe ({team.length} membros)</h2>
      
      {team.map(member => (
        <div key={member.id} className="team-card">
          <img 
            src={member.imageUrl || '/default-avatar.png'} 
            alt={member.name} 
          />
          
          <div className="info">
            <h3>{member.name}</h3>
            <p className="specialty">{getSpecialtyLabel(member.specialty)}</p>
            <p>{member.phone}</p>
            <p>{member.email}</p>
          </div>
          
          <div className="work-info">
            <p><strong>Modelo:</strong> {member.workModel}</p>
            {member.monthlySalary && (
              <p><strong>Salário:</strong> R$ {member.monthlySalary.toFixed(2)}</p>
            )}
            {member.chairRentalFee && (
              <p><strong>Aluguel:</strong> R$ {member.chairRentalFee.toFixed(2)}</p>
            )}
          </div>
          
          {member.commissions && member.commissions.length > 0 && (
            <div className="commissions">
              <h4>Comissões:</h4>
              <ul>
                {member.commissions.map(comm => (
                  <li key={comm.id}>
                    {comm.type === 'PERCENTAGE' ? `${comm.value}%` : `R$ ${comm.value}`}
                    {' '}em {comm.applyOnServices ? 'serviços' : 'produtos'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="actions">
            <button>Editar</button>
            <button className="danger">Desativar</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: SUPER_ADMIN Configura Assinatura

1. Login como SUPER_ADMIN
2. Acessa painel de barbearias
3. Seleciona barbearia para configurar
4. PATCH `/barbershops/:shopId/subscription`
5. Define tier, status, datas e limites
6. Sistema valida downgrade (se aplicável)
7. Barbearia atualizada com novos recursos

### Fluxo 2: ADMIN Cria Plano de Fidelidade

1. Login como ADMIN
2. Acessa seção de planos
3. POST `/plans` (shopId automático)
4. Define nome, preço, benefícios, desconto
5. Marca como destaque (featured) se desejado
6. Plano criado e disponível para clientes

### Fluxo 3: ADMIN Adiciona Membro da Equipe

1. Login como ADMIN
2. Acessa gestão de equipe
3. POST `/barbers`
4. Preenche dados: nome, email, specialty
5. Define modelo de trabalho (salário/comissão)
6. Sistema cria User + Barber
7. Configura comissões via POST `/commissions`

### Fluxo 4: Cliente Visualiza Planos Disponíveis

1. Cliente acessa página da barbearia
2. GET `/plans` (filtrado por shopId da barbearia)
3. Sistema retorna apenas planos ativos
4. Cliente vê planos ordenados por preço
5. Planos com `featured: true` destacados

### Fluxo 5: Sistema Calcula Comissão Automaticamente

1. Comanda é fechada (ServiceOrder COMPLETED)
2. Backend busca comissões do barbeiro
3. Hierarquia: específica → padrão → modelo de trabalho
4. Calcula valor baseado em tipo (PERCENTAGE/FIXED/TIERED)
5. Salva em OrderItem.commissionValue
6. Atualiza DailyCashFlow automaticamente

---

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções

#### 1. Erro 403: Forbidden
```json
{
  "statusCode": 403,
  "message": "Usuário não vinculado a uma barbearia",
  "error": "Forbidden"
}
```
**Solução:** Verificar se usuário tem `shopId` no token JWT.

#### 2. Erro 400: Downgrade Bloqueado
```json
{
  "statusCode": 400,
  "message": "Não é possível fazer downgrade: 6 barbeiros ativos excedem o limite de 3",
  "error": "Bad Request"
}
```
**Solução:** Desativar barbeiros antes de fazer downgrade.

#### 3. Erro 400: SUPER_ADMIN sem shopId
```json
{
  "statusCode": 400,
  "message": "SUPER_ADMIN deve especificar o shopId ao criar um plano",
  "error": "Bad Request"
}
```
**Solução:** Adicionar campo `shopId` no body da requisição.

#### 4. Erro 404: Plano não Encontrado
```json
{
  "statusCode": 404,
  "message": "Plano não encontrado",
  "error": "Not Found"
}
```
**Solução:** Verificar se ID está correto e se plano pertence ao shopId do usuário.

---

## 📝 Checklist de Implementação Frontend

### Telas a Implementar

- [ ] **Dashboard SUPER_ADMIN**
  - [ ] Lista de todas as barbearias
  - [ ] Painel de configuração de assinatura por barbearia
  - [ ] Visualização de estatísticas gerais
  
- [ ] **Dashboard ADMIN**
  - [ ] Visualização da própria assinatura (read-only)
  - [ ] Indicador de limite de membros da equipe
  - [ ] Alerta de expiração de assinatura
  
- [ ] **Gestão de Planos de Fidelidade**
  - [ ] Lista de planos com filtros e ordenação
  - [ ] Formulário de criação/edição
  - [ ] Toggle ativar/desativar
  - [ ] Marcação de plano destacado (featured)
  
- [ ] **Gestão de Equipe**
  - [ ] Lista de membros com specialty clara
  - [ ] Formulário de cadastro com modelo de trabalho
  - [ ] Configuração de comissões por membro
  - [ ] Filtros por specialty e status
  
- [ ] **Página Pública de Planos**
  - [ ] Card de planos para clientes
  - [ ] Destaque para planos populares
  - [ ] Comparação de benefícios
  - [ ] Call-to-action para contratação

### Funcionalidades de Validação

- [ ] Validar limites de tier antes de adicionar membro
- [ ] Alertar quando próximo do limite de membros
- [ ] Exibir módulos habilitados baseados no tier
- [ ] Bloquear funcionalidades se módulo desabilitado
- [ ] Validar datas de assinatura (alertar próximo da expiração)

---

## 🎨 Sugestões de UX/UI

### Cards de Planos de Fidelidade

```tsx
// Exemplo de estilização
<div className="plan-card featured">
  <span className="badge popular">MAIS POPULAR</span>
  <h3>Plano Prata</h3>
  <div className="price">
    <span className="currency">R$</span>
    <span className="value">129</span>
    <span className="cents">,90</span>
    <span className="period">/mês</span>
  </div>
  <ul className="benefits">
    {/* Lista de benefícios com ícones */}
  </ul>
  <div className="discount-badge">
    15% de desconto
  </div>
  <button className="cta">Contratar Agora</button>
</div>
```

### Indicador de Assinatura

```tsx
<div className="subscription-indicator">
  <span className="tier-badge premium">PREMIUM</span>
  <div className="limits">
    <span>6 / 999 membros</span>
    <progress value={6} max={999}></progress>
  </div>
  <span className="expiry">Válido até 13/02/2027</span>
</div>
```

### Card de Membro da Equipe

```tsx
<div className="team-member-card">
  <img src={member.imageUrl} alt={member.name} />
  <h4>{member.name}</h4>
  <span className="specialty-badge hairdresser">
    Cabeleireiro(a)
  </span>
  <div className="commission-info">
    <span className="commission-badge">35%</span>
    <span>de comissão</span>
  </div>
</div>
```

---

## 📞 Suporte e Troubleshooting

### Problemas Conhecidos

1. **Prisma Client desatualizado**
   - Executar: `npx prisma generate`
   
2. **Seed falha por processo Node travado**
   - Fechar todos os terminais Node.js
   - Executar novamente: `npx prisma db seed`

3. **Erro de permissão em endpoints**
   - Verificar se token JWT está correto
   - Validar role do usuário
   - Confirmar shopId no token

### Logs Úteis

```typescript
// Adicionar nos services para debug
console.log('Request:', {
  endpoint: '/plans',
  method: 'POST',
  headers: api.defaults.headers,
  data: requestData
});
```

---

## 📚 Documentações Relacionadas

- [SUBSCRIPTION_PLANS_SEPARATION.md](./SUBSCRIPTION_PLANS_SEPARATION.md) - Detalhes técnicos da separação de planos
- [COMMISSIONS_SYSTEM.md](./COMMISSIONS_SYSTEM.md) - Sistema de comissões completo
- [FINANCIAL_SYSTEM.md](./FINANCIAL_SYSTEM.md) - Sistema financeiro e comandas
- [API_PAYLOADS_FRONTEND.md](./API_PAYLOADS_FRONTEND.md) - Payloads gerais da API
- [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) - Credenciais de teste

---

## 🎉 Conclusão

O sistema está completamente implementado e populado com dados de teste realistas. O frontend pode consumir imediatamente os endpoints documentados seguindo os exemplos de código fornecidos.

**Próximos Passos Sugeridos:**
1. Implementar telas de gestão de planos
2. Criar dashboard de assinatura para SUPER_ADMIN
3. Implementar página pública de planos para clientes
4. Adicionar gestão visual de equipe com specialty
5. Criar relatórios de comissões por membro

**Data da Documentação:** 13 de fevereiro de 2026  
**Versão do Backend:** 1.0.0 (Seed Completo)  
**Autor:** BarberPro Development Team
