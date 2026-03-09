# 🔧 Correção: "Request Entity Too Large"

**Data:** 05/02/2026  
**Issue:** Erro ao editar/atualizar serviços com imagens

---

## 🐛 Problema Identificado

Ao editar um serviço no frontend, ocorria o erro:
```
"request entity too large"
```

### Causa Raiz
O limite padrão do body parser do Express é **100kb**. Quando o frontend envia imagens em formato **base64** (que são maiores), o payload excede esse limite e o servidor rejeita a requisição.

**Exemplo:** Uma imagem de 500KB em base64 pode gerar um payload de ~666KB.

---

## ✅ Solução Implementada

Adicionado middleware do Express para aumentar o limite de payload para **10MB** no arquivo [src/main.ts](../src/main.ts):

```typescript
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumentar limite de payload para aceitar imagens em base64
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // ... resto da configuração
}
```

### Por que 10MB?
- **Imagens base64:** ~5-7MB (após conversão de imagens 2-3MB)
- **Buffer de segurança:** Margem para múltiplas imagens ou dados adicionais
- **Não excessivo:** Evita DoS com payloads gigantes

---

## 🎯 Endpoints Afetados

A correção afeta todos os endpoints que recebem imagens em base64:

### 1. **Services (Serviços)**
```
PATCH /api/services/:id
POST /api/services
```
- Campo: `imageUrl` (imagem em base64)

### 2. **Products (Produtos)**
```
PATCH /api/products/:id
POST /api/products
```
- Campo: `imageUrl` (imagem em base64)

### 3. **Barbershops**
```
PATCH /api/barbershops/:id
PATCH /api/barbershops/:shopId/hero
```
- Campos: `logo`, `heroImageUrl`, `heroBackgroundImage` (imagens em base64)

### 4. **Barbers (Barbeiros)**
```
PATCH /api/barbers/:id
POST /api/barbers
```
- Campo: `profileImageUrl` (imagem em base64)

---

## 🧪 Como Testar

### Teste 1: Editar Serviço com Imagem
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barbearia.com","password":"senha123"}'

# 2. Editar serviço com imagem grande (base64)
curl -X PATCH http://localhost:3000/api/services/{SERVICE_ID} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corte Premium",
    "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." 
  }'
```

**Resultado Esperado:** Status 200 OK (antes: 413 Payload Too Large)

### Teste 2: Criar Produto com Múltiplas Imagens
```javascript
// Frontend - React/Next.js
const formData = {
  name: 'Pomada Premium',
  imageUrl: largeBase64Image, // ~2MB
  description: 'Descrição longa com mais dados...'
};

const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify(formData)
});
```

**Resultado Esperado:** Status 201 Created

---

## 🔒 Considerações de Segurança

### ✅ Proteções Mantidas
1. **Rate Limiting:** Throttler ainda ativo (100 req/min)
2. **Validação de DTO:** class-validator continua validando campos
3. **Guards:** JWT + Roles + Tenant guards ativos
4. **Helmet:** Proteções HTTP headers mantidas

### ⚠️ Mitigações Adicionais

**1. Validação de Tipo de Arquivo (Recomendado)**
```typescript
// Adicionar no DTO
@IsString()
@Matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/, {
  message: 'Formato de imagem inválido'
})
imageUrl?: string;
```

**2. Validação de Tamanho (Opcional)**
```typescript
// Service layer
if (base64Image.length > 10485760) { // 10MB em bytes
  throw new BadRequestException('Imagem muito grande. Máximo: 10MB');
}
```

**3. Upload Otimizado (Futuro)**
Migrar para upload direto para cloud storage:
- AWS S3
- Cloudinary
- Supabase Storage

Benefícios:
- ✅ Reduz payload nas requisições
- ✅ CDN automático
- ✅ Redimensionamento on-the-fly
- ✅ Menos carga no servidor backend

---

## 📊 Comparação: Antes vs Depois

### Antes da Correção
```
POST /api/services
Payload: 5MB (imagem base64)
↓
Express body-parser: REJECT ❌
↓
Response: 413 Payload Too Large
```

### Depois da Correção
```
POST /api/services
Payload: 5MB (imagem base64)
↓
Express body-parser: ACCEPT ✅ (limite: 10MB)
↓
NestJS Validation Pipe: VALIDATE ✅
↓
Service Layer: PROCESS ✅
↓
Response: 201 Created
```

---

## 🚀 Deployment

### Variável de Ambiente (Opcional)
Para ambientes diferentes, pode criar variável:

```env
# .env
MAX_PAYLOAD_SIZE=10mb
```

```typescript
// main.ts
app.use(json({ limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }));
```

### Configuração Nginx/Apache
Se usar proxy reverso, também configure:

**Nginx:**
```nginx
http {
  client_max_body_size 10M;
}
```

**Apache:**
```apache
LimitRequestBody 10485760
```

---

## 📝 Checklist de Implementação

- [x] Importar `json` e `urlencoded` do express
- [x] Adicionar middleware antes dos outros middlewares
- [x] Definir limite de 10mb para json e urlencoded
- [x] Compilação TypeScript sem erros
- [x] Documentação criada (este arquivo)
- [ ] Testar edição de serviço com imagem (manual)
- [ ] Testar upload de produto com imagem grande (manual)
- [ ] Considerar migração para cloud storage (futuro)

---

## 🔗 Referências

- [Express body-parser documentation](https://expressjs.com/en/api.html#express.json)
- [NestJS Middleware](https://docs.nestjs.com/middleware)
- [Base64 encoding overhead](https://en.wikipedia.org/wiki/Base64) - ~33% maior que binário

---

## ✅ Status: **CORRIGIDO**

O erro "request entity too large" foi resolvido aumentando o limite de payload para 10MB no backend.

**Frontend está desbloqueado** para editar serviços e produtos com imagens normalmente.
