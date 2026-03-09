# ✅ Implementação Multitenant - JWT-Based

**Data:** 07/02/2026  
**Status:** ✅ Frontend Implementado - Aguardando Backend

---

## 🎯 Solução Adotada: JWT-Based Switch Shop

Após análise técnica, foi decidido **MANTER** a arquitetura JWT-based do backend (superior para multitenant) em vez de implementar path parameters.

### Por que JWT-Based é melhor?

1. ✅ **Impossível misturar dados** - shopId vem do token criptografado
2. ✅ **Segurança máxima** - usuário não pode falsificar shopId
3. ✅ **Troca instantânea** - 1 chamada API → novo token → dados atualizados
4. ✅ **Performance** - validação centralizada no TenantGuard
5. ✅ **Manutenção** - mudanças em um lugar só
6. ✅ **Padrão industry** - mesma abordagem de Auth0, Firebase, Stripe

---

## 📦 O que foi implementado no Frontend

### 1. `barbershopService.switch()` ✅

**Arquivo:** `src/services/barbershopService.ts`

```typescript
interface SwitchShopResponse {
  message: string;
  shop: Barbershop;
  user: { id, name, email, role, shopId };
  accessToken: string;
  refreshToken: string;
}

async switch(shopId: string): Promise<SwitchShopResponse> {
  const response = await api.post('/barbershops/switch', { shopId });
  return response.data;
}
```

### 2. `ShopContext.switchShop()` ✅

**Arquivo:** `src/context/ShopContext.tsx`

```typescript
const switchShop = async (shopId: string): Promise<void> => {
  // 1. Chamar backend para trocar de loja
  const response = await barbershopService.switch(shopId);

  // 2. Atualizar tokens no localStorage
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
  localStorage.setItem('user', JSON.stringify(response.user));

  // 3. Atualizar shop atual
  setShop(newShop);

  // 4. Recarregar página para garantir dados corretos
  window.location.reload();
};
```

### 3. `ShopSelector` com Multitenant ✅

**Arquivo:** `src/components/ShopSelector.tsx`

- Detecta se usuário está autenticado (tem JWT)
- **Se autenticado:** usa `switchShop()` → chama backend → novo token → reload
- **Se não autenticado:** usa `setShop()` → apenas local (para clientes navegando)
- Loading state durante troca de loja

### 4. APIs mantidas simples ✅

- **serviceService**: `/services` (sem shopId na URL)
- **productService**: `/products` (sem shopId na URL)  
- Backend filtra automaticamente por `user.shopId` do JWT

---

## 🔧 O que o Backend precisa fazer

### ⚠️ Atualizar `/api/barbershops/switch`

O endpoint já existe, mas precisa **retornar novo JWT**:

**Arquivo Backend:** `src/barbershops/barbershops.service.ts`

```typescript
async switchBarbershop(userId: string, shopId: string) {
  // 1. Validar que a loja existe
  const shop = await this.prisma.barbershop.findUnique({ 
    where: { id: shopId } 
  });
  if (!shop) {
    throw new NotFoundException('Barbearia não encontrada');
  }

  // 2. Buscar usuário
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { shopAccess: true } // ← Para multitenant
  });

  // 3. Validar acesso (SUPER_ADMIN ou user tem permissão)
  const hasAccess = 
    user.role === 'SUPER_ADMIN' || 
    user.shopId === shopId ||
    user.shopAccess?.some(access => access.shopId === shopId);

  if (!hasAccess) {
    throw new ForbiddenException('Sem permissão');
  }

  // 4. Atualizar shopId do usuário no banco
  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data: { shopId },
  });

  // 5. Gerar NOVO JWT com shopId atualizado ← IMPORTANTE!
  const payload = {
    sub: updatedUser.id,
    role: updatedUser.role,
    shopId: updatedUser.shopId, // ← Novo shopId
  };

  const accessToken = await this.jwtService.signAsync(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  });

  // 6. Salvar hash do refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashedRefreshToken },
  });

  // 7. Retornar novo token + dados ← IMPORTANTE!
  return {
    message: 'Barbearia alterada com sucesso',
    shop,
    user: {
      ...updatedUser,
      passwordHash: undefined,
      refreshToken: undefined,
    },
    accessToken, // ← Novo token
    refreshToken, // ← Novo refresh token
  };
}
```

**Adicionar ao módulo:**

```typescript
// barbershops.module.ts
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // ← Adicionar
  ],
  // ...
})
export class BarbershopsModule {}
```

---

## 🚀 Fluxo Completo Funcionando

```
┌─────────────────────────────────────────────────────┐
│ 1. Admin abre dashboard → vê "Barbearia Centro"    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. Admin clica dropdown → seleciona "Shopping"      │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/barbershops/switch           │
│    Body: { shopId: "id-shopping" }                  │
│    Headers: { Authorization: "Bearer token-atual" } │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. Backend:                                          │
│    ✅ Valida acesso                                  │
│    ✅ Atualiza user.shopId = "id-shopping"          │
│    ✅ Gera NOVO JWT com shopId atualizado           │
│    ✅ Retorna: { accessToken, refreshToken, shop }  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. Frontend:                                         │
│    ✅ Atualiza tokens no localStorage               │
│    ✅ Recarrega página (window.location.reload())   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. TODAS as APIs usam novo token automaticamente:   │
│    GET /api/services  ← Filtra por "id-shopping"    │
│    GET /api/products  ← Filtra por "id-shopping"    │
│    GET /api/barbers   ← Filtra por "id-shopping"    │
│    (shopId vem do JWT, impossível misturar dados!)  │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança Garantida

### Como funciona o isolamento:

```typescript
// Token Antigo
{
  sub: "user-123",
  role: "ADMIN",
  shopId: "id-centro"  ← Loja antiga
}

// Após switch → Token Novo
{
  sub: "user-123",
  role: "ADMIN",
  shopId: "id-shopping"  ← Loja nova
}

// Todas as próximas chamadas usam novo token:
GET /api/services
  ↓ TenantGuard extrai shopId do JWT
  ↓ Query: SELECT * FROM services WHERE shopId = "id-shopping"
  ✅ Retorna APENAS serviços da Shopping

GET /api/barbers
  ↓ TenantGuard extrai shopId do JWT
  ↓ Query: SELECT * FROM barbers WHERE shopId = "id-shopping"
  ✅ Retorna APENAS barbeiros da Shopping
```

**Resultado:**
- ✅ Impossível ver dados de outra loja
- ✅ shopId não pode ser falsificado (vem do JWT criptografado)
- ✅ Validação automática em TODOS os endpoints via TenantGuard

---

## 📋 Checklist Final

### Frontend ✅
- [x] `barbershopService.switch()` implementado
- [x] `ShopContext.switchShop()` implementado
- [x] `ShopSelector` detecta autenticação e usa `switchShop()`
- [x] Loading state durante troca
- [x] Tokens atualizados no localStorage
- [x] Reload automático após switch

### Backend ⏳ (Aguardando)
- [ ] Atualizar `BarbershopsService.switchBarbershop()`
  - [ ] Gerar novo JWT após trocar de loja
  - [ ] Retornar `{ accessToken, refreshToken, shop, user }`
- [ ] Adicionar `JwtModule` no `BarbershopsModule`
- [ ] (Opcional) Criar tabela `UserShopAccess` para franqueadores
- [ ] Testar endpoint `/api/barbershops/switch`

---

## 🧪 Como Testar

### 1. Usuário com múltiplas lojas (SUPER_ADMIN)

```bash
# Login
POST /api/auth/login
{
  "email": "admin@barberpro.com",
  "password": "senha123"
}
# Retorna: { accessToken, user: { shopId: "loja-1" } }

# Trocar para loja 2
POST /api/barbershops/switch
Headers: { Authorization: "Bearer token" }
Body: { "shopId": "loja-2" }
# Deve retornar: { accessToken (novo), refreshToken, shop, user }

# Buscar serviços (deve vir apenas da loja 2)
GET /api/services
Headers: { Authorization: "Bearer novo-token" }
# Deve retornar apenas serviços da loja-2
```

### 2. Usuário sem permissão

```bash
# Tentar acessar loja sem permissão
POST /api/barbershops/switch
Headers: { Authorization: "Bearer token-user-comum" }
Body: { "shopId": "loja-de-outro-dono" }
# Deve retornar: 403 Forbidden
```

---

## 📚 Documentação Adicional

- **Análise Completa:** Documento enviado pelo backend explicando por que JWT é superior
- **Security:** shopId no JWT = impossível falsificar = dados sempre corretos
- **Performance:** 1 validação por request (TenantGuard) vs múltiplas validações com path param

---

**Status Atual:**  
✅ Frontend 100% pronto  
⏳ Backend aguardando atualização do endpoint `/api/barbershops/switch`

**Próximo Passo:**  
Backend implementar retorno de novo JWT conforme especificação acima.

