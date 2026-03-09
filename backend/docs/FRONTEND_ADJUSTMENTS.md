# 🚀 Guia de Ajustes no Frontend - Sistema de Módulos

## 📋 Índice de Ajustes

1. [AuthService - Corrigir formato de tokens](#1-authservice)
2. [Interceptor - Auto-refresh de tokens](#2-interceptor)
3. [Módulos Context - Gerenciar módulos habilitados](#3-módulos-context)
4. [Proteção de Rotas - Guard para módulos](#4-proteção-de-rotas)
5. [UI - Ocultar menus desabilitados](#5-ajustes-de-ui)
6. [Tratamento de Erros - 403 Forbidden](#6-tratamento-de-erros)

---

## 1. AuthService

### ❌ Problema Atual
O authService está usando **snake_case** (`access_token`), mas o backend retorna **camelCase** (`accessToken`).

### ✅ Solução

```typescript
// src/services/authService.ts

import { api } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterShopData {
  name: string;
  email: string;
  password: string;
  shopName: string;
  shopAddress: string;
  phone?: string;
  cnpj?: string;
}

interface AuthResponse {
  accessToken: string;      // ✅ camelCase
  refreshToken: string;     // ✅ camelCase
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    shopId: string;         // ✅ shopId (não currentBarbershopId)
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    
    if (accessToken && refreshToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 🆕 Buscar módulos habilitados após login
      await this.fetchEnabledModules(user.shopId);
    }
    
    return response.data;
  },

  async registerShop(data: RegisterShopData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register-shop', data);
    const { accessToken, refreshToken, user } = response.data;
    
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Nova barbearia tem todos módulos habilitados por padrão
      await this.fetchEnabledModules(user.shopId);
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('enabled_modules'); // 🆕 Limpar módulos
    }
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken, // ✅ camelCase
    });
    
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
    }
    
    return response.data;
  },

  // 🆕 Buscar módulos habilitados
  async fetchEnabledModules(shopId: string): Promise<string[]> {
    try {
      const response = await api.get(`/barbershop-modules/shop/${shopId}/enabled`);
      const modules = response.data.map((m: any) => m.moduleType);
      localStorage.setItem('enabled_modules', JSON.stringify(modules));
      return modules;
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      return [];
    }
  },

  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 🆕 Verificar se módulo está habilitado
  hasModuleAccess(moduleType: string): boolean {
    const user = this.getCurrentUser();
    
    // SUPER_ADMIN tem acesso a tudo
    if (user?.role === 'SUPER_ADMIN') return true;
    
    const modulesStr = localStorage.getItem('enabled_modules');
    if (!modulesStr) return false;
    
    const enabledModules: string[] = JSON.parse(modulesStr);
    return enabledModules.includes(moduleType);
  },

  async validateToken(): Promise<{ user: AuthResponse['user']; message: string }> {
    const response = await api.get<{ user: AuthResponse['user']; message: string }>('/auth/me');
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
```

---

## 2. Interceptor

### ✅ Implementar Auto-Refresh de Tokens

Crie/atualize o arquivo de configuração da API:

```typescript
// src/services/api.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar refresh loop
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor - Adicionar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Auto-refresh em 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Se erro 401 e não é a rota de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Se já está fazendo refresh, adiciona na fila
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken } = await authService.refreshToken();
        
        // Atualiza token na request original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Processa fila de requests pendentes
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh falhou, fazer logout
        await authService.logout();
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 3. Módulos Context

### ✅ Criar Context para Gerenciar Módulos

```typescript
// src/contexts/ModulesContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

type ModuleType = 
  | 'AGENDA' 
  | 'FINANCEIRO' 
  | 'CAIXA' 
  | 'SERVICOS' 
  | 'GESTAO_TIME' 
  | 'PRODUTOS' 
  | 'MARKETING' 
  | 'PLANOS' 
  | 'NOTIFICACOES' 
  | 'CLIENTES';

interface ModulesContextData {
  enabledModules: ModuleType[];
  hasAccess: (module: ModuleType) => boolean;
  isLoading: boolean;
  refreshModules: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextData>({} as ModulesContextData);

interface ModulesProviderProps {
  children: ReactNode;
}

export const ModulesProvider: React.FC<ModulesProviderProps> = ({ children }) => {
  const [enabledModules, setEnabledModules] = useState<ModuleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadModules = async () => {
    try {
      const user = authService.getCurrentUser();
      
      // SUPER_ADMIN tem todos os módulos
      if (user?.role === 'SUPER_ADMIN') {
        setEnabledModules([
          'AGENDA', 'FINANCEIRO', 'CAIXA', 'SERVICOS', 
          'GESTAO_TIME', 'PRODUTOS', 'MARKETING', 'PLANOS', 
          'NOTIFICACOES', 'CLIENTES'
        ]);
        return;
      }

      if (user?.shopId) {
        const modules = await authService.fetchEnabledModules(user.shopId);
        setEnabledModules(modules as ModuleType[]);
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      setEnabledModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadModules();
    } else {
      setIsLoading(false);
    }
  }, []);

  const hasAccess = (module: ModuleType): boolean => {
    const user = authService.getCurrentUser();
    if (user?.role === 'SUPER_ADMIN') return true;
    return enabledModules.includes(module);
  };

  const refreshModules = async () => {
    setIsLoading(true);
    await loadModules();
  };

  return (
    <ModulesContext.Provider value={{ enabledModules, hasAccess, isLoading, refreshModules }}>
      {children}
    </ModulesContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules deve ser usado dentro de ModulesProvider');
  }
  return context;
};
```

### ✅ Adicionar Provider no App

```typescript
// src/App.tsx

import { ModulesProvider } from './contexts/ModulesContext';
import { AuthProvider } from './contexts/AuthContext'; // se existir

function App() {
  return (
    <AuthProvider>
      <ModulesProvider>
        {/* Suas rotas e componentes */}
        <Routes>
          {/* ... */}
        </Routes>
      </ModulesProvider>
    </AuthProvider>
  );
}
```

---

## 4. Proteção de Rotas

### ✅ Criar Guard para Rotas com Módulos

```typescript
// src/components/guards/ModuleGuard.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModules } from '../../contexts/ModulesContext';
import { Alert, Spinner } from '@/components/ui'; // seus componentes

type ModuleType = 
  | 'AGENDA' 
  | 'FINANCEIRO' 
  | 'CAIXA' 
  | 'SERVICOS' 
  | 'GESTAO_TIME' 
  | 'PRODUTOS' 
  | 'MARKETING' 
  | 'PLANOS' 
  | 'NOTIFICACOES' 
  | 'CLIENTES';

interface ModuleGuardProps {
  module: ModuleType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ 
  module, 
  children, 
  fallback 
}) => {
  const { hasAccess, isLoading } = useModules();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="large" />
        <span className="ml-2">Carregando módulos...</span>
      </div>
    );
  }

  if (!hasAccess(module)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="warning">
          <h2 className="text-xl font-bold mb-2">Módulo Não Disponível</h2>
          <p>Sua barbearia não tem acesso ao módulo: <strong>{module}</strong></p>
          <p className="mt-2 text-sm">Entre em contato com o suporte para habilitar.</p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
```

### ✅ Usar Guard nas Rotas

```typescript
// src/routes/index.tsx (ou App.tsx)

import { ModuleGuard } from '../components/guards/ModuleGuard';

<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  
  {/* Rotas protegidas por módulo */}
  <Route 
    path="/produtos" 
    element={
      <PrivateRoute>
        <ModuleGuard module="PRODUTOS">
          <ProductsPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/servicos" 
    element={
      <PrivateRoute>
        <ModuleGuard module="SERVICOS">
          <ServicesPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/agenda" 
    element={
      <PrivateRoute>
        <ModuleGuard module="AGENDA">
          <SchedulePage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/financeiro" 
    element={
      <PrivateRoute>
        <ModuleGuard module="FINANCEIRO">
          <FinancialPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/caixa" 
    element={
      <PrivateRoute>
        <ModuleGuard module="CAIXA">
          <CashierPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/barbeiros" 
    element={
      <PrivateRoute>
        <ModuleGuard module="GESTAO_TIME">
          <BarbersPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/clientes" 
    element={
      <PrivateRoute>
        <ModuleGuard module="CLIENTES">
          <ClientsPage />
        </ModuleGuard>
      </PrivateRoute>
    } 
  />
</Routes>
```

---

## 5. Ajustes de UI

### ✅ Ocultar Menus de Módulos Desabilitados

```typescript
// src/components/Sidebar.tsx (ou Menu.tsx)

import { useModules } from '../contexts/ModulesContext';
import { Calendar, DollarSign, Package, Users, Scissors } from 'lucide-react';

export const Sidebar = () => {
  const { hasAccess } = useModules();

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {/* Dashboard sempre visível */}
          <li>
            <Link to="/dashboard">
              <Home /> Dashboard
            </Link>
          </li>

          {/* Agenda */}
          {hasAccess('AGENDA') && (
            <li>
              <Link to="/agenda">
                <Calendar /> Agendamentos
              </Link>
            </li>
          )}

          {/* Produtos */}
          {hasAccess('PRODUTOS') && (
            <li>
              <Link to="/produtos">
                <Package /> Produtos
              </Link>
            </li>
          )}

          {/* Serviços */}
          {hasAccess('SERVICOS') && (
            <li>
              <Link to="/servicos">
                <Scissors /> Serviços
              </Link>
            </li>
          )}

          {/* Barbeiros */}
          {hasAccess('GESTAO_TIME') && (
            <li>
              <Link to="/barbeiros">
                <Users /> Equipe
              </Link>
            </li>
          )}

          {/* Clientes */}
          {hasAccess('CLIENTES') && (
            <li>
              <Link to="/clientes">
                <Users /> Clientes
              </Link>
            </li>
          )}

          {/* Financeiro */}
          {hasAccess('FINANCEIRO') && (
            <li>
              <Link to="/financeiro">
                <DollarSign /> Financeiro
              </Link>
            </li>
          )}

          {/* Caixa */}
          {hasAccess('CAIXA') && (
            <li>
              <Link to="/caixa">
                <CashRegister /> Caixa
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};
```

### ✅ Ocultar Botões/Ações

```typescript
// Exemplo: Página de Produtos

import { useModules } from '../contexts/ModulesContext';

export const ProductsPage = () => {
  const { hasAccess } = useModules();

  return (
    <div>
      <h1>Produtos</h1>
      
      {/* Apenas ADMIN pode criar produtos */}
      {hasAccess('PRODUTOS') && (
        <Button onClick={handleCreate}>
          Novo Produto
        </Button>
      )}

      {/* Lista de produtos */}
      <ProductsList />
    </div>
  );
};
```

---

## 6. Tratamento de Erros

### ✅ Interceptor para Erro 403 (Módulo Desabilitado)

Adicione ao interceptor de resposta:

```typescript
// src/services/api.ts (adicionar ao interceptor existente)

import { toast } from 'react-hot-toast'; // ou sua lib de notificações

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // ... código de refresh existente ...

    // Tratar erro 403 de módulo desabilitado
    if (error.response?.status === 403) {
      const message = (error.response.data as any)?.message || '';
      
      if (message.includes('módulo') || message.includes('module')) {
        toast.error('Sua barbearia não tem acesso a esta funcionalidade', {
          duration: 5000,
        });
        
        // Redirecionar para dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
        return Promise.reject(new Error('Módulo não disponível'));
      }
    }

    return Promise.reject(error);
  }
);
```

### ✅ Componente de Erro Global

```typescript
// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Tratar erro de módulo
    if (error.message.includes('Módulo não disponível')) {
      // Redirecionar ou mostrar mensagem específica
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Algo deu errado</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📝 Checklist de Implementação

### Passo 1: Corrigir AuthService
- [ ] Atualizar interface `AuthResponse` para camelCase
- [ ] Corrigir `login()` para usar `accessToken`/`refreshToken`
- [ ] Adicionar método `fetchEnabledModules()`
- [ ] Adicionar método `hasModuleAccess()`

### Passo 2: Implementar Interceptor
- [ ] Criar/atualizar `api.ts` com interceptor de auto-refresh
- [ ] Adicionar tratamento de erro 403 para módulos

### Passo 3: Context de Módulos
- [ ] Criar `ModulesContext.tsx`
- [ ] Adicionar `ModulesProvider` no `App.tsx`
- [ ] Criar hook `useModules()`

### Passo 4: Guards
- [ ] Criar `ModuleGuard.tsx`
- [ ] Aplicar guard nas rotas protegidas
- [ ] Testar redirecionamento

### Passo 5: Ajustar UI
- [ ] Atualizar Sidebar/Menu para ocultar itens
- [ ] Ocultar botões de ações desabilitadas
- [ ] Adicionar indicadores visuais

### Passo 6: Testes
- [ ] Login e verificar módulos carregados
- [ ] Tentar acessar rota com módulo desabilitado
- [ ] Verificar auto-refresh de token
- [ ] Testar com SUPER_ADMIN (deve ter tudo)

---

## 🧪 Testando

### 1. Testar Login
```typescript
// Deve salvar: token, refresh_token, user, enabled_modules
await authService.login({ email: 'admin@shop.com', password: 'senha' });

console.log(localStorage.getItem('enabled_modules'));
// ["AGENDA", "PRODUTOS", "SERVICOS", ...]
```

### 2. Testar Auto-Refresh
```typescript
// Após 15 minutos, fazer request:
const products = await api.get('/products');
// Deve renovar token automaticamente sem erro
```

### 3. Testar Módulo Desabilitado
```typescript
// SUPER_ADMIN desabilita módulo via backend
// Usuário tenta acessar:
// ❌ Deve mostrar toast e redirecionar
```

---

## 🎯 Resultado Esperado

✅ **Login**: Tokens e módulos carregados  
✅ **Auto-refresh**: Sessão renovada automaticamente  
✅ **Menus**: Apenas módulos habilitados visíveis  
✅ **Rotas**: Bloqueio em módulos desabilitados  
✅ **Erros**: Toast amigável + redirecionamento  
✅ **SUPER_ADMIN**: Acesso total (bypass)

---

**Próximos Passos:**
1. Implementar ajustes na ordem do checklist
2. Testar cada funcionalidade
3. Ajustar estilos e UX conforme necessário
4. Documentar para equipe

Precisa de ajuda com algum ajuste específico? 🚀
