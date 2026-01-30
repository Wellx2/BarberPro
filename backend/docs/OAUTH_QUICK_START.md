# ⚡ Quick Start - Google OAuth

Configuração rápida em **5 minutos** para ativar login com Google.

## 📋 Pré-requisitos

- ✅ Backend rodando: `npm run start:dev`
- ✅ Conta Google (Gmail)

## 🚀 Passo a Passo

### 1️⃣ Google Cloud Console (5 min)

**1.1 Criar Projeto**
1. Acesse: https://console.cloud.google.com/
2. Clique: **"Select a project"** → **"New Project"**
3. Nome: `BarberPro`
4. **Create**

**1.2 OAuth Consent Screen**
1. Menu: **"APIs & Services"** → **"OAuth consent screen"**
2. Tipo: **"External"**
3. Preencha:
   - App name: `BarberPro`
   - User support email: `seu@email.com`
   - Developer contact: `seu@email.com`
4. **Save and Continue** (3 vezes)

**1.3 Criar Credenciais**
1. Menu: **"APIs & Services"** → **"Credentials"**
2. **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `BarberPro Web`
5. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. **Create**
7. **COPIE** Client ID e Client Secret

### 2️⃣ Configurar Backend (1 min)

Edite `.env`:

```env
# Cole os valores copiados do Google
GOOGLE_CLIENT_ID="123456789012-abc...xyz.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc...xyz"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Confirme que existe:
FRONTEND_URL="http://localhost:3001"
```

Reinicie o backend:
```bash
# Ctrl+C para parar
npm run start:dev
```

### 3️⃣ Testar (30 segundos)

**Opção 1: Navegador**
```
http://localhost:3000/api/auth/google
```

**Opção 2: Swagger UI**
```
http://localhost:3000/api/docs
```
→ Procure por `auth` → `GET /api/auth/google`

**O que vai acontecer:**
1. Abre tela de login do Google
2. Você faz login
3. Google autoriza o app
4. Redireciona para:
   ```
   http://localhost:3001/auth/callback?accessToken=xxx&refreshToken=yyy
   ```

### 4️⃣ Adicionar Test Users (se necessário)

**Erro "access_denied"?**

1. Google Console → **OAuth consent screen**
2. Seção **"Test users"**
3. **"+ Add Users"**
4. Digite seu email
5. **Save**

Agora teste novamente!

## 🎯 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/google` | GET | Inicia fluxo OAuth |
| `/api/auth/google/callback` | GET | Processa callback |
| `/api/auth/login` | POST | Login tradicional |
| `/api/auth/register-shop` | POST | Registro de barbearia |

## 🔐 Testando Login Completo

### Via curl (obter tokens)

```bash
# Login tradicional
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barberpro.com",
    "password": "senha123"
  }'
```

### Via Postman/Insomnia

1. **Request:** `POST http://localhost:3000/api/auth/login`
2. **Body (JSON):**
   ```json
   {
     "email": "admin@barberpro.com",
     "password": "senha123"
   }
   ```
3. **Response:**
   ```json
   {
     "user": { ... },
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```

### Testando Endpoints Protegidos

Copie o `accessToken` e use em outros endpoints:

```bash
curl -X GET http://localhost:3000/api/barbershops \
  -H "Authorization: Bearer eyJhbGc..."
```

## 🌐 Integrar com Frontend

### React/Next.js

```tsx
// Botão de login
<button onClick={() => {
  window.location.href = 'http://localhost:3000/api/auth/google';
}}>
  Entrar com Google
</button>

// Página /auth/callback
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  
  if (accessToken && refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    window.location.href = '/dashboard';
  }
}, []);
```

## 🐛 Troubleshooting Rápido

### ❌ "redirect_uri_mismatch"
```
Erro: URL de callback não autorizada
```

**Solução:**
1. Google Console → Credentials → Seu OAuth Client
2. Verifique "Authorized redirect URIs"
3. Deve ter EXATAMENTE: `http://localhost:3000/api/auth/google/callback`
4. **Edit** → **Add URI** → **Save**

### ❌ "invalid_client"
```
Erro: Credenciais inválidas
```

**Solução:**
1. Verifique `.env`:
   - `GOOGLE_CLIENT_ID` correto?
   - `GOOGLE_CLIENT_SECRET` correto?
2. Reinicie o backend

### ❌ "access_denied"
```
Erro: Acesso negado
```

**Solução:**
1. Google Console → OAuth consent screen
2. **Test users** → Add seu email
3. Teste novamente

### ❌ Backend não conecta
```
Erro: ECONNREFUSED localhost:5432
```

**Solução:**
```bash
# Verificar Docker
docker ps

# Se não estiver rodando:
docker-compose up -d
```

## 📊 Verificar Dados no Banco

```bash
# Entrar no container PostgreSQL
docker exec -it barberpro-db psql -U postgres -d barberpro

# Listar usuários
SELECT id, name, email, provider, "emailVerified", role FROM users;

# Sair
\q
```

## 🚀 Produção (Checklist)

Quando for para produção:

- [ ] Mudar URLs para HTTPS
- [ ] Adicionar domínio real no Google Console
- [ ] Publicar app no Google (sair de modo "Testing")
- [ ] Usar secrets seguros (rotate JWT secrets)
- [ ] Configurar CORS para domínio de produção
- [ ] Testar em staging primeiro

**URLs de Produção:**
```env
GOOGLE_CALLBACK_URL="https://api.seudominio.com/api/auth/google/callback"
FRONTEND_URL="https://seudominio.com"
```

## 📚 Documentação Completa

- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Guia detalhado
- [OAUTH_README.md](./OAUTH_README.md) - Arquitetura
- [FRONTEND_OAUTH_EXAMPLE.md](./FRONTEND_OAUTH_EXAMPLE.md) - Exemplos PWA
- [OAUTH_IMPLEMENTATION_SUMMARY.md](./OAUTH_IMPLEMENTATION_SUMMARY.md) - Resumo

## 🎉 Pronto!

OAuth Google configurado e funcionando!

**Próximo:** Integre com seu frontend PWA seguindo [FRONTEND_OAUTH_EXAMPLE.md](./FRONTEND_OAUTH_EXAMPLE.md)

---

**Dúvidas?** Consulte os logs do backend: `npm run start:dev`
