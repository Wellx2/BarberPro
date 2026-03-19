# ⚠️ Funcionalidades Pendentes - Backend Fase 2

## 📋 Status Atual da Implementação

**Data:** 04/02/2026  
**Status Backend:** Fase 1 Completa ✅ | Fase 2 Pendente ⏳

---

## ✅ O que está funcionando (Fase 1)

### Endpoints Implementados e Funcionais:

1. **GET /api/financial/analytics** ✅
   - Usado em: Saúde Financeira (AdminDashboard)
   - Status: Totalmente funcional
   - Retorna: Analytics financeiros por período

2. **GET /api/financial/cashier/daily** ✅
   - Usado em: Caixa Operacional
   - Status: Totalmente funcional
   - Retorna: Analytics diários do caixa

---

## ⏳ O que está pendente (Fase 2 - Backend não implementado)

### Endpoints NÃO Implementados:

#### 1. PATCH /api/invoices/:id ❌
**Impacto:** Processamento de pagamentos no Caixa

**Funcionalidade afetada:**
- ❌ Processar pagamento de invoice pendente
- ❌ Marcar invoice como PAID
- ❌ Atualizar método de pagamento
- ❌ Registrar data/hora do pagamento

**Comportamento atual:**
- Retorna **404 (Not Found)**
- Frontend mostra mensagem: "O processamento de pagamentos ainda não foi implementado no backend. Esta funcionalidade estará disponível na Fase 2."
- Modal permanece aberto para retry

**Tratamento no frontend:**
```typescript
// Em Cashier.tsx
if (error?.statusCode === 404) {
  addNotification('warning', 
    'O processamento de pagamentos ainda não foi implementado...'
  );
}
```

**Para implementar no backend:**
```typescript
// NestJS Controller
@Patch(':id')
@UseGuards(JwtAuthGuard, TenantGuard)
async update(
  @Param('id') id: string,
  @Body() updateDto: UpdateInvoiceDto
) {
  return this.invoicesService.update(id, updateDto);
}

// DTO
class UpdateInvoiceDto {
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';
  paidAt?: string;
}
```

---

#### 2. GET /api/invoices ❌
**Impacto:** Listar faturas com filtros

**Funcionalidade afetada:**
- ❌ Buscar invoices por status
- ❌ Filtrar por data
- ❌ Filtrar por cliente
- ❌ Paginação de resultados

**Status:** Não utilizado no frontend atual (dados vêm de dailyAnalytics)

---

#### 3. POST /api/invoices ❌
**Impacto:** Criar fatura manual

**Funcionalidade afetada:**
- ❌ Criar venda de produto avulso
- ❌ Criar venda de plano manual
- ❌ Gerar invoice sem appointment

**Status:** Interface não implementada no frontend

---

#### 4. DELETE /api/invoices/:id ❌
**Impacto:** Cancelar fatura

**Funcionalidade afetada:**
- ❌ Cancelar invoice com motivo
- ❌ Estornar valor do caixa
- ❌ Manter histórico de cancelamento

**Comportamento esperado:**
- Deveria abrir prompt pedindo motivo
- Atualizar status para CANCELLED
- Adicionar motivo na description

**Status:** Função `handleCancelInvoice` foi removida do frontend aguardando backend

---

## 🔧 Workarounds Temporários

### Opção 1: Aguardar Backend (Recomendado)
- Frontend está preparado
- Apenas aguardar implementação da Fase 2
- Tratamento de erro já implementado

### Opção 2: Mock Temporário (Desenvolvimento)
Se precisar testar a UI enquanto aguarda backend:

```typescript
// Em financialService.ts - TEMPORÁRIO
export const processInvoicePaymentMock = async (
  invoiceId: string,
  paymentMethod: string
): Promise<void> => {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock: atualizar localStorage
  const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
  const updated = invoices.map((inv: any) => 
    inv.id === invoiceId 
      ? { ...inv, status: 'PAID', paymentMethod, paidAt: new Date().toISOString() }
      : inv
  );
  localStorage.setItem('invoices', JSON.stringify(updated));
  
  console.warn('⚠️ USANDO MOCK - Substitua por API real');
};
```

### Opção 3: Desabilitar Funcionalidade
Comentar botões de ação até backend estar pronto:

```tsx
{/* Temporariamente desabilitado - Aguardando Fase 2 */}
<Button disabled title="Aguardando implementação do backend">
  Processar Pagamento
</Button>
```

---

## 📅 Roadmap de Implementação

### Fase 1 ✅ - CONCLUÍDA
- [x] GET /api/financial/analytics
- [x] GET /api/financial/cashier/daily
- [x] Models: Invoice, InvoiceItem, FixedCost
- [x] Migration aplicada
- [x] Frontend integrado

### Fase 2 ⏳ - AGUARDANDO BACKEND
**Prioridade:** Alta  
**Estimativa:** 2-3 dias de desenvolvimento

- [ ] **Invoices Controller**
  - [ ] POST /api/invoices (criar invoice)
  - [ ] PATCH /api/invoices/:id (atualizar/processar pagamento)
  - [ ] DELETE /api/invoices/:id (cancelar)
  - [ ] GET /api/invoices (listar com filtros)
  - [ ] GET /api/invoices/:id (detalhes)

- [ ] **Invoices Service**
  - [ ] Validação de status transitions
  - [ ] Validação de tenant (shopId)
  - [ ] Cálculo automático de totais
  - [ ] Trigger para atualizar appointment

- [ ] **Validações**
  - [ ] Não permitir PATCH em invoice já PAID
  - [ ] Não permitir DELETE em invoice PAID (só CANCELLED)
  - [ ] Validar paymentMethod obrigatório ao marcar PAID

### Fase 3 ⏳ - PLANEJADO
- [ ] Fixed Costs CRUD
- [ ] Relatórios avançados
- [ ] Exportação PDF/Excel
- [ ] Gráficos de evolução

---

## 🚨 Mensagem para o Usuário Final

**O que está funcionando:**
- ✅ Visualização de analytics financeiros (Saúde Financeira)
- ✅ Visualização do caixa diário
- ✅ Navegação por datas
- ✅ Visualização de faturas pendentes
- ✅ Comissões por barbeiro
- ✅ Breakdown de receitas

**O que ainda não funciona:**
- ⏳ Processar pagamento de faturas pendentes
- ⏳ Cancelar faturas
- ⏳ Criar faturas manualmente
- ⏳ Editar faturas existentes

**Previsão:** Essas funcionalidades estarão disponíveis assim que o backend implementar os endpoints de CRUD de invoices (Fase 2).

---

## 📞 Para o Time de Backend

### Endpoints prioritários a implementar:

**1. PATCH /api/invoices/:id (Crítico)**
```typescript
// Request
PATCH /api/invoices/uuid-here
{
  "status": "PAID",
  "paymentMethod": "PIX",
  "paidAt": "2026-02-04T15:30:00.000Z"
}

// Response
{
  "id": "uuid-here",
  "shopId": "shop-1",
  "clientName": "Roberto Santos",
  "status": "PAID",
  "amount": 85.00,
  "paymentMethod": "PIX",
  "paidAt": "2026-02-04T15:30:00.000Z",
  ...
}
```

**Validações necessárias:**
- Invoice existe
- Invoice pertence ao shopId do token (TenantGuard)
- Invoice não está CANCELLED
- Se status = PAID, paymentMethod é obrigatório
- Se status = PAID, paidAt é obrigatório

**Side effects:**
- Se invoice está linkada a appointment, atualizar appointment
- Recalcular analytics (cache invalidation)

---

## 🔗 Documentação Relacionada

- [Especificação Técnica Completa](./FINANCIAL_SYSTEM_DOCUMENTATION.md)
- [Integração Frontend](./FINANCIAL_INTEGRATION_COMPLETE.md)
- [Plano de QA](./QA_FINANCIAL_INTEGRATION.md)
- [Backend API Docs](../backend/README.md)

---

**Última atualização:** 04/02/2026  
**Status:** Frontend aguardando Backend Fase 2  
**Bloqueio:** Processamento de pagamentos depende de PATCH /api/invoices/:id
