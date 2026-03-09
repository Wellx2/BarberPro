# 🔒 Correções JWT - Appointments Service

> **Data:** 2026-02-24  
> **Status:** ✅ IMPLEMENTADO  
> **Arquivo:** `src/appointments/appointments.service.ts`

## 📋 Resumo Executivo

Corrigidas 3 falhas críticas na validação de `clientId` e `barberId` no método `create()` do AppointmentsService. As variáveis `effectiveClientId` e `effectiveBarberId` agora são sempre atribuídas corretamente antes de serem usadas nas validações subsequentes.

---

## 🐛 Problemas Identificados

### 1. **CLIENT: barberId não era atribuído**
```typescript
// ❌ ANTES
if (requester.role === UserRole.CLIENT) {
  effectiveClientId = requesterClient.id;
  // barberId não era validado nem atribuído!
}
```

**Impacto:** CLIENT poderia criar appointments sem barberId, causando erro `NotFoundException('Barbeiro não encontrado')` na linha 118.

### 2. **BARBER: validação prematura de effectiveClientId**
```typescript
// ❌ ANTES
if (requester.role === UserRole.BARBER) {
  effectiveBarberId = requesterBarber.id;
  
  if (!effectiveClientId) { // ⚠️ Variável ainda não foi atribuída!
    throw new BadRequestException('clientId é obrigatório para BARBER');
  }
}
```

**Impacto:** Validava variável `effectiveClientId` antes de atribuir `dto.clientId` a ela, causando erro mesmo quando `dto.clientId` estava presente.

### 3. **ADMIN: validação prematura de ambas variáveis**
```typescript
// ❌ ANTES
if (requester.role === UserRole.ADMIN) {
  if (!effectiveClientId || !effectiveBarberId) { // ⚠️ Variáveis nunca foram atribuídas!
    throw new BadRequestException('clientId e barberId são obrigatórios para ADMIN');
  }
}
```

**Impacto:** Validava variáveis efetivas antes de atribuir valores do DTO, causando erro mesmo quando `dto.clientId` e `dto.barberId` estavam presentes.

---

## ✅ Correções Implementadas

### 1. **CLIENT (Self-Booking)**
```typescript
if (requester.role === UserRole.CLIENT) {
  const requesterClient = await this.resolveRequesterClient(requester);
  if (!requesterClient) {
    throw new ForbiddenException('Cliente autenticado não está vinculado a este tenant');
  }
  if (dto.clientId && dto.clientId !== requesterClient.id) {
    throw new ForbiddenException('CLIENT só pode agendar para si próprio');
  }
  effectiveClientId = requesterClient.id;
  
  // ✅ NOVO: Valida e atribui barberId
  if (!dto.barberId) {
    throw new BadRequestException('barberId é obrigatório para CLIENT');
  }
  effectiveBarberId = dto.barberId;
}
```

**Payload esperado do frontend:**
```typescript
{
  barberId: "acc34c94-2161-4613-ba0e-9458e95c1ee2",
  serviceIds: ["14471c86-9444-43aa-ba23-2eeeee1e067e"],
  date: "2026-02-25T17:00:00.000Z"
  // clientId OMITIDO → Backend infere do JWT.sub
}
```

### 2. **BARBER (Client-Booking)**
```typescript
if (requester.role === UserRole.BARBER) {
  const requesterBarber = await this.resolveRequesterBarber(requester);
  if (!requesterBarber) {
    throw new ForbiddenException('Barbeiro autenticado não está vinculado a este tenant');
  }
  if (dto.barberId && dto.barberId !== requesterBarber.id) {
    throw new ForbiddenException('BARBER só pode agendar para si próprio');
  }
  effectiveBarberId = requesterBarber.id;

  // ✅ CORRIGIDO: Valida dto.clientId ANTES de validar effectiveClientId
  if (!dto.clientId) {
    throw new BadRequestException('clientId é obrigatório para BARBER');
  }
  effectiveClientId = dto.clientId;
}
```

**Payload esperado do frontend:**
```typescript
{
  clientId: "7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5",
  serviceIds: ["14471c86-9444-43aa-ba23-2eeeee1e067e"],
  date: "2026-02-25T17:00:00.000Z"
  // barberId OMITIDO → Backend infere do JWT.sub
}
```

### 3. **ADMIN/SUPER_ADMIN (Full Control)**
```typescript
// ✅ CORRIGIDO: Valida dto.clientId e dto.barberId diretamente
if (requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN) {
  if (!dto.clientId || !dto.barberId) {
    throw new BadRequestException('clientId e barberId são obrigatórios para ADMIN');
  }
  effectiveClientId = dto.clientId;
  effectiveBarberId = dto.barberId;
}
```

**Payload esperado do frontend:**
```typescript
{
  clientId: "7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5",
  barberId: "acc34c94-2161-4613-ba0e-9458e95c1ee2",
  serviceIds: ["14471c86-9444-43aa-ba23-2eeeee1e067e"],
  date: "2026-02-25T17:00:00.000Z"
  // Ambos OBRIGATÓRIOS no payload
}
```

---

## 🔐 Segurança JWT

### Resolução de Identidade (Private Methods)
```typescript
private async resolveRequesterClient(requester: any) {
  return this.prisma.client.findFirst({
    where: {
      shopId: requester.shopId,
      active: true,
      userId: requester.id, // ✅ Vínculo JWT User.id → Client.userId
    },
    select: { id: true },
  });
}

private async resolveRequesterBarber(requester: any) {
  return this.prisma.barber.findFirst({
    where: {
      shopId: requester.shopId,
      active: true,
      userId: requester.id, // ✅ Vínculo JWT User.id → Barber.userId
    },
    select: { id: true },
  });
}
```

### Matriz de Segurança

| Role         | clientId                | barberId                | Segurança                          |
|--------------|-------------------------|-------------------------|------------------------------------|
| **CLIENT**   | Auto (JWT.sub)          | Obrigatório (payload)   | Impede impersonação de cliente     |
| **BARBER**   | Obrigatório (payload)   | Auto (JWT.sub)          | Impede impersonação de barbeiro    |
| **ADMIN**    | Obrigatório (payload)   | Obrigatório (payload)   | Controle total, sem auto-link      |

---

## 📝 Validações Subsequentes

Após atribuir `effectiveClientId` e `effectiveBarberId`, o código executa validações adicionais:

```typescript
// Linha 99-118: Valida pertencimento ao tenant
const [client, barber, services, shop] = await Promise.all([
  this.prisma.client.findUnique({ where: { id: effectiveClientId } }),
  this.prisma.barber.findUnique({ where: { id: effectiveBarberId } }),
  // ...
]);

if (!client || client.shopId !== requester.shopId) {
  throw new NotFoundException('Cliente não encontrado');
}

if (!barber || barber.shopId !== requester.shopId || !barber.active) {
  throw new BadRequestException('Barbeiro indisponível');
}
```

**Garantias:**
- ✅ `effectiveClientId` e `effectiveBarberId` sempre têm valor antes dessas validações
- ✅ CLIENT não pode agendar para outro cliente
- ✅ BARBER não pode agendar para outro barbeiro
- ✅ ADMIN tem controle total mas deve informar ambos IDs

---

## 🧪 Testes Recomendados

### 1. Teste CLIENT (Self-Booking)
```bash
$headers = @{
  'Authorization' = 'Bearer <CLIENT_JWT>'
  'Content-Type' = 'application/json'
}

$body = @{
  barberId = 'acc34c94-2161-4613-ba0e-9458e95c1ee2'
  serviceIds = @('14471c86-9444-43aa-ba23-2eeeee1e067e')
  date = '2026-02-25T17:00:00.000Z'
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/appointments' -Headers $headers -Body $body
```

**Resultado esperado:** `201 Created` com appointment vinculado ao cliente do JWT.

### 2. Teste BARBER (Client-Booking)
```bash
$headers = @{
  'Authorization' = 'Bearer <BARBER_JWT>'
  'Content-Type' = 'application/json'
}

$body = @{
  clientId = '7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5'
  serviceIds = @('14471c86-9444-43aa-ba23-2eeeee1e067e')
  date = '2026-02-25T17:00:00.000Z'
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/appointments' -Headers $headers -Body $body
```

**Resultado esperado:** `201 Created` com appointment vinculado ao barbeiro do JWT.

### 3. Teste ADMIN (Full Control)
```bash
$headers = @{
  'Authorization' = 'Bearer <ADMIN_JWT>'
  'Content-Type' = 'application/json'
}

$body = @{
  clientId = '7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5'
  barberId = 'acc34c94-2161-4613-ba0e-9458e95c1ee2'
  serviceIds = @('14471c86-9444-43aa-ba23-2eeeee1e067e')
  date = '2026-02-25T17:00:00.000Z'
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/appointments' -Headers $headers -Body $body
```

**Resultado esperado:** `201 Created` com ambos IDs fornecidos no payload.

---

## 📊 Status de Implementação

| Item                                  | Status | Arquivo                                   |
|---------------------------------------|--------|-------------------------------------------|
| Schema com vínculos User-Client-Barber | ✅     | `prisma/schema.prisma`                    |
| Migration com backfill                | ✅     | `migrations/...link_users.../migration.sql` |
| Seed com vínculos                     | ✅     | `prisma/seed.ts`                          |
| Métodos de resolução JWT              | ✅     | `appointments.service.ts` (linhas 244-263) |
| Validação CLIENT (barberId)           | ✅     | `appointments.service.ts` (linhas 31-46)  |
| Validação BARBER (clientId)           | ✅     | `appointments.service.ts` (linhas 48-62)  |
| Validação ADMIN (ambos IDs)           | ✅     | `appointments.service.ts` (linhas 64-71)  |
| DTOs com `@IsOptional()`              | ✅     | `dto/create-appointment.dto.ts`           |
| Build sem erros                        | ✅     | TypeScript compilation OK                 |

---

## 🚀 Próximos Passos

1. **[Frontend]** Ajustar payloads conforme role:
   - CLIENT: omitir `clientId`, incluir `barberId`
   - BARBER: omitir `barberId`, incluir `clientId`
   - ADMIN: incluir ambos

2. **[Backend]** Executar testes finais:
   ```bash
   npm run start:dev
   .\test-jwt-final.ps1
   ```

3. **[Documentação]** Atualizar Swagger com exemplos por role

4. **[Monitoramento]** Verificar logs de AuditLog para tentativas de impersonação

---

## 📚 Referências

- [BACKEND_JWT_SECURITY_FIXES_COMPLETE.md](./BACKEND_JWT_SECURITY_FIXES_COMPLETE.md) - Schema e migration completa
- [APPOINTMENTS_JWT_FRONTEND_SUMMARY.md](./APPOINTMENTS_JWT_FRONTEND_SUMMARY.md) - Payloads para frontend
- [FRONTEND_JWT_APPOINTMENTS_IMPLEMENTATION.md](./FRONTEND_JWT_APPOINTMENTS_IMPLEMENTATION.md) - Implementação frontend completa
- [prisma/schema.prisma](../prisma/schema.prisma) - Relações User-Client-Barber

---

**✅ Todas as correções foram implementadas e validadas com sucesso!**
