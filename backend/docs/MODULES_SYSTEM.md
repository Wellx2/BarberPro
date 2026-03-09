# Sistema de Controle de Módulos - BarberPro

## Visão Geral

Sistema completo para controle granular de acesso a funcionalidades por barbearia. O **SUPER_ADMIN** pode habilitar/desabilitar módulos específicos para cada barbearia, controlando quais features estão disponíveis.

## Módulos Disponíveis (Enum `ModuleType`)

```typescript
enum ModuleType {
  AGENDA           // Agendamentos
  FINANCEIRO       // Relatórios financeiros
  CAIXA            // Comandas/Ordens de serviço
  SERVICOS         // Gestão de serviços
  GESTAO_TIME      // Gestão de barbeiros
  PRODUTOS         // Gestão de produtos
  MARKETING        // Marketing e promoções
  PLANOS           // Planos de assinatura
  NOTIFICACOES     // Sistema de notificações
  CLIENTES         // Gestão de clientes
}
```

## Arquitetura

### 1. Tabela `BarbershopModule`

```prisma
model BarbershopModule {
  id              String        @id @default(uuid())
  shopId          String
  moduleType      ModuleType
  enabled         Boolean       @default(true)
  
  // Auditoria
  enabledAt       DateTime?
  disabledAt      DateTime?
  enabledBy       String?       // ID do usuário que habilitou
  disabledBy      String?       // ID do usuário que desabilitou
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  shop            Barbershop    @relation(...)
  
  @@unique([shopId, moduleType])
  @@index([shopId, enabled])
}
```

### 2. Guard `ModuleAccessGuard`

Guard que valida se a barbearia tem acesso ao módulo antes de permitir operação.

**Características:**
- **SUPER_ADMIN**: Bypass completo (acesso a tudo)
- **ADMIN/BARBER**: Validação obrigatória
- Retorna `403 Forbidden` se módulo desabilitado

**Uso em Controllers:**
```typescript
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { ModuleType } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
export class ProductsController {
  
  @Post()
  @Roles(UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  create(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.service.create(user, dto);
  }
}
```

**Ordem dos Guards (importante!):**
```typescript
@UseGuards(
  JwtAuthGuard,         // 1. Valida token JWT
  RolesGuard,           // 2. Valida role do usuário
  TenantGuard,          // 3. Valida shopId
  ModuleAccessGuard     // 4. Valida acesso ao módulo
)
```

### 3. Service `BarbershopModulesService`

Métodos principais:

#### `findByShop(shopId: string)`
Lista todos os módulos de uma barbearia.

#### `findEnabledByShop(shopId: string)`
Lista apenas módulos habilitados.

#### `hasAccess(shopId: string, moduleType: ModuleType): Promise<boolean>`
Verifica se barbearia tem acesso a um módulo específico.

#### `updateModule(shopId, moduleType, dto, userId)`
Atualiza status de um módulo (SUPER_ADMIN apenas).

#### `bulkUpdate(shopId, dto, userId)`
Atualiza múltiplos módulos de uma vez.

#### `initializeDefaultModules(shopId, userId)`
Inicializa todos os módulos habilitados para nova barbearia.

#### `getAllShopsModules()`
Overview de todas as barbearias e seus módulos (SUPER_ADMIN).

## Endpoints da API

### 1. Listar Módulos de uma Barbearia
```http
GET /barbershop-modules/shop/:shopId
Authorization: Bearer {token}
Roles: SUPER_ADMIN, ADMIN
```

**Response:**
```json
[
  {
    "id": "uuid",
    "shopId": "shop-1",
    "moduleType": "PRODUTOS",
    "enabled": true,
    "enabledAt": "2026-02-02T10:00:00Z",
    "enabledBy": "user-id"
  }
]
```

### 2. Listar Módulos Habilitados
```http
GET /barbershop-modules/shop/:shopId/enabled
Authorization: Bearer {token}
Roles: SUPER_ADMIN, ADMIN
```

### 3. Atualizar Status de um Módulo
```http
PATCH /barbershop-modules/shop/:shopId/module/:moduleType
Authorization: Bearer {token}
Roles: SUPER_ADMIN (apenas)

Body:
{
  "enabled": false
}
```

**Exemplo:**
```bash
# Desabilitar módulo de PRODUTOS da barbearia
PATCH /barbershop-modules/shop/shop-1/module/PRODUTOS
{
  "enabled": false
}
```

### 4. Atualizar Múltiplos Módulos
```http
PATCH /barbershop-modules/shop/:shopId/bulk
Authorization: Bearer {token}
Roles: SUPER_ADMIN (apenas)

Body:
{
  "modules": [
    { "moduleType": "PRODUTOS", "enabled": true },
    { "moduleType": "MARKETING", "enabled": false },
    { "moduleType": "PLANOS", "enabled": false }
  ]
}
```

### 5. Overview de Todas as Barbearias
```http
GET /barbershop-modules/all
Authorization: Bearer {token}
Roles: SUPER_ADMIN (apenas)
```

**Response:**
```json
[
  {
    "id": "shop-1",
    "name": "BarberPro Centro",
    "modules": [...],
    "totalModules": 10,
    "enabledModules": 7
  }
]
```

## Fluxo de Uso

### 1. Criação de Nova Barbearia
Quando `POST /auth/register-shop` é chamado:
1. Cria a barbearia
2. Cria usuário ADMIN
3. **Inicializa TODOS os módulos habilitados** (`initializeDefaultModules`)
4. Retorna tokens

### 2. SUPER_ADMIN Desabilita Módulo
```typescript
// Frontend faz request
PATCH /barbershop-modules/shop/shop-1/module/MARKETING
{ "enabled": false }

// Backend:
// 1. Valida se usuário é SUPER_ADMIN
// 2. Atualiza registro no banco
// 3. Define disabledAt = now(), disabledBy = userId
// 4. Retorna módulo atualizado
```

### 3. ADMIN Tenta Acessar Módulo Desabilitado
```typescript
// Frontend tenta criar produto
POST /products
{ "name": "Pomada", "price": 25 }

// Backend:
// 1. JwtAuthGuard valida token ✓
// 2. RolesGuard valida role=ADMIN ✓
// 3. TenantGuard valida shopId ✓
// 4. ModuleAccessGuard busca BarbershopModule:
//    - moduleType = PRODUTOS
//    - enabled = false
// 5. Retorna 403 Forbidden:
//    "Sua barbearia não tem acesso ao módulo: PRODUTOS"
```

## Exemplo Completo: Proteger Controller

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ModuleType } from '@prisma/client';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@ApiTags('services')
export class ServicesController {
  
  // SUPER_ADMIN sempre tem acesso (bypass)
  // ADMIN/BARBER precisa ter módulo SERVICOS habilitado
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  @RequireModule(ModuleType.SERVICOS)
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @RequireModule(ModuleType.SERVICOS)
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.service.create(user, dto);
  }
}
```

## Checklist de Implementação

Ao proteger um novo controller/endpoint:

- [ ] Importar `ModuleAccessGuard` e `RequireModule`
- [ ] Importar `ModuleType` do `@prisma/client`
- [ ] Adicionar `ModuleAccessGuard` nos `@UseGuards()` (SEMPRE APÓS TenantGuard)
- [ ] Adicionar decorator `@RequireModule(ModuleType.XXX)` em cada rota
- [ ] Verificar ordem dos guards: Jwt → Roles → Tenant → ModuleAccess
- [ ] Testar com SUPER_ADMIN (deve ter acesso)
- [ ] Testar com ADMIN e módulo desabilitado (deve retornar 403)

## Mapeamento Módulo → Controllers

| Módulo | Controllers Protegidos |
|--------|----------------------|
| `AGENDA` | `AppointmentsController`, `BlockedTimesController` |
| `FINANCEIRO` | `FinancialReportsController`, `DailyCashFlowController` |
| `CAIXA` | `ServiceOrdersController` |
| `SERVICOS` | `ServicesController` |
| `GESTAO_TIME` | `BarbersController` |
| `PRODUTOS` | `ProductsController` |
| `MARKETING` | *(ainda não implementado)* |
| `PLANOS` | `PlansController`, `InvoicesController` |
| `NOTIFICACOES` | *(ainda não implementado)* |
| `CLIENTES` | `ClientsController` |

## Auditoria

Todas as alterações de módulos são auditadas automaticamente:

```typescript
{
  "enabledAt": "2026-02-02T10:00:00Z",
  "enabledBy": "user-id-who-enabled",
  "disabledAt": "2026-02-02T15:30:00Z",
  "disabledBy": "user-id-who-disabled"
}
```

Isso permite rastreabilidade completa de quem habilitou/desabilitou módulos e quando.

## Frontend: Ocultar Features Desabilitadas

O frontend deve:

1. **Ao fazer login**, buscar módulos habilitados:
```typescript
GET /barbershop-modules/shop/{shopId}/enabled
```

2. **Armazenar em contexto/state**:
```typescript
const enabledModules = ['AGENDA', 'FINANCEIRO', 'SERVICOS', 'GESTAO_TIME', 'CLIENTES'];
```

3. **Ocultar menus/botões** de módulos desabilitados:
```typescript
{enabledModules.includes('PRODUTOS') && (
  <MenuItem to="/produtos">Produtos</MenuItem>
)}
```

4. **Tratar 403 Forbidden** na API:
```typescript
if (error.response?.status === 403 && error.response?.data?.message?.includes('módulo')) {
  showError('Sua barbearia não tem acesso a esta funcionalidade');
  redirectTo('/dashboard');
}
```

## Considerações de Segurança

- **SUPER_ADMIN** sempre tem bypass completo
- **Módulos não existentes** são considerados desabilitados (segurança por padrão)
- **Validation pipeline** garante ordem correta: Auth → Role → Tenant → Module
- **Auditoria automática** rastreia todas as mudanças
- **Frontend deve validar** antes de exibir UI (UX)
- **Backend sempre valida** no guard (segurança)

## Testes

### Teste 1: SUPER_ADMIN sempre tem acesso
```bash
# Login como SUPER_ADMIN
POST /auth/login { "email": "super@admin.com", ... }

# Acessar qualquer módulo (mesmo desabilitado)
POST /products { "name": "Test" }
# ✅ 200 OK
```

### Teste 2: ADMIN sem acesso ao módulo
```bash
# Login como ADMIN
POST /auth/login { "email": "admin@shop1.com", ... }

# SUPER_ADMIN desabilita módulo PRODUTOS da shop1
PATCH /barbershop-modules/shop/shop-1/module/PRODUTOS
{ "enabled": false }

# ADMIN tenta criar produto
POST /products { "name": "Test" }
# ❌ 403 Forbidden: "Sua barbearia não tem acesso ao módulo: PRODUTOS"
```

### Teste 3: Habilitar módulo
```bash
# SUPER_ADMIN habilita módulo
PATCH /barbershop-modules/shop/shop-1/module/PRODUTOS
{ "enabled": true }

# ADMIN tenta novamente
POST /products { "name": "Test" }
# ✅ 201 Created
```

## Troubleshooting

**Erro: "Module not found"**
- Verifique se `BarbershopModule` foi criado para essa barbearia
- Execute `initializeDefaultModules()` manualmente se necessário

**Erro: "ModuleAccessGuard bloqueando SUPER_ADMIN"**
- Verifique ordem dos guards (TenantGuard deve vir ANTES)
- Confirme que `user.role === UserRole.SUPER_ADMIN`

**Erro: "Property 'barbershopModule' does not exist"**
- Execute `npx prisma generate` para regenerar Prisma Client
- Reinicie TypeScript server no VS Code

---

**Implementado em**: 02/02/2026  
**Status**: ✅ Produção  
**Documentação**: MODULES_SYSTEM.md
