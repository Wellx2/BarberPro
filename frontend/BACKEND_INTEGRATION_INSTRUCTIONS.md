# Instruções para Integração Backend - Sistema de Planos e Equipe

## 📋 Resumo

Este documento descreve os requisitos do backend para integração completa com o sistema de gerenciamento de equipe e planos de assinatura para clientes implementado no frontend.

---

## ✅ Endpoints Necessários

### 1. Team Members (Colaboradores)

#### **Base URL:** `/team-members`

| Método | Endpoint | Descrição | Auth | Observações |
|--------|----------|-----------|------|-------------|
| GET | `/team-members` | Lista todos os colaboradores da loja | ADMIN | - Filtrar automaticamente por shopId (via JWT - TenantGuard)<br>- Suporta query param `?includeInactive=true` para incluir inativos<br>- Não retornar colaboradores com soft delete |
| GET | `/team-members/:id` | Busca colaborador por ID | ADMIN | - Verificar se pertence ao shopId do usuário logado |
| POST | `/team-members` | Cria novo colaborador | ADMIN | - ShopId inferido automaticamente do JWT<br>- Validar campos obrigatórios |
| PATCH | `/team-members/:id` | Atualiza colaborador | ADMIN | - Permitir atualização parcial |
| DELETE | `/team-members/:id` | Remove colaborador (soft delete) | ADMIN | - **Body:** `{ "reason": "string" }`<br>- Soft delete: não remover do BD, marcar como deletado<br>- Manter histórico de agendamentos |
| PATCH | `/team-members/:id/toggle-active` | Ativa/Desativa colaborador | ADMIN | - Toggle do campo `active` |
| GET | `/team-members/:id/available-slots` | Horários disponíveis | ADMIN | - Query param: `?date=YYYY-MM-DD`<br>- Considerar bloqueios de agenda |

#### **Schema esperado: TeamMember**

```json
{
  "id": "uuid",
  "shopId": "uuid",
  "name": "string",
  "email": "string | null",
  "phone": "string | null",
  "avatar": "string | null",
  "role": "BARBER | HAIRDRESSER | MANICURIST | RECEPTIONIST | CASHIER | CLEANER",
  "specialties": ["string"],
  "description": "string | null",
  "commissionRate": "number (0-100)",
  "birthDate": "string (ISO 8601) | null",
  "hireDate": "string (ISO 8601) | null",
  "active": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

#### **CreateTeamMemberDto**

```json
{
  "name": "string (obrigatório)",
  "email": "string (opcional)",
  "phone": "string (opcional)",
  "avatar": "string (opcional)",
  "role": "TeamMemberRole (obrigatório)",
  "specialties": ["string"] (opcional),
  "description": "string (opcional)",
  "commissionRate": "number (opcional, padrão: 50)",
  "birthDate": "string (opcional)",
  "hireDate": "string (opcional)",
  "active": "boolean (opcional, padrão: true)"
}
```

---

### 2. Agenda Locks (Bloqueio de Agenda)

#### **Base URL:** `/agenda-locks`

| Método | Endpoint | Descrição | Auth | Observações |
|--------|----------|-----------|------|-------------|
| POST | `/agenda-locks/check-conflicts` | Verifica conflitos antes de bloquear | ADMIN | - Retornar lista de agendamentos conflitantes |
| POST | `/agenda-locks` | Cria bloqueio de agenda | ADMIN | - Se `forceOverride=true`, cancelar agendamentos conflitantes e notificar clientes |
| GET | `/agenda-locks` | Lista bloqueios de agenda | ADMIN | - Query params opcionais:<br>&nbsp;&nbsp;`?teamMemberId=uuid`<br>&nbsp;&nbsp;`?startDate=YYYY-MM-DD`<br>&nbsp;&nbsp;`?endDate=YYYY-MM-DD` |
| PATCH | `/agenda-locks/:id` | Atualiza bloqueio | ADMIN | - Permitir atualização parcial |
| DELETE | `/agenda-locks/:id` | Remove bloqueio | ADMIN | - Não afetar agendamentos já cancelados |

#### **Schema esperado: AgendaLock**

```json
{
  "id": "uuid",
  "teamMemberId": "uuid",
  "teamMemberName": "string",
  "date": "string (YYYY-MM-DD)",
  "startTime": "string (HH:mm)",
  "endTime": "string (HH:mm)",
  "reason": "string",
  "lockedBy": "uuid (userId)",
  "lockedByName": "string",
  "conflictingAppointments": [
    {
      "id": "uuid",
      "clientName": "string",
      "scheduledFor": "string (ISO 8601)"
    }
  ],
  "notifiedClients": ["uuid"],
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

#### **CreateAgendaLockDto**

```json
{
  "teamMemberId": "uuid (obrigatório)",
  "date": "string YYYY-MM-DD (obrigatório)",
  "startTime": "string HH:mm (obrigatório)",
  "endTime": "string HH:mm (obrigatório)",
  "reason": "string (obrigatório)",
  "forceOverride": "boolean (opcional, padrão: false)"
}
```

#### **Resposta de `/check-conflicts`:**

```json
{
  "hasConflicts": true,
  "conflicts": [
    {
      "id": "uuid",
      "clientName": "string",
      "clientPhone": "string",
      "scheduledFor": "string (ISO 8601)",
      "serviceIds": ["uuid"]
    }
  ],
  "message": "Existem 2 agendamentos neste horário"
}
```

---

### 3. Plans (Planos de Assinatura para Clientes)

#### **Base URL:** `/plans`

| Método | Endpoint | Descrição | Auth | Observações |
|--------|----------|-----------|------|-------------|
| GET | `/plans` | Lista todos os planos da loja | ADMIN | - Filtrar automaticamente por shopId (via JWT - TenantGuard)<br>- Incluir planos ativos e inativos |
| GET | `/plans/:id` | Busca plano por ID | ADMIN | - Verificar se pertence ao shopId do usuário logado |
| POST | `/plans` | Cria novo plano | ADMIN | - ShopId inferido automaticamente do JWT<br>- Validar campos obrigatórios |
| PATCH | `/plans/:id` | Atualiza plano | ADMIN | - Permitir atualização parcial |
| DELETE | `/plans/:id` | Exclui plano | ADMIN | - **Apenas se `active = false`**<br>- Retornar erro se plano estiver ativo<br>- Verificar se há assinaturas ativas vinculadas |
| PATCH | `/plans/:id/toggle-active` | Ativa/Desativa plano | ADMIN | - Toggle do campo `active` |

#### **Schema esperado: Plan**

```json
{
  "id": "uuid",
  "shopId": "uuid",
  "name": "string",
  "price": "number",
  "benefitMonths": "number",
  "benefitServices": "number",
  "benefitProducts": "number",
  "benefitMoneyback": "number (porcentagem 0-100)",
  "description": "string | null",
  "benefits": ["string"],
  "discount": "number",
  "active": "boolean",
  "isPopular": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

#### **CreatePlanDto**

```json
{
  "name": "string (obrigatório)",
  "price": "number (obrigatório, > 0)",
  "benefitMonths": "number (obrigatório)",
  "benefitServices": "number (obrigatório)",
  "benefitProducts": "number (obrigatório)",
  "benefitMoneyback": "number (obrigatório)",
  "description": "string (opcional)",
  "benefits": ["string"] (obrigatório)",
  "discount": "number (opcional, padrão: 0)",
  "active": "boolean (opcional, padrão: true)",
  "isPopular": "boolean (opcional, padrão: false)"
}
```

#### **UpdatePlanDto**

Todos os campos são opcionais (atualização parcial permitida).

---

## 🔐 Autenticação e Autorização

### **TenantGuard (Isolamento Multi-tenant)**

- Todos os endpoints devem implementar TenantGuard
- O `shopId` deve ser extraído automaticamente do JWT do usuário logado
- O frontend **NÃO** deve enviar `shopId` no body das requisições
- Validar que o usuário só acessa dados da sua própria loja

### **Roles necessárias:**

- **ADMIN**: Acesso completo aos endpoints de equipe e planos
- **SUPER_ADMIN**: Acesso a configurações globais (se aplicável)

---

## ⚙️ Regras de Negócio Importantes

### **Team Members:**

1. Soft delete obrigatório - não remover do banco
2. Manter histórico de agendamentos mesmo após remoção
3. Campo `active` independente de soft delete
4. Validar email único por loja (se fornecido)
5. Taxa de comissão entre 0-100

### **Agenda Locks:**

1. Verificar conflitos antes de criar bloqueio
2. Se `forceOverride=true`:
   - Cancelar agendamentos conflitantes
   - Atualizar status para `CANCELLED_BY_BARBER`
   - Notificar clientes por email/SMS (se configurado)
   - Registrar IDs dos clientes notificados
3. Prevenir bloqueios retroativos (data passada)
4. Validar horários (`endTime > startTime`)

### **Plans:**

1. Preço deve ser maior que zero
2. Apenas planos inativos podem ser excluídos
3. Verificar assinaturas ativas antes de excluir
4. `benefits` pode ser um array vazio ou derivado dos campos numéricos
5. `discount` é percentual (0-100)

---

## 📊 Validações e Erros

### **Status Codes Esperados:**

| Código | Situação |
|--------|----------|
| 200 | Sucesso (GET, PATCH) |
| 201 | Criado com sucesso (POST) |
| 204 | Sem conteúdo (DELETE) |
| 400 | Validação falhou (ex: campos obrigatórios faltando) |
| 401 | Não autenticado |
| 403 | Não autorizado (papel insuficiente) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: tentar excluir plano ativo) |
| 500 | Erro interno do servidor |

### **Formato de erro esperado:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "name should not be empty",
    "price must be greater than 0"
  ]
}
```

---

## 🔄 Sincronização e Cache

### **Frontend Cache:**

O frontend mantém cache dos dados em estado React. Após operações CRUD, faz nova requisição GET para sincronizar.

### **Recomendações Backend:**

1. Retornar o objeto completo após CREATE/UPDATE (não apenas `{ message: 'success' }`)
2. Incluir campos computed no response (ex: `teamMemberName` em AgendaLock)
3. Timestamp em ISO 8601 para facilitar parsing
4. Considerar paginação para listagens grandes (futuro)

---

## 🧪 Casos de Teste Importantes

### **Team Members:**

- ✅ Criar colaborador sem email/phone (campos opcionais)
- ✅ Tentar criar colaborador com email duplicado na mesma loja
- ✅ Remover colaborador com agendamentos futuros (não deve perder dados)
- ✅ Listar apenas ativos vs todos

### **Agenda Locks:**

- ✅ Criar bloqueio sem conflitos
- ✅ Verificar conflitos e receber lista de agendamentos
- ✅ Forçar bloqueio com conflitos e verificar cancelamentos
- ✅ Tentar criar bloqueio em data passada (deve falhar)

### **Plans:**

- ✅ Criar plano com preço zero (deve falhar)
- ✅ Tentar excluir plano ativo (deve falhar)
- ✅ Toggle active de plano
- ✅ Atualizar plano parcialmente

---

## 📝 Observações Adicionais

### **Sobre o método DELETE:**

O frontend está enviando `{ reason: "string" }` no body de requisições DELETE para colaboradores. Certifique-se que o backend aceita body em DELETE ou ajuste para query parameter se necessário:

**Opção 1 (atual):**
```http
DELETE /team-members/:id
Content-Type: application/json

{ "reason": "Desligamento voluntário" }
```

**Opção 2 (alternativa):**
```http
DELETE /team-members/:id?reason=Desligamento%20voluntário
```

### **Sobre campos computados:**

Alguns campos são populados no backend por conveniência:
- `teamMemberName` em AgendaLock
- `lockedByName` em AgendaLock

O frontend espera esses campos, mas pode funcionar sem eles (null-safe).

---

## 🎯 Checklist de Implementação

Backend deve implementar:

- [ ] Todos os endpoints de Team Members
- [ ] Todos os endpoints de Agenda Locks
- [ ] Todos os endpoints de Plans
- [ ] TenantGuard em todos os endpoints protegidos
- [ ] Soft delete para Team Members
- [ ] Sistema de notificação para clientes (email/SMS) quando agenda for bloqueada
- [ ] Validações de negócio (preço > 0, endTime > startTime, etc)
- [ ] Tratamento de erros com mensagens claras
- [ ] Testes unitários e de integração

---

**Data de criação:** 13 de fevereiro de 2026  
**Versão Frontend:** 2.0.0  
**Compatibilidade Backend esperada:** >= 2.0.0

---

## 📞 Contato

Para dúvidas sobre esta integração:
- Documentação frontend: `TEAM_PLANS_MODULES_DOCUMENTATION.md`
- Issues: GitHub Issues do projeto
