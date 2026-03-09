# 🔒 Agendamentos - Update de Segurança (Frontend)

## Resumo da mudança
O backend agora **vincula identidade pelo JWT**, não mais por `clientId`/`barberId` no body.

`CLIENT` → sempre seu próprio cliente | `BARBER` → sempre seu próprio barbeiro | `ADMIN` → passa explícito

---

## Payloads por Role

### 👤 CLIENT (Agenda para si mesmo)
```json
POST /api/appointments
Authorization: Bearer {accessToken}

{
  "serviceIds": ["uuid-servico"],
  "date": "2026-02-25T17:00:00.000Z",
  "notes": "Opcional"
}
```
✅ Backend ignora/valida `clientId` se vier; sempre usa o vinculado ao JWT

---

### 💈 BARBER (Agenda para si mesmo)
```json
POST /api/appointments
Authorization: Bearer {accessToken}

{
  "clientId": "uuid-cliente",
  "serviceIds": ["uuid-servico"],
  "date": "2026-02-25T17:00:00.000Z"
}
```
✅ Backend ignora/valida `barberId` se vier; sempre usa o vinculado ao JWT

---

### 👑 ADMIN / SUPER_ADMIN (Passa explícito)
```json
POST /api/appointments
Authorization: Bearer {accessToken}

{
  "clientId": "uuid-cliente",
  "barberId": "uuid-barbeiro",
  "serviceIds": ["uuid-servico"],
  "date": "2026-02-25T17:00:00.000Z",
  "notes": "Opcional",
  "products": [
    { "id": "uuid-produto", "quantity": 1 }
  ]
}
```
✅ Obrigatório informar `clientId` e `barberId`

---

## Erros esperados

| Status | Mensagem | Quando | Ação |
|--------|----------|--------|------|
| **403** | `CLIENT só pode agendar para si próprio` | CLIENT tentando `clientId` diferente | Remover `clientId` ou deixar vazio |
| **403** | `BARBER só pode agendar para si próprio` | BARBER tentando `barberId` diferente | Remover `barberId` ou deixar vazio |
| **403** | `Cliente autenticado não está vinculado a este tenant` | CLIENT sem vínculo `userId` no banco | Contatar admin da barbearia |
| **403** | `Barbeiro autenticado não está vinculado a este tenant` | BARBER sem vínculo `userId` no banco | Contatar admin da barbearia |
| **400** | `clientId e barberId são obrigatórios para este perfil` | ADMIN sem passar um dos dois | Adicionar `clientId` e `barberId` no corpo |
| **400** | `Não é possível agendar para data/hora passada` | `date` anterior ao horário atual | Escolher data/hora futura |
| **400** | `Horário fora do expediente. Funcionamento: HH:MM - HH:MM` | Agendamento fora do expediente | Respeitar horário da barbearia |
| **404** | `Cliente não encontrado` | `clientId` inválido/outro tenant | Validar UUID do cliente |
| **404** | `Barbeiro indisponível` | `barberId` inválido/inativo/outro tenant | Validar UUID do barbeiro |
| **404** | `Um ou mais serviços não encontrados/ativos para esta barbearia` | `serviceIds` inválidos/inativos/outro tenant | Validar UUIDs de serviços |
| **409** | `Horário conflita com agendamento existente` | Barbeiro ocupado no horário | Sugerir outro horário |

---

## Ajustes rápidos no frontend

### CLIENT
- Parar de exigir seleção de cliente (sempre usa o do JWT)
- Apenas seleção de serviço + data/hora

### BARBER
- Parar de exigir seleção de barbeiro (sempre usa o do JWT)
- Apenas seleção de cliente + serviço + data/hora

### ADMIN
- Manter seleção explícita de cliente e barbeiro (obrigatório)

---

## Teste rápido (Postman/cURL)

```bash
# 1. Login CLIENT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "roberto@email.com", "password": "senha123"}'

# Copiar accessToken da resposta

# 2. Agendar (CLIENT - sem clientId)
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceIds": ["556c5374-2a70-48b2-9a42-98c7a4371777"],
    "date": "2026-02-25T17:00:00.000Z",
    "notes": "Teste CLIENT"
  }'
```

---

## Matriz de compatibilidade

| Cenário | Payload | Resultado |
|---------|---------|-----------|
| CLIENT sem `clientId` | ✅ válido | 201 Created |
| CLIENT com `clientId` = seu | ✅ válido | 201 Created |
| CLIENT com `clientId` ≠ seu | ❌ erro 403 | Rejected |
| BARBER sem `barberId` | ✅ válido | 201 Created |
| BARBER com `barberId` = seu | ✅ válido | 201 Created |
| BARBER com `barberId` ≠ seu | ❌ erro 403 | Rejected |
| ADMIN sem `clientId` | ❌ erro 400 | Rejected |
| ADMIN sem `barberId` | ❌ erro 400 | Rejected |
| ADMIN com ambos | ✅ válido | 201 Created |

---

## Links úteis

- [Documentação completa](./APPOINTMENTS_SECURITY_JWT_LINK_UPDATE.md)
- [DTO do backend](../../src/appointments/dto/create-appointment.dto.ts)
- [Lógica de validação](../../src/appointments/appointments.service.ts)
