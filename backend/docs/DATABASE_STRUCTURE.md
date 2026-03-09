# 🗄️ Estrutura de Banco de Dados - BarberPro

## 📊 Informações de Conexão

### Desenvolvimento
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barberpro"
```

### Conexão
- **Host**: localhost
- **Porta**: 5432
- **Database**: barberpro
- **User**: postgres
- **Password**: postgres

---

## 📦 Estrutura de Dados - Produtos

### Modelo Product
```typescript
interface Product {
  id: string;                // UUID
  shopId: string;            // UUID da barbearia (multi-tenant)
  name: string;              // Nome do produto
  price: number;             // Preço de venda
  costPrice: number | null;  // Preço de custo (opcional)
  stock: number;             // Quantidade em estoque
  unit: string | null;       // Unidade (unidade, caixa, litro, etc)
  category: string | null;   // Categoria (POMADAS, SHAMPOOS, etc)
  description: string | null; // Descrição do produto
  formulation: string | null; // Composição/Ingredientes
  howToUse: string | null;   // Instruções de uso
  recommendedFor: string | null; // Para quem é recomendado
  image: string | null;      // URL da imagem
  active: boolean;           // Produto ativo (soft delete)
  featured: boolean;         // Produto em destaque (máx 3 por shop)
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
}
```

### Categorias de Produtos Populadas
- **POMADAS**: Pomadas e ceras para modelagem
- **SHAMPOOS**: Shampoos diversos
- **CONDICIONADORES**: Condicionadores e leave-ins
- **ÓLEOS**: Óleos e sérums
- **FIXADORES**: Géis e sprays fixadores
- **PÓS-BARBA**: Loções e bálsamos pós-barba
- **COLORAÇÃO**: Tintas para cabelo e barba
- **TRATAMENTO**: Esfoliantes e máscaras
- **ACESSÓRIOS**: Escovas, pentes, tesouras, etc

---

## 💈 Estrutura de Dados - Serviços

### Modelo Service
```typescript
interface Service {
  id: string;                // UUID
  shopId: string;            // UUID da barbearia (multi-tenant)
  name: string;              // Nome do serviço
  duration: number;          // Duração em minutos
  price: number;             // Preço do serviço
  category: string | null;   // Categoria (CORTES, BARBAS, etc)
  description: string | null; // Descrição do serviço
  image: string | null;      // URL da imagem
  active: boolean;           // Serviço ativo (soft delete)
  featured: boolean;         // Serviço em destaque (máx 3 por shop)
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
}
```

### Categorias de Serviços
- **CORTES**: Cortes de cabelo
- **BARBAS**: Serviços de barba
- **COMBOS**: Pacotes combinados
- **TRATAMENTOS**: Tratamentos capilares
- **ESTÉTICA**: Sobrancelha, limpeza de pele
- **ESPECIAIS**: Pacotes para eventos

---

## 🏪 Estrutura de Dados - Barbearia

### Modelo Barbershop
```typescript
interface Barbershop {
  id: string;                // UUID
  name: string;              // Nome da barbearia
  email: string;             // Email de contato
  phone: string | null;      // Telefone
  address: string | null;    // Endereço completo
  city: string | null;       // Cidade
  state: string | null;      // Estado
  zipCode: string | null;    // CEP
  country: string;           // País (padrão: BR)
  latitude: number | null;   // Latitude (geolocalização)
  longitude: number | null;  // Longitude (geolocalização)
  logo: string | null;       // URL do logo
  description: string | null; // Descrição da barbearia
  openingHours: any | null;  // JSON com horários de funcionamento
  active: boolean;           // Barbearia ativa
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
}
```

---

## 👤 Estrutura de Dados - Usuário

### Modelo User
```typescript
interface User {
  id: string;                // UUID
  shopId: string | null;     // UUID da barbearia (null para SUPER_ADMIN)
  email: string;             // Email único
  passwordHash: string;      // Hash da senha (nunca retornar)
  name: string;              // Nome completo
  phone: string | null;      // Telefone
  role: UserRole;            // SUPER_ADMIN | ADMIN | BARBER | CLIENT
  active: boolean;           // Usuário ativo
  emailVerified: boolean;    // Email verificado
  googleId: string | null;   // ID do Google OAuth
  profilePicture: string | null; // URL da foto de perfil
  refreshToken: string | null; // Token de refresh (nunca retornar)
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
}

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Acesso total cross-tenant
  ADMIN = 'ADMIN',             // Gestão completa do próprio shop
  BARBER = 'BARBER',           // Edição de perfil + visualização
  CLIENT = 'CLIENT'            // Acesso público limitado
}
```

---

## 🔐 Multi-Tenancy (Isolamento de Dados)

### Conceito
Cada barbearia é um **tenant** independente. Todos os dados são isolados por `shopId`.

### Validações Automáticas
O backend aplica automaticamente:
1. **Filtro por shopId**:Usuários só veem dados da própria barbearia
2. **TenantGuard**: Valida que usuário tem acesso ao recurso
3. **SUPER_ADMIN**: Único role que pode acessar múltiplos tenants

### Exemplo de Query
```typescript
// ❌ ERRADO - Retorna dados de todas as barbearias
const products = await prisma.product.findMany();

// ✅ CORRETO - Filtra por shopId do usuário autenticado
const products = await prisma.product.findMany({
  where: { shopId: user.shopId }
});
```

---

## 📊 Dados Populados no Sistema

### Barbearias de Teste
1. **BarberPro Centro** - 20 produtos, múltiplos serviços
2. **BarberPro Zona Sul** - 20 produtos, múltiplos serviços

### Produtos Populados
Cada barbearia possui **20 produtos** com:
- ✅ Imagens de alta qualidade (Unsplash)
- ✅ Descrições completas
- ✅ Formulação/ingredientes
- ✅ Instruções de uso
- ✅ Recomendações
- ✅ Preços de custo e venda
- ✅ Estoque inicial

### Serviços Padrão
Cada barbearia possui serviços nas categorias:
- Cortes (7+ serviços)
- Barbas (5+ serviços)
- Combos (4+ serviços)
- Tratamentos (4+ serviços)
- Estética (3+ serviços)
- Especiais (2+ serviços)

---

## 🔄 Soft Delete (Remoção Lógica)

O sistema **NÃO** deleta fisicamente registros. Usa flag `active`:

```typescript
// Ao "deletar" um produto:
await prisma.product.update({
  where: { id },
  data: { 
    active: false // Apenas desativa
  }
});

// Auditoria é registrada:
await prisma.auditLog.create({
  data: {
    action: 'REMOVE',
    entity: 'Product',
    entityId: id,
    userId: user.id,
    shopId: user.shopId,
    details: reason // Motivo da remoção
  }
});
```

### Benefícios
- ✅ Histórico completo mantido
- ✅ Possibilidade de restauração
- ✅ Auditoria detalhada
- ✅ Relatórios incluem dados históricos

---

## 📝 Auditoria (AuditLog)

Todas as ações críticas são registradas:

```typescript
interface AuditLog {
  id: string;           // UUID
  shopId: string;       // UUID da barbearia
  userId: string;       // UUID do usuário que executou
  action: string;       // CREATE | UPDATE | DISABLE | REMOVE
  entity: string;       // Product | Service | Barber | etc
  entityId: string;     // ID do registro afetado
  details: string | null; // Informações adicionais (ex: motivo)
  createdAt: Date;      // Timestamp da ação
}
```

### Ações Registradas
- **CREATE**: Criação de registros
- **UPDATE**: Atualização de dados
- **DISABLE**: Desativação temporária
- **REMOVE**: Remoção lógica (soft delete)

---

## 🎯 Sistema de Destaque (Featured)

Produtos e serviços podem ser marcados como **destaque**:

### Regras
- **Máximo**: 3 produtos e 3 serviços em destaque por barbearia
- **Campo**: `featured: boolean`
- **Endpoint**: `PATCH /:id/toggle-featured`

### Validação
```typescript
// Ao tentar adicionar 4º destaque:
if (featuredCount >= 3) {
  throw new UnprocessableEntityException(
    'Limite de 3 produtos em destaque atingido'
  );
}
```

---

## 🔍 Queries Comuns no Frontend

### 1. Buscar produtos de uma barbearia (público)
```sql
SELECT * FROM products 
WHERE "shopId" = $1 
  AND active = true
ORDER BY featured DESC, name ASC;
```

### 2. Buscar produtos em destaque
```sql
SELECT * FROM products 
WHERE "shopId" = $1 
  AND active = true 
  AND featured = true
LIMIT 3;
```

### 3. Buscar serviços por categoria
```sql
SELECT * FROM services 
WHERE "shopId" = $1 
  AND active = true 
  AND category = $2
ORDER BY price ASC;
```

### 4. Buscar produtos com estoque baixo
```sql
SELECT * FROM products 
WHERE "shopId" = $1 
  AND active = true 
  AND stock <= 10
ORDER BY stock ASC;
```

---

## 🗂️ Relacionamentos

### Product
```typescript
// Relacionamentos:
shop: Barbershop           // Pertence a uma barbearia
appointments: Appointment[] // Usado em agendamentos
orderItems: OrderItem[]    // Usado em comandas
stockMovements: Movement[] // Histórico de estoque
analytics: Analytics[]     // Dados de analytics
```

### Service
```typescript
// Relacionamentos:
shop: Barbershop                // Pertence a uma barbearia
appointments: Appointment[]     // Usado em agendamentos
barbers: Barber[]               // Barbeiros que oferecem
disabledPeriods: DisabledPeriod[] // Períodos desabilitados
orderItems: OrderItem[]         // Usado em comandas
analytics: Analytics[]          // Dados de analytics
```

---

## 🛠️ Comandos Úteis Prisma

### Verificar estado do banco
```bash
npx prisma db pull           # Puxa schema do banco
npx prisma db push           # Envia schema para banco (dev)
```

### Migrations
```bash
npm run prisma:migrate       # Cria e aplica migration
npx prisma migrate reset     # Reset completo (⚠️ deleta dados)
npx prisma migrate status    # Status das migrations
```

### Seed (Popular dados)
```bash
npx tsx prisma/seed.ts              # Seed completo
npx tsx scripts/populate-products.ts # Apenas produtos
```

### Prisma Studio (UI Visual)
```bash
npx prisma studio            # Abre interface visual na porta 5555
```

---

## 📈 Performance e Índices

### Índices Criados
Todos os modelos possuem índice em `shopId`:
```prisma
@@index([shopId])
```

Campos únicos/compostos:
```prisma
@@unique([email])           // User
@@unique([shopId, name])    // Product (não pode ter nome duplicado no shop)
```

### Otimizações
- ✅ Índices em campos de filtro frequentes
- ✅ Paginação em listas grandes
- ✅ Select específico de campos necessários
- ✅ Eager loading de relações necessárias

---

## 🔄 Sincronização Frontend-Backend

### IDs
Todos os IDs são **UUIDs** (v4), não integers sequenciais.

### Datas
Todas as datas são retornadas em **ISO 8601**:
```json
{
  "createdAt": "2026-02-11T05:30:00.000Z",
  "updatedAt": "2026-02-11T07:45:30.000Z"
}
```

### Números
```json
{
  "price": 45.00,      // Float (2 casas decimais)
  "stock": 25,         // Integer
  "duration": 30       // Integer (minutos)
}
```

### Booleanos
```json
{
  "active": true,
  "featured": false,
  "emailVerified": true
}
```

---

## 🚀 Próximos Passos

Para consultar a API:
1. 📚 [ENDPOINTS_FRONTEND.md](./ENDPOINTS_FRONTEND.md) - Todos os endpoints
2. 💻 [FRONTEND_API_EXAMPLES.ts](./FRONTEND_API_EXAMPLES.ts) - Código pronto
3. 🔧 [FIX_BAD_REQUEST_GUIDE.md](./FIX_BAD_REQUEST_GUIDE.md) - Correção do erro

**Swagger UI**: http://localhost:3000/api
