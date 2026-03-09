# Correção: Erro "Cannot read properties of undefined (reading 'role')"

## Problema
O frontend está tentando acessar `user.role` quando o objeto `user` está `undefined`.

## Causa Provável
1. O contexto de autenticação não está inicializado
2. O usuário não está autenticado mas o componente tenta acessar `user.role`
3. Falta verificação de null/undefined antes de acessar propriedades

## Soluções

### 1. Verificar AuthContext/Provider

No arquivo de contexto de autenticação (geralmente `AuthContext.tsx` ou similar), certifique-se de que:

```typescript
// ❌ ERRADO - Causa o erro
const SomeComponent = () => {
  const { user } = useAuth();
  
  if (user.role === 'ADMIN') { // ❌ user pode ser undefined
    // ...
  }
}

// ✅ CORRETO - Adicione verificação
const SomeComponent = () => {
  const { user } = useAuth();
  
  if (user && user.role === 'ADMIN') { // ✅ Verifica se user existe
    // ...
  }
}

// ✅ OU use optional chaining
const SomeComponent = () => {
  const { user } = useAuth();
  
  if (user?.role === 'ADMIN') { // ✅ Optional chaining
    // ...
  }
}
```

### 2. Inicializar Estado com Valor Padrão

No AuthContext/Provider:

```typescript
// ❌ ERRADO
const [user, setUser] = useState(); // undefined por padrão

// ✅ CORRETO - Com valor inicial null
const [user, setUser] = useState<User | null>(null);

// ✅ E verifique antes de usar
if (!user) {
  return <div>Carregando...</div>;
}
```

### 3. Proteger Rotas com Guards

```typescript
// Em ProtectedRoute.tsx ou similar
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### 4. Verificar Header/Navbar

Se o erro está no Header/Navbar (comum quando há links condicionais por role):

```typescript
// ❌ ERRADO
const Header = () => {
  const { user } = useAuth();
  
  return (
    <nav>
      {user.role === 'ADMIN' && ( // ❌ Erro aqui
        <Link to="/admin">Admin</Link>
      )}
    </nav>
  );
}

// ✅ CORRETO
const Header = () => {
  const { user } = useAuth();
  
  return (
    <nav>
      {user?.role === 'ADMIN' && ( // ✅ Optional chaining
        <Link to="/admin">Admin</Link>
      )}
    </nav>
  );
}
```

### 5. useEffect para Carregar Usuário

Certifique-se de que o AuthProvider carrega o usuário na montagem:

```typescript
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Buscar dados do usuário ou decodificar token
          const userData = await fetchCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Checklist de Correção

- [ ] Adicionar verificação `user &&` ou `user?.` antes de acessar `role`
- [ ] Inicializar estado do user com `null` explicitamente
- [ ] Adicionar estado de `loading` no AuthContext
- [ ] Proteger rotas com ProtectedRoute
- [ ] Verificar todos os componentes que usam `user.role`
- [ ] Adicionar fallback para usuário não autenticado

## Arquivos Comuns a Verificar

1. **AuthContext.tsx** ou **AuthProvider.tsx**
2. **Header.tsx** / **Navbar.tsx**
3. **ProtectedRoute.tsx** / **PrivateRoute.tsx**
4. Qualquer componente que use `useAuth()` ou acesse `user`

## Exemplo Completo de AuthContext Correto

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BARBER' | 'CLIENT';
  shopId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Decodificar JWT ou buscar usuário do backend
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data = await response.json();
    localStorage.setItem('token', data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
```

## Próximos Passos

1. Localize o arquivo onde o erro está ocorrendo (verifique o stack trace no console)
2. Adicione as verificações necessárias (`user?.role` ou `user && user.role`)
3. Certifique-se de que o AuthProvider está envolvendo toda a aplicação no `main.tsx` ou `App.tsx`
4. Teste o login e verifique se o usuário é carregado corretamente

## Resposta da API de Login Esperada

O backend retorna no login (`POST /api/auth/login`):

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "role": "ADMIN",
    "shopId": "shop-id",
    "phone": "(11) 99999-9999"
  },
  "accessToken": "jwt-token-aqui",
  "refreshToken": "refresh-token-aqui"
}
```

Certifique-se de que o frontend está salvando e usando corretamente esses dados.
