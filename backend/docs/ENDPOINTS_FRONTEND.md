# 📚 Documentação de Endpoints para Frontend - BarberPro

## 🔌 Conexão com Banco de Dados

**Base URL**: `http://localhost:3000` (desenvolvimento)

**Autenticação**: Todos os endpoints protegidos requerem header:
```
Authorization: Bearer {accessToken}
```

---

## 🛍️ PRODUTOS (Products)

### 📋 Listar Produtos (Público)
```http
GET /products/public/shop/:shopId?active=true
```
**Headers**: Nenhum (público)  
**Parâmetros**:
- `shopId` (path): ID da barbearia
- `active` (query, opcional): `true` | `false` | omitir para todos

**Response 200**:
```json
[
  {
    "id": "uuid",
    "shopId": "uuid",
    "name": "Pomada Modeladora Strong",
    "price": 45.00,
    "costPrice": 22.00,
    "stock": 25,
    "unit": "unidade",
    "category": "POMADAS",
    "description": "Pomada de alta fixação",
    "formulation": "Cera de abelha, óleo de argan",
    "howToUse": "Aplicar pequena quantidade",
    "recommendedFor": "Todos os tipos de cabelo",
    "image": "https://...",
    "active": true,
    "featured": false,
    "createdAt": "2026-02-11T00:00:00.000Z",
    "updatedAt": "2026-02-11T00:00:00.000Z"
  }
]
```

---

### 📋 Listar Produtos (Autenticado)
```http
GET /products?active=true
```
**Headers**: `Authorization: Bearer {token}`  
**Roles**: ADMIN, BARBER, SUPER_ADMIN  
**Módulo Requerido**: PRODUTOS

---

### 🔍 Buscar Produto por ID
```http
GET /products/:id
```
**Headers**: `Authorization: Bearer {token}`  
**Roles**: ADMIN, BARBER, SUPER_ADMIN

---

### ➕ Criar Produto
```http
POST /products
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: PRODUTOS

**Body** (obrigatórios marcados com *):
```json
{
  "name": "Pomada Strong", // * obrigatório
  "price": 45.00, // * obrigatório, mínimo 0
  "stock": 25, // * obrigatório, mínimo 0
  "costPrice": 22.00, // opcional
  "unit": "unidade", // opcional
  "category": "POMADAS", // opcional
  "description": "Descrição", // opcional
  "formulation": "Ingredientes", // opcional
  "howToUse": "Modo de usar", // opcional
  "recommendedFor": "Recomendado para", // opcional
  "image": "https://...", // opcional
  "active": true // opcional, padrão: true
}
```

**Response 201**: Objeto do produto criado

---

### ✏️ Editar Produto
```http
PATCH /products/:id
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN

**Body** (todos campos opcionais):
```json
{
  "name": "Novo Nome",
  "price": 50.00,
  "stock": 30,
  "costPrice": 25.00,
  "unit": "unidade",
  "category": "POMADAS",
  "description": "Nova descrição",
  "formulation": "Novos ingredientes",
  "howToUse": "Novo modo de usar",
  "recommendedFor": "Nova recomendação",
  "image": "https://nova-imagem.jpg",
  "active": true
}
```

**⚠️ IMPORTANTE**: Envie APENAS os campos que deseja alterar. Campos não enviados não serão modificados.

**Response 200**: Objeto do produto atualizado

---

### 🚫 Desativar Produto
```http
PATCH /products/:id/disable
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN

**Body** (obrigatório):
```json
{
  "reason": "Produto descontinuado" // * obrigatório
}
```

**Response 200**: Produto com `active: false`

---

### 🗑️ Remover Produto (Soft Delete)
```http
DELETE /products/:id
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN

**Body** (obrigatório):
```json
{
  "reason": "Produto obsoleto" // * obrigatório
}
```

**⚠️ CRÍTICO**: O endpoint DELETE REQUER um body com o campo `reason`. Se você enviar DELETE sem body, receberá erro 400 (Bad Request).

**Response 200**: Produto com `active: false` + registro no AuditLog

---

### ⭐ Alternar Destaque do Produto
```http
PATCH /products/:id/toggle-featured
```
**Headers**: `Authorization: Bearer {token}`  
**Roles**: ADMIN, SUPER_ADMIN  
**Body**: Vazio

**Response 200**: Produto com campo `featured` alternado

---

### ⭐ Listar Produtos em Destaque
```http
GET /products/featured
```
**Headers**: `Authorization: Bearer {token}`

**Response 200**: Array com até 3 produtos com `featured: true`

---

## 💈 SERVIÇOS (Services)

### 📋 Listar Serviços (Público)
```http
GET /services/public/shop/:shopId?active=true
```
**Headers**: Nenhum (público)  
**Parâmetros**:
- `shopId` (path): ID da barbearia
- `active` (query, opcional): `true` | `false`

**Response 200**:
```json
[
  {
    "id": "uuid",
    "shopId": "uuid",
    "name": "Corte Tradicional",
    "duration": 30,
    "price": 35.00,
    "category": "CORTES",
    "description": "Corte clássico",
    "image": "https://...",
    "active": true,
    "featured": false,
    "createdAt": "2026-02-11T00:00:00.000Z",
    "updatedAt": "2026-02-11T00:00:00.000Z"
  }
]
```

---

### 📋 Listar Serviços (Autenticado)
```http
GET /services?active=true
```
**Headers**: `Authorization: Bearer {token}`  
**Módulo Requerido**: SERVICOS

---

### 🔍 Buscar Serviço por ID
```http
GET /services/:id
```
**Headers**: `Authorization: Bearer {token}`  
**Módulo Requerido**: SERVICOS

---

### ➕ Criar Serviço
```http
POST /services
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: SERVICOS

**Body**:
```json
{
  "name": "Corte Tradicional", // * obrigatório
  "duration": 30, // * obrigatório, mínimo 1
  "price": 35.00, // * obrigatório
  "category": "CORTES", // opcional
  "description": "Descrição", // opcional
  "image": "https://...", // opcional
  "active": true, // opcional, padrão: true
  "featured": false // opcional, padrão: false
}
```

---

### ✏️ Editar Serviço
```http
PATCH /services/:id
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: SERVICOS

**Body** (todos campos opcionais):
```json
{
  "name": "Novo Nome",
  "duration": 45,
  "price": 40.00,
  "category": "CORTES",
  "description": "Nova descrição",
  "image": "https://nova-imagem.jpg",
  "active": true,
  "featured": false
}
```

**Response 200**: Objeto do serviço atualizado

---

### 🚫 Desativar Serviço (Por Período)
```http
PATCH /services/:id/disable
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: SERVICOS

**Body**:
```json
{
  "type": "DAY", // * obrigatório: "DAY" | "PERIOD" | "RECURRING_DAY"
  "date": "2026-02-15", // para type: DAY
  "startDate": "2026-02-15", // para type: PERIOD
  "endDate": "2026-02-20", // para type: PERIOD
  "reason": "Férias do barbeiro" // * obrigatório
}
```

**Tipos de Desativação**:
- `DAY`: Desativa em um dia específico
- `PERIOD`: Desativa em um período (startDate até endDate)
- `RECURRING_DAY`: Desativa todo dia da semana (ex: todas segundas)

---

### 🗑️ Remover Serviço (Soft Delete)
```http
DELETE /services/:id
```
**Headers**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: SERVICOS

**Body** (obrigatório):
```json
{
  "reason": "Serviço descontinuado" // * obrigatório
}
```

**⚠️ CRÍTICO**: O endpoint DELETE REQUER um body com o campo `reason`. Se você enviar DELETE sem body, receberá erro 400 (Bad Request).

**Response 200**: Serviço com `active: false` + registro no AuditLog

---

### 📅 Listar Períodos Desabilitados
```http
GET /services/:id/disabled-periods
```
**Headers**: `Authorization: Bearer {token}`  
**Roles**: ADMIN, SUPER_ADMIN

**Response 200**: Array de períodos em que o serviço está desabilitado

---

### ⭐ Alternar Destaque do Serviço
```http
PATCH /services/:id/toggle-featured
```
**Headers**: `Authorization: Bearer {token}`  
**Roles**: ADMIN, SUPER_ADMIN  
**Módulo Requerido**: SERVICOS  
**Body**: Vazio

---

### ⭐ Listar Serviços em Destaque
```http
GET /services/featured
```
**Headers**: `Authorization: Bearer {token}`

**Response 200**: Array com até 3 serviços com `featured: true`

---

## 🚨 Tratamento de Erros

### Códigos HTTP Comuns:

- **200 OK**: Sucesso
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos (validação falhou)
  - Campos obrigatórios faltando
  - Formato de dados incorreto
  - Body obrigatório não enviado (DELETE)
- **401 Unauthorized**: Token inválido ou expirado
- **403 Forbidden**: Sem permissão (role insuficiente ou tenant inválido)
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: nome duplicado)
- **422 Unprocessable Entity**: Lógica de negócio violada (ex: limite de featured excedido)

### Exemplo de Erro:
```json
{
  "statusCode": 400,
  "message": [
    "reason must be a string",
    "reason should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## 🛠️ Correções para o Frontend

### ❌ ERRO ATUAL: Bad Request no DELETE

**Problema**: Frontend envia DELETE sem body ou com body vazio.

```javascript
// ❌ ERRADO - Causa Bad Request
await fetch(`/products/${id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// ❌ ERRADO - Body vazio
await fetch(`/products/${id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

```javascript
// ✅ CORRETO - Com reason obrigatório
await fetch(`/products/${id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Produto obsoleto' // OBRIGATÓRIO
  })
});
```

---

### ✅ Exemplos Corretos para Frontend

#### **Editar Produto (React/Next.js)**:
```typescript
const updateProduct = async (id: string, data: Partial<Product>) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // Envie apenas campos alterados
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Uso:
await updateProduct('uuid-produto', {
  name: 'Novo Nome',
  price: 50.00
});
```

---

#### **Remover Produto (React/Next.js)**:
```typescript
const deleteProduct = async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason }) // OBRIGATÓRIO
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Uso:
await deleteProduct('uuid-produto', 'Produto descontinuado');
```

---

#### **Remover Serviço (React/Next.js)**:
```typescript
const deleteService = async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason }) // OBRIGATÓRIO
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Uso:
await deleteService('uuid-servico', 'Serviço não oferecido mais');
```

---

#### **Editar Serviço (React/Next.js)**:
```typescript
const updateService = async (id: string, data: Partial<Service>) => {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Uso:
await updateService('uuid-servico', {
  name: 'Corte Premium',
  price: 45.00,
  duration: 45
});
```

---

## 🔐 Sistema de Módulos

Alguns endpoints requerem que o módulo específico esteja ativado na barbearia:

- **PRODUTOS**: Endpoints de produtos
- **SERVICOS**: Endpoints de serviços

**Erro** se módulo não ativado:
```json
{
  "statusCode": 403,
  "message": "Módulo PRODUTOS não está ativo para esta barbearia"
}
```

**Solução**: Ativar módulo via plano ou configuração da barbearia.

---

## 📦 Informações Adicionais

### Variáveis de Ambiente (Backend):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barberpro"
JWT_SECRET="seu-secret-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui"
PORT=3000
```

### Comandos Úteis:
```bash
# Iniciar backend
npm run start:dev

# Rodar migrations
npm run prisma:migrate

# Popular banco com dados de teste
npx tsx prisma/seed.ts

# Popular produtos com imagens
npx tsx scripts/populate-products.ts
```

---

## 📞 Suporte

Em caso de dúvidas ou erros, verifique:

1. ✅ Token JWT válido no header
2. ✅ Módulo necessário ativado na barbearia
3. ✅ Role do usuário tem permissão
4. ✅ Body obrigatório enviado (DELETE endpoints)
5. ✅ Content-Type: application/json no header
6. ✅ Campos obrigatórios presentes no body

**Swagger UI**: `http://localhost:3000/api` (documentação interativa)
