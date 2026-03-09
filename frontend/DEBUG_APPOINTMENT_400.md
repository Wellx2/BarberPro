# 🐛 DEBUG - Erro 400 ao Criar Agendamento

## 📋 Erro Atual
```
POST http://localhost:3000/api/appointments 400 (Bad Request)
❌ Erro HTTP: {status: 400, endpoint: '/appointments', error: {...}}
```

---

## 🔍 Como Investigar

### 1. **Verificar Swagger (Documentação do Backend)**

Abra: http://localhost:3000/api/docs

Procure pelo endpoint: **POST /api/appointments**

**Informações importantes a verificar:**

#### A. **Nome dos campos esperados**
```json
{
  "barberId": "string",      // ✅ Correto?
  "serviceIds": ["string"],  // ✅ Correto?
  "date": "string"           // ⚠️ Ou seria "scheduledFor"?
}
```

#### B. **Formato da data**
- ISO 8601: `"2026-02-18T10:30:00.000Z"` ✅
- Timestamp: `1708248600000` ❌
- String simples: `"2026-02-18 10:30"` ❌

#### C. **Campos obrigatórios**
Verifique se há campos marcados como `required` que não estamos enviando:
- ❓ `clientId` - (deveria ser inferido do JWT)
- ❓ `shopId` ou `barbershopId` - (deveria ser inferido do JWT)
- ❓ `duration` - duração total em minutos
- ❓ `totalPrice` - preço total dos serviços

---

## 🔧 Possíveis Soluções

### **Solução 1: Campo 'date' vs 'scheduledFor'**

O backend pode estar esperando `scheduledFor` ao invés de `date`.

**Teste no Postman/Insomnia:**
```json
{
  "barberId": "1fd1f0a7-24e3-4904-ad09-a1c233951672",
  "serviceIds": ["service-id-1", "service-id-2"],
  "scheduledFor": "2026-02-18T10:30:00.000Z"
}
```

Se funcionar, precisamos alterar no frontend.

---

### **Solução 2: Campos Adicionais Obrigatórios**

O backend pode exigir campos que não estamos enviando.

**Teste com campos extras:**
```json
{
  "barberId": "1fd1f0a7-24e3-4904-ad09-a1c233951672",
  "serviceIds": ["service-id-1"],
  "date": "2026-02-18T10:30:00.000Z",
  "duration": 30,
  "totalPrice": 80.00
}
```

---

### **Solução 3: JWT não contém shopId ou clientId**

Verifique o token JWT decodificado.

**No console do navegador:**
```javascript
// Copiar o token
const token = localStorage.getItem('accessToken');

// Decodificar (base64)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
```

**Verificar se contém:**
```json
{
  "sub": "user-id",           // ✅ ID do usuário
  "shopId": "shop-id",        // ⚠️ IMPORTANTE
  "role": "CLIENT",
  "email": "user@email.com"
}
```

Se `shopId` não estiver no JWT, o backend não consegue inferir a barbearia.

---

## 🧪 Teste Manual no Postman

### **Request:**
```
POST http://localhost:3000/api/appointments
```

### **Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

### **Body (JSON):**
```json
{
  "barberId": "1fd1f0a7-24e3-4904-ad09-a1c233951672",
  "serviceIds": ["4e3b7d9a-1234-5678-90ab-cdef12345678"],
  "date": "2026-02-18T10:30:00.000Z"
}
```

**Teste variações:**
1. Trocar `date` por `scheduledFor`
2. Adicionar `clientId` explicitamente
3. Adicionar `duration` e `totalPrice`

---

## 📊 Informações para o Backend

Se o backend espera campos diferentes, forneça estas informações:

**O que o frontend envia:**
```json
{
  "barberId": "uuid",
  "serviceIds": ["uuid", "uuid"],
  "date": "2026-02-18T10:30:00.000Z"
}
```

**O que o backend espera:** _(preencher após verificar Swagger)_
```json
{
  // Copiar do Swagger aqui
}
```

---

## ✅ Após Descobrir o Problema

Me informe qual foi a causa:

1. **Nome do campo diferente**: date → scheduledFor
2. **Campos obrigatórios faltando**: duration, totalPrice, etc.
3. **Formato de data incorreto**: ISO 8601 → outro formato
4. **JWT sem shopId**: backend não consegue inferir
5. **Outro problema**: descrever

---

## 🔄 Logs Atualizados

Após as alterações, você verá logs mais detalhados:

```
📅 Criando agendamento: { barberId, serviceIds, date }
📋 Payload completo: { JSON completo }
❌ Erro completo: { erro com todos os detalhes }
```

Esses logs vão ajudar a identificar exatamente o que está errado.

---

**Data:** 18/02/2026  
**Status:** 🔴 Aguardando verificação do Swagger
