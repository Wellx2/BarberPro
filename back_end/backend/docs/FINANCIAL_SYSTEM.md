# Sistema Financeiro Completo - BarberPro

## 🎯 Objetivo

"Um Financeiro de ponta, com cada detalhe" - Sistema completo para gestão financeira de barbearias SaaS multi-tenant.

## 🏛️ Arquitetura

### Módulos Implementados

1. **ServiceOrdersModule** - Gestão de Comandas/Ordens de Serviço
2. **CommissionsModule** - Configuração e cálculo de comissões
3. **ExpensesModule** - Controle de custos operacionais
4. **FinancialReportsModule** - Relatórios consolidados e analytics

### Novos Modelos Prisma

```prisma
// 6 Novos Enums
OrderStatus, OrderItemType, ExpenseType, CommissionType, 
ProductStockMovementType, BarberWorkModel

// 6 Novas Tabelas
ServiceOrder          // Comandas/Ordens de serviço
OrderItem             // Itens da comanda (serviços, produtos, extras)
BarberCommission      // Configuração de comissões
Expense               // Custos operacionais
DailyCashFlow         // Consolidação diária automática
ServiceProductAnalytics // Ranking de mais vendidos
```

## 📊 Funcionalidades Principais

### 1. Gestão de Comandas (ServiceOrders)

**Fluxo Completo:**
```
Cliente chega → Cria comanda → Adiciona serviços/produtos/extras 
→ Finaliza com pagamento → Atualiza DailyCashFlow
```

**Exemplo do João:**
```json
{
  "orderNumber": "2024001",
  "client": "João Silva",
  "barber": "Carlos Barbeiro",
  "items": [
    { "type": "SERVICE", "name": "Corte + Barba", "price": 60.00 },
    { "type": "EXTRA", "name": "Café", "price": 5.00 },
    { "type": "PRODUCT", "name": "Pomada", "price": 35.00 }
  ],
  "total": 100.00,
  "commission": 24.00,
  "paymentMethod": "PIX"
}
```

**Endpoints:**
- `POST /service-orders` - Criar comanda
- `POST /service-orders/:id/items` - Adicionar item
- `PATCH /service-orders/:id/start` - Iniciar atendimento
- `PATCH /service-orders/:id/complete` - Finalizar com pagamento
- `GET /service-orders/:id/history` - Histórico completo
- `GET /service-orders/client/:clientId` - Histórico do cliente
- `GET /service-orders/barber/:barberId` - Histórico do barbeiro

### 2. Sistema de Comissões (Commissions)

**4 Modelos de Trabalho:**

| Modelo | Descrição | Campos |
|--------|-----------|--------|
| `CHAIR_RENT` | Aluga cadeira | `chairRentalFee` |
| `SALARY` | Salário fixo | `monthlySalary` |
| `SALARY_COMMISSION` | Salário + comissão | `monthlySalary` + comissões |
| `COMMISSION_ONLY` | Apenas comissão | Comissões configuráveis |

**Configuração Flexível:**
- Comissão específica por serviço
- Comissão específica por produto
- Comissão padrão (serviceId/productId null)
- Ativar/desativar por tipo (serviços/produtos)
- 3 tipos: PERCENTAGE, FIXED, TIERED

**Endpoints:**
- `PATCH /barbers/:id/work-model` - Definir modelo de trabalho
- `POST /commissions` - Criar regra de comissão
- `POST /commissions/barber/:id/default` - Comissões padrão
- `PATCH /commissions/:id` - Editar porcentagem/valor
- `PATCH /commissions/:id/toggle` - Ativar/desativar
- `GET /commissions/barber/:id` - Ver comissões do barbeiro

### 3. Controle de Custos (Expenses)

**Tipos de Despesa:**
- `RENT` - Aluguel
- `UTILITIES` - Água, luz, internet
- `SALARIES` - Folha de pagamento
- `PRODUCTS` - Compra de produtos
- `MAINTENANCE` - Manutenção
- `MARKETING` - Publicidade
- `TAXES` - Impostos
- `OTHER` - Outros

**Recursos:**
- Despesas recorrentes (mensal)
- Controle de pagamento (pago/pendente)
- Data de vencimento e pagamento
- Categorias customizáveis

**Endpoints:**
- `POST /expenses` - Criar despesa
- `GET /expenses` - Listar (filtros: tipo, isPaid, período)
- `PATCH /expenses/:id/pay` - Marcar como paga
- `GET /expenses/overdue` - Despesas vencidas

### 4. Relatórios Financeiros (FinancialReports)

**Consolidado por Período:**
```json
{
  "period": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "grossRevenue": 50000.00,      // Faturamento bruto
  "commissions": 18000.00,        // Total de comissões
  "netRevenue": 32000.00,         // Faturamento líquido
  "expenses": 12000.00,           // Custos totais
  "profit": 20000.00,             // Lucro
  "profitMargin": 40.0,           // % margem
  "revenueByPaymentMethod": {
    "CREDIT_CARD": 20000.00,
    "DEBIT_CARD": 15000.00,
    "PIX": 10000.00,
    "CASH": 5000.00
  },
  "expensesByType": {
    "RENT": 5000.00,
    "SALARIES": 4000.00,
    "UTILITIES": 1500.00,
    "PRODUCTS": 1500.00
  }
}
```

**Endpoints:**
- `GET /financial-reports/daily?date={date}`
- `GET /financial-reports/weekly?startDate={date}`
- `GET /financial-reports/fortnightly?startDate={date}`
- `GET /financial-reports/monthly?year={year}&month={month}`
- `GET /financial-reports/annual?year={year}` (com breakdown mensal)
- `GET /financial-reports/top-selling?days={7|15|30|45}`
- `GET /financial-reports/barber-performance?barberId={uuid}&month={1-12}`
- `GET /financial-reports/costs-analysis?startDate={date}&endDate={date}`

### 5. Analytics de Vendas

**Serviços e Produtos Mais Solicitados:**
```json
{
  "period": "30days",
  "services": [
    {
      "serviceId": "uuid",
      "name": "Corte + Barba",
      "totalQuantity": 245,
      "totalRevenue": 14700.00,
      "averagePrice": 60.00
    }
  ],
  "products": [
    {
      "productId": "uuid",
      "name": "Pomada Modeladora",
      "totalQuantity": 87,
      "totalRevenue": 3045.00,
      "averagePrice": 35.00
    }
  ]
}
```

**Performance por Barbeiro:**
```json
{
  "barberId": "uuid",
  "name": "Carlos Silva",
  "workModel": "SALARY_COMMISSION",
  "monthlySalary": 2500.00,
  "period": "2024-01",
  "servicesCount": 156,
  "totalRevenue": 9360.00,
  "totalCommissions": 3744.00,
  "averageTicket": 60.00,
  "topServices": [...]
}
```

## 🔄 Fluxo de Dados

### Criação de Comanda
```
1. POST /service-orders
   └─> Cria ServiceOrder (status: OPEN)
   
2. POST /service-orders/:id/items (N vezes)
   ├─> Cria OrderItem
   ├─> Calcula comissão via CommissionsService
   ├─> Atualiza estoque (se produto)
   └─> Atualiza totais da comanda

3. PATCH /service-orders/:id/complete
   ├─> Atualiza status para COMPLETED
   ├─> Registra paymentMethod
   ├─> Atualiza DailyCashFlow
   └─> Atualiza Appointment.status
```

### Cálculo de Comissão
```
CommissionsService.calculateCommission()
   ├─> Busca regra específica (serviceId/productId)
   ├─> Se não, busca regra padrão (nulls)
   ├─> Verifica applyOnServices/applyOnProducts
   └─> Calcula:
       ├─> PERCENTAGE: itemTotal * (value/100)
       ├─> FIXED: value
       └─> TIERED: porcentagem base
```

### Consolidação Diária
```
ServiceOrdersService.complete()
   └─> updateDailyCashFlow()
       ├─> Upsert DailyCashFlow
       ├─> Soma revenues por paymentMethod
       ├─> Soma commissions
       └─> Calcula netRevenue
```

## 🎨 Casos de Uso Reais

### 1. Configurar Nova Barbearia

```bash
# 1. Criar barbeiro
POST /barbers
{
  "name": "Carlos Silva",
  "nickname": "Carlão",
  "specialties": ["Corte clássico", "Barba"]
}

# 2. Definir modelo de trabalho
PATCH /barbers/{id}/work-model
{
  "workModel": "SALARY_COMMISSION",
  "monthlySalary": 2000.00
}

# 3. Configurar comissões padrão
POST /commissions/barber/{id}/default
{
  "serviceCommission": 40,
  "productCommission": 10
}

# 4. Comissão especial para serviço premium
POST /commissions
{
  "barberId": "{id}",
  "serviceId": "{corte-premium-id}",
  "type": "PERCENTAGE",
  "value": 50,
  "applyOnServices": true
}
```

### 2. Atender Cliente (Fluxo Completo)

```bash
# Cliente João chega para corte às 10h
POST /service-orders
{
  "appointmentId": "uuid",
  "barberId": "uuid",
  "clientId": "uuid"
}

# Adiciona corte + barba
POST /service-orders/{id}/items
{
  "type": "SERVICE",
  "serviceId": "uuid",
  "quantity": 1,
  "unitPrice": 60.00
}

# Cliente pede café
POST /service-orders/{id}/items
{
  "type": "EXTRA",
  "name": "Café",
  "quantity": 1,
  "unitPrice": 5.00
}

# Cliente compra pomada
POST /service-orders/{id}/items
{
  "type": "PRODUCT",
  "productId": "uuid",
  "quantity": 1,
  "unitPrice": 35.00
}

# Finaliza pagamento
PATCH /service-orders/{id}/complete
{
  "paymentMethod": "PIX"
}
```

### 3. Relatório Mensal

```bash
# Faturamento do mês
GET /financial-reports/monthly?year=2024&month=1

# Top serviços dos últimos 30 dias
GET /financial-reports/top-selling?days=30

# Performance do barbeiro Carlos
GET /financial-reports/barber-performance?barberId={uuid}&month=1

# Análise de custos do trimestre
GET /financial-reports/costs-analysis?startDate=2024-01-01&endDate=2024-03-31
```

## 🔐 Segurança

### Multi-Tenancy
Todos os módulos aplicam isolamento por `shopId`:
```typescript
where: { 
  shopId: requester.shopId,
  // ... outros filtros
}
```

### RBAC
| Módulo | ADMIN | BARBER | CLIENT |
|--------|-------|--------|--------|
| ServiceOrders | CRUD completo | Ver próprios | - |
| Commissions | CRUD completo | Ver próprias (readonly) | - |
| Expenses | CRUD completo | - | - |
| Reports | Todos | Próprios | - |

### Auditoria
Todas as operações críticas registram em `AuditLog`:
- Entity: ServiceOrder, BarberCommission, Expense
- Action: CREATE, UPDATE, COMPLETE, CANCEL, etc.
- Details: JSON com informações da operação

## 📈 Métricas Disponíveis

### KPIs
- Faturamento bruto/líquido
- Lucro e margem
- Ticket médio
- Comissões totais
- Custos totais
- Custos por tipo

### Análises
- Receita por forma de pagamento
- Custos por categoria
- Serviços mais vendidos
- Produtos mais vendidos
- Performance por barbeiro
- Evolução mensal (breakdown anual)

### Períodos
- Diário
- Semanal (7 dias)
- Quinzenal (14 dias)
- Mensal
- Anual (com breakdown mensal)
- Customizado (startDate/endDate)

## 🚀 Próximos Passos

### Para Desenvolvimento
- [ ] Executar migration: `npm run prisma:migrate`
- [ ] Testar endpoints no Postman
- [ ] Verificar logs de auditoria
- [ ] Testar cálculo de comissões

### Para Produção
- [ ] Seed de dados de exemplo
- [ ] Dashboard de métricas em tempo real
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações de despesas vencidas
- [ ] Metas mensais para barbeiros

### Melhorias Futuras
- [ ] Gráficos de evolução temporal
- [ ] Previsão de faturamento
- [ ] Análise de sazonalidade
- [ ] Comparativo entre barbearias
- [ ] Sistema de metas e bonificações

## 📚 Documentação Técnica

- [Sistema de Comissões](./COMMISSIONS_SYSTEM.md)
- [Schema Prisma](../prisma/schema.prisma)
- [Copilot Instructions](../.github/copilot-instructions.md)

## 🎓 Aprendizados

Este sistema implementa as melhores práticas:
- ✅ Multi-tenancy por design
- ✅ RBAC granular
- ✅ Auditoria completa
- ✅ Soft deletes
- ✅ Consolidação automática (DailyCashFlow)
- ✅ Cálculo de comissões em tempo real
- ✅ Analytics detalhado
- ✅ Flexibilidade de configuração

---

**Desenvolvido para BarberPro**
Sistema financeiro completo para gestão de barbearias SaaS multi-tenant.
