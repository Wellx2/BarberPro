# BarberPro Backend - Copilot Instructions

## Arquitetura Geral

Backend SaaS multi-tenant para gestão de barbearias desenvolvido com **NestJS + Prisma + PostgreSQL**. Utiliza arquitetura modular por domínio (barbershops, barbers, services, clients, appointments) com isolamento de dados por tenant (shopId).

### Stack Principal
- **Framework**: NestJS 10 com TypeScript (strict mode)
- **ORM**: Prisma 5 com PostgreSQL
- **Auth**: JWT (access + refresh tokens) via Passport
- **Validação**: class-validator + class-transformer

## Multi-Tenancy e Segurança

### Padrão de Isolamento de Tenant
**CRÍTICO**: Todo acesso a dados DEVE validar `shopId` do usuário autenticado.

```typescript
// Sempre aplicar em Services:
async findAll(requester: any) {
  if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
  return this.prisma.barber.findMany({
    where: { shopId: requester.shopId } // Filtro obrigatório
  });
}
```

### Guards Obrigatórios (na ordem)
Controllers aplicam tripla camada de proteção:
```typescript
@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard) // Ordem importa
export class BarbersController {
  @Post()
  @Roles(UserRole.ADMIN) // Autorização granular
  create(@CurrentUser() user: any, @Body() dto: CreateBarberDto) {}
}
```

1. **JwtAuthGuard**: Valida token e injeta `request.user`
2. **RolesGuard**: Valida permissões por enum `UserRole` (SUPER_ADMIN, ADMIN, BARBER, CLIENT)
3. **TenantGuard**: Valida `user.shopId` e injeta `request.shopId`

### Hierarquia de Roles
- `SUPER_ADMIN`: Acesso cross-tenant (bypass TenantGuard)
- `ADMIN`: Gestão completa do próprio shop
- `BARBER`: Edição de perfil próprio + visualização de agendamentos
- `CLIENT`: Acesso público limitado

## Convenções de Desenvolvimento

### Estrutura de Módulos
Cada domínio segue:
```
module-name/
├── module-name.module.ts      # Imports: PrismaModule, JwtModule
├── module-name.controller.ts  # Guards + @Roles
├── module-name.service.ts     # Lógica de negócio + tenant validation
└── dto/                       # Validação com class-validator
    ├── create-*.dto.ts
    ├── update-*.dto.ts
    └── disable-*.dto.ts       # Soft delete padrão
```

### Soft Delete Padrão
Nunca deletar fisicamente registros. Usar flag `active: boolean`:
```typescript
async remove(requester: any, id: string, dto: RemoveBarberDto) {
  await this.prisma.barber.update({ where: { id }, data: { active: false } });
  await this.logAction('REMOVE', id, requester.id, requester.shopId, dto.reason);
}
```

### Auditoria Obrigatória
Services devem logar ações críticas (CREATE, UPDATE, DISABLE, REMOVE) via `AuditLog`:
```typescript
private async logAction(action: string, entityId: string, userId: string, shopId: string, details?: string) {
  await this.prisma.auditLog.create({
    data: { action, entity: 'Barber', entityId, userId, shopId, details }
  });
}
```

## Prisma e Database

### Comandos Essenciais
```bash
npm run prisma:migrate      # Cria migration e aplica
npm run prisma:generate     # Regenera Prisma Client após alterar schema
```

### Enums Tipados
Sempre importar do Prisma Client:
```typescript
import { UserRole, AppointmentStatus } from '@prisma/client';
```

### Relações e Naming
- Tabelas: snake_case (via `@@map("table_name")`)
- Campos: camelCase no schema
- Sempre indexar `shopId`: `@@index([shopId])`
- Relações muitos-para-muitos via tabelas intermediárias explícitas (ex: `AppointmentService`)

## Workflows de Desenvolvimento

### Ambiente Local
```bash
# Setup inicial
npm install --legacy-peer-deps
docker-compose up -d           # Inicia PostgreSQL
npm run prisma:migrate         # Aplica migrations
npm run start:dev              # Dev server na porta 3000
```

### Cadastro Multi-Tenant
Endpoint `POST /auth/register-shop` cria atomicamente:
1. Barbershop (tenant)
2. User com role ADMIN vinculado ao shop
3. Retorna tokens JWT

### Variáveis de Ambiente
Requeridas em `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barberpro"
JWT_SECRET="seu-secret-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui"
```

## Padrões de Response

### DTOs de Saída
Usar `@Exclude()` do class-transformer para remover campos sensíveis:
```typescript
// Em auth.service.ts: nunca retornar passwordHash
return {
  shop,
  user: { ...user, passwordHash: undefined },
  accessToken,
  refreshToken
};
```

### Tratamento de Erros
Preferir exceptions específicas do NestJS:
- `NotFoundException`: Entidade não encontrada
- `ForbiddenException`: Violação de tenant/permissão
- `BadRequestException`: Validação de DTO falhou
- `UnauthorizedException`: Falha de autenticação

## Exemplos de Implementação

### Criar Novo Endpoint com Multi-Tenancy
1. Adicionar rota no controller com guards
2. No service, injetar `requester: any` (vem de `@CurrentUser()`)
3. Validar `requester.shopId` antes de queries
4. Filtrar Prisma queries com `where: { shopId: requester.shopId }`
5. Logar ação em `AuditLog` se aplicável

### Adicionar Nova Entidade Prisma
1. Definir model no `schema.prisma` com `shopId String` e `@@index([shopId])`
2. Adicionar relação `Barbershop` via `@relation(fields: [shopId], references: [id])`
3. Executar `npm run prisma:migrate`
4. Criar módulo NestJS seguindo estrutura padrão
5. Aplicar guards e validação de tenant em todos os endpoints

## Links Importantes
- [Schema Prisma completo](prisma/schema.prisma)
- [Auth Service (exemplo de registro multi-tenant)](src/auth/auth.service.ts)
- [Barbers Service (exemplo de tenant validation)](src/barbers/barbers.service.ts)
- [TenantGuard implementation](src/common/guards/tenant.guard.ts)
