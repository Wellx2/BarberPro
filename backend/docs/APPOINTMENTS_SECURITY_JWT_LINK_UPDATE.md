# Atualização de Segurança - Agendamentos (JWT + Vínculo Forte de Identidade)

## Objetivo
Endurecer o `POST /api/appointments` para impedir impersonação entre usuários em ambiente **SaaS multi-tenant**.

---

## O que foi corrigido no backend

### 1) Vínculo forte entre `User` e perfis de domínio
Foram adicionados vínculos explícitos no banco:

- `clients.userId -> users.id`
- `barbers.userId -> users.id`

Com constraints de unicidade e foreign keys.

### 2) Backfill de dados existentes
Migration aplicada para tentar vincular registros legados por regra segura:

- mesmo `shopId`
- `role` compatível (`CLIENT` ou `BARBER`)
- match por `email` ou `phone`
- seleção determinística para evitar colisões

Migration aplicada:
- `prisma/migrations/20260224120000_link_users_to_clients_and_barbers/migration.sql`

### 3) Agendamento passou a usar identidade do JWT por perfil
No `POST /api/appointments`:

- `CLIENT`: sempre agenda para o próprio `client` vinculado ao `request.user.id`
- `BARBER`: sempre agenda para o próprio `barber` vinculado ao `request.user.id`
- `ADMIN`/`SUPER_ADMIN`: continuam podendo informar `clientId` e `barberId` no body

### 4) Hardening adicional de tenant
No create de agendamento, serviços/produtos agora são validados com:

- `shopId` do usuário autenticado
- status ativo
- soft-delete respeitado (`deletedAt: null` onde aplicável)

### 5) Compatibilidade para novos cadastros
Ao criar `Client` e `Barber`, o backend tenta vincular automaticamente um `User` existente do mesmo tenant/role por email/telefone (sem sobrescrever vínculo já existente).

---

## Impacto para o Frontend

## Endpoint
- `POST /api/appointments`

## Payload atualizado
`clientId` e `barberId` agora são **condicionais por role**:

- `CLIENT`: `clientId` opcional (ignorado se vier diferente do vínculo do JWT)
- `BARBER`: `barberId` opcional (ignorado se vier diferente do vínculo do JWT)
- `ADMIN`/`SUPER_ADMIN`: `clientId` e `barberId` obrigatórios

Exemplo recomendado (funciona para todos; para CLIENT/BARBER o backend valida/normaliza):

```json
{
  "clientId": "uuid-client",
  "barberId": "uuid-barber",
  "serviceIds": ["uuid-service"],
  "date": "2026-02-25T17:00:00.000Z",
  "notes": "Opcional",
  "products": [
    { "id": "uuid-product", "quantity": 1 }
  ]
}
```

---

## Novos cenários de erro esperados

### 403 Forbidden
- `CLIENT` tentando agendar para outro cliente
- `BARBER` tentando agendar para outro barbeiro
- usuário sem vínculo `userId` válido no tenant

Mensagens típicas:
- `CLIENT só pode agendar para si próprio`
- `BARBER só pode agendar para si próprio`
- `Cliente autenticado não está vinculado a este tenant`
- `Barbeiro autenticado não está vinculado a este tenant`

### 400 Bad Request
- `ADMIN/SUPER_ADMIN` sem `clientId` ou `barberId`
- data inválida/passada
- fora do expediente
- serviço/produto inválido para tenant

---

## Ajustes recomendados no frontend

1. Para sessão `CLIENT`:
   - pode parar de forçar escolha de cliente no formulário (usar perfil logado)

2. Para sessão `BARBER`:
   - pode fixar barbeiro no usuário logado

3. Para sessão `ADMIN`:
   - manter seleção explícita de cliente e barbeiro

4. Tratar erros 403 de vínculo com mensagem de ação:
   - “Seu usuário não está vinculado ao perfil de cliente/barbeiro nesta barbearia. Contate o administrador.”

---

## Arquivos alterados

- `prisma/schema.prisma`
- `prisma/migrations/20260224120000_link_users_to_clients_and_barbers/migration.sql`
- `src/appointments/appointments.service.ts`
- `src/appointments/dto/create-appointment.dto.ts`
- `src/clients/clients.service.ts`
- `src/barbers/barbers.service.ts`

---

## Observação de segurança

Esta abordagem reduz risco de impersonação via body (`clientId`/`barberId`) e fortalece isolamento multi-tenant ao atrelar operações sensíveis ao contexto real do usuário autenticado (`JWT.sub`).
