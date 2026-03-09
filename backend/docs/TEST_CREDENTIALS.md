# 🔐 Credenciais de Teste - BarberPro Backend

**Data de Atualização**: 11 de fevereiro de 2026  
**Ambiente**: Desenvolvimento  
**Senha Padrão**: `senha123` (para todos os usuários)

---

## 👤 USUÁRIOS DO SISTEMA

### 🏪 **Barbearia 1: BarberPro Centro**

#### 👨‍💼 Administrador
```
Email: admin@barberpro.com
Senha: senha123
Role: ADMIN
Nome: Carlos Silva
Telefone: (11) 98765-4321
```

#### 💈 Barbeiros

**Barbeiro 1**
```
Email: joao@barberpro.com
Senha: senha123
Role: BARBER
Nome: João Barbeiro
Telefone: (11) 98765-1111
Especialidades: Corte Social, Barba, Degradê
Rating: 4.8/5.0
```

**Barbeiro 2**
```
Email: pedro@barberpro.com
Senha: senha123
Role: BARBER
Nome: Pedro Navalheiro
Telefone: (11) 98765-2222
Especialidades: Barba Completa, Bigode, Design
Rating: 4.9/5.0
```

---

### 🏪 **Barbearia 2: BarberPro Zona Sul**

#### 👨‍💼 Administradora
```
Email: maria@barberpro.com
Senha: senha123
Role: ADMIN
Nome: Maria Administradora
Telefone: (11) 97654-3210
```

#### 💈 Barbeiro
```
Nome: Ricardo Tesoura (Ricardão)
Especialidades: Corte Infantil, Social, Freestyle
Rating: 4.7/5.0
Observação: Não possui login de usuário (apenas perfil de barbeiro)
```

---

### 👑 **Super Administrador** (Acesso Cross-Tenant)
```
Email: superadmin@barberpro.com
Senha: senha123
Role: SUPER_ADMIN
Nome: Super Admin
Telefone: (11) 99999-0000
Acesso: Todas as barbearias
```

---

### 👤 **Clientes com Login**

#### 🏪 Barbearia Centro

**Cliente 1**
```
Email: roberto@email.com
Senha: senha123
Role: CLIENT
Nome: Roberto Santos
Telefone: (11) 99999-1111
```

**Cliente 2**
```
Email: lucas@email.com
Senha: senha123
Role: CLIENT
Nome: Lucas Oliveira
Telefone: (11) 99999-2222
```

**Cliente 3**
```
Email: fernando@email.com
Senha: senha123
Role: CLIENT
Nome: Fernando Costa
Telefone: (11) 99999-3333
```

**Cliente 4**
```
Email: rafael@email.com
Senha: senha123
Role: CLIENT
Nome: Rafael Santos
Telefone: (11) 91111-4444
```

**Cliente 5**
```
Email: gustavo@email.com
Senha: senha123
Role: CLIENT
Nome: Gustavo Lima
Telefone: (11) 91111-5555
```

**Cliente 6**
```
Email: andre@email.com
Senha: senha123
Role: CLIENT
Nome: André Oliveira
Telefone: (11) 91111-6666
```

#### 🏪 Barbearia Zona Sul

**Cliente 1**
```
Email: bruno@email.com
Senha: senha123
Role: CLIENT
Nome: Bruno Silva
Telefone: (11) 92222-1111
```

**Cliente 2**
```
Email: felipe@email.com
Senha: senha123
Role: CLIENT
Nome: Felipe Souza
Telefone: (11) 92222-2222
```

**Cliente 3**
```
Email: marcelo@email.com
Senha: senha123
Role: CLIENT
Nome: Marcelo Dias
Telefone: (11) 92222-3333
```

---

## 🎯 RESUMO DE CREDENCIAIS PARA LOGIN

| Email | Senha | Role | Barbearia | Nome |
|-------|-------|------|-----------|------|
| `admin@barberpro.com` | `senha123` | ADMIN | Centro | Carlos Silva |
| `joao@barberpro.com` | `senha123` | BARBER | Centro | João Barbeiro |
| `pedro@barberpro.com` | `senha123` | BARBER | Centro | Pedro Navalheiro |
| `maria@barberpro.com` | `senha123` | ADMIN | Zona Sul | Maria Administradora |
| `superadmin@barberpro.com` | `senha123` | SUPER_ADMIN | Todas | Super Admin |

---

## 🧪 COMO FAZER LOGIN

### Via API (cURL)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barberpro.com",
    "password": "senha123"
  }'
```

### Via PowerShell
```powershell
$body = @{ 
    email = "admin@barberpro.com"
    password = "senha123" 
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Via Swagger UI
1. Acesse: http://localhost:3000/api
2. Clique em **POST /api/auth/login**
3. Clique em **Try it out**
4. Cole a credencial:
```json
{
  "email": "admin@barberpro.com",
  "password": "senha123"
}
```
5. Clique em **Execute**
6. Copie o `accessToken` retornado
7. Clique no botão **Authorize** no topo
8. Cole o token: `Bearer {seu-token-aqui}`

---

## 👥 CLIENTES CADASTRADOS (Sem Login)

### Barbearia Centro
- **Roberto Santos** - roberto@email.com - (11) 99999-1111
- **Lucas Oliveira** - lucas@email.com - (11) 99999-2222
- **Fernando Costa** - fernando@email.com - (11) 99999-3333

### Mais clientes disponíveis no seed (total: 15 clientes)

**Observação**: Clientes NÃO possuem login no sistema. Eles são cadastrados pelos administradores/barbeiros.

---

## 🔄 PERMISSÕES POR ROLE

### SUPER_ADMIN 👑
- ✅ Acesso a TODAS as barbearias (cross-tenant)
- ✅ Pode ver e editar dados de qualquer shop
- ✅ Bypass do TenantGuard
- ✅ Acesso total ao sistema

### ADMIN 👨‍💼
- ✅ Gestão completa da PRÓPRIA barbearia
- ✅ Criar/editar/remover: produtos, serviços, barbeiros
- ✅ Visualizar relatórios financeiros
- ✅ Gerenciar agendamentos
- ✅ Configurar módulos e planos
- ❌ Não pode acessar outras barbearias

### BARBER 💈
- ✅ Visualizar próprio perfil
- ✅ Visualizar agendamentos atribuídos a si
- ✅ Editar informações do próprio perfil
- ✅ Visualizar produtos e serviços (read-only)
- ❌ Não pode criar/editar/remover registros
- ❌ Não pode acessar relatórios financeiros completos

### CLIENT 👤
- ✅ Acesso público limitado
- ✅ Visualizar barbearias, serviços e produtos
- ✅ Fazer agendamentos (quando implementado no frontend)
- ❌ Sem acesso a áreas administrativas

---

## 🔑 INFORMAÇÕES DE SEGURANÇA

### Hash de Senha
- **Algoritmo**: bcrypt
- **Salt Rounds**: 12
- **Senha em texto plano** (apenas para desenvolvimento): `senha123`
- **Hash gerado**: Diferente a cada seed (salt aleatório)

### Tokens JWT
- **Access Token**: Expira em 15 minutos (padrão)
- **Refresh Token**: Expira em 7 dias (padrão)
- **Secret**: Definido em `.env` (JWT_SECRET e JWT_REFRESH_SECRET)

---

## 🗄️ DADOS DO BANCO DE DADOS

### Conexão PostgreSQL
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barberpro"

Host: localhost
Porta: 5432
Database: barberpro
Usuário: postgres
Senha: postgres
```

### Prisma Studio
Para visualizar/editar dados visualmente:
```bash
npx prisma studio
```
Abre em: http://localhost:5555

---

## 🔄 RESETAR DADOS DE TESTE

### Opção 1: Rodar Seed Novamente
```bash
npx tsx prisma/seed.ts
```

### Opção 2: Reset Completo
```bash
npm run prisma:migrate:reset
# Confirme com 'y'
# Isso irá:
# 1. Dropar o banco de dados
# 2. Recriar o banco
# 3. Aplicar todas as migrations
# 4. Rodar o seed automaticamente
```

---

## ⚠️ AVISOS IMPORTANTES

### ❌ NUNCA use estas credenciais em produção!

Estas senhas são **APENAS PARA DESENVOLVIMENTO**. 

Em produção:
- ✅ Use senhas fortes e únicas
- ✅ Implemente recuperação de senha via email
- ✅ Force alteração de senha no primeiro login
- ✅ Implemente 2FA (Two-Factor Authentication)
- ✅ Use variáveis de ambiente seguras
- ✅ Rotacione secrets regularmente

---

## 📞 TESTE RÁPIDO

### Login Admin (BarberPro Centro)
```json
POST http://localhost:3000/api/auth/login

{
  "email": "admin@barberpro.com",
  "password": "senha123"
}
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "aa62b19b-f5de-4f04-9354-a06d2c3cb567",
    "email": "admin@barberpro.com",
    "name": "Carlos Silva",
    "role": "ADMIN",
    "shopId": "aa62b19b-f5de-4f04-9354-a06d2c3cb567"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

> **Nota**: Os IDs acima são UUIDs reais gerados automaticamente pelo Prisma. Execute `npx tsx scripts/check-data.ts` para ver os IDs atuais das suas barbearias de teste.

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [BACKEND_ANALYSIS_REPORT.md](./BACKEND_ANALYSIS_REPORT.md) - Análise completa do backend
- [ENDPOINTS_FRONTEND.md](./ENDPOINTS_FRONTEND.md) - Documentação de endpoints
- [FRONTEND_API_EXAMPLES.ts](./FRONTEND_API_EXAMPLES.ts) - Exemplos de código

---

**Nota**: Estas credenciais são geradas pelo script [prisma/seed.ts](../prisma/seed.ts) e são recriadas toda vez que o seed é executado.
