# Sistema de Comissões - BarberPro

## 📋 Visão Geral

Sistema completo e flexível de gerenciamento de comissões que suporta múltiplos modelos de trabalho comuns em barbearias brasileiras.

## 🏗️ Modelos de Trabalho Suportados

### 1. **CHAIR_RENT** (Aluguel de Cadeira)
- Barbeiro paga um valor fixo mensal para usar o espaço
- Não recebe comissões (fica com 100% do faturamento)
- Campo: `chairRentalFee` (obrigatório)

### 2. **SALARY** (Salário Fixo)
- Barbeiro recebe apenas salário mensal
- Sem comissões
- Campo: `monthlySalary` (obrigatório)

### 3. **SALARY_COMMISSION** (Salário + Comissão)
- Barbeiro recebe salário fixo + comissões sobre vendas
- Modelo híbrido mais comum
- Campos: `monthlySalary` (obrigatório) + comissões configuráveis

### 4. **COMMISSION_ONLY** (Apenas Comissão)
- Barbeiro recebe apenas comissões sobre vendas
- Sem salário fixo
- Comissões configuráveis por serviço/produto

## 💰 Tipos de Comissão

### PERCENTAGE
- Porcentagem sobre o valor (ex: 40%)
- Mais comum e flexível
- Valor entre 0 e 100

### FIXED
- Valor fixo por serviço (ex: R$ 10,00)
- Usado para serviços específicos

### TIERED
- Comissão escalonada por metas mensais
- Requer `minTarget` e `maxTarget`
- Incentiva performance

## 🎯 Configuração de Comissões

### Hierarquia de Aplicação
1. **Regra Específica** (serviceId ou productId definido)
2. **Regra Padrão** (serviceId e productId = null)

### Flags de Controle
- `applyOnServices`: Ativa/desativa comissão em serviços
- `applyOnProducts`: Ativa/desativa comissão em produtos
- `active`: Ativa/desativa a regra inteira

### Exemplo de Configuração

**Barbeiro com comissões personalizadas:**
```json
{
  "barberId": "uuid-barbeiro",
  "serviceId": null,
  "productId": null,
  "type": "PERCENTAGE",
  "value": 40,
  "applyOnServices": true,
  "applyOnProducts": true,
  "active": true
}
```

**Comissão específica para um serviço:**
```json
{
  "barberId": "uuid-barbeiro",
  "serviceId": "uuid-corte-premium",
  "type": "PERCENTAGE",
  "value": 50,
  "applyOnServices": true,
  "active": true
}
```

## 🔌 Endpoints

### Configurar Modelo de Trabalho
```http
PATCH /barbers/:barberId/work-model
Authorization: Bearer {token}
Role: ADMIN

Body:
{
  "workModel": "SALARY_COMMISSION",
  "monthlySalary": 2500.00,
  "chairRentalFee": null
}
```

### Criar Comissão
```http
POST /commissions
Authorization: Bearer {token}
Role: ADMIN

Body:
{
  "barberId": "uuid",
  "serviceId": "uuid" | null,
  "productId": "uuid" | null,
  "type": "PERCENTAGE" | "FIXED" | "TIERED",
  "value": 40,
  "applyOnServices": true,
  "applyOnProducts": false,
  "active": true
}
```

### Listar Comissões
```http
GET /commissions?barberId={uuid}&active=true
Authorization: Bearer {token}
Role: ADMIN, BARBER
```

### Buscar Comissões de um Barbeiro
```http
GET /commissions/barber/:barberId
Authorization: Bearer {token}
Role: ADMIN, BARBER (próprio)

Response:
{
  "barber": {
    "id": "uuid",
    "name": "João Silva",
    "workModel": "SALARY_COMMISSION",
    "monthlySalary": 2500.00,
    "chairRentalFee": null
  },
  "commissions": [...]
}
```

### Configurar Comissões Padrão
```http
POST /commissions/barber/:barberId/default
Authorization: Bearer {token}
Role: ADMIN

Body:
{
  "serviceCommission": 40,
  "productCommission": 10
}
```

### Atualizar Comissão
```http
PATCH /commissions/:commissionId
Authorization: Bearer {token}
Role: ADMIN

Body:
{
  "value": 45,
  "active": true
}
```

### Ativar/Desativar Comissão
```http
PATCH /commissions/:commissionId/toggle
Authorization: Bearer {token}
Role: ADMIN

Body:
{
  "active": false,
  "reason": "Promoção temporária"
}
```

### Remover Comissão
```http
DELETE /commissions/:commissionId?reason=motivo
Authorization: Bearer {token}
Role: ADMIN
```

## 🔄 Integração com Comandas

O `ServiceOrdersService` calcula comissões automaticamente ao adicionar itens usando `CommissionsService.calculateCommission()`:

```typescript
// Ao adicionar item na comanda
const commission = await commissionsService.calculateCommission(
  shopId,
  barberId,
  serviceId,
  productId,
  itemTotal
);

// Retorna { rate: 40, value: 16.00 }
```

### Lógica de Cálculo

1. Busca regra específica para o serviço/produto
2. Se não encontrar, usa regra padrão (serviceId/productId null)
3. Verifica flags `applyOnServices` e `applyOnProducts`
4. Calcula valor baseado no tipo:
   - **PERCENTAGE**: `itemTotal * (value / 100)`
   - **FIXED**: `value`
   - **TIERED**: Usa porcentagem base (escalonamento no fechamento mensal)

## 📊 Casos de Uso

### 1. Barbeiro Aluga Cadeira
```typescript
// Configurar barbeiro
PATCH /barbers/:id/work-model
{
  "workModel": "CHAIR_RENT",
  "chairRentalFee": 800.00
}

// Não precisa configurar comissões
// Barbeiro fica com 100% do faturamento
```

### 2. Salário + Comissão (Mais Comum)
```typescript
// 1. Configurar modelo
PATCH /barbers/:id/work-model
{
  "workModel": "SALARY_COMMISSION",
  "monthlySalary": 2000.00
}

// 2. Configurar comissões padrão
POST /commissions/barber/:id/default
{
  "serviceCommission": 40,
  "productCommission": 10
}

// 3. Comissão específica para serviço premium
POST /commissions
{
  "barberId": "uuid",
  "serviceId": "uuid-corte-premium",
  "type": "PERCENTAGE",
  "value": 50,
  "applyOnServices": true
}
```

### 3. Apenas Comissão
```typescript
// 1. Configurar modelo
PATCH /barbers/:id/work-model
{
  "workModel": "COMMISSION_ONLY"
}

// 2. Comissões altas
POST /commissions/barber/:id/default
{
  "serviceCommission": 60,
  "productCommission": 20
}
```

### 4. Desativar Comissão em Produtos
```typescript
// Barbeiro não ganha comissão em produtos
PATCH /commissions/:id
{
  "applyOnProducts": false
}
```

### 5. Comissão Escalonada por Meta
```typescript
POST /commissions
{
  "barberId": "uuid",
  "type": "TIERED",
  "value": 40,
  "minTarget": 3000.00,
  "maxTarget": 5000.00,
  "applyOnServices": true
}

// < R$ 3.000: 40%
// R$ 3.000 - R$ 5.000: escala progressiva
// > R$ 5.000: máximo
```

## 🔐 Segurança e Permissões

### Roles
- **ADMIN**: Gestão completa de comissões
- **BARBER**: Visualiza apenas as próprias comissões (readonly)

### Multi-tenancy
- Todas as queries filtram por `shopId`
- Validação de tenant em todos os endpoints
- Auditoria completa de alterações

## 📝 Auditoria

Todas as operações são registradas em `AuditLog`:
- CREATE_COMMISSION
- UPDATE_COMMISSION
- ACTIVATE_COMMISSION
- DEACTIVATE_COMMISSION
- DELETE_COMMISSION
- SET_DEFAULT_COMMISSIONS
- UPDATE_WORK_MODEL

## 🎨 Fluxo Completo

1. **Criar barbeiro** → `POST /barbers`
2. **Definir modelo de trabalho** → `PATCH /barbers/:id/work-model`
3. **Configurar comissões padrão** → `POST /commissions/barber/:id/default`
4. **Criar comissões específicas** (opcional) → `POST /commissions`
5. **Ajustar comissões** → `PATCH /commissions/:id`
6. **Ativar/Desativar** → `PATCH /commissions/:id/toggle`

## 🚀 Próximos Passos

- [ ] Executar migration: `npm run prisma:migrate`
- [ ] Testar servidor: `npm run start:dev`
- [ ] Configurar barbeiros existentes com modelos de trabalho
- [ ] Definir comissões padrão por barbearia
- [ ] Implementar dashboard de comissões no frontend

## 📚 Referências

- Schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Service: [src/commissions/commissions.service.ts](./commissions/commissions.service.ts)
- Controller: [src/commissions/commissions.controller.ts](./commissions/commissions.controller.ts)
- DTOs: [src/commissions/dto/](./commissions/dto/)
