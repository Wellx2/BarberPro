# ✨ Sistema de Destaques (Featured) - Documentação

## 🎯 Visão Geral

Sistema implementado para permitir destacar até **3 serviços** e **3 produtos** por barbearia, visível para clientes em páginas públicas.

---

## 📋 Mudanças Implementadas

### 1. Schema Prisma
**Arquivo:** `prisma/schema.prisma`

Adicionado campo `featured` aos models `Service` e `Product`:

```prisma
model Service {
  // ... outros campos
  featured    Boolean   @default(false) // Serviço em destaque (máx 3 por loja)
}

model Product {
  // ... outros campos
  featured    Boolean   @default(false) // Produto em destaque (máx 3 por loja)
}
```

### 2. Migration
**Gerada:** `20260203035405_add_featured_field`

```sql
ALTER TABLE "services" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
```

**Executar:**
```bash
npx prisma migrate dev --name add_featured_field
```

### 3. DTOs Atualizados

#### UpdateServiceDto
**Arquivo:** `src/services/dto/update-service.dto.ts`

```typescript
export class UpdateServiceDto {
  // ... outros campos
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
```

#### UpdateProductDto
**Arquivo:** `src/products/dto/update-product.dto.ts`

Já herda de `PartialType(CreateProductDto)`, então automaticamente inclui `featured` se necessário.

---

## 🔌 Novos Endpoints

### Services

#### 1. Listar Serviços em Destaque
```http
GET /api/services/featured
```

**Auth:** Opcional (pode ser usado em rotas públicas se `requester.shopId` estiver disponível)  
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Corte + Barba",
    "price": 50.00,
    "duration": 60,
    "featured": true,
    "active": true
  }
]
```
**Limite:** Máximo 3 serviços

#### 2. Alternar Destaque de Serviço
```http
PATCH /api/services/:id/toggle-featured
```

**Auth:** JWT (ADMIN ou SUPER_ADMIN)  
**Guards:** JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard  
**Módulo Requerido:** SERVICOS

**Response:**
```json
{
  "id": "uuid",
  "name": "Corte + Barba",
  "featured": true,
  "message": "Destaque ativado"
}
```

**Regras:**
- ✅ Se já tiver destaque → remove destaque
- ✅ Se NÃO tiver destaque E tiver menos de 3 → adiciona destaque
- ❌ Se NÃO tiver destaque E JÁ tiver 3 → retorna erro 400

**Erro (limite atingido):**
```json
{
  "statusCode": 400,
  "message": "Limite de 3 serviços em destaque atingido"
}
```

---

### Products

#### 1. Listar Produtos em Destaque
```http
GET /api/products/featured
```

**Auth:** Opcional (pode ser usado em rotas públicas se `requester.shopId` estiver disponível)  
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Pomada Modeladora Strong",
    "price": 45.00,
    "featured": true,
    "active": true
  }
]
```
**Limite:** Máximo 3 produtos

#### 2. Alternar Destaque de Produto
```http
PATCH /api/products/:id/toggle-featured
```

**Auth:** JWT (ADMIN ou SUPER_ADMIN)  
**Guards:** JwtAuthGuard, RolesGuard, TenantGuard

**Response:**
```json
{
  "id": "uuid",
  "name": "Pomada Modeladora Strong",
  "featured": true,
  "message": "Destaque ativado"
}
```

**Regras:**
- ✅ Se já tiver destaque → remove destaque
- ✅ Se NÃO tiver destaque E tiver menos de 3 → adiciona destaque
- ❌ Se NÃO tiver destaque E JÁ tiver 3 → retorna erro 400

**Erro (limite atingido):**
```json
{
  "statusCode": 400,
  "message": "Limite de 3 produtos em destaque atingido"
}
```

---

## 🔒 Regras de Negócio

### Limitações
- ✅ **Máximo 3 serviços em destaque por barbearia**
- ✅ **Máximo 3 produtos em destaque por barbearia**
- ✅ Apenas itens **ativos** podem ser destacados
- ✅ Validação de tenant (shopId) em todas as operações

### Permissões
- **Listar featured:** Qualquer usuário autenticado (ou público com shopId)
- **Alternar featured:** Apenas ADMIN ou SUPER_ADMIN

### Auditoria
Todas as operações de toggle são registradas em `AuditLog`:
```typescript
action: 'TOGGLE_FEATURED'
entity: 'SERVICE' ou 'PRODUCT'
details: 'Destaque ativado' ou 'Destaque desativado'
```

---

## 🧪 Como Testar

### 1. Marcar Serviço como Destaque
```bash
PATCH http://localhost:3000/api/services/{serviceId}/toggle-featured
Authorization: Bearer {token}
```

### 2. Listar Serviços em Destaque
```bash
GET http://localhost:3000/api/services/featured
Authorization: Bearer {token}
```

### 3. Tentar Adicionar 4º Destaque (deve falhar)
```bash
# Após marcar 3 serviços como destaque:
PATCH http://localhost:3000/api/services/{serviceId4}/toggle-featured
Authorization: Bearer {token}

# Esperado: HTTP 400 - "Limite de 3 serviços em destaque atingido"
```

### 4. Remover Destaque
```bash
# Fazer toggle novamente no mesmo item:
PATCH http://localhost:3000/api/services/{serviceId}/toggle-featured
Authorization: Bearer {token}

# Esperado: featured muda para false
```

---

## 📂 Arquivos Modificados

### Criados
- `prisma/migrations/20260203035405_add_featured_field/migration.sql`

### Modificados
- `prisma/schema.prisma` (campo featured)
- `src/services/dto/update-service.dto.ts` (campo featured)
- `src/services/services.controller.ts` (2 endpoints)
- `src/services/services.service.ts` (2 métodos + BadRequestException)
- `src/products/products.controller.ts` (2 endpoints)
- `src/products/products.service.ts` (2 métodos + BadRequestException)

---

## 🚀 Próximos Passos (Frontend)

### 1. Criar Interface Featured
```typescript
interface FeaturedItem {
  id: string;
  name: string;
  price: number;
  featured: boolean;
  active: boolean;
  // ... outros campos
}
```

### 2. Implementar Página de Destaque
- Seção "Serviços em Destaque" na home (público)
- Seção "Produtos em Destaque" na loja (público)
- Badge "⭐ Destaque" nos cards

### 3. Admin: Toggle Featured
- Botão "Marcar como Destaque" em listagens de serviços/produtos
- Indicador visual de limite (X/3 destaques usados)
- Mensagem de erro ao atingir limite

### 4. Filtros e Ordenação
```typescript
// Exemplo de query com featured
GET /api/services/public/shop/:shopId?featured=true
```

---

## ✅ Checklist de Implementação

| Item | Status |
|------|--------|
| Campo `featured` no schema | ✅ |
| Migration aplicada | ✅ |
| DTO atualizado (Services) | ✅ |
| DTO atualizado (Products) | ✅ |
| Endpoint listar featured (Services) | ✅ |
| Endpoint toggle featured (Services) | ✅ |
| Endpoint listar featured (Products) | ✅ |
| Endpoint toggle featured (Products) | ✅ |
| Validação limite 3 itens | ✅ |
| Auditoria (AuditLog) | ✅ |
| Build sem erros | ✅ |
| Documentação | ✅ |

---

## 📚 Referências

- [Schema Prisma](../prisma/schema.prisma)
- [Services Controller](../src/services/services.controller.ts)
- [Products Controller](../src/products/products.controller.ts)
- [BACKEND_ADJUSTS_SUMMARY.md](./BACKEND_ADJUSTS_SUMMARY.md)

---

**Última atualização:** 03/02/2026  
**Status:** ✅ IMPLEMENTAÇÃO COMPLETA
