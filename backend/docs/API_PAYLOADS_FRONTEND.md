# 📡 API Payloads - Serviços e Produtos

**Documentação para Frontend**  
**Data:** 05/02/2026  
**Backend:** BarberPro API - http://localhost:3000/api

---

## 🔐 Autenticação

Todos os endpoints de serviços e produtos requerem **JWT Bearer Token**:

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🎨 Serviços (Services)

### 📝 POST `/api/services` - Criar Serviço

**Campos Obrigatórios:**

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `name` | `string` | Obrigatório | Nome do serviço |
| `duration` | `number` | Obrigatório, Min: 1 | Duração em minutos |
| `price` | `number` | Obrigatório, Min: 0 | Preço do serviço |
| `category` | `string` | Obrigatório | Categoria (ex: "Corte", "Barba", "Combo") |

**Campos Opcionais:**

| Campo | Tipo | Validação | Descrição | Default |
|-------|------|-----------|-----------|---------|
| `description` | `string` | Opcional | Descrição detalhada | `null` |
| `image` | `string` | Opcional, URL válida | URL da imagem (base64 ou URL) | `null` |
| `active` | `boolean` | Opcional | Serviço ativo/inativo | `true` |

**Exemplo de Payload (TypeScript/JavaScript):**

```typescript
// Criar serviço
const payload = {
  name: "Corte Premium",
  duration: 45,
  price: 50.00,
  category: "Corte",
  description: "Corte estilizado com máquina e tesoura",
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // ou URL
  active: true
};

const response = await fetch('http://localhost:3000/api/services', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const service = await response.json();
```

**Response (201 Created):**

```json
{
  "id": "uuid-do-servico",
  "shopId": "uuid-da-barbearia",
  "name": "Corte Premium",
  "duration": 45,
  "price": 50.00,
  "category": "Corte",
  "description": "Corte estilizado com máquina e tesoura",
  "image": "data:image/jpeg;base64,...",
  "active": true,
  "featured": false,
  "createdAt": "2026-02-05T10:00:00.000Z",
  "updatedAt": "2026-02-05T10:00:00.000Z"
}
```

---

### ✏️ PATCH `/api/services/:id` - Editar Serviço

**Todos os campos são opcionais** (enviar apenas os que deseja alterar):

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `name` | `string` | Opcional | Nome do serviço |
| `duration` | `number` | Opcional, Min: 1 | Duração em minutos |
| `price` | `number` | Opcional, Min: 0 | Preço do serviço |
| `category` | `string` | Opcional | Categoria |
| `description` | `string` | Opcional | Descrição |
| `active` | `boolean` | Opcional | Ativo/Inativo |
| `featured` | `boolean` | Opcional | Serviço em destaque |

**Exemplo de Payload:**

```typescript
// Atualizar apenas nome e preço
const payload = {
  name: "Corte Premium Plus",
  price: 60.00
};

const response = await fetch(`http://localhost:3000/api/services/${serviceId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

**Atualizar imagem:**

```typescript
// Enviar nova imagem em base64
const payload = {
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
};

await fetch(`http://localhost:3000/api/services/${serviceId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

---

## 🛒 Produtos (Products)

### 📝 POST `/api/products` - Criar Produto

**Campos Obrigatórios:**

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `name` | `string` | Obrigatório | Nome do produto |
| `price` | `number` | Obrigatório, Min: 0 | Preço de venda |
| `stock` | `number` | Obrigatório, Min: 0 | Quantidade em estoque |

**Campos Opcionais:**

| Campo | Tipo | Validação | Descrição | Default |
|-------|------|-----------|-----------|---------|
| `costPrice` | `number` | Opcional, Min: 0 | Preço de custo | `null` |
| `unit` | `string` | Opcional | Unidade (ex: "unidade", "ml", "g") | `"unidade"` |
| `category` | `string` | Opcional | Categoria do produto | `null` |
| `description` | `string` | Opcional | Descrição do produto | `null` |
| `formulation` | `string` | Opcional | Formulação/Ingredientes | `null` |
| `howToUse` | `string` | Opcional | Instruções de uso | `null` |
| `recommendedFor` | `string` | Opcional | Para quem é recomendado | `null` |
| `image` | `string` | Opcional | URL da imagem (base64 ou URL) | `null` |
| `active` | `boolean` | Opcional | Produto ativo/inativo | `true` |

**Exemplo de Payload (TypeScript/JavaScript):**

```typescript
// Criar produto simples
const payload = {
  name: "Pomada Modeladora",
  price: 45.90,
  stock: 50,
  category: "Finalizadores",
  description: "Pomada para modelagem com fixação média",
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  active: true
};

const response = await fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const product = await response.json();
```

**Criar produto completo com todos os campos:**

```typescript
const payload = {
  // Obrigatórios
  name: "Pomada Modeladora Premium",
  price: 89.90,
  stock: 30,
  
  // Opcionais - Informações básicas
  costPrice: 45.00,
  unit: "unidade",
  category: "Finalizadores",
  description: "Pomada de alta performance para modelagem profissional",
  
  // Opcionais - Informações detalhadas
  formulation: "Cera de abelha, óleo de argan, vitamina E, fragrância masculina",
  howToUse: "Aplicar pequena quantidade no cabelo úmido ou seco. Modelar conforme desejado.",
  recommendedFor: "Todos os tipos de cabelo. Ideal para penteados estruturados.",
  
  // Opcionais - Visual e status
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  active: true
};

const response = await fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

**Response (201 Created):**

```json
{
  "id": "uuid-do-produto",
  "shopId": "uuid-da-barbearia",
  "name": "Pomada Modeladora Premium",
  "price": 89.90,
  "stock": 30,
  "costPrice": 45.00,
  "unit": "unidade",
  "category": "Finalizadores",
  "description": "Pomada de alta performance para modelagem profissional",
  "formulation": "Cera de abelha, óleo de argan...",
  "howToUse": "Aplicar pequena quantidade...",
  "recommendedFor": "Todos os tipos de cabelo...",
  "image": "data:image/jpeg;base64,...",
  "active": true,
  "featured": false,
  "createdAt": "2026-02-05T10:00:00.000Z",
  "updatedAt": "2026-02-05T10:00:00.000Z"
}
```

---

### ✏️ PATCH `/api/products/:id` - Editar Produto

**Todos os campos são opcionais** (enviar apenas os que deseja alterar):

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `name` | `string` | Opcional | Nome do produto |
| `price` | `number` | Opcional, Min: 0 | Preço de venda |
| `stock` | `number` | Opcional, Min: 0 | Quantidade em estoque |
| `costPrice` | `number` | Opcional, Min: 0 | Preço de custo |
| `unit` | `string` | Opcional | Unidade |
| `category` | `string` | Opcional | Categoria |
| `description` | `string` | Opcional | Descrição |
| `formulation` | `string` | Opcional | Formulação |
| `howToUse` | `string` | Opcional | Instruções de uso |
| `recommendedFor` | `string` | Opcional | Recomendação |
| `image` | `string` | Opcional | URL da imagem |
| `active` | `boolean` | Opcional | Ativo/Inativo |

**Exemplo de Payload:**

```typescript
// Atualizar apenas preço e estoque
const payload = {
  price: 79.90,
  stock: 45
};

await fetch(`http://localhost:3000/api/products/${productId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

**Atualizar imagem:**

```typescript
const payload = {
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
};

await fetch(`http://localhost:3000/api/products/${productId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

---

## 🖼️ Trabalhando com Imagens

### Formato Base64 (Recomendado para Upload)

```typescript
// Converter File para Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Uso no React/Next.js
const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const base64 = await fileToBase64(file);
    setFormData({ ...formData, image: base64 });
  }
};
```

### Tamanho Máximo

- **Limite do Backend:** 10MB
- **Recomendado:** Comprimir imagens para ~500KB-1MB antes do upload
- **Formato:** JPEG, PNG, WebP, GIF

### Compressão no Frontend (Opcional)

```typescript
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  const compressedFile = await imageCompression(file, options);
  return fileToBase64(compressedFile);
};
```

---

## 🎯 Interfaces TypeScript para Frontend

### Serviços

```typescript
// Interface para criar serviço
export interface CreateServicePayload {
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
  image?: string;
  active?: boolean;
}

// Interface para editar serviço
export interface UpdateServicePayload {
  name?: string;
  duration?: number;
  price?: number;
  category?: string;
  description?: string;
  active?: boolean;
  featured?: boolean;
}

// Interface de resposta do backend
export interface Service {
  id: string;
  shopId: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description: string | null;
  image: string | null;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Produtos

```typescript
// Interface para criar produto
export interface CreateProductPayload {
  // Obrigatórios
  name: string;
  price: number;
  stock: number;
  
  // Opcionais
  costPrice?: number;
  unit?: string;
  category?: string;
  description?: string;
  formulation?: string;
  howToUse?: string;
  recommendedFor?: string;
  image?: string;
  active?: boolean;
}

// Interface para editar produto
export interface UpdateProductPayload {
  name?: string;
  price?: number;
  stock?: number;
  costPrice?: number;
  unit?: string;
  category?: string;
  description?: string;
  formulation?: string;
  howToUse?: string;
  recommendedFor?: string;
  image?: string;
  active?: boolean;
}

// Interface de resposta do backend
export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  stock: number;
  costPrice: number | null;
  unit: string;
  category: string | null;
  description: string | null;
  formulation: string | null;
  howToUse: string | null;
  recommendedFor: string | null;
  image: string | null;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🛡️ Validações e Erros

### Erros Comuns

**400 Bad Request - Validação Falhou:**

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a number conforming to the specified constraints",
    "duration must not be less than 1"
  ],
  "error": "Bad Request"
}
```

**401 Unauthorized - Token Inválido:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden - Sem Permissão:**

```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar este recurso"
}
```

**413 Payload Too Large - Imagem Muito Grande:**

```json
{
  "statusCode": 413,
  "message": "request entity too large"
}
```

**Solução:** Comprimir imagem antes do upload (limite: 10MB)

---

## 📋 Exemplo Completo React/Next.js

### Formulário de Serviço

```typescript
import { useState } from 'react';

interface ServiceFormData {
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
  image?: string;
  active: boolean;
}

export default function ServiceForm() {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    duration: 30,
    price: 0,
    category: '',
    description: '',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('http://localhost:3000/api/services', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const service = await response.json();
      console.log('Serviço criado:', service);
    } else {
      const error = await response.json();
      console.error('Erro:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome do serviço"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Duração (minutos)"
        value={formData.duration}
        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
        required
      />
      <input
        type="number"
        placeholder="Preço"
        step="0.01"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        required
      />
      <input
        type="text"
        placeholder="Categoria"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        required
      />
      <button type="submit">Criar Serviço</button>
    </form>
  );
}
```

### Formulário de Produto

```typescript
import { useState } from 'react';

interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  category?: string;
  description?: string;
  image?: string;
  active: boolean;
}

export default function ProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    description: '',
    active: true
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const product = await response.json();
      console.log('Produto criado:', product);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome do produto"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Preço"
        step="0.01"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        required
      />
      <input
        type="number"
        placeholder="Estoque"
        value={formData.stock}
        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <button type="submit">Criar Produto</button>
    </form>
  );
}
```

---

## 🔗 Links Úteis

- **Swagger UI:** http://localhost:3000/api/docs
- **Endpoints:**
  - Serviços: `/api/services`
  - Produtos: `/api/products`
- **Documentação Técnica:**
  - [Schema Prisma](../prisma/schema.prisma)
  - [Services DTOs](../src/services/dto/)
  - [Products DTOs](../src/products/dto/)

---

**Última Atualização:** 05/02/2026
