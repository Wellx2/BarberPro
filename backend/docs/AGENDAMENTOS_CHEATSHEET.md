# 📝 Cheatsheet - API de Agendamentos

## 🔗 Endpoint Base
```
POST http://localhost:3000/api/appointments
```

---

## 🔑 Headers
```javascript
{
  "Authorization": "Bearer SEU_TOKEN_JWT",
  "Content-Type": "application/json"
}
```

---

## 📦 Body Mínimo (Obrigatório)

```json
{
  "clientId": "uuid-do-cliente",
  "barberId": "uuid-do-barbeiro",
  "serviceIds": ["uuid-servico-1", "uuid-servico-2"],
  "date": "2026-02-20T14:30:00.000Z"
}
```

---

## 📦 Body Completo (com Produtos)

```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "barberId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "serviceIds": [
    "9a2e1234-5678-90ab-cdef-123456789012",
    "1b3c4567-89de-0123-4567-89abcdef0123"
  ],
  "date": "2026-02-20T14:30:00.000Z",
  "products": [
    {
      "id": "8d4f5a6b-7c8e-9d0a-1b2c-3d4e5f6a7b8c",
      "quantity": 2
    }
  ]
}
```

---

## ✅ Validações

| Campo | Tipo | Regras |
|-------|------|--------|
| `clientId` | string | Obrigatório, UUID válido |
| `barberId` | string | Obrigatório, UUID válido |
| `serviceIds` | array | Obrigatório, mínimo 1 item, todos UUIDs |
| `date` | string | Obrigatório, formato ISO 8601 |
| `products` | array | Opcional |
| `products[].id` | string | UUID válido |
| `products[].quantity` | number | Mínimo: 1 |

---

## 📅 Formato de Data ISO 8601

```javascript
// ✅ CORRETO
"2026-02-20T14:30:00.000Z"

// ❌ ERRADO
"20/02/2026"
"2026-02-20 14:30"
"20-02-2026T14:30:00"
```

### Como Formatar:
```javascript
// Opção 1
new Date('2026-02-20T14:30:00').toISOString()

// Opção 2
const data = new Date(2026, 1, 20, 14, 30); // mês é 0-indexado
data.toISOString()
```

---

## 🚨 Erros Comuns

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["clientId must be a UUID"],
  "error": "Bad Request"
}
```
**Causa**: Campo obrigatório ausente ou formato inválido

---

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Cliente não encontrado"
}
```
**Causa**: Cliente/Barbeiro/Serviço não existe ou pertence a outro shop

---

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Horário indisponível - conflito com outro agendamento"
}
```
**Causa**: Barbeiro já tem agendamento nesse horário

---

### 400 Horário Fora do Expediente
```json
{
  "statusCode": 400,
  "message": "Horário fora do expediente (09:00 - 18:00)"
}
```
**Causa**: Agendamento ultrapassa horário de funcionamento

---

## 📋 Outros Endpoints

### Listar Agendamentos
```
GET /api/appointments
GET /api/appointments?date=2026-02-20T00:00:00.000Z
GET /api/appointments?barberId=uuid&status=SCHEDULED
```

### Buscar Por ID
```
GET /api/appointments/:id
```

### Cancelar
```
PATCH /api/appointments/:id/cancel
Body: { "cancelReason": "Motivo" }
```

### Completar (Admin/Barber)
```
PATCH /api/appointments/:id/complete
```

---

## 🎯 Exemplo Fetch Completo

```javascript
const token = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'uuid-cliente',
    barberId: 'uuid-barbeiro',
    serviceIds: ['uuid-servico'],
    date: new Date('2026-02-20T14:30:00').toISOString()
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Erro:', error.message);
} else {
  const agendamento = await response.json();
  console.log('Sucesso:', agendamento);
}
```

---

## 🎯 Exemplo Axios

```javascript
import axios from 'axios';

const token = localStorage.getItem('accessToken');

try {
  const { data } = await axios.post(
    'http://localhost:3000/api/appointments',
    {
      clientId: 'uuid-cliente',
      barberId: 'uuid-barbeiro',
      serviceIds: ['uuid-servico'],
      date: new Date('2026-02-20T14:30:00').toISOString()
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  console.log('Agendamento criado:', data);
} catch (error) {
  console.error('Erro:', error.response?.data?.message);
}
```

---

## 📊 Status de Agendamento

| Status | Descrição |
|--------|-----------|
| `SCHEDULED` | Agendado (padrão) |
| `COMPLETED` | Completado |
| `CANCELLED` | Cancelado pelo cliente |
| `CANCELLED_BY_BARBER` | Cancelado pelo barbeiro |
| `NO_SHOW` | Cliente não compareceu |

---

## 🛠️ Buscar Dados Necessários

### Barbeiros
```
GET /api/barbers
```

### Serviços
```
GET /api/services
```

### Clientes
```
GET /api/clients
```

### Produtos
```
GET /api/products
```

### Barbearia (Horários)
```
GET /api/barbershops/my-shop
```

---

## 🔒 Autenticação

### Login
```
POST /api/auth/login
Body: { "email": "user@email.com", "password": "senha" }
Response: { "accessToken": "...", "refreshToken": "..." }
```

### Salvar Token
```javascript
const { accessToken, refreshToken } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Usar Token
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
}
```

---

## ⚡ Quick Test (Console)

```javascript
// Cole no console do navegador após login

const token = localStorage.getItem('accessToken');

fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'COLE_UUID_CLIENTE',
    barberId: 'COLE_UUID_BARBEIRO',
    serviceIds: ['COLE_UUID_SERVICO'],
    date: new Date('2026-02-20T14:30:00').toISOString()
  })
})
.then(r => r.json())
.then(d => console.log('Resultado:', d))
.catch(e => console.error('Erro:', e));
```

---

## 📖 Links Úteis

- **Guia Completo**: [FRONTEND_APPOINTMENTS_GUIDE.md](./FRONTEND_APPOINTMENTS_GUIDE.md)
- **Quick Start**: [FRONTEND_QUICK_START.md](./FRONTEND_QUICK_START.md)
- **Swagger Docs**: http://localhost:3000/api/docs
- **API Técnica**: [APPOINTMENTS_API.md](./APPOINTMENTS_API.md)

---

**Última atualização**: 18/02/2026
