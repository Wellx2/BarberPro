# 📦 API de Atualização de Produtos - Guia Frontend

## ✅ Status do Método Update
**Funcionando:** SIM ✅  
**Última validação:** 03/02/2026

---

## 🔌 Endpoint

### PATCH /api/products/:id

**Método:** `PATCH`  
**URL Completa:** `http://localhost:3000/api/products/{productId}`  
**Autenticação:** JWT Bearer Token (obrigatório)  
**Permissões:** ADMIN ou SUPER_ADMIN

---

## 🔐 Headers Obrigatórios

```javascript
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

---

## 📋 Parâmetros

### URL Parameters (Obrigatório)
- **id** (string, UUID): ID do produto a ser atualizado
  - Exemplo: `550e8400-e29b-41d4-a716-446655440000`

### Body (JSON) - TODOS OS CAMPOS SÃO OPCIONAIS

Como `UpdateProductDto` estende `PartialType(CreateProductDto)`, **TODOS os campos são opcionais**. Você pode enviar apenas os campos que deseja atualizar.

```typescript
{
  // CAMPOS BÁSICOS (opcionais)
  "name"?: string,              // Nome do produto
  "price"?: number,             // Preço de venda (≥ 0)
  "stock"?: number,             // Quantidade em estoque (≥ 0)
  
  // CAMPOS DE CUSTO (opcionais)
  "costPrice"?: number,         // Preço de custo (≥ 0)
  
  // CAMPOS DE CATEGORIZAÇÃO (opcionais)
  "category"?: string,          // Categoria do produto
  "unit"?: string,              // Unidade de medida (ex: "unidade", "caixa", "litro")
  
  // CAMPOS DESCRITIVOS (opcionais)
  "description"?: string,       // Descrição geral
  "formulation"?: string,       // Composição/Ingredientes
  "howToUse"?: string,          // Instruções de uso
  "recommendedFor"?: string,    // Para quem é recomendado
  
  // CAMPOS VISUAIS (opcionais)
  "image"?: string,             // URL da imagem
  
  // CAMPOS DE STATUS (opcionais)
  "active"?: boolean,           // Ativo/Inativo
  "featured"?: boolean          // Em destaque (máx 3 por loja)
}
```

---

## 📤 Exemplos de Requisição

### Exemplo 1: Atualizar Apenas Preço
```javascript
// URL
PATCH http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000

// Headers
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}

// Body
{
  "price": 49.90
}
```

### Exemplo 2: Atualizar Nome e Estoque
```javascript
// Body
{
  "name": "Pomada Modeladora Premium",
  "stock": 25
}
```

### Exemplo 3: Atualizar Detalhes Completos
```javascript
// Body
{
  "name": "Pomada Modeladora Strong Pro",
  "price": 55.00,
  "costPrice": 27.50,
  "stock": 30,
  "category": "Pomadas",
  "unit": "unidade",
  "description": "Pomada de fixação forte com acabamento natural",
  "formulation": "Cera de abelha orgânica, óleo de argan, vitamina E, lanolina premium",
  "howToUse": "Aplique pequena quantidade nas mãos, aqueça esfregando e distribua no cabelo seco ou levemente úmido. Penteie para modelar.",
  "recommendedFor": "Cabelos curtos e médios que precisam de fixação forte e duradoura. Ideal para penteados estruturados.",
  "image": "https://exemplo.com/images/pomada-strong-pro.jpg",
  "active": true,
  "featured": false
}
```

### Exemplo 4: Ativar/Desativar Produto
```javascript
// Body
{
  "active": false
}
```

### Exemplo 5: Marcar como Destaque
```javascript
// Body
{
  "featured": true
}
```

---

## 📥 Response (Sucesso)

### Status Code: 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "shopId": "shop-1",
  "name": "Pomada Modeladora Strong Pro",
  "price": 55.00,
  "costPrice": 27.50,
  "stock": 30,
  "unit": "unidade",
  "category": "Pomadas",
  "description": "Pomada de fixação forte com acabamento natural",
  "formulation": "Cera de abelha orgânica, óleo de argan, vitamina E, lanolina premium",
  "howToUse": "Aplique pequena quantidade nas mãos, aqueça esfregando e distribua no cabelo seco ou levemente úmido. Penteie para modelar.",
  "recommendedFor": "Cabelos curtos e médios que precisam de fixação forte e duradoura. Ideal para penteados estruturados.",
  "image": "https://exemplo.com/images/pomada-strong-pro.jpg",
  "active": true,
  "featured": false,
  "createdAt": "2026-02-01T10:30:00.000Z",
  "updatedAt": "2026-02-03T15:45:00.000Z"
}
```

---

## ❌ Respostas de Erro

### 1. Produto Não Encontrado
**Status:** 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Produto não encontrado",
  "error": "Not Found"
}
```

**Causas:**
- ID do produto inexistente
- Produto pertence a outra barbearia (validação de tenant)

### 2. Não Autorizado
**Status:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causas:**
- Token JWT ausente ou inválido
- Token expirado

### 3. Permissão Negada
**Status:** 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Causas:**
- Usuário não é ADMIN ou SUPER_ADMIN
- Tentativa de atualizar produto de outra barbearia

### 4. Validação Falhou
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "price must be a number conforming to the specified constraints",
    "stock must not be less than 0"
  ],
  "error": "Bad Request"
}
```

**Causas:**
- Valores negativos em `price`, `stock` ou `costPrice`
- Tipo de dado inválido (ex: string em campo numérico)

---

## 🔍 Validações Aplicadas

| Campo | Tipo | Validações |
|-------|------|------------|
| name | string | Opcional |
| price | number | Opcional, ≥ 0 |
| stock | number | Opcional, ≥ 0 |
| costPrice | number | Opcional, ≥ 0 |
| unit | string | Opcional |
| category | string | Opcional |
| description | string | Opcional |
| formulation | string | Opcional |
| howToUse | string | Opcional |
| recommendedFor | string | Opcional |
| image | string | Opcional (URL) |
| active | boolean | Opcional |
| featured | boolean | Opcional |

---

## 🔐 Segurança e Multi-Tenancy

### Validações Automáticas
1. **JWT Token:** Validado pelo `JwtAuthGuard`
2. **Role:** Apenas ADMIN ou SUPER_ADMIN pelo `RolesGuard`
3. **Tenant:** Valida que produto pertence ao `shopId` do usuário autenticado
4. **AuditLog:** Toda atualização é registrada no log de auditoria

### Tenant Isolation
O método `update` garante que:
```typescript
// ✅ Só atualiza se produto.shopId === requester.shopId
if (product.shopId !== requester.shopId) {
  throw new NotFoundException('Produto não encontrado');
}
```

---

## 💻 Exemplos de Código Frontend

### React/Next.js com Axios
```typescript
import axios from 'axios';

// Configurar axios com token
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

// Função de atualização
async function updateProduct(productId: string, data: Partial<Product>) {
  try {
    const response = await api.patch(`/products/${productId}`, data);
    console.log('Produto atualizado:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Erro da API
      console.error('Erro:', error.response.data.message);
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

// Uso
updateProduct('550e8400-e29b-41d4-a716-446655440000', {
  price: 49.90,
  stock: 30
});
```

### Fetch API (JavaScript Puro)
```javascript
async function updateProduct(productId, updates) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Uso
updateProduct('550e8400-e29b-41d4-a716-446655440000', {
  name: 'Novo Nome',
  price: 59.90
})
.then(product => console.log('Sucesso:', product))
.catch(err => console.error('Erro:', err.message));
```

---

## 🧪 Testando no Postman/Insomnia

### 1. Configurar Request
```
Method: PATCH
URL: http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000
```

### 2. Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 3. Body (JSON)
```json
{
  "price": 49.90,
  "stock": 25,
  "active": true
}
```

### 4. Credenciais de Teste
```
Email: admin@barberpro.com
Senha: senha123
ShopId: shop-1
```

---

## 📊 Fluxo Completo

```mermaid
graph TD
    A[Frontend: PATCH /products/:id] --> B{Token JWT Válido?}
    B -->|Não| C[401 Unauthorized]
    B -->|Sim| D{Usuário é ADMIN?}
    D -->|Não| E[403 Forbidden]
    D -->|Sim| F{Produto Existe?}
    F -->|Não| G[404 Not Found]
    F -->|Sim| H{Produto do Mesmo Shop?}
    H -->|Não| I[404 Not Found]
    H -->|Sim| J{Dados Válidos?}
    J -->|Não| K[400 Bad Request]
    J -->|Sim| L[Atualizar no Banco]
    L --> M[Registrar AuditLog]
    M --> N[200 OK + Produto Atualizado]
```

---

## 🆚 Diferença entre Update e Disable

### PATCH /products/:id (Update)
- Atualiza **qualquer campo** do produto
- Pode ativar/desativar via `active: true/false`
- Permite atualizar múltiplos campos de uma vez
- Requer apenas permissão ADMIN

### PATCH /products/:id/disable (Disable)
- Especificamente para **desativar** produto
- Requer enviar `reason` (motivo da desativação)
- Registra motivo no AuditLog
- Usado quando há processo formal de desativação

---

## 📚 Arquivos Relacionados

- [UpdateProductDto](../src/products/dto/update-product.dto.ts) - DTO de atualização
- [CreateProductDto](../src/products/dto/create-product.dto.ts) - DTO base (inherited)
- [ProductsController](../src/products/products.controller.ts) - Rota PATCH /:id
- [ProductsService](../src/products/products.service.ts) - Método update()
- [Schema Prisma](../prisma/schema.prisma) - Model Product

---

## ✅ Checklist de Implementação Frontend

- [ ] Criar formulário de edição com todos os campos
- [ ] Implementar função `updateProduct(id, data)`
- [ ] Adicionar tratamento de erros (404, 401, 403, 400)
- [ ] Validar campos antes de enviar (price/stock ≥ 0)
- [ ] Mostrar loading durante atualização
- [ ] Atualizar lista/cache após sucesso
- [ ] Exibir mensagem de sucesso/erro ao usuário
- [ ] Implementar debounce em campos de texto
- [ ] Validar formato de URL para campo `image`

---

**Última atualização:** 03/02/2026  
**Status:** ✅ ENDPOINT TOTALMENTE FUNCIONAL
