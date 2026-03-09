# BarberPro – Módulo Financeiro de Precisão (BI de Lucro Real)

## O que foi construído

### 1. Schema do Banco de Dados (Prisma)

| Mudança | Detalhe |
|---------|---------|
| `Service.supplyCost` | Novo campo `Float @default(0)` — custo estimado de insumos por execução do serviço |
| `BarbershopAsset` | Novo model para controle de bens físicos (cadeiras, máquinas etc.) |

**Campos do `BarbershopAsset`:**
```prisma
name             String
description      String?
purchaseDate     DateTime
purchasePrice    Float
usefulLifeMonths Int @default(24)
isActive         Boolean @default(true)
```

---

### 2. Isolamento de Dados (RLS – Prisma Client Extensions)

Toda query no sistema é automaticamente escoped ao `shopId` do usuário autenticado via `AsyncLocalStorage` no [PrismaService](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/prisma/prisma.service.ts#12-118). Nenhuma query vaza entre tenants.

**Automação de Estoque:** Um segundo bloco `$extends` intercepta qualquer `serviceOrder.update` onde `status → COMPLETED` e decrementa automaticamente o `stock` dos produtos vinculados. Se `stock ≤ 0`, o produto é desativado (`isActive = false`).

---

### 3. Fórmula de Lucro Líquido Real

```
Lucro Real = Faturamento Bruto
           - Taxas de Cartão (4% Crédito / 2% Débito)
           - Custos de Insumos (supplyCost × qtd de serviços)
           - Comissões Granulares (% por tipo: Serviços ≠ Produtos)
           - Pró-rata de Custos Fixos (escalonado pelo período)
           - Custo de Produto (CMV estimado 30%)
```

---

## API Reference – Endpoints Financeiros

**Base URL:** `/api/financial`  
**Auth:** `Bearer <JWT_TOKEN>` obrigatório em todos os endpoints.

---

### `GET /financial/analytics`

Retorna analytics financeiros completos com Lucro Líquido Real para o período.

**Query Params:**
| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `period` | `TODAY \| WEEK \| MONTH \| QUARTER \| YEAR \| ALL` | ✅ |
| `shopId` | `string` | Apenas SUPER_ADMIN |
| `startDate` | `string (YYYY-MM-DD)` | ❌ |
| `endDate` | `string (YYYY-MM-DD)` | ❌ |

**Response:**
```typescript
interface FinancialAnalyticsResponse {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  gross: number;           // Faturamento bruto total
  serviceRev: number;
  productRev: number;
  planRev: number;
  expenses: number;        // Soma de todos os custos
  totalCommissions: number;
  fixedCostsTotal: number;
  supplyCostsTotal: number; // ⭐ NOVO – custo de insumos
  cardFees: number;         // ⭐ NOVO – taxas de máquina
  productCosts: number;
  net: number;             // ⭐ Lucro Líquido Real
  isLoss: boolean;
  margin: number;          // % de margem real
  avgTicket: number;
  totalAppointments: number;
  commissionsByBarber: BarberCommissionDetail[];
}

interface BarberCommissionDetail {
  id: string;
  name: string;
  avatar: string | null;
  appointments: number;
  revenue: number;
  commission: number;
  serviceRate: number;   // ⭐ NOVO – % sobre serviços
  productRate: number;   // ⭐ NOVO – % sobre produtos
  netForShop: number;
}
```

---

### `GET /financial/cashier/daily`

**Query Params:** `date: YYYY-MM-DD`, `shopId?`

**Response (campos novos adicionados):**
```typescript
interface DailyCashierResponse {
  // ... campos existentes ...
  cardFees: number;        // ⭐ NOVO – taxas de cartão do dia
  supplyCostsTotal: number;// ⭐ NOVO – custo de insumos do dia
  netRevenue: number;      // ⭐ Atualizado – agora é lucro real
}
```

---

### `GET /financial/opportunities`

Retorna sugestões preditivas de venda baseadas em padrão de compra de produtos dos clientes.

**Roles:** `SUPER_ADMIN`, `ADMIN`, `BARBER`

**Response:**
```typescript
interface SalesOpportunity {
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  productPrice: number;
  avgRecurrenceDays: number;     // Padrão de compra detectado
  daysSinceLastPurchase: number;
  lastPurchaseDate: string;      // ISO String
  urgency: 'NORMAL' | 'HIGH';   // HIGH = passou a data ideal
  suggestion: string;            // Texto de sugestão
}
```

---

### `GET /financial/retention`

Calcula o Churn e taxa de retenção dos últimos 90 dias.

**Roles:** `SUPER_ADMIN`, `ADMIN`

**Response:**
```typescript
interface RetentionMetrics {
  retentionRate: number;      // % ex: 72.3
  retainedClients: number;
  newClients: number;
  totalActiveClients: number;
  churnedClients: number;
  evaluationPeriod: string;   // "Últimos 90 dias"
}
```

---

### `GET /financial/assets` ⭐ NOVO

Lista todos os bens físicos da barbearia com depreciação linear calculada e alertas de necessidade de troca.

**Roles:** `SUPER_ADMIN`, `ADMIN`

**Response:**
```typescript
interface AssetWithDepreciation {
  id: string;
  name: string;
  description: string | null;
  purchaseDate: string;          // ISO Date
  purchasePrice: number;
  usefulLifeMonths: number;
  monthsElapsed: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  currentValue: number;
  depreciationPercentage: number;  // ex: 45.8 (%)
  needsReplacement: boolean;
  monthsUntilReplacement: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'NEEDS_REPLACEMENT';
  isActive: boolean;
}
```

**Lógica de status:**
- `ACTIVE` → dentro da vida útil
- `EXPIRING_SOON` → ≤ 3 meses para expirar
- `NEEDS_REPLACEMENT` → passou da vida útil

---

## Service (Axios) – Adicionar ao [financialService.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/services/financialService.ts) do Frontend

```typescript
// Adicionar ao arquivo: src/services/financialService.ts

export const getAssets = async (): Promise<AssetWithDepreciation[]> => {
  const response = await api.get<AssetWithDepreciation[]>('/financial/assets');
  return response.data;
};
```

---

## Como registrar um novo Ativo (via Prisma Studio ou endpoint separado)

Atualmente o cadastro de ativos deve ser feito via Prisma Studio (`npx prisma studio`) ou via script. Um endpoint `POST /financial/assets` pode ser criado na Fase seguinte conforme necessidade.

---

## Testes

- **Arquivo:** [src/financial/financial.service.spec.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/financial/financial.service.spec.ts)
- **Rodar:** `npx jest --testPathPattern="financial.service.spec" --no-coverage --forceExit`
- **Cenário validado:** Serviço de R$ 50 via Débito → Lucro Real = R$ 18,00 (taxa R$1 + insumo R$5 + comissão R$25 + custo fixo R$1)
