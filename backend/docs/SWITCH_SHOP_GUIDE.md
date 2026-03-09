# 🔄 Guia de Uso: Switch de Barbearias (Franquias)

**Status:** ✅ **IMPLEMENTADO**  
**Data:** 07/02/2026

---

## 🎯 O que foi Implementado

O endpoint `/api/barbershops/switch` agora **gera e retorna novos tokens JWT** ao trocar de unidade, garantindo isolamento perfeito dos dados entre barbearias.

### ✅ Melhorias Aplicadas

1. **JwtModule** adicionado ao `BarbershopsModule`
2. **JwtService** injetado no `BarbershopsService`
3. Método `switchBarbershop()` reescrito para:
   - ✅ Validar acesso à barbearia
   - ✅ Gerar novos tokens (accessToken + refreshToken)
   - ✅ Atualizar `shopId` do usuário
   - ✅ Salvar hash do novo refreshToken
   - ✅ Retornar dados completos da operação

---

## 📡 API Endpoint

### POST `/api/barbershops/switch`

**Autenticação:** ✅ Bearer Token obrigatório

**Request Body:**
```json
{
  "shopId": "uuid-da-barbearia"
}
```

**Validações (class-validator):**
- `shopId`: **Obrigatório**, deve ser um UUID v4 válido
- DTO: `SwitchBarbershopDto` em [dto/switch-barbershop.dto.ts](../src/barbershops/dto/switch-barbershop.dto.ts)

**Response (200 OK):**
```json
{
  "message": "Barbearia alterada com sucesso",
  "shop": {
    "id": "uuid-da-barbearia",
    "name": "Barbearia Shopping",
    "cnpj": "12.345.678/0001-90",
    "phone": "(11) 98765-4321",
    "address": "Rua do Shopping, 123",
    "openingTime": "09:00",
    "closingTime": "20:00"
  },
  "user": {
    "id": "uuid-do-usuario",
    "name": "João Silva",
    "email": "joao@barberpro.com",
    "role": "ADMIN",
    "shopId": "uuid-da-barbearia",
    "active": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros Possíveis:**

**400 - Bad Request (Validação falhou):**
```json
{
  "statusCode": 400,
  "message": [
    "O ID da barbearia é obrigatório",
    "O ID da barbearia deve ser um UUID válido"
  ],
  "error": "Bad Request"
}
```

**404 - Barbearia não encontrada:**
```json
{
  "statusCode": 404,
  "message": "Barbearia não encontrada"
}
```

**403 - Sem permissão:**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar esta barbearia"
}
```

---

## 💻 Implementação no Frontend

### 1. Service/API Helper

```typescript
// services/api.ts
interface SwitchShopResponse {
  message: string;
  shop: {
    id: string;
    name: string;
    cnpj: string;
    phone: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    shopId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export async function switchShop(shopId: string): Promise<SwitchShopResponse> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/barbershops/switch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shopId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao trocar de barbearia');
  }

  return response.json();
}
```

---

### 2. Hook React (useShopSwitch)

```typescript
// hooks/useShopSwitch.ts
import { useState } from 'react';
import { switchShop } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function useShopSwitch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateTokens, setCurrentShop, reloadData } = useAuth();

  const handleSwitchShop = async (shopId: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Chamar API para trocar de barbearia
      const data = await switchShop(shopId);

      // 2. Atualizar tokens no localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 3. Atualizar contexto da aplicação
      updateTokens(data.accessToken, data.refreshToken);
      setCurrentShop(data.shop);

      // 4. Recarregar todos os dados da nova barbearia
      await reloadData();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    switchShop: handleSwitchShop,
    loading,
    error,
  };
}
```

---

### 3. Componente: ShopSelector

```typescript
// components/ShopSelector.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSwitch } from '@/hooks/useShopSwitch';

interface Shop {
  id: string;
  name: string;
  cnpj: string;
}

export function ShopSelector() {
  const { currentShop } = useAuth();
  const { switchShop, loading, error } = useShopSwitch();
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/api/barbershops', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Erro ao buscar barbearias:', error);
    }
  };

  const handleShopChange = async (shopId: string) => {
    if (shopId === currentShop?.id || loading) return;

    try {
      await switchShop(shopId);
      // Opcional: Mostrar toast de sucesso
      console.log('Barbearia alterada com sucesso!');
    } catch (error) {
      // Opcional: Mostrar toast de erro
      console.error('Erro ao trocar de barbearia:', error);
    }
  };

  return (
    <div className="shop-selector">
      <label htmlFor="shop-select" className="block text-sm font-medium mb-2">
        Unidade:
      </label>
      
      <select
        id="shop-select"
        value={currentShop?.id || ''}
        onChange={(e) => handleShopChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2 border rounded-lg"
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name} {shop.cnpj ? `- ${shop.cnpj}` : ''}
          </option>
        ))}
      </select>

      {loading && (
        <p className="text-sm text-gray-500 mt-2">Carregando dados...</p>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
```

---

### 4. Context de Autenticação (AuthContext)

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Shop {
  id: string;
  name: string;
  cnpj: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shopId: string;
}

interface AuthContextData {
  currentShop: Shop | null;
  currentUser: User | null;
  accessToken: string | null;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setCurrentShop: (shop: Shop) => void;
  reloadData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados do localStorage na inicialização
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token) setAccessToken(token);
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
  };

  const setCurrentShop = (shop: Shop) => {
    setCurrentShopState(shop);
  };

  const reloadData = async () => {
    // Recarregar todos os dados da aplicação
    // Pode ser implementado com React Query, SWR, ou chamadas diretas
    console.log('Recarregando dados da nova barbearia...');
    
    // Exemplo: disparar evento global de reload
    window.dispatchEvent(new CustomEvent('shop-changed'));
  };

  return (
    <AuthContext.Provider
      value={{
        currentShop,
        currentUser,
        accessToken,
        updateTokens,
        setCurrentShop,
        reloadData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

### 5. Uso no Dashboard

```typescript
// pages/Dashboard.tsx
import { useEffect } from 'react';
import { ShopSelector } from '@/components/ShopSelector';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { currentShop } = useAuth();

  useEffect(() => {
    // Escutar evento de mudança de shop
    const handleShopChange = () => {
      // Recarregar dados específicos desta página
      fetchServices();
      fetchProducts();
      fetchBarbers();
    };

    window.addEventListener('shop-changed', handleShopChange);
    return () => window.removeEventListener('shop-changed', handleShopChange);
  }, []);

  const fetchServices = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('http://localhost:3000/api/services', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    // Atualizar estado
  };

  // ... outros fetchs

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard - {currentShop?.name}</h1>
        <ShopSelector />
      </header>

      <main>
        {/* Conteúdo do dashboard */}
      </main>
    </div>
  );
}
```

---

## 🔒 Validações de Segurança

### Backend

**Validação de Acesso:**
```typescript
// Atualmente implementado:
- SUPER_ADMIN: pode acessar qualquer barbearia
- Usuários normais: apenas sua própria barbearia

// TODO: Implementar UserShopAccess
// Para permitir franqueadores gerenciarem múltiplas unidades
```

**Criação da Tabela (Futuro):**
```prisma
model UserShopAccess {
  id        String   @id @default(uuid())
  userId    String
  shopId    String
  role      UserRole @default(ADMIN)
  createdAt DateTime @default(now())
  
  user User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  shop Barbershop @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  @@unique([userId, shopId])
  @@map("user_shop_access")
}
```

---

## 🧪 Testando a Implementação

### Teste Manual (cURL)

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barbearia.com",
    "password": "senha123"
  }'

# Salvar o token retornado
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Listar barbearias disponíveis
curl -X GET http://localhost:3000/api/barbershops \
  -H "Authorization: Bearer $TOKEN"

# 3. Trocar para outra barbearia
curl -X POST http://localhost:3000/api/barbershops/switch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "uuid-da-outra-barbearia"
  }'

# 4. Usar novo token retornado para carregar dados
NOVO_TOKEN="..."

curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer $NOVO_TOKEN"
```

### Teste Frontend (Console do Navegador)

```javascript
// 1. Trocar de barbearia
const response = await fetch('http://localhost:3000/api/barbershops/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shopId: 'uuid-da-barbearia'
  })
});

const data = await response.json();
console.log('Resposta:', data);

// 2. Atualizar token
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// 3. Testar com novo token
const services = await fetch('http://localhost:3000/api/services', {
  headers: {
    'Authorization': `Bearer ${data.accessToken}`
  }
});
console.log('Serviços da nova barbearia:', await services.json());
```

---

## 📊 Fluxo Completo

```
┌──────────────────────────────────────────┐
│ 1. User seleciona outra unidade          │
│    Dropdown: "Barbearia Shopping"        │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ 2. Frontend chama API                    │
│    POST /api/barbershops/switch          │
│    { shopId: "id-shopping" }             │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ 3. Backend valida e gera novo JWT        │
│    - Valida acesso                       │
│    - Atualiza user.shopId                │
│    - Gera novos tokens                   │
│    - Retorna: shop + user + tokens       │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ 4. Frontend atualiza localStorage        │
│    - accessToken                         │
│    - refreshToken                        │
│    - user                                │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ 5. Recarrega dados da nova unidade       │
│    - Serviços                            │
│    - Produtos                            │
│    - Barbeiros                           │
│    - Agendamentos                        │
│    - Financeiro                          │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ 6. Dashboard atualizado!                 │
│    ✅ Dados 100% da nova unidade         │
│    ✅ Zero cache antigo                  │
│    ✅ Zero dados misturados              │
└──────────────────────────────────────────┘
```

---

## ✅ Checklist de Integração Frontend

- [ ] Implementar `switchShop()` service
- [ ] Criar hook `useShopSwitch()`
- [ ] Criar componente `<ShopSelector />`
- [ ] Atualizar `AuthContext` para incluir `currentShop`
- [ ] Adicionar listener para evento `shop-changed`
- [ ] Implementar função `reloadData()` global
- [ ] Testar troca entre unidades
- [ ] Validar que dados não ficam misturados
- [ ] Testar performance (troca deve ser instantânea)
- [ ] Adicionar loading states
- [ ] Adicionar error handling
- [ ] Adicionar toasts de sucesso/erro

---

## 🚀 Próximos Passos (Opcional)

### 1. Tabela UserShopAccess
Para permitir que franqueadores gerenciem múltiplas unidades:
```sql
CREATE TABLE user_shop_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);
```

### 2. Middleware de Auditoria
Logar todas as trocas de unidade:
```typescript
await this.prisma.auditLog.create({
  data: {
    action: 'SWITCH_SHOP',
    entity: 'Barbershop',
    entityId: shopId,
    userId,
    shopId,
    details: `Trocou de ${user.shopIdold} para ${shopId}`,
  },
});
```

### 3. Rate Limiting
Prevenir abuso do endpoint:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 trocas por minuto
@Post('switch')
```

---

**Status Final:** ✅ **PRONTO PARA USO**

O backend está completo e funcional. Basta implementar o frontend seguindo este guia! 🎉
