# 💰 API Financial - Saúde Financeira e Caixa Operacional

## ✅ Status da Implementação
**Concluído:** 04/02/2026  
**Backend:** ✅ FUNCIONANDO  
**Migration:** ✅ APLICADA  

---

## 🗄️ Models Criados

### Invoice (Fatura/Ordem de Serviço)
```prisma
model Invoice {
  id              String          @id @default(uuid())
  shopId          String
  clientId        String?
  clientName      String
  type            InvoiceType     // SERVICE, PRODUCT, PLAN
  status          InvoiceStatus   // PENDING, PAID, CANCELLED
  amount          Float
  description     String?
  paymentMethod   PaymentMethod?  // PIX, CASH, CREDIT_CARD, DEBIT_CARD
  paidAt          DateTime?
  barberId        String?
  appointmentId   String?         @unique
  items           InvoiceItem[]
  createdAt       DateTime
  updatedAt       DateTime
  cancelledAt     DateTime?
}
```

### InvoiceItem (Item da Fatura)
```prisma
model InvoiceItem {
  id          String      @id @default(uuid())
  invoiceId   String
  type        InvoiceType
  serviceId   String?
  productId   String?
  planId      String?
  name        String
  price       Float
  quantity    Int         @default(1)
}
```

### FixedCost (Custos Fixos)
```prisma
model FixedCost {
  id          String        @id @default(uuid())
  shopId      String
  name        String
  value       Float
  category    CostCategory  // RENT, UTILITIES, SALARIES, TAXES, etc
  frequency   CostFrequency // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  active      Boolean       @default(true)
}
```

---

## 🔌 Endpoints Implementados

### 1. GET /api/financial/analytics

**Descrição:** Retorna analytics financeiros para o período especificado (Saúde Financeira)

**Auth:** JWT Bearer Token (ADMIN ou SUPER_ADMIN)

**Query Parameters:**
- `shopId` (string, obrigatório): ID da barbearia (obtido do token JWT após login)
- `period` (enum, obrigatório): TODAY | WEEK | MONTH | QUARTER | YEAR | ALL
- `startDate` (string ISO 8601, opcional): Data inicial customizada
- `endDate` (string ISO 8601, opcional): Data final customizada

**Exemplo de Requisição:**
```bash
GET http://localhost:3000/api/financial/analytics?shopId={{shopId}}&period=MONTH
Authorization: Bearer {token}

# O shopId vem da resposta do login (user.shopId)
# Exemplo: aa62b19b-f5de-4f04-9354-a06d2c3cb567
```

**Response (200 OK):**
```json
{
  "period": "MONTH",
  "startDate": "2026-01-05T00:00:00.000Z",
  "endDate": "2026-02-04T23:59:59.999Z",
  "gross": 15000.00,
  "serviceRev": 10000.00,
  "productRev": 4000.00,
  "planRev": 1000.00,
  "expenses": 8500.00,
  "totalCommissions": 5000.00,
  "fixedCostsTotal": 3000.00,
  "productCosts": 500.00,
  "net": 6500.00,
  "isLoss": false,
  "margin": 43.33,
  "avgTicket": 75.00,
  "totalAppointments": 200,
  "commissionsByBarber": [
    {
      "id": "barber-1",
      "name": "João Silva",
      "avatar": "https://...",
      "appointments": 85,
      "revenue": 6375.00,
      "commission": 3187.50,
      "commissionRate": 50,
      "netForShop": 3187.50
    }
  ]
}
```

**Cálculos Realizados:**
- **Faturamento Bruto (gross)**: Soma de serviceRev + productRev + planRev
- **Receita de Serviços (serviceRev)**: Soma de appointments COMPLETED
- **Receita de Produtos (productRev)**: Invoices tipo PRODUCT com status PAID
- **Receita de Planos (planRev)**: Invoices tipo PLAN com status PAID
- **Comissões Totais (totalCommissions)**: Soma das comissões de todos os barbeiros
- **Custos Fixos (fixedCostsTotal)**: Expenses rateadas pelo período
- **Custo de Produtos (productCosts)**: 30% da receita de produtos (CMV)
- **Lucro Líquido (net)**: gross - expenses
- **Margem de Lucro (margin)**: (net / gross) * 100
- **Ticket Médio (avgTicket)**: gross / totalAppointments

---

### 2. GET /api/financial/cashier/daily

**Descrição:** Retorna analytics diários para o caixa operacional

**Auth:** JWT Bearer Token (ADMIN ou SUPER_ADMIN)

**Query Parameters:**
- `shopId` (string, obrigatório): ID da barbearia
- `date` (string, obrigatório): Data no formato YYYY-MM-DD (ex: 2026-02-04)

**Exemplo de Requisição:**
```bash
GET http://localhost:3000/api/financial/cashier/daily?shopId={{shopId}}&date=2026-02-04
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "date": "2026-02-04",
  "isToday": true,
  "totalReceived": 3500.00,
  "totalPending": 450.00,
  "totalDay": 3950.00,
  "serviceRevenue": 2800.00,
  "productRevenue": 650.00,
  "planRevenue": 500.00,
  "paymentMethods": {
    "PIX": 1500.00,
    "CASH": 800.00,
    "CREDIT_CARD": 900.00,
    "DEBIT_CARD": 300.00
  },
  "totalAppointments": 52,
  "completedAppointments": 47,
  "avgTicket": 74.47,
  "barberCommissions": [
    {
      "id": "barber-1",
      "name": "João Silva",
      "avatar": "https://...",
      "appointments": 20,
      "revenue": 1500.00,
      "commission": 750.00,
      "commissionRate": 50,
      "netForShop": 750.00
    }
  ],
  "totalCommissions": 1750.00,
  "netRevenue": 1750.00,
  "pendingInvoices": [
    {
      "id": "inv-1",
      "shopId": "aa62b19b-f5de-4f04-9354-a06d2c3cb567",
      "clientName": "Maria Santos",
      "amount": 80.00,
      "type": "SERVICE",
      "status": "PENDING",
      "description": "Corte + Barba",
      "date": "2026-02-04T10:30:00.000Z"
    }
  ]
}
```

**Cálculos Realizados:**
- **Total Recebido (totalReceived)**: Soma de invoices PAID do dia
- **Total Pendente (totalPending)**: Soma de invoices PENDING do dia
- **Total do Dia (totalDay)**: totalReceived + totalPending
- **Receitas por Fonte**: Agrupamento por tipo de invoice (SERVICE/PRODUCT/PLAN)
- **Formas de Pagamento**: Agrupamento por paymentMethod dos invoices PAID
- **Ticket Médio (avgTicket)**: totalReceived / completedAppointments
- **Comissões por Barbeiro**: Cálculo baseado na taxa de comissão de cada barbeiro
- **Lucro Líquido da Barbearia (netRevenue)**: totalReceived - totalCommissions

---

## 🔐 Segurança e Validações

### Autenticação
- Todas as rotas protegidas por `JwtAuthGuard`
- Apenas roles ADMIN e SUPER_ADMIN têm acesso

### Multi-Tenancy
- `TenantGuard` valida que shopId do token corresponde ao shopId requisitado
- Impossível acessar dados de outra barbearia

### Validações
- Datas em formato ISO 8601
- Period enum validado
- shopId obrigatório em todas as queries

---

## 📊 Regras de Negócio

### Cálculo de Comissões
```typescript
// Por atendimento
comissão = totalPrice * (barber.commissionRate / 100)

// Exemplo:
// Atendimento: R$ 100,00
// Taxa: 50%
// Comissão: R$ 50,00
// Lucro para barbearia: R$ 50,00
```

### Rateio de Custos Fixos
```typescript
const divider = {
  TODAY: 30,      // Divide por 30 dias
  WEEK: 4.3,      // ~4.3 semanas/mês
  MONTH: 1,       // Valor integral
  QUARTER: 1/3,   // 3 meses
  YEAR: 1/12,     // 12 meses
  ALL: 1          // Sem rateio
};

custoFixo = totalExpenses / divider[period]
```

### Margem de Lucro
```typescript
margem = ((net / gross) * 100)

// Status visual:
// ≥ 30% = Verde (Excelente)
// 15-30% = Amarelo (Atenção)
// < 15% = Vermelho (Crítico)
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
src/financial/
├── financial.module.ts              # Módulo Financial
├── financial.controller.ts          # Controller com 2 endpoints
├── financial.service.ts             # Service com lógica de cálculos
└── dto/
    ├── get-analytics.dto.ts         # DTO para analytics
    └── get-daily-cashier.dto.ts     # DTO para caixa diário
```

### Modificados
```
src/
├── app.module.ts                    # Importa FinancialModule
└── invoices/
    ├── invoices.service.ts          # Corrigido para usar InvoiceItem
    └── dto/create-invoice.dto.ts    # Adicionado campo description

prisma/
├── schema.prisma                    # Adicionado Invoice, InvoiceItem, FixedCost
└── migrations/
    └── 20260204033612_add_invoice_and_fixed_costs/
        └── migration.sql
```

---

## 🧪 Como Testar

> **Nota**: Substitua `{{shopId}}` pelo ID real da sua barbearia obtido na resposta do login (`user.shopId`)

### 1. Analytics Financeiros
```bash
# Buscar dados do último mês
curl -X GET "http://localhost:3000/api/financial/analytics?shopId={{shopId}}&period=MONTH" \
  -H "Authorization: Bearer {token}"

# Período customizado
curl -X GET "http://localhost:3000/api/financial/analytics?shopId={{shopId}}&period=ALL&startDate=2026-01-01T00:00:00.000Z&endDate=2026-02-04T23:59:59.999Z" \
  -H "Authorization: Bearer {token}"
```

### 2. Caixa Diário
```bash
# Dados de hoje
curl -X GET "http://localhost:3000/api/financial/cashier/daily?shopId={{shopId}}&date=2026-02-04" \
  -H "Authorization: Bearer {token}"

# Dados de um dia específico
curl -X GET "http://localhost:3000/api/financial/cashier/daily?shopId={{shopId}}&date=2026-01-15" \
  -H "Authorization: Bearer {token}"
```

---

## 🚀 Próximos Passos

### Fase 2: CRUD de Invoices (Próxima prioridade)
- [ ] POST /api/invoices (criar fatura)
- [ ] PATCH /api/invoices/:id (atualizar status/pagamento)
- [ ] DELETE /api/invoices/:id (cancelar fatura)
- [ ] GET /api/invoices (listar faturas)
- [ ] GET /api/invoices/:id (detalhes da fatura)

### Fase 3: CRUD de FixedCosts
- [ ] POST /api/fixed-costs (criar custo fixo)
- [ ] PATCH /api/fixed-costs/:id (atualizar custo)
- [ ] DELETE /api/fixed-costs/:id (remover custo)
- [ ] GET /api/fixed-costs (listar custos)

### Fase 4: Features Avançadas
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Gráficos de evolução temporal
- [ ] Comparativo mês a mês
- [ ] Projeções e metas
- [ ] Sistema de alertas/notificações

---

## ✅ Checklist de Implementação

| Item | Status |
|------|--------|
| Schema Prisma (Invoice, InvoiceItem, FixedCost) | ✅ |
| Migration aplicada | ✅ |
| FinancialModule criado | ✅ |
| FinancialService (lógica de cálculos) | ✅ |
| FinancialController (2 endpoints) | ✅ |
| DTOs de entrada | ✅ |
| Validação de tenant | ✅ |
| Cálculo de comissões por barbeiro | ✅ |
| Cálculo de receitas por fonte | ✅ |
| Agrupamento por forma de pagamento | ✅ |
| Rateio de custos fixos | ✅ |
| Build sem erros | ✅ |
| Documentação API | ✅ |

---

## 🔗 Referências

- [Schema Prisma](../prisma/schema.prisma)
- [FinancialService](../src/financial/financial.service.ts)
- [FinancialController](../src/financial/financial.controller.ts)
- [Documento de Especificação Técnica](./FINANCIAL_SPECIFICATION.md)

---

**Última atualização:** 04/02/2026  
**Status:** ✅ BACKEND PRONTO PARA INTEGRAÇÃO FRONTEND
