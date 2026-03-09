# 📅 API de Appointments - Documentação Completa

## ✅ STATUS: IMPLEMENTADO E FUNCIONAL

O módulo de Appointments está **completamente implementado** no backend com todas as funcionalidades solicitadas.

---

## 🎯 Recursos Implementados

### ✅ Funcionalidades
- ✅ Criar agendamento com validação de horários
- ✅ Listar agendamentos com filtros (data, barbeiro, status)
- ✅ Buscar agendamento por ID
- ✅ Cancelar agendamento (com motivo)
- ✅ Completar agendamento
- ✅ Validação de conflitos de horário
- ✅ Validação de horários bloqueados (blocked times)
- ✅ Validação de horário de funcionamento
- ✅ Cálculo automático de preço total
- ✅ Suporte a produtos adicionais
- ✅ Controle de estoque automático
- ✅ Multi-tenant (isolamento por shopId)
- ✅ Auditoria de ações (AuditLog)
- ✅ Controle de acesso por módulos (ModuleAccessGuard)

### ✅ Guards de Segurança
- JwtAuthGuard - Autenticação obrigatória
- RolesGuard - Controle por role (ADMIN, BARBER, CLIENT)
- TenantGuard - Isolamento multi-tenant
- ModuleAccessGuard - Requer módulo AGENDA ativo

---

## 📋 Endpoints Disponíveis

### 1. Criar Agendamento

**POST** `/api/appointments`

**⚠️ IMPORTANTE:** Todos os endpoints usam o prefixo `/api`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "clientId": "uuid-do-cliente",
  "barberId": "uuid-do-barbeiro",
  "serviceIds": ["uuid-servico1", "uuid-servico2"],
  "date": "2026-02-14T10:00:00.000Z",
  "products": [
    {
      "id": "uuid-produto",
      "quantity": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "shopId": "uuid",
  "clientId": "uuid",
  "barberId": "uuid",
  "date": "2026-02-14T10:00:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 95.00,
  "cancelReason": null,
  "createdAt": "2026-02-13T...",
  "updatedAt": "2026-02-13T...",
  "client": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "(11) 99999-9999",
    "email": "joao@example.com"
  },
  "barber": {
    "id": "uuid",
    "name": "Pedro Barbeiro",
    "nickname": "Pedrão"
  },
  "services": [
    {
      "id": "uuid",
      "service": {
        "id": "uuid",
        "name": "Corte Degradê",
        "price": 50.00,
        "duration": 40
      }
    }
  ],
  "products": [
    {
      "id": "uuid",
      "name": "Pomada Modeladora",
      "price": 35.00,
      "quantity": 1
    }
  ]
}
```

**Validações:**
- ✅ Cliente e barbeiro devem pertencer ao mesmo shop
- ✅ Barbeiro deve estar ativo
- ✅ Horário dentro do expediente da barbearia
- ✅ Sem conflito com outros agendamentos
- ✅ Sem conflito com horários bloqueados
- ✅ Estoque suficiente para produtos
- ✅ Pelo menos 1 serviço obrigatório

**Erros Possíveis:**
- `404` - Cliente/Barbeiro/Serviço não encontrado
- `400` - Horário fora do expediente
- `409` - Conflito de horário
- `400` - Estoque insuficiente

---

### 2. Listar Agendamentos

**GET** `/api/appointments`

**Query Params (todos opcionais):**
- `date` - Filtrar por data (ISO 8601) ex: `2026-02-14`
- `barberId` - Filtrar por barbeiro (UUID)
- `status` - Filtrar por status (SCHEDULED, COMPLETED, CANCELLED, CANCELLED_BY_BARBER)

**Exemplos:**
```
GET /api/appointments
GET /api/appointments?date=2026-02-14
GET /api/appointments?barberId=uuid-barbeiro
GET /api/appointments?status=SCHEDULED
GET /api/appointments?date=2026-02-14&barberId=uuid&status=SCHEDULED
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "shopId": "uuid",
    "clientId": "uuid",
    "barberId": "uuid",
    "date": "2026-02-14T10:00:00.000Z",
    "status": "SCHEDULED",
    "totalPrice": 95.00,
    "client": { ... },
    "barber": { ... },
    "services": [ ... ],
    "products": [ ... ]
  }
]
```

**Regras de Acesso:**
- `ADMIN/BARBER` - Vê todos agendamentos do shop
- `CLIENT` - Vê apenas próprios agendamentos

---

### 3. Buscar Agendamento por ID

**GET** `/api/appointments/:id`

**Response 200:**
```json
{
  "id": "uuid",
  "shopId": "uuid",
  "clientId": "uuid",
  "barberId": "uuid",
  "date": "2026-02-14T10:00:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 95.00,
  "cancelReason": null,
  "client": { ... },
  "barber": { ... },
  "services": [ ... ],
  "products": [ ... ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Erros:**
- `404` - Agendamento não encontrado ou não pertence ao shop

---

### 4. Cancelar Agendamento

**PATCH** `/api/appointments/:id/cancel`

**Body:**
```json
{
  "cancelReason": "Cliente solicitou reagendamento"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "CANCELLED",  // ou "CANCELLED_BY_BARBER" se cancelado por ADMIN/BARBER
  "cancelReason": "Cliente solicitou reagendamento",
  ...
}
```

**Regras:**
- Apenas agendamentos com status `SCHEDULED` podem ser cancelados
- Cliente cancela → status = `CANCELLED`
- Admin/Barber cancela → status = `CANCELLED_BY_BARBER`
- Estoque de produtos é restaurado automaticamente

**Erros:**
- `404` - Agendamento não encontrado
- `400` - Status inválido para cancelamento

---

### 5. Completar Agendamento

**PATCH** `/api/appointments/:id/complete`

**Roles:** `ADMIN`, `BARBER` (CLIENT não pode completar)

**Response 200:**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  ...
}
```

**Regras:**
- Apenas agendamentos com status `SCHEDULED` podem ser completados
- Estoque de produtos NÃO é restaurado (venda confirmada)

**Erros:**
- `404` - Agendamento não encontrado
- `400` - Status inválido para completar
- `403` - Cliente não tem permissão

---

## 🧪 Testando com Postman/Insomnia

### Passo 1: Fazer Login

**POST** `http://localhost:3000/api/auth/login`
```json
{
  "email": "admin@barberpro.com",
  "password": "senha123"
}
```

Copie o `accessToken` da resposta.

---

### Passo 2: Buscar IDs Necessários

**Buscar Clientes:**
```
GET http://localhost:3000/api/clients
Authorization: Bearer {token}
```

**Buscar Barbeiros:**
```
GET http://localhost:3000/api/barbers
Authorization: Bearer {token}
```

**Buscar Serviços:**
```
GET http://localhost:3000/api/services
Authorization: Bearer {token}
```

**Buscar Produtos (opcional):**
```
GET http://localhost:3000/api/products
Authorization: Bearer {token}
```

---

### Passo 3: Criar Agendamento

**POST** `http://localhost:3000/api/appointments`

**Headers:**
```
Authorization: Bearer {seu_token_aqui}
Content-Type: application/json
```

**Body:**
```json
{
  "clientId": "{id_do_cliente}",
  "barberId": "{id_do_barbeiro}",
  "serviceIds": ["{id_servico1}", "{id_servico2}"],
  "date": "2026-02-14T14:00:00.000Z",
  "products": [
    {
      "id": "{id_produto}",
      "quantity": 1
    }
  ]
}
```

---

### Passo 4: Listar Agendamentos do Dia

**GET** `http://localhost:3000/api/appointments?date=2026-02-14`

**Headers:**
```
Authorization: Bearer {seu_token}
```

---

### Passo 5: Cancelar Agendamento

**PATCH** `http://localhost:3000/api/appointments/{id}/cancel`

**Headers:**
```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

**Body:**
```json
{
  "cancelReason": "Cliente não poderá comparecer"
}
```

---

## 🔑 Credenciais de Teste (Seed)

### Admin
- **Email:** `admin@barberpro.com`
- **Senha:** `senha123`
- **Role:** `ADMIN`

### Barbeiro 1
- **Email:** `joao@barberpro.com`
- **Senha:** `senha123`
- **Role:** `BARBER`

### Barbeiro 2
- **Email:** `pedro@barberpro.com`
- **Senha:** `senha123`
- **Role:** `BARBER`

---

## 📊 Modelo de Dados (Prisma)

```prisma
model Appointment {
  id          String            @id @default(uuid())
  shopId      String
  clientId    String
  barberId    String
  date        DateTime
  status      AppointmentStatus @default(SCHEDULED)
  totalPrice  Float
  cancelReason String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  shop        Barbershop         @relation(fields: [shopId])
  client      Client             @relation(fields: [clientId])
  barber      Barber             @relation(fields: [barberId])
  services    AppointmentService[]
  products    AppointmentProduct[]
  review      Review?
  serviceOrder ServiceOrder?
  invoice     Invoice?

  @@index([shopId, barberId, date])
  @@index([clientId])
}

enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  CANCELLED_BY_BARBER
}
```

---

## 🔍 Validações Implementadas

### 1. Validação de Conflito de Horário
```typescript
checkAppointmentConflicts(barberId, shopId, startAt, endAt)
```
- Verifica se há agendamentos SCHEDULED no mesmo horário
- Calcula overlap entre horários (início e fim)

### 2. Validação de Horário Bloqueado
```typescript
checkBlockedTimeConflicts(barberId, shopId, startAt)
```
- Verifica blocked times tipo `DAY` (dia inteiro)
- Verifica blocked times tipo `TIME` (horário específico)
- Verifica blocked times tipo `RANGE` (período)

### 3. Validação de Horário de Funcionamento
```typescript
if (startTime < shop.openingTime || endTime > shop.closingTime)
```
- Calcula horário de início baseado em `date`
- Calcula horário de fim baseado em `duration` dos serviços
- Compara com `openingTime` e `closingTime` do shop

### 4. Validação de Estoque
```typescript
if (product.stock < productDto.quantity)
```
- Verifica estoque disponível antes de criar agendamento
- Decrementa estoque após criar
- Restaura estoque ao cancelar

---

## 📈 Auditoria

Todas as ações críticas são registradas em `AuditLog`:

```typescript
{
  action: 'CREATE' | 'CANCEL' | 'COMPLETE',
  entity: 'APPOINTMENT',
  entityId: 'uuid-do-agendamento',
  userId: 'uuid-do-usuario',
  shopId: 'uuid-do-shop',
  details: 'Descrição da ação'
}
```

---

## 🚀 Próximos Passos (Frontend)

Agora você pode implementar no frontend:

1. **Tela de Agendamentos**
   - Calendário/lista de agendamentos
   - Filtros por data, barbeiro, status

2. **Formulário de Novo Agendamento**
   - Seleção de cliente (busca por nome/telefone)
   - Seleção de barbeiro
   - Seleção de serviços (múltipla)
   - Seleção de data/hora
   - Produtos opcionais

3. **Visualização de Detalhes**
   - Modal/página com todos os dados
   - Botão cancelar (com motivo)
   - Botão completar (se ADMIN/BARBER)

4. **Validações em Tempo Real**
   - Verificar horários disponíveis antes de criar
   - Mostrar sugestões de horários livres
   - Alertar conflitos antes de enviar

---

## ✅ Checklist de Implementação

- [x] Schema Prisma definido
- [x] Modelo Appointment criado
- [x] Enum AppointmentStatus criado
- [x] Module criado e registrado
- [x] Controller implementado
- [x] Service implementado
- [x] DTOs criados (CreateAppointmentDto, CancelAppointmentDto)
- [x] Guards aplicados (JWT, Roles, Tenant, ModuleAccess)
- [x] Validação de conflitos de horário
- [x] Validação de blocked times
- [x] Validação de horário de funcionamento
- [x] Cálculo automático de preço
- [x] Suporte a produtos com controle de estoque
- [x] Auditoria de ações
- [x] Multi-tenant isolation
- [x] Dados de teste no seed
- [x] Documentação completa

---

## 🎉 CONCLUSÃO

O módulo de Appointments está **100% funcional** e pronto para uso!

**Tempo economizado:** ~90 minutos (já estava implementado)

**Qualidade:** Código segue todos os padrões do projeto:
- ✅ Prisma como ORM
- ✅ Multi-tenant isolation
- ✅ Guards de segurança
- ✅ Validações robustas
- ✅ Auditoria completa
- ✅ Swagger documentado

**Próximo passo:** Integrar com o frontend!
