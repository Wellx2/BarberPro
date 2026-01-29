# BarberPro Backend 💈

> Backend SaaS multi-tenant completo para gestão de barbearias

## 🚀 Tecnologias

- **Node.js** 20.x + **TypeScript** 5.x
- **NestJS** 10.x (Framework)
- **PostgreSQL** 16.x (Banco de dados)
- **Prisma** 5.x (ORM + Migrations)
- **JWT** (Autenticação)
- **Swagger** (Documentação da API)

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- Docker e Docker Compose (para PostgreSQL)
- npm ou yarn

## ⚙️ Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd backend
```

### 2. Instale as dependências

```bash
npm install --legacy-peer-deps
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

**🔒 IMPORTANTE - SEGURANÇA:**
Edite o arquivo `.env` e configure com valores **SEGUROS**:

```bash
# Gere secrets fortes para JWT:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Configure no `.env`:
- `POSTGRES_PASSWORD`: Senha forte para PostgreSQL (mínimo 16 caracteres)
- `JWT_SECRET` e `JWT_REFRESH_SECRET`: Use os secrets gerados acima
- `DATABASE_URL`: Atualize com a senha do PostgreSQL
- `FRONTEND_URL`: URL do frontend para CORS

⚠️ **NUNCA commite o arquivo `.env` no Git!** Verifique que está no `.gitignore`.

📖 Veja [SECURITY.md](SECURITY.md) para mais detalhes sobre segurança.

### 4. Inicie o PostgreSQL via Docker

```bash
docker-compose up -d postgres
```

### 5. Execute as migrations do Prisma

```bash
npm run prisma:migrate
```

### 6. Inicie o servidor

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação da API

Acesse a documentação Swagger em:
```
http://localhost:3000/api/docs
```

## 🏗️ Arquitetura

### Multi-Tenancy

O sistema utiliza isolamento por `shopId` (barbearia). **Todas as queries ao banco DEVEM filtrar por `shopId`** para garantir que cada barbearia acesse apenas seus próprios dados.

### Guards de Segurança

Aplicados em ordem nos controllers:

1. **JwtAuthGuard**: Valida token JWT e injeta `request.user`
2. **RolesGuard**: Valida permissões por role (SUPER_ADMIN, ADMIN, BARBER, CLIENT)
3. **TenantGuard**: Valida `user.shopId` e injeta `request.shopId`

### Hierarquia de Roles

| Role | Permissões |
|------|-----------|
| **SUPER_ADMIN** | Acesso total cross-tenant |
| **ADMIN** | Gestão completa da própria barbearia |
| **BARBER** | Gerenciar agenda, bloquear horários |
| **CLIENT** | Criar agendamentos, ver histórico |

## 🔒 LGPD Compliance

### Dados Coletados

- **Finalidade**: Agendamentos e contato com clientes
- **Dados obrigatórios**: nome, telefone
- **Dados opcionais**: email, data de nascimento, CPF

### Direitos do Titular

✅ **Acesso**: `GET /api/clients/:id/export` - Exporta todos os dados em JSON
✅ **Exclusão**: 
- `DELETE /api/clients/:id` - Soft delete (marca como inativo)
- `DELETE /api/clients/:id/permanently` - Hard delete (ADMIN, após período de retenção)

### Retenção de Dados

- Clientes inativos: 2 anos (compliance fiscal)
- Logs de auditoria: 1 ano
- Dados sensíveis **NUNCA** são logados

### Segurança

- Senhas: hash bcrypt (12 rounds)
- Tokens JWT: curta duração (15min access, 7 dias refresh)
- Interceptor remove campos sensíveis automaticamente (`passwordHash`, `refreshToken`)

## 📊 Principais Endpoints

### Autenticação

```bash
# Registrar barbearia + primeiro admin
POST /api/auth/register-shop
{
  "shopName": "Minha Barbearia",
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "phone": "11999999999"
}

# Login
POST /api/auth/login
{
  "email": "joao@example.com",
  "password": "senha123"
}

# Refresh token
POST /api/auth/refresh
{
  "refreshToken": "..."
}
```

### Agendamentos

```bash
# Criar agendamento
POST /api/appointments
Header: Authorization: Bearer <token>
{
  "clientId": "uuid",
  "barberId": "uuid",
  "serviceIds": ["uuid1", "uuid2"],
  "date": "2025-02-15T10:00:00Z",
  "products": [{ "id": "uuid", "quantity": 1 }]
}

# Listar agendamentos
GET /api/appointments?date=2025-02-15&barberId=uuid&status=SCHEDULED

# Cancelar agendamento
PATCH /api/appointments/:id/cancel
{
  "cancelReason": "Cliente cancelou"
}

# Completar agendamento
PATCH /api/appointments/:id/complete
```

### Bloqueio de Horários

```bash
# Criar bloqueio
POST /api/blocked-times
{
  "barberId": "uuid",
  "type": "DAY",
  "date": "2025-02-15",
  "reason": "Férias"
}

# Listar bloqueios
GET /api/blocked-times?barberId=uuid&date=2025-02-15
```

## � Sistema Financeiro Completo

### Comandas/Ordens de Serviço

```bash
# Criar comanda
POST /api/service-orders
{
  "appointmentId": "uuid",
  "barberId": "uuid",
  "clientId": "uuid"
}

# Adicionar item (serviço, produto, extra)
POST /api/service-orders/:id/items
{
  "type": "SERVICE",
  "serviceId": "uuid",
  "quantity": 1,
  "unitPrice": 60.00
}

# Finalizar com pagamento
PATCH /api/service-orders/:id/complete
{
  "paymentMethod": "PIX"
}

# Histórico do cliente
GET /api/service-orders/client/:clientId

# Histórico do barbeiro
GET /api/service-orders/barber/:barberId
```

### Sistema de Comissões

```bash
# Configurar modelo de trabalho do barbeiro
PATCH /api/barbers/:id/work-model
{
  "workModel": "SALARY_COMMISSION",  # CHAIR_RENT, SALARY, SALARY_COMMISSION, COMMISSION_ONLY
  "monthlySalary": 2000.00,
  "chairRentalFee": null
}

# Configurar comissões padrão
POST /api/commissions/barber/:barberId/default
{
  "serviceCommission": 40,   # 40%
  "productCommission": 10    # 10%
}

# Criar comissão específica
POST /api/commissions
{
  "barberId": "uuid",
  "serviceId": "uuid",       # ou null para padrão
  "type": "PERCENTAGE",      # PERCENTAGE, FIXED, TIERED
  "value": 50,
  "applyOnServices": true,
  "applyOnProducts": false,
  "active": true
}

# Editar comissão
PATCH /api/commissions/:id
{
  "value": 45
}

# Ativar/Desativar
PATCH /api/commissions/:id/toggle
{
  "active": false,
  "reason": "Promoção temporária"
}
```

### Despesas/Custos

```bash
# Criar despesa
POST /api/expenses
{
  "type": "RENT",
  "category": "Aluguel do imóvel",
  "description": "Aluguel Janeiro/2025",
  "amount": 5000.00,
  "dueDate": "2025-01-05",
  "isRecurring": true,
  "recurrenceDay": 5
}

# Marcar como paga
PATCH /api/expenses/:id/pay
{
  "paidDate": "2025-01-05",
  "paymentMethod": "BANK_TRANSFER"
}

# Listar despesas vencidas
GET /api/expenses/overdue
```

### Relatórios Financeiros

```bash
# Relatório mensal consolidado
GET /api/financial-reports/monthly?year=2025&month=1

Response:
{
  "period": "monthly",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "grossRevenue": 50000.00,      # Faturamento bruto
  "commissions": 18000.00,        # Total comissões
  "netRevenue": 32000.00,         # Faturamento líquido
  "expenses": 12000.00,           # Custos totais
  "profit": 20000.00,             # Lucro
  "profitMargin": 40.0            # % margem
}

# Serviços mais vendidos (últimos 30 dias)
GET /api/financial-reports/top-selling?days=30

# Performance de barbeiro
GET /api/financial-reports/barber-performance?barberId=uuid&month=1

# Análise de custos
GET /api/financial-reports/costs-analysis?startDate=2025-01-01&endDate=2025-03-31
```

**Documentação completa:** [Sistema Financeiro](docs/FINANCIAL_SYSTEM.md) | [Sistema de Comissões](docs/COMMISSIONS_SYSTEM.md)

## �🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Prisma
npm run prisma:migrate    # Criar e aplicar migration
npm run prisma:generate   # Regenerar Prisma Client
npm run prisma:studio     # Abrir Prisma Studio (GUI do DB)

# Linting
npm run lint              # Verificar código
npm run format            # Formatar código com Prettier
```

## 🐳 Docker

### Iniciar apenas PostgreSQL

```bash
docker-compose up -d postgres
```

### Iniciar aplicação completa (Postgres + API)

```bash
docker-compose up -d
```

## 📝 Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── migrations/            # Migrations SQL
├── src/
│   ├── auth/                  # Autenticação (JWT)
│   ├── barbers/               # Gestão de barbeiros
│   ├── barbershops/           # Gestão de barbearias
│   ├── services/              # Serviços oferecidos
│   ├── products/              # Produtos vendidos
│   ├── clients/               # Gestão de clientes
│   ├── appointments/          # Agendamentos
│   ├── blocked-times/         # Bloqueio de horários
│   ├── plans/                 # Planos de assinatura
│   ├── invoices/              # Faturas
│   ├── reviews/               # Avaliações
│   ├── service-orders/        # 💰 Comandas/Ordens de serviço
│   ├── commissions/           # 💰 Sistema de comissões
│   ├── expenses/              # 💰 Controle de custos
│   ├── financial-reports/     # 💰 Relatórios financeiros
│   ├── common/
│   │   ├── decorators/        # Decorators customizados
│   │   ├── guards/            # Guards (JWT, Roles, Tenant)
│   │   ├── interceptors/      # Interceptors (Sanitize)
│   │   └── filters/           # Exception filters
│   ├── prisma/                # Prisma Service
│   ├── main.ts                # Entry point
│   └── app.module.ts          # Root module
├── .env.example
├── docker-compose.yml
└── README.md
```

## 🔐 Segurança Implementada

### Proteções Ativas

✅ Rate limiting (100 req/min por IP)
✅ Helmet (headers de segurança)
✅ CORS configurado
✅ Validação de input (class-validator)
✅ Proteção SQL Injection (Prisma ORM)
✅ Hash de senhas (bcrypt 12 rounds)
✅ Remoção automática de campos sensíveis
✅ Logs sem PII
✅ Multi-tenancy enforcement

### OWASP Top 10

- ✅ Injection: Prisma ORM + validação
- ✅ Broken Authentication: JWT + refresh tokens
- ✅ Sensitive Data Exposure: Interceptor + HTTPS obrigatório em prod
- ✅ XML External Entities: Não usa XML
- ✅ Broken Access Control: RBAC + TenantGuard
- ✅ Security Misconfiguration: Helmet + variáveis de ambiente
- ✅ XSS: Sanitização de outputs
- ✅ Insecure Deserialization: Validação de DTOs
- ✅ Using Components with Known Vulnerabilities: Dependências atualizadas
- ✅ Insufficient Logging & Monitoring: AuditLog table

## 🚧 Regras de Negócio Importantes

### Agendamentos

1. **Validação de conflitos**: Sistema verifica automaticamente:
   - Conflitos com outros agendamentos do barbeiro
   - Conflitos com horários bloqueados
   - Horário dentro do expediente da barbearia

2. **Cálculo de preço**: 
   ```
   totalPrice = SUM(services.price) + SUM(products.price * quantity)
   ```

3. **Estoque**: Ao criar agendamento com produtos, o estoque é decrementado automaticamente. Ao cancelar, é restaurado.

### Bloqueio de Horários

1. **Tipos de bloqueio**:
   - `DAY`: Bloqueia o dia inteiro
   - `TIME`: Bloqueia horário específico (ex: 13h-14h)
   - `RANGE`: Bloqueia período (ex: 15/02 a 20/02)

2. **Agendamentos conflitantes**: Sistema retorna lista de agendamentos que serão afetados para confirmação

### Auditoria

Todas ações críticas são registradas na tabela `AuditLog`:
- CREATE, UPDATE, DELETE de entidades principais
- Cancelamentos de agendamentos
- Bloqueios de horários

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Deploy

### Variáveis de Ambiente em Produção

**OBRIGATÓRIO** configurar:

```env
NODE_ENV=production
DATABASE_URL=<url-do-postgres-em-producao>
JWT_SECRET=<secret-forte-gerado>
JWT_REFRESH_SECRET=<outro-secret-forte-gerado>
FRONTEND_URL=<url-do-frontend-em-producao>
```

### Checklist de Deploy

- [ ] Gerar secrets fortes para JWT
- [ ] Configurar SSL/TLS no PostgreSQL
- [ ] Configurar CORS com domínio correto
- [ ] Habilitar HTTPS obrigatório
- [ ] Configurar backup automático do banco
- [ ] Monitorar logs de erro
- [ ] Configurar alertas de falhas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT

## 👨‍💻 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para simplificar a gestão de barbearias**
