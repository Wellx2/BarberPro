# Exemplo de Integração OAuth no Frontend PWA

Exemplos práticos de como implementar autenticação com Google no seu aplicativo PWA.

## 🎨 Componente de Login (React/Next.js)

### Login Page Completa

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      
      // Salvar tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Redirecionar
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BarberPro</h1>
          <p className="text-gray-600 mt-2">Bem-vindo de volta!</p>
        </div>

        {/* Botão Google OAuth */}
        <GoogleLoginButton />

        {/* Divisor */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">ou continue com email</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Formulário tradicional */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Link de cadastro */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Não tem conta?{' '}
          <a href="/register" className="text-amber-600 font-semibold hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
```

### Componente do Botão Google

```tsx
// components/GoogleLoginButton.tsx
'use client';

import { FcGoogle } from 'react-icons/fc';

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
    >
      <FcGoogle className="text-2xl" />
      <span className="font-semibold text-gray-700 group-hover:text-gray-900">
        Continuar com Google
      </span>
    </button>
  );
}
```

### Página de Callback OAuth

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processAuth = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // Erro no OAuth
      if (error) {
        setStatus('error');
        setTimeout(() => router.push('/login?error=oauth_failed'), 2000);
        return;
      }

      // Sucesso
      if (accessToken && refreshToken) {
        try {
          // Salvar tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // Buscar dados do usuário
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch user');

          const user = await response.json();
          
          // Salvar user no state/context
          localStorage.setItem('user', JSON.stringify(user));

          setStatus('success');
          
          // Redirecionar baseado no role
          setTimeout(() => {
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
              router.push('/dashboard');
            } else if (user.role === 'BARBER') {
              router.push('/barber/agenda');
            } else {
              router.push('/client/appointments');
            }
          }, 1000);
        } catch (error) {
          setStatus('error');
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
        }
      } else {
        setStatus('error');
        setTimeout(() => router.push('/login?error=missing_tokens'), 2000);
      }
    };

    processAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processando login...
            </h2>
            <p className="text-gray-600">Aguarde um momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Login realizado!
            </h2>
            <p className="text-gray-600">Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Erro no login
            </h2>
            <p className="text-gray-600">Redirecionando para login...</p>
          </>
        )}
      </div>
    </div>
  );
}
```

## 📱 PWA Manifest (manifest.json)

```json
{
  "name": "BarberPro",
  "short_name": "BarberPro",
  "description": "Gestão completa para barbearias",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#D97706",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "scope": "/",
  "orientation": "portrait",
  "categories": ["business", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "540x720",
      "type": "image/png",
      "label": "Dashboard BarberPro"
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

## 🔧 Configuração de Ambiente (.env.local)

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Google OAuth (Client ID público - pode expor no frontend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## 🎯 Service Worker com OAuth

```javascript
// public/sw.js
const CACHE_NAME = 'barberpro-v1';
const AUTH_ROUTES = ['/auth/', '/login', '/register', '/callback'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/styles/main.css',
        '/scripts/main.js',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear rotas de autenticação
  if (AUTH_ROUTES.some(route => url.pathname.includes(route))) {
    return event.respondWith(fetch(event.request));
  }

  // Nunca cachear chamadas à API
  if (url.pathname.includes('/api/')) {
    return event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 🔐 Hook de Autenticação

```tsx
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'BARBER' | 'CLIENT';
  avatar?: string;
  provider: 'LOCAL' | 'GOOGLE';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          // Token expirado, tentar refresh
          await refreshToken();
        } else {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Refresh failed');

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Recarregar página para buscar user novamente
      window.location.reload();
    } catch (error) {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout };
}
```

### Uso do Hook

```tsx
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Não autorizado</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo, {user.name}!</h1>
            <p className="text-gray-600 text-sm">
              Login via {user.provider === 'GOOGLE' ? 'Google' : 'Email'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sair
        </button>
      </div>

      {/* Resto do dashboard */}
    </div>
  );
}
```

## 🎨 Ícone do Google (SVG)

```tsx
// components/icons/GoogleIcon.tsx
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path
          fill="#4285F4"
          d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
        />
        <path
          fill="#34A853"
          d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
        />
        <path
          fill="#FBBC05"
          d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
        />
        <path
          fill="#EA4335"
          d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
        />
      </g>
    </svg>
  );
}
```

## 📚 Instalação de Dependências

```bash
# React Icons (para ícones)
npm install react-icons

# Axios (para chamadas HTTP - opcional)
npm install axios

# Zustand (para state management - opcional)
npm install zustand
```

## 🚀 Deploy

### Vercel (Next.js)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configure variáveis de ambiente na Vercel:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Configurar Domínio de Produção

No Google Cloud Console, adicione:
- **Authorized JavaScript origins**: `https://seudominio.com`
- **Authorized redirect URIs**: `https://api.seudominio.com/api/auth/google/callback`

## 📱 Instalar como PWA

1. Acesse o site no Chrome/Edge mobile
2. Menu → "Adicionar à tela inicial"
3. App instalado como nativo!

## 🎯 Features PWA

- ✅ Offline mode (cache de assets)
- ✅ Push notifications (futuro)
- ✅ Instalável na home screen
- ✅ Funciona como app nativo
- ✅ OAuth funciona perfeitamente
