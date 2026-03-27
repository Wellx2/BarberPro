# KlypBarber Backend - Copilot Instructions

## Arquitetura Geral

Backend SaaS multi-tenant para gestão completa de barbearias desenvolvido com **NestJS + Prisma + PostgreSQL**. Utiliza arquitetura modular por domínio com isolamento de dados por tenant (shopId).

### Stack Principal
- **Framework**: NestJS 10 com TypeScript (strict mode)
- **ORM**: Prisma 5 com PostgreSQL 16
- **Auth**: JWT (access + refresh tokens) via Passport
- **Validação**: class-validator + class-transformer
- **API Docs**: Swagger/OpenAPI integrado
- **Segurança**: Helmet + CORS + Rate Limiting (Throttler)

### Módulos Principais
**Negócio Core**: Auth, Barbershops, Users, Barbers, Services, Products, Clients, Appointments, BlockedTimes, Plans, Invoices, Reviews

**Sistema Financeiro** (implementado completamente):
- `ServiceOrdersModule` - Comandas/Ordens de serviço com itens
- `CommissionsModule` - Configuração flexível de comissões por barbeiro
- `ExpensesModule` - Controle de custos operacionais
- `FinancialReportsModule` - Relatórios consolidados e analytics
- `DailyCashFlow` - Consolidação automática diária (gerado via triggers)

## Multi-Tenancy e Segurança

### Padrão de Isolamento de Tenant
**CRÍTICO**: Todo acesso a dados DEVE validar `shopId` do usuário autenticado.

```typescript
// Sempre aplicar em Services:
async findAll(requester: any) {
  if (!requester.shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');
  return this.prisma.barber.findMany({
    where: { shopId: requester.shopId } // Filtro obrigatório
  });
}
```

### Guards Obrigatórios (na ordem)
Controllers aplicam tripla camada de proteção:
```typescript
@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard) // Ordem importa!
@ApiTags('barbers')
export class BarbersController {
  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateBarberDto) {}
}
```

1. **JwtAuthGuard**: Valida token JWT e injeta `request.user`
2. **RolesGuard**: Valida permissões por enum `UserRole` (@Roles decorator)
3. **TenantGuard**: Valida `user.shopId` e injeta `request.shopId` (bypass para SUPER_ADMIN)

### Hierarquia de Roles (UserRole enum)
- `SUPER_ADMIN`: Acesso cross-tenant (bypass TenantGuard)
- `ADMIN`: Gestão completa do próprio shop
- `BARBER`: Edição de perfil próprio + visualização de agendamentos
- `CLIENT`: Acesso público limitado (visualização de shops/serviços)

## Convenções de Desenvolvimento

### Estrutura de Módulos
Cada domínio segue padrão NestJS:
```
module-name/
├── module-name.module.ts      # Imports: PrismaModule, JwtModule
├── module-name.controller.ts  # Guards + @Roles + @ApiTags
├── module-name.service.ts     # Lógica de negócio + tenant validation
└── dto/                       # Validação com class-validator
    ├── create-*.dto.ts
    ├── update-*.dto.ts
    └── disable-*.dto.ts       # Soft delete padrão
```

### DTOs e Validação
Usar decorators do `class-validator`:
```typescript
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```
ValidationPipe global já configurado em [main.ts](src/main.ts) com `whitelist: true` e `forbidNonWhitelisted: true`.

### Soft Delete Padrão
**Nunca deletar fisicamente** registros. Usar flag `active: boolean`:
```typescript
async remove(requester: any, id: string, dto: RemoveBarberDto) {
  await this.prisma.barber.update({ 
    where: { id, shopId: requester.shopId }, 
    data: { active: false } 
  });
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

### Tratamento de Erros
Preferir exceptions específicas do NestJS:
- `NotFoundException`: Entidade não encontrada
- `ForbiddenException`: Violação de tenant/permissão
- `BadRequestException`: Validação de DTO falhou
- `UnauthorizedException`: Falha de autenticação

Exception filter global configurado: [AllExceptionsFilter](src/common/filters/all-exceptions.filter.ts)

### DTOs de Saída e Dados Sensíveis
Usar `@Exclude()` do class-transformer para remover campos sensíveis. Interceptor global já aplicado: [SanitizeResponseInterceptor](src/common/interceptors/sanitize-response.interceptor.ts)
```typescript
// Nunca retornar passwordHash, refreshToken
return { ...user, passwordHash: undefined, refreshToken: undefined };
```


## Prisma e Database

### Comandos Essenciais
```bash
npm run prisma:migrate      # Cria migration e aplica no DB
npm run prisma:generate     # Regenera Prisma Client após alterar schema
```

### Enums Tipados
Sempre importar do Prisma Client:
```typescript
import { UserRole, AppointmentStatus, OrderStatus, OrderItemType } from '@prisma/client';
```

### Relações e Naming
- Tabelas: snake_case (via `@@map("table_name")`)
- Campos: camelCase no schema
- Sempre indexar `shopId`: `@@index([shopId])`
- Relações muitos-para-muitos via tabelas intermediárias explícitas (ex: `AppointmentService`)

### Padrão de Queries com Multi-Tenancy
```typescript
// Sempre filtrar por shopId
await this.prisma.barber.findMany({
  where: { shopId: requester.shopId, active: true },
  include: { shop: true }
});

// Validar ownership em updates/deletes
const barber = await this.prisma.barber.findFirst({
  where: { id, shopId: requester.shopId }
});
if (!barber) throw new NotFoundException('Barbeiro não encontrado');
```

## Sistema Financeiro

### Arquitetura do Financial System
Sistema completo implementado conforme [FINANCIAL_SYSTEM.md](docs/FINANCIAL_SYSTEM.md) e [COMMISSIONS_SYSTEM.md](docs/COMMISSIONS_SYSTEM.md).

**Fluxo de Comanda:**
```
Cliente chega → Cria ServiceOrder (OPEN) 
→ Adiciona items (SERVICE, PRODUCT, EXTRA) via OrderItem
→ Inicia atendimento (IN_PROGRESS)
→ Finaliza com CompleteServiceOrderDto (COMPLETED)
→ Calcula comissões automaticamente via CommissionsService
→ Atualiza DailyCashFlow (trigger automático)
```

**Modelos de Trabalho (BarberWorkModel):**
- `CHAIR_RENT`: Barbeiro paga aluguel fixo mensal (`chairRentalFee`)
- `SALARY`: Salário fixo sem comissões (`monthlySalary`)
- `SALARY_COMMISSION`: Salário + comissões configuráveis
- `COMMISSION_ONLY`: Apenas comissões (padrão)

**Tipos de Comissão (CommissionType):**
- `PERCENTAGE`: Porcentagem sobre valor (ex: 40%)
- `FIXED`: Valor fixo por serviço (ex: R$ 10,00)
- `TIERED`: Escalonado por metas (`minTarget`, `maxTarget`)

### Serviços Financeiros Principais
Ver implementações em:
- [ServiceOrdersService](src/service-orders/service-orders.service.ts) - Gestão de comandas
- [CommissionsService](src/commissions/commissions.service.ts) - Cálculo de comissões
- [ExpensesService](src/expenses/expenses.service.ts) - Controle de custos
- [FinancialReportsService](src/financial-reports/financial-reports.service.ts) - Analytics

### Cálculo Automático de Comissões
`CommissionsService.calculateCommission()` aplica hierarquia:
1. Comissão específica (serviceId/productId definido)
2. Comissão padrão (serviceId/productId = null)
3. Considera flags `applyOnServices`, `applyOnProducts`, `active`
4. Retorna valor calculado baseado no tipo (PERCENTAGE, FIXED, TIERED)


## Workflows de Desenvolvimento

### Ambiente Local
```bash
# Setup inicial
npm install --legacy-peer-deps
docker-compose up -d           # Inicia PostgreSQL na porta 5432
npm run prisma:migrate         # Aplica migrations
npm run start:dev              # Dev server na porta 3000
```

### Cadastro Multi-Tenant
Endpoint `POST /auth/register-shop` cria atomicamente:
1. Barbershop (tenant)
2. User com role ADMIN vinculado ao shop
3. Retorna tokens JWT (accessToken + refreshToken)

Implementação: [AuthService.registerShop()](src/auth/auth.service.ts)

### Variáveis de Ambiente
Requeridas em `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/KlypBarber"
JWT_SECRET="seu-secret-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui"
FRONTEND_URL="http://localhost:3000"  # Para CORS
```

### Configuração Global (main.ts)
- ValidationPipe: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- AllExceptionsFilter: Tratamento global de erros
- SanitizeResponseInterceptor: Remove campos sensíveis (passwordHash, refreshToken)
- Helmet: Segurança HTTP
- ThrottlerGuard: Rate limiting (100 req/min via APP_GUARD)
- Swagger: Disponível em `/api` (DocumentBuilder com Bearer Auth)

## Padrões de Response e Erros

### DTOs de Saída
Sempre remover campos sensíveis em Services:
```typescript
// Em auth.service.ts: nunca retornar passwordHash
return {
  shop,
  user: { ...user, passwordHash: undefined, refreshToken: undefined },
  accessToken,
  refreshToken
};
```

### Tratamento de Erros
Exception filter global captura todas as exceptions. Usar exceptions específicas:
- `NotFoundException`: Entidade não encontrada (404)
- `ForbiddenException`: Violação de tenant/permissão (403)
- `BadRequestException`: Validação de DTO falhou (400)
- `UnauthorizedException`: Falha de autenticação (401)

## Exemplos de Implementação

### Criar Novo Endpoint com Multi-Tenancy
1. Adicionar rota no controller com guards:
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(UserRole.ADMIN, UserRole.BARBER)
findAll(@CurrentUser() user: any) {
  return this.service.findAll(user);
}
```

2. No service, validar tenant antes de queries:
```typescript
async findAll(requester: any) {
  if (!requester.shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');
  
  return this.prisma.entity.findMany({
    where: { shopId: requester.shopId, active: true }
  });
}
```

3. Logar ação em `AuditLog` se aplicável (CREATE, UPDATE, DELETE)

### Adicionar Nova Entidade Prisma
1. Definir model no `schema.prisma` com `shopId String` e `@@index([shopId])`
2. Adicionar relação `Barbershop` via `@relation(fields: [shopId], references: [id])`
3. Executar `npm run prisma:migrate`
4. Criar módulo NestJS seguindo estrutura padrão:
   - Module (imports: PrismaModule, JwtModule.register)
   - Controller (guards + @ApiTags)
   - Service (tenant validation)
   - DTOs (class-validator decorators)
5. Importar módulo em [AppModule](src/app.module.ts)

### Implementar Sistema de Comissões
```typescript
// 1. Configurar modelo de trabalho do barbeiro
await this.prisma.barber.update({
  where: { id },
  data: { 
    workModel: BarberWorkModel.SALARY_COMMISSION,
    monthlySalary: 2500.00 
  }
});

// 2. Criar comissão padrão (40% em serviços)
await this.prisma.barberCommission.create({
  data: {
    barberId,
    shopId,
    type: CommissionType.PERCENTAGE,
    value: 40,
    applyOnServices: true,
    applyOnProducts: false,
    active: true
  }
});

// 3. Ao finalizar comanda, cálculo é automático
await this.commissionsService.calculateCommission(
  barberId,
  serviceId,
  price,
  OrderItemType.SERVICE
);
```

## Links Importantes
- [Schema Prisma completo](prisma/schema.prisma) - Todas as entidades e enums
- [Auth Service](src/auth/auth.service.ts) - Exemplo de registro multi-tenant
- [Barbers Service](src/barbers/barbers.service.ts) - Exemplo de tenant validation
- [TenantGuard](src/common/guards/tenant.guard.ts) - Implementação do guard
- [ServiceOrders Service](src/service-orders/service-orders.service.ts) - Sistema de comandas
- [Commissions Service](src/commissions/commissions.service.ts) - Cálculo de comissões
- [Financial Reports Service](src/financial-reports/financial-reports.service.ts) - Analytics financeiros

