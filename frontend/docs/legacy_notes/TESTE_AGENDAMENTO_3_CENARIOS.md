# Teste de Agendamento - 3 Cenários (CLIENT, BARBER, ADMIN)

## Contexto
Cliente novo vai à barbearia e precisa adicionar um agendamento em 3 cenários diferentes baseado em seu perfil.

---

## IDs Reais do Banco (Seed)

```
Cliente ID:  b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f
Barbeiro ID: e82b9c39-a4b4-49af-b537-0f0d5704cd35
Serviço ID:  556c5374-2a70-48b2-9a42-98c7a4371777
Shop ID:     f95101f7-ab85-46d2-bb1e-c300c49ad095
```

---

## Data/Hora do Agendamento

Use uma data futura. Exemplo:
```
2026-02-26T17:00:00.000Z  (amanhã às 17:00)
```

---

## CENÁRIO 1: CLIENTE FAZ SEU PRÓPRIO AGENDAMENTO

### 1️⃣ Login como CLIENT

**Requisição:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "cliente@test.com",
  "password": "senha123"
}
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "45b90b65-4ba8-49e7-87d0-bdd092c00cca",
    "email": "cliente@test.com",
    "role": "CLIENT"
  }
}
```

**👉 Copiar o `accessToken` para usar no próximo passo**

---

### 2️⃣ Cliente agenda para si mesmo

**Requisição:**
```http
POST http://localhost:3000/api/appointments
Authorization: Bearer {SEU_ACCESS_TOKEN_AQUI}
Content-Type: application/json

{
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "serviceIds": ["556c5374-2a70-48b2-9a42-98c7a4371777"],
  "date": "2026-02-26T17:00:00.000Z",
  "notes": "Cliente novo - primeira visita"
}
```

**⚠️ IMPORTANTE:** 
- CLIENT NÃO envia `clientId` no body
- Backend infere automaticamente do JWT (`token.sub`)

**Resposta esperada (201):**
```json
{
  "id": "uuid-agendamento",
  "clientId": "45b90b65-4ba8-49e7-87d0-bdd092c00cca",
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "date": "2026-02-26T17:00:00.000Z",
  "status": "SCHEDULED",
  "createdAt": "2026-02-24T..."
}
```

---

## CENÁRIO 2: BARBEIRO AGENDA PARA O CLIENTE

### 1️⃣ Login como BARBER

**Requisição:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "barber@test.com",
  "password": "senha123"
}
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid-barbeiro",
    "email": "barber@test.com",
    "role": "BARBER"
  }
}
```

**👉 Copiar o `accessToken`**

---

### 2️⃣ Barbeiro agenda para o cliente

**Requisição:**
```http
POST http://localhost:3000/api/appointments
Authorization: Bearer {BARBER_TOKEN_AQUI}
Content-Type: application/json

{
  "clientId": "b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f",
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "serviceIds": ["556c5374-2a70-48b2-9a42-98c7a4371777"],
  "date": "2026-02-26T17:00:00.000Z",
  "notes": "Agendado pelo barbeiro para cliente novo"
}
```

**⚠️ IMPORTANTE:**
- BARBER pode enviar `clientId` no body
- Backend valida se corresponde ao vínculo real do barbeiro
- Se BARBER enviar ID de outro cliente que não está vinculado a ele → 403 Forbidden

**Resposta esperada (201):**
```json
{
  "id": "uuid-agendamento",
  "clientId": "b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f",
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "date": "2026-02-26T17:00:00.000Z",
  "status": "SCHEDULED"
}
```

---

## CENÁRIO 3: ADMIN AGENDA PARA O CLIENTE

### 1️⃣ Login como ADMIN

**Requisição:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "senha123"
}
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid-admin",
    "email": "admin@test.com",
    "role": "ADMIN"
  }
}
```

**👉 Copiar o `accessToken`**

---

### 2️⃣ Admin agenda para o cliente

**Requisição:**
```http
POST http://localhost:3000/api/appointments
Authorization: Bearer {ADMIN_TOKEN_AQUI}
Content-Type: application/json

{
  "clientId": "b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f",
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "serviceIds": ["556c5374-2a70-48b2-9a42-98c7a4371777"],
  "date": "2026-02-26T17:00:00.000Z",
  "notes": "Agendado pelo admin para cliente novo"
}
```

**⚠️ IMPORTANTE:**
- ADMIN deve obrigatoriamente enviar `clientId` E `barberId`
- ADMIN pode agendar para qualquer cliente/barbeiro do tenant
- Sem `clientId` ou `barberId` → 400 Bad Request

**Resposta esperada (201):**
```json
{
  "id": "uuid-agendamento",
  "clientId": "b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f",
  "barberId": "e82b9c39-a4b4-49af-b537-0f0d5704cd35",
  "date": "2026-02-26T17:00:00.000Z",
  "status": "SCHEDULED"
}
```

---

## Erros Esperados

### 403 Forbidden - Vínculo de Identidade
```json
{
  "statusCode": 403,
  "message": "CLIENT so pode agendar para si promo" 
  // ou
  "message": "BARBER so pode agendar para si promo"
  // ou  
  "message": "Cliente autenticado nao esta vinculado a este tenant"
}
```

**Quando ocorre:**
- CLIENT tenta agendar para outro cliente
- BARBER tenta agendar para outro barbeiro
- Usuário não está vinculado ao perfil (userId -> clientId/barberId)

---

### 400 Bad Request - Validação de Dados
```json
{
  "statusCode": 400,
  "message": "Data no passado",
  // ou
  "message": "Barbeiro inativo",
  // ou
  "message": "Fora do horario de funcionamento",
  // ou
  "message": "ADMIN deve informar clientId e barberId"
}
```

**Quando ocorre:**
- Data/hora inválida ou no passado
- Barbeiro inativo ou não encontrado
- Fora do horário da barbearia
- IDs não existem ou não pertencem ao mesmo tenant

---

## Checklist de Teste

- [ ] Cenário 1: CLIENT agenda para si (sem enviar clientId) → 201
- [ ] Cenário 2: BARBER agenda para cliente (com clientId) → 201
- [ ] Cenário 3: ADMIN agenda para cliente (com clientId + barberId) → 201
- [ ] Erro 403: CLIENT tenta agendar para outro cliente → 403
- [ ] Erro 403: BARBER tenta agendar para outro barbeiro → 403
- [ ] Erro 400: Qualquer cenário com data no passado → 400
- [ ] Erro 400: ADMIN sem enviar clientId → 400

---

## Dicas do Insomnia/Postman

### Usar variáveis de ambiente

1. Criar variável: `access_token`
2. Após login, extrair token e copiar para `access_token`
3. Usar em posteriores requests: `Authorization: Bearer {{ access_token }}`

### Ou usar Scripts (Postman/Insomnia)

**Pre-request script:**
```javascript
// Pré-preenchimento automático de data
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
pm.environment.set('appointment_date', tomorrow.toISOString());
```

**Post-response script:**
```javascript
// Extrair token automaticamente após login
const response = pm.response.json();
if (response.accessToken) {
  pm.environment.set('access_token', response.accessToken);
}
```

---

## Resumo da Lógica de Segurança

| Role | clientId | barberId | Deve enviar | Backend valida |
|------|----------|----------|-----------|----------------|
| CLIENT | ❌ Omitir | ✅ Sim | Apenas `barberId, serviceIds, date` | Força clientId do JWT |
| BARBER | ✅ Enviar | ✅ Sim | `clientId, barberId, serviceIds, date` | Valida vínculo do barbeiro |
| ADMIN | ✅ Enviar | ✅ Enviar | `clientId, barberId, serviceIds, date` | Sem validações de vínculo |

---

**Data:** 24-02-2026  
**Status:** Pronto para testar  
**IDs validados:** backend@wellx2 confirmou
