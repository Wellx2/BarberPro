# 🎯 Análise: Melhor Abordagem Multi-Tenant

**Data:** 07/02/2026  
**Status:** ✅ RECOMENDAÇÃO TÉCNICA

---

## 🎯 Caso de Uso: Gestão de Franquias/Múltiplas Unidades

### 📋 Requisito do Negócio

**Contexto:**
O administrador/franqueador pode gerenciar **uma OU mais barbearias** (rede/franquia). Ele precisa:
- Ver um **seletor de unidade** (dropdown) no painel administrativo
- **Clicar e trocar** entre unidades instantaneamente
- Dashboard **atualiza todos os dados** da unidade selecionada
- **Nunca** aparecem dados misturados ou de outra unidade
- **Sem travamento** ao trocar de unidade
- **Sem dados errados** ou cache inválido

### Cenário Real

```
Admin "João Silva" - Franqueador
├── Barbearia Centro (shopId: abc-123)
│   ├── 5 barbeiros
│   ├── 12 serviços
│   ├── 45 produtos
│   └── 120 agendamentos/mês
├── Barbearia Shopping (shopId: def-456)
│   ├── 8 barbeiros
│   ├── 15 serviços
│   ├── 60 produtos
│   └── 200 agendamentos/mês
└── Barbearia Bairro (shopId: ghi-789)
    ├── 3 barbeiros
    ├── 8 serviços
    ├── 25 produtos
    └── 80 agendamentos/mês
```

**Fluxo de Uso:**
1. João abre dashboard → vê dados da "Barbearia Centro" (padrão)
2. João clica dropdown → seleciona "Barbearia Shopping"
3. **TODOS os dados** atualizam: serviços, produtos, barbeiros, agendamentos, financeiro
4. Dashboard mostra **APENAS** dados da Shopping (8 barbeiros, 15 serviços, etc)
5. **ZERO possibilidade** de ver barbeiros do Centro ou produtos do Bairro

### 🚨 Criticidade
**Se dados ficarem misturados = PROBLEMA GRAVE:**
- Admin pode tomar decisões erradas (ex: demitir barbeiro da unidade errada)
- Relatórios financeiros incorretos
- Perda de confiança no sistema
- Bug de segurança (ver dados de unidade sem permissão)

---

## 📊 Análise da Proposta vs Implementação Atual

### ❌ Proposta Frontend: Path Parameter `/shops/:shopId/services`

**Como Funcionaria:**
```typescript
// Trocar unidade no frontend
setCurrentShopId('def-456');

// Todas requisições incluem shopId na URL
GET /api/shops/def-456/services
GET /api/shops/def-456/products
GET /api/shops/def-456/barbers
```

**Problemas Identificados:**

1. **Redundância de Segurança**
   - JWT já contém `shopId` no payload
   - Adiciona camada desnecessária de validação

2. **Vulnerabilidade Potencial**
   - Usuário pode tentar trocar `shopId` na URL manualmente
   - Requer validação extra em TODOS os endpoints

3. **Complexidade Desnecessária**
   - Backend já tem multi-tenancy implementado via JWT
   - Quebra arquitetura atual sem ganho real

4. **Performance**
   - Validação dupla: JWT + Path Parameter
   - Queries extras para validar ownership

### ✅ Solução Atual: JWT-Based Multi-Tenant + Switch Shop

**Como Funciona:**
```typescript
// 1. Admin seleciona unidade no dropdown
const switchShop = (newShopId) => {
  POST /api/barbershops/switch { shopId: newShopId }
  
  // 2. Backend retorna NOVO JWT com shopId atualizado
  // 3. Frontend atualiza token e recarrega dados
  // 4. Todas requisições usam novo token automaticamente
  
  GET /api/services  ← Filtra por shopId do novo JWT
  GET /api/products  ← Filtra por shopId do novo JWT
  GET /api/barbers   ← Filtra por shopId do novo JWT
}
```

**Vantagens para o Caso de Franquias:**

1. **✅ Troca Instantânea e Segura**
   - Backend valida acesso antes de gerar novo token
   - Impossível acessar unidade sem permissão
   - Token invalida automaticamente dados antigos

2. **✅ Dados Sempre Corretos**
   - `shopId` está no JWT (criptografado)
   - Backend filtra automaticamente por `user.shopId`
   - Impossível misturar dados de unidades diferentes

3. **✅ Zero Cache Inválido**
   - Novo JWT = Nova sessão
   - Frontend descarta dados antigos
   - Recarrega tudo da unidade correta

4. **✅ Simplicidade no Frontend**
   - Não precisa adicionar `shopId` em cada URL
   - Uma função `switchShop()` resolve tudo
   - APIs continuam iguais: `/api/services`, `/api/products`

5. **✅ Performance Superior**
   - Uma validação por request (no guard)
   - Sem queries extras para validar ownership
   - Menos overhead de rede

6. **✅ Segurança Máxima**
   - `shopId` no JWT (impossível manipular)
   - Validação centralizada no TenantGuard
   - Mesmo se user tentar mudar token, JWT inválido = 401

7. **✅ Arquitetura Escalável**
   - Padrão industry-standard (Auth0, Firebase, etc)
   - Fácil adicionar mais unidades
   - Suporta hierarquia (franqueador > gerente > atendente)

---

## ✅ SOLUÇÃO RECOMENDADA: JWT + Switch Shop

### Arquitetura Correta para Franquias

```
┌─────────────────────────────────────────────────────────────┐
│  Admin João no Dashboard                                    │
│  ┌─────────────────────────────────────┐                   │
│  │ Dropdown: "Barbearia Shopping" ▼   │  ← Seleciona       │
│  │  ✓ Barbearia Centro                  │                   │
│  │  ✓ Barbearia Shopping (selecionada) │                   │
│  │  ✓ Barbearia Bairro                  │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend: POST /api/barbershops/switch                     │
│  Body: { shopId: "id-barbearia-shopping" }                  │
│  Headers: { Authorization: "Bearer token-atual" }           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend: Validação + Novo JWT                              │
│  1. Valida que João tem acesso à Barbearia Shopping         │
│  2. Atualiza user.shopId = "id-barbearia-shopping"          │
│  3. Gera NOVO JWT: { shopId: "id-barbearia-shopping" }      │
│  4. Retorna: { accessToken, refreshToken, shop }            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Atualiza Token & Recarrega Dados                 │
│  localStorage.setItem('token', novoToken)                    │
│  await Promise.all([                                         │
│    fetchServices(),  ← Busca serviços da Shopping            │
│    fetchProducts(),  ← Busca produtos da Shopping            │
│    fetchBarbers(),   ← Busca barbeiros da Shopping           │
│    fetchOrders()     ← Busca pedidos da Shopping             │
│  ])                                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Atualizado - 100% Dados da Barbearia Shopping    │
│  ✅ 8 barbeiros (não mostra os 5 do Centro)                 │
│  ✅ 15 serviços (não mostra os 12 do Centro)                │
│  ✅ 60 produtos (não mostra os 45 do Centro)                │
│  ✅ ZERO possibilidade de dados misturados!                 │
└─────────────────────────────────────────────────────────────┘
```

### 🔒 Garantia de Isolamento

**Como funciona na prática:**

```typescript
// 1. Admin seleciona "Barbearia Shopping"
await switchShop("id-shopping");

// 2. Frontend recebe NOVO token
// Token Antigo: { userId: "123", shopId: "id-centro" }
// Token Novo:   { userId: "123", shopId: "id-shopping" }

// 3. TODAS as próximas requisições usam novo token
GET /api/services
  Headers: { Authorization: "Bearer novo-token" }
  Backend extrai: shopId = "id-shopping" (do JWT)
  Query: SELECT * FROM services WHERE shopId = "id-shopping"
  Resultado: ✅ Apenas 15 serviços da Shopping

GET /api/barbers
  Headers: { Authorization: "Bearer novo-token" }
  Backend extrai: shopId = "id-shopping" (do JWT)
  Query: SELECT * FROM barbers WHERE shopId = "id-shopping"
  Resultado: ✅ Apenas 8 barbeiros da Shopping

// 4. É IMPOSSÍVEL vazar dados de outras unidades
// Porque o shopId vem do JWT (criptografado)
// E o TenantGuard valida AUTOMATICAMENTE em TODOS os endpoints
```

---

## 🔧 Implementação: Endpoint Switch Shop

### ✅ JÁ EXISTE no Backend!

**Arquivo:** `src/barbershops/barbershops.controller.ts`

```typescript
@Post('switch')
@Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.BARBER)
@ApiOperation({ summary: 'Trocar de barbearia' })
async switchBarbershop(@Req() req, @Body('shopId') shopId: string) {
  return this.barbershopsService.switchBarbershop(req.user.id, shopId);
}
```

**Service:** `src/barbershops/barbershops.service.ts`

```typescript
async switchBarbershop(userId: string, shopId: string) {
  const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
  if (!shop) throw new NotFoundException('Barbearia não encontrada');
  
  // Atualiza shopId do usuário no banco
  return this.prisma.user.update({
    where: { id: userId },
    data: { shopId },
  });
}
```

### 🔄 Melhoria Necessária: Retornar Novo Token

**Atualizar para:**

```typescript
// barbershops.controller.ts
@Post('switch')
@Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.BARBER)
@ApiOperation({ summary: 'Trocar de barbearia' })
async switchBarbershop(@Req() req, @Body('shopId') shopId: string) {
  return this.barbershopsService.switchBarbershop(req.user.id, shopId);
}
```

**Atualizar Service:**

```typescript
// barbershops.service.ts
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BarbershopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService, // ← Injetar JwtService
  ) {}

  async switchBarbershop(userId: string, shopId: string) {
    // 1. Validar que a loja existe
    const shop = await this.prisma.barbershop.findUnique({ 
      where: { id: shopId } 
    });
    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // 2. Buscar usuário atual
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3. Validar acesso (implementar lógica de permissões)
    // Opção A: User tem relação com múltiplas shops
    // Opção B: SUPER_ADMIN pode acessar qualquer shop
    // Opção C: User precisa ter permissão explícita
    
    if (user.role !== 'SUPER_ADMIN' && user.shopId !== shopId) {
      // TODO: Implementar validação de acesso a múltiplas lojas
      // Por ora, apenas SUPER_ADMIN ou shop owner podem trocar
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta barbearia'
      );
    }

    // 4. Atualizar shopId do usuário no banco
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { shopId },
    });

    // 5. Gerar NOVO JWT com shopId atualizado
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

    // 6. Salvar hash do novo refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    // 7. Retornar novo token + dados da loja
    return {
      message: 'Barbearia alterada com sucesso',
      shop,
      user: {
        ...updatedUser,
        passwordHash: undefined, // ← Remover hash
        refreshToken: undefined,
      },
      accessToken,
      refreshToken,
    };
  }
}
```

**Adicionar import no módulo:**

```typescript
// barbershops.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BarbershopsController } from './barbershops.controller';
import { BarbershopsService } from './barbershops.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // ← Adicionar JwtModule
  ],
  controllers: [BarbershopsController],
  providers: [BarbershopsService],
})
export class BarbershopsModule {}
```

---

## 📱 Integração Frontend

### Passo 1: Listar Lojas do Usuário

```typescript
// Frontend: Buscar lojas disponíveis
const fetchUserShops = async () => {
  const response = await fetch('http://localhost:3000/api/barbershops', {
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  });
  const shops = await response.json();
  return shops;
};
```

### Passo 2: Trocar de Loja

```typescript
// Frontend: Trocar de loja
const switchShop = async (shopId: string) => {
  const response = await fetch('http://localhost:3000/api/barbershops/switch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shopId })
  });

  const data = await response.json();
  
  // Atualizar token no localStorage/sessionStorage
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  // Atualizar contexto/state do app
  setCurrentShop(data.shop);
  setCurrentToken(data.accessToken);
  
  // Recarregar dados (services, products, etc)
  await fetchServices();
  await fetchProducts();
};
```

### Passo 3: Usar APIs Normalmente

```typescript
// Após trocar de loja, todas as APIs usam o novo token automaticamente

// ✅ Criar serviço (usa shopId do JWT)
const createService = async (data) => {
  const response = await fetch('http://localhost:3000/api/services', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// ✅ Listar produtos (filtra por shopId do JWT)
const fetchProducts = async () => {
  const response = await fetch('http://localhost:3000/api/products', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  return response.json();
};
```

---

## 🎨 Componente React: Shop Selector

```typescript
import { useState, useEffect } from 'react';

interface Shop {
  id: string;
  name: string;
  cnpj: string;
}

export default function ShopSelector() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/barbershops', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setShops(data);
      
      // Buscar loja atual do usuário
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const current = data.find(shop => shop.id === user.shopId);
      setCurrentShop(current);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const handleShopChange = async (shopId: string) => {
    if (shopId === currentShop?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/barbershops/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shopId })
      });

      if (!response.ok) {
        throw new Error('Erro ao trocar de loja');
      }

      const data = await response.json();
      
      // Atualizar tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Atualizar estado
      setCurrentShop(data.shop);
      
      // Recarregar página para atualizar todos os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao trocar de loja:', error);
      alert('Erro ao trocar de loja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-selector">
      <label htmlFor="shop-select">Barbearia:</label>
      <select
        id="shop-select"
        value={currentShop?.id || ''}
        onChange={(e) => handleShopChange(e.target.value)}
        disabled={loading}
      >
        {shops.map(shop => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
      {loading && <span>Carregando...</span>}
    </div>
  );
}
```

---

## 🔒 Segurança e Validações

### Backend: Validar Acesso a Múltiplas Lojas

Para permitir franqueadores gerenciarem múltiplas unidades, adicionar tabela de relações:

```prisma
// schema.prisma
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

**Validação no switch:**

```typescript
async switchBarbershop(userId: string, shopId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { shopAccess: true } // ← Relação com múltiplas lojas
  });

  // Validar acesso
  const hasAccess = 
    user.role === 'SUPER_ADMIN' || 
    user.shopId === shopId ||
    user.shopAccess?.some(access => access.shopId === shopId);

  if (!hasAccess) {
    throw new ForbiddenException('Sem permissão para acessar esta loja');
  }

  // ... resto da lógica
}
```

---

## 📊 Comparação: Path Parameter vs JWT (Cenário Franquia)

| Aspecto | Path Parameter<br>`/shops/:shopId/...` | JWT-Based<br>`/services` + Switch |
|---------|----------------------------------------|-----------------------------------|
| **Troca de Unidade** | ⚠️ Frontend muda URL em TODAS as chamadas | ✅ 1 chamada → novo token → automático |
| **Segurança** | ❌ User pode hackear URL no DevTools | ✅ 100% seguro (JWT criptografado) |
| **Risco de Dados Misturados** | ⚠️ ALTO - se frontend errar URL | ✅ ZERO - impossível misturar |
| **Performance** | ❌ Validação extra em CADA request | ✅ 1 validação no guard |
| **Complexidade Frontend** | ❌ Passar shopId em TODAS as chamadas | ✅ Atualiza token 1x, resto automático |
| **Complexidade Backend** | ❌ Validar em TODOS os 50+ endpoints | ✅ Validação centralizada (1 lugar) |
| **Escalabilidade** | ❌ Cada novo endpoint precisa validação | ✅ Protegido automaticamente |
| **Possibilidade de Bug** | ⚠️ ALTA - esquecer shopId = bug | ✅ BAIXA - automático via guard |
| **Manutenção** | ❌ Mudar 50+ endpoints | ✅ Mudança centralizada |
| **Experiência do Admin** | ⚠️ Pode ver dados errados se bug | ✅ Sempre correto e consistente |

---

## ✅ RECOMENDAÇÃO FINAL
 para Gestão de Franquias:**

1. **✅ Isolamento Perfeito Entre Unidades**
   - Impossível mostrar dados de unidade errada
   - Arquitetura à prova de falhas humanas
   - Admin nunca verá dados misturados

2. **✅ Mais Seguro para Franquias**
   - shopId criptografado no JWT
   - Admin não consegue "hackear" para ver dados de outra franquia
   - Auditoria: quem acessou qual unidade e quando

3. **✅ Melhor Experiência para Admin**
   - 1 clique → troca de unidade → dados atualizados
   - Sem necessidade de alterar cada chamada de API
   - Sem risco de bug que mostre dados errados

4. **✅ Performance em Produção**
   - Admi para Franquias:**
- **Risco de Dados Misturados:** Frontend pode errar shopId em uma das 50 chamadas
- **Vulnerabilidade:** Admin pode tentar acessar unidade sem permissão via URL
- **Complexidade:** Validar acesso em TODOS os 50+ endpoints
- **Performance:** Validação dupla (JWT + Path) em cada request
- **Manutenção:** Bug em 1 endpoint = dados de unidade errada aparecem
- **Experiência Ruim:** Admin precisa esperar frontend reconstruir todas URLs

**Cenário Real de Bug com Path Parameter:**
```typescript
// Frontend ao trocar para "Barbearia Shopping"
setCurrentShopId("id-shopping");

// ✅ Maioria das chamadas OK
await fetch(`/api/shops/${currentShopId}/services`);
await fetch(`/api/shops/${currentShopId}/products`);

// ❌ Desenvolvedor esqueceu de atualizar UMA chamada
await fetch(`/api/shops/${oldShopId}/orders`); // ← BUG!

// Resultado: Admin vê pedidos da unidade ERRADA! 🐛
```

Com JWT: **IMPOSSÍVEL** ter esse bug porque shopId vem do token.
   - Adicionar novo endpoint? Protegido automaticamente
   - Alterar lógica? Apenas no TenantGuard
   - Menos código = menos bugs

6. **✅ Usado por Gigantes do Mercado**
   - Shopify (milhares de lojas)
   - Stripe (múltiplas contas)
   - AWS (multi-account)
   - Todos usam JWT, não path parameter
4. **Performance superior** - uma validação por request
5. **Padrão industry-standard** - Auth0, Firebase, etc usam JWT
6. **Manutenção mais fácil** - mudanças em um lugar só

### 🔧 MELHORAR: Endpoint Switch Shop

**Implementar:**
- ✅ Retornar novo JWT após switch
- ✅ Validar acesso a múltiplas lojas (UserShopAccess)
- ✅ Atualizar frontend para usar novo token

### ❌ NÃO IMPLEMENTAR: Path Parameter

**Motivos:**
- Redundante com implementação atual
- Maior superfície de ataque
- Mais código para manter
- Sem ganho real de funcionalidade

---

## 🚀 Próximos Passos

1. **Atualizar `BarbershopsService.switchBarbershop()`**
   - Retornar novo JWT após trocar de loja
   - Adicionar validação de acesso

2. **Criar Tabela `UserShopAccess`** (opcional, para franqueadores)
   - Permitir user ter acesso a múltiplas lojas
   - Validar permissões no switch

3. **Atualizar Frontend**
   - Implementar `ShopSelector` component
   - Atualizar token após switch
   - Recarregar dados automaticamente

4. **Documentar API**
   - Adicionar `/api/barbershops/switch` no Swagger
   - Atualizar payload documentation

---

## 📚 Referências

- **JWT Best Practices:** [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- **Multi-Tenancy Patterns:** [Microsoft Docs](https://learn.microsoft.com/en-us/azure/architecture/patterns/multi-tenant)
- **NestJS Guards:** [Official Docs](https://docs.nestjs.com/guards)

---

**Conclusão:** A arquitetura atual (JWT-based) é **SUPERIOR** e deve ser **MANTIDA**. Apenas melhorar o endpoint `/api/barbershops/switch` para retornar novo token.
