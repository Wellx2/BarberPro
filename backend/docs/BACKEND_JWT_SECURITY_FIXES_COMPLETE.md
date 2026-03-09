# ✅ Correções Aplicadas - Vínculo JWT Backend

## Resumo

O frontend reportou erro **403 Forbidden** para BARBER agendamentos devido à ausência de vínculo `User -> Barber/Client` no banco de dados. Implementadas as seguintes correções:

---

## 1. Schema Prisma - Vínculos Adicionados ✅

**Arquivo:** [`prisma/schema.prisma`](../prisma/schema.prisma)

Adicionadas relações 1:1 entre `User` e `Client/Barber`:

```prisma
model User {
  clientProfile  Client?  @relation("UserClientProfile")
  barberProfile  Barber?  @relation("UserBarberProfile")
}

model Client {
  userId  String?  @unique
  user    User?    @relation("UserClientProfile", fields: [userId], references: [id])
  @@index([userId])
}

model Barber {
  userId  String?  @unique
  user    User?    @relation("UserBarberProfile", fields: [userId], references: [id])
  @@index([userId])
}
```

---

## 2. Migration Aplicada ✅

**Arquivo:** [`prisma/migrations/20260224120000_link_users_to_clients_and_barbers/migration.sql`](../prisma/migrations/20260224120000_link_users_to_clients_and_barbers/migration.sql)

- Adicionadas colunas `userId` em `Client` e `Barber`
- Backfill automático de dados legados por match determinístico (email + phone + shopId + role)
- Índices únicos e foreign  keys com `ON DELETE SET NULL`

---

## 3. Seed.ts - Vínculos Automáticos ✅

**Arquivo:** [`prisma/seed.ts`](../prisma/seed.ts)

Adicionada seção para criar vínculos ao criar Barbeiros e Clientes:

```typescript
// 🔗 VINCULAR USERS A BARBEIROS (JWT Link)
const userBarber1 = await prisma.user.findUnique({
  where: { email: 'joao@barberpro.com' }
});
await prisma.barber.update({
  where: { id: barber1.id },
  data: { userId: userBarber1.id }
});

// 🔗 VINCULAR USERS A CLIENTES (JWT Link)
const userClientRoberto = await prisma.user.findUnique({
  where: { email: 'roberto@email.com' }
});
await prisma.client.update({
  where: { id: client1.id },
  data: { userId: userClientRoberto.id }
});
```

**Output do seed:**
```
🔗 Vinculando Users aos Barbeiros...
✅ Barbeiro João vinculado ao User
✅ Barbeiro Pedro vinculado ao User
✅ Cabeleireira Marina vinculada ao User
✅ Manicure Juliana vinculada ao User
✅ Recepcionista Carla vinculada ao User
✅ Caixa Roberto vinculado ao User

🔗 Vinculando Users aos Clientes...
✅ Cliente Roberto vinculado ao User
✅ Cliente Lucas vinculado ao User
✅ Cliente Fernando vinculado ao User
```

---

## 4. AppointmentsService - Lógica de Resolução ✅

**Arquivo:** [`src/appointments/appointments.service.ts`](../src/appointments/appointments.service.ts)

### Métodos Privados Criados:

```typescript
private async resolveRequesterClient(requester: any) {
  return this.prisma.client.findFirst({
    where: {
      shopId: requester.shopId,
      userId: requester.id,  // Vínculo forte via JWT
      active: true
    }
  });
}

private async resolveRequesterBarber(requester: any) {
  return this.prisma.barber.findFirst({
    where: {
      shopId: requester.shopId,
      userId: requester.id,  // Vínculo forte via JWT
      active: true
    }
  });
}
```

### Lógica por Role:

**CLIENT:**
```typescript
if (requester.role === UserRole.CLIENT) {
  const requesterClient = await this.resolveRequesterClient(requester);
  if (!requesterClient) {
    throw new ForbiddenException('Cliente autenticado não está vinculado a este tenant');
  }
  if (dto.clientId && dto.clientId !== requesterClient.id) {
    throw new ForbiddenException('CLIENT só pode agendar para si próprio');
  }
  effectiveClientId = requesterClient.id;  // Auto-link
}
```

**BARBER:**
```typescript
if (requester.role === UserRole.BARBER) {
  const requesterBarber = await this.resolveRequesterBarber(requester);
  if (!requesterBarber) {
    throw new ForbiddenException('Barbeiro autenticado não está vinculado a este tenant');
  }
  if (dto.barberId && dto.barberId !== requesterBarber.id) {
    throw new ForbiddenException('BARBER só pode agendar para si próprio');
  }
  effectiveBarberId = requesterBarber.id;  // Auto-link
  
  // BARBER precisa informar clientId
  if (!effectiveClientId) {
    throw new BadRequestException('clientId é obrigatório para BARBER');
  }
}
```

**ADMIN/SUPER_ADMIN:**
```typescript
if (requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN) {
  if (!effectiveClientId || !effectiveBarberId) {
    throw new BadRequestException('clientId e barberId são obrigatórios para ADMIN');
  }
}
```

---

## 5. DTOs Atualizados ✅

**Arquivo:** [`src/appointments/dto/create-appointment.dto.ts`](../src/appointments/dto/create-appointment.dto.ts)

```typescript
// clientId e barberId agora opcionais (auto-link por JWT)
@ApiPropertyOptional({ description: 'ID do cliente (obrigatório para ADMIN/SUPER_ADMIN)' })
@IsOptional()
@IsUUID()
clientId?: string;

@ApiPropertyOptional({ description: 'ID do barbeiro (obrigatório para ADMIN/SUPER_ADMIN)' })
@IsOptional()
@IsUUID()
barberId?: string;
```

---

## 6. Auto-Link em ClientsService e BarbersService ✅

**Arquivos:** 
- [`src/clients/clients.service.ts`](../src/clients/clients.service.ts)
- [`src/barbers/barbers.service.ts`](../src/barbers/barbers.service.ts)

Adicionada lógica de auto-link ao criar novos clientes/barbeiros:

```typescript
async create(requester: any, dto: CreateClientDto) {
  let linkedUserId: string | undefined;
  
  if (dto.email || dto.phone) {
    const candidateUser = await this.prisma.user.findFirst({
      where: {
        shopId: requester.shopId,
        role: UserRole.CLIENT,
        OR: [
          dto.email ? { email: dto.email } : null,
          dto.phone ? { phone: dto.phone } : null
        ].filter(Boolean)
      }
    });
    
    if (candidateUser) {
      const alreadyLinked = await this.prisma.client.findFirst({
        where: { userId: candidateUser.id }
      });
      
      if (!alreadyLinked) {
        linkedUserId = candidateUser.id;
      }
    }
  }
  
  const client = await this.prisma.client.create({
    data: { ...dto, userId: linkedUserId }
  });
}
```

---

## 7. Validação de Build ✅

```bash
# Sem erros de compilação
No errors found
```

Validados arquivos:
- ✅ `src/appointments/appointments.service.ts`
- ✅ `src/appointments/dto/create-appointment.dto.ts`
- ✅ `src/clients/clients.service.ts`
- ✅ `src/barbers/barbers.service.ts`
- ✅ `prisma/seed.ts`

---

## 8. Banco de Dados Resetado ✅

```bash
npx prisma migrate reset --force
```

**Resultado:**
- ✅ 12 migrations aplicadas
- ✅ Seed executado com sucesso
- ✅ Vínculos User->Client/Barber criados
- ✅ 2 Barbearias com plano PREMIUM
- ✅ 22 Usuários (1 Super Admin + 2 Admins + membros da equipe + clientes)
- ✅ 11 Membros da Equipe (barbeiros, cabeleireiras, manicure, recepcionistas, caixa, faxineiro)
- ✅ 46 Serviços
- ✅ 15 Produtos
- ✅ 15 Clientes
- ✅ 42 Agendamentos

---

## 9. Credenciais de Teste 🔐

```
Super Admin: superadmin@barberpro.com / senha123
Admin Shop 1: admin@barberpro.com / senha123
Barbeiro João: joao@barberpro.com / senha123
Barbeiro Pedro: pedro@barberpro.com / senha123
Cliente Roberto: roberto@email.com / senha123
```

---

## 10. IDs Reais para Testes 🆔

### Clientes (Shop 1):
- Roberto Santos: `7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5`
- Lucas Oliveira: `dbc6b75c-6dba-412e-8cbb-8251b6b60e98`
- Fernando Costa: `f77f55f4-e4ae-44af-9667-ded5869be39c`

### Barbeiros (Shop 1):
- João Barbeiro: `acc34c94-2161-4613-ba0e-9458e95c1ee2`
- Pedro Navalheiro: `4a545354-629e-490f-af24-6644ad4e6481`
- Marina Costa: `e1578e65-afcc-4bb2-bb9c-8fe3958d8965`

### Serviços (Shop 1):
- Barba Completa (35 reais): `14471c86-9444-43aa-ba23-2eeeee1e067e`

---

## 11. Próximos Passos para o Frontend 📋

1. **Re-testar os 3 cenários:**
   - ✅ CLIENT agendando sem `clientId`
   - ✅ BARBER agendando com `clientId`
   - ✅ ADMIN agendando com `clientId` + `barberId`

2. **Usar IDs corretos nos testes:**
   - Substituir IDs do documento `TEST_RESULTS_SUMMARY.md` pelos IDs acima

3. **Ajustar UI por Role:**
   - CLIENT: remover seleção de cliente (sempre usa JWT)
   - BARBER: remover seleção de barbeiro (sempre usa JWT)
   - ADMIN: manter seleção explícita de ambos

4. **Tratamento de Erros:**
   - 403: "Cliente autenticado não está vinculado a este tenant" → Contatar admin
   - 403: "Barbeiro autenticado não vinculado isto a este tenant" → Contatar admin
   - 400: "clientId é obrigatório para BARBER" → Adicionar clientId
   - 400: "clientId e barberId são obrigatórios para ADMIN" → Adicionar ambos

---

## 12. Documentação Relacionada 📚

- [APPOINTMENTS_SECURITY_JWT_LINK_UPDATE.md](./APPOINTMENTS_SECURITY_JWT_LINK_UPDATE.md) - Análise técnica completa
- [APPOINTMENTS_JWT_FRONTEND_SUMMARY.md](./APPOINTMENTS_JWT_FRONTEND_SUMMARY.md) - Resumo executivo com payloads

---

## Status Final ✅

- ✅ Schema Prisma atualizado
- ✅ Migration aplicada
- ✅ Seed.ts com vínculos automáticos
- ✅ AppointmentsService refatorado
- ✅ ClientsService com auto-link
- ✅ BarbersService com auto-link
- ✅ DTOs atualizados
- ✅ Build sem erros
- ✅ Banco de dados resetado e populado

**O backend está pronto para receber requisições do frontend com a nova segurança JWT-driven!** 🚀
