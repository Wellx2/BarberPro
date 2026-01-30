# Autenticação OAuth - BarberPro Backend

## 📋 Resumo

Backend configurado para suportar **autenticação híbrida**:
- ✅ **Login tradicional** (email + senha)
- ✅ **Login com Google** (OAuth 2.0)
- 🔜 Facebook, Apple (estrutura pronta para adicionar)

## 🚀 Quick Start

### 1. Configurar Google OAuth

Siga o guia completo: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

Resumo rápido:
1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Configurar OAuth Consent Screen
4. Criar credenciais OAuth 2.0
5. Copiar Client ID e Client Secret

### 2. Configurar Variáveis de Ambiente

Adicione no `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
FRONTEND_URL="http://localhost:3001"
```

### 3. Aplicar Migração do Banco

```bash
npm run prisma:migrate
# ou se já aplicou: npm run prisma:generate
```

### 4. Reiniciar Backend

```bash
npm run start:dev
```

## 🔐 Endpoints

### Login com Google (fluxo completo)

**GET** `/api/auth/google`
- Inicia fluxo OAuth
- Redireciona para tela de login do Google

**GET** `/api/auth/google/callback`
- Callback do Google após autenticação
- Redireciona para frontend com tokens JWT

**Response redirect:**
```
http://localhost:3001/auth/callback?accessToken=xxx&refreshToken=yyy
```

### Login Tradicional (existente)

**POST** `/api/auth/login`
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@example.com",
    "role": "CLIENT",
    "provider": "LOCAL"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## 📊 Schema do Banco (User Model)

Novos campos adicionados:

```prisma
model User {
  // ... campos existentes
  
  // Campos OAuth
  provider       AuthProvider  @default(LOCAL)  // LOCAL, GOOGLE, FACEBOOK, APPLE
  providerId     String?                        // ID do usuário no provedor
  avatar         String?                        // URL da foto OAuth
  emailVerified  Boolean       @default(false)  // Email verificado pelo provedor
  passwordHash   String?                        // Opcional para OAuth users
  
  @@unique([provider, providerId])
}

enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
  APPLE
}
```

## 🔄 Fluxo de Autenticação

### Novo Usuário (Google)

1. Usuário clica "Entrar com Google" no frontend
2. Frontend redireciona para `/api/auth/google`
3. Backend redireciona para Google OAuth
4. Usuário faz login e autoriza no Google
5. Google redireciona para `/api/auth/google/callback`
6. Backend:
   - Valida token do Google
   - **Cria novo usuário** com:
     - `provider: GOOGLE`
     - `providerId: <Google User ID>`
     - `role: CLIENT`
     - `emailVerified: true`
     - `avatar: <Google Photo URL>`
     - `passwordHash: null`
   - Gera tokens JWT
7. Backend redireciona para frontend com tokens
8. Frontend salva tokens e redireciona para dashboard

### Usuário Existente (migração LOCAL → GOOGLE)

Se usuário já tem conta com email/senha e faz login com Google:

1. Backend busca usuário por email
2. **Migra de LOCAL para GOOGLE**:
   - `provider: LOCAL` → `GOOGLE`
   - `providerId: <Google User ID>`
   - `emailVerified: true`
   - `avatar: <Google Photo URL>` (atualiza)
   - `passwordHash: mantém` (permite login híbrido)
3. Gera tokens JWT e redireciona

### Login com Senha (verificação de provider)

Se usuário criou conta via Google e tenta login com senha:

```typescript
// AuthService.login()
if (user.provider !== AuthProvider.LOCAL || !user.passwordHash) {
  throw new UnauthorizedException(
    'Por favor, use o login com Google para acessar sua conta'
  );
}
```

## 🎨 Integração Frontend (PWA)

### Botão de Login

```tsx
// components/GoogleLoginButton.tsx
export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
    >
      <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
      Entrar com Google
    </button>
  );
}
```

### Callback Handler

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Salvar tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Buscar dados do usuário
      fetchUserProfile(accessToken).then(user => {
        // Salvar no state global
        router.push('/dashboard');
      });
    } else {
      router.push('/login?error=auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="ml-4">Processando login...</p>
    </div>
  );
}
```

### Configuração de Ambiente (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🔒 Segurança

### Validações Implementadas

✅ **Tokens JWT**: Access token (15min) + Refresh token (7 dias)
✅ **Email verificado**: Automaticamente pelo Google
✅ **CORS**: Apenas domínios autorizados
✅ **Rate limiting**: 100 requisições/15min
✅ **Refresh token hasheado**: Armazenado com bcrypt
✅ **HTTPS obrigatório**: Em produção

### Proteções

- Client Secret **nunca** exposto no frontend
- Redirect URIs validadas pelo Google
- Tokens com expiração curta
- Refresh token rotation em cada uso

## 🧪 Testando OAuth

### Modo Development (localhost)

1. Configure test users no Google Console
2. Adicione seu email na lista de test users
3. Teste o fluxo completo:

```bash
# Inicie o backend
npm run start:dev

# Acesse no navegador
http://localhost:3000/api/auth/google

# Será redirecionado para:
http://localhost:3001/auth/callback?accessToken=xxx&refreshToken=yyy
```

### Via curl (não recomendado para OAuth)

OAuth requer browser para fluxo de redirect. Use Postman ou Insomnia com suporte a OAuth 2.0.

### Via Swagger UI

Swagger UI não suporta fluxo de redirect OAuth. Para testar:

1. Copie a URL: `http://localhost:3000/api/auth/google`
2. Cole no navegador
3. Complete o fluxo
4. Copie os tokens do redirect
5. Use tokens para testar outros endpoints no Swagger

## 📱 PWA Considerations

### Service Worker

Autenticação OAuth funciona perfeitamente em PWAs. Certifique-se de:

1. **Não cachear** rotas de autenticação:

```javascript
// service-worker.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Não cachear OAuth
  if (url.pathname.includes('/auth/')) {
    return fetch(event.request);
  }
  
  // ... resto do caching
});
```

2. **Adicionar OAuth redirect** ao manifest:

```json
// manifest.json
{
  "start_url": "/?source=pwa",
  "scope": "/",
  "oauth_redirect_uri": "/auth/callback"
}
```

### Install Prompt

Mantenha popup de instalação do PWA visível durante OAuth:

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  // Não prevenir durante OAuth
  if (!window.location.pathname.includes('/auth/')) {
    e.preventDefault();
    // ... lógica de instalação
  }
});
```

## 🌐 Produção

### Checklist

- [ ] Criar projeto no Google Cloud Console (modo produção)
- [ ] Configurar OAuth Consent Screen completo
- [ ] Publicar app (sair de modo "Testing")
- [ ] Adicionar domínio de produção nas Authorized URLs
- [ ] Atualizar `.env` com URLs HTTPS
- [ ] Testar fluxo completo em staging
- [ ] Configurar CORS para domínio de produção
- [ ] Monitorar logs de autenticação

### URLs de Produção

```env
GOOGLE_CALLBACK_URL="https://api.seudominioprod.com/api/auth/google/callback"
FRONTEND_URL="https://seudominioprod.com"
```

## 🆘 Troubleshooting

### Erro: "redirect_uri_mismatch"
**Causa:** URL de callback no `.env` diferente da configurada no Google Console
**Solução:** Verifique URLs (protocolo, porta, path) estão idênticas

### Erro: "access_denied"
**Causa:** Usuário cancelou autorização OU não está em test users (modo Testing)
**Solução:** Adicione email em test users ou publique app

### Tokens não aparecem no callback
**Causa:** `FRONTEND_URL` incorreta ou CORS bloqueando
**Solução:** Verifique CORS em `main.ts` e `FRONTEND_URL` no `.env`

### Usuário criado mas sem permissões
**Causa:** OAuth cria usuários com role CLIENT por padrão
**Solução:** Admin deve promover usuário via dashboard (futuro: convite por email)

## 📚 Próximos Passos

### Adicionar Facebook OAuth

1. Criar app no [Facebook Developers](https://developers.facebook.com/)
2. Criar `FacebookStrategy` similar à `GoogleStrategy`
3. Adicionar endpoint `/auth/facebook` e `/auth/facebook/callback`

### Adicionar Apple Sign In

1. Configurar [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
2. Criar `AppleStrategy`
3. Adicionar endpoints `/auth/apple` e `/auth/apple/callback`

### Melhorias Futuras

- [ ] Link/unlink de múltiplos provedores por usuário
- [ ] Sincronização de avatar automática
- [ ] Login social via popup (não redirect)
- [ ] Suporte a SSO empresarial (SAML/OIDC)

## 📖 Referências

- [Guia completo Google OAuth](./GOOGLE_OAUTH_SETUP.md)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Documentation](http://www.passportjs.org/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
