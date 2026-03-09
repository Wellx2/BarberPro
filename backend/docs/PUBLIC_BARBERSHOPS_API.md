# 🌐 API Pública de Barbearias - Documentação

## ✅ STATUS: IMPLEMENTADO E FUNCIONAL

Rotas públicas para navegação de barbearias **sem autenticação necessária**.

---

## 🎯 Casos de Uso

### Frontend Home Screen (Público)
- Usuários **não autenticados** podem:
  - Ver lista de todas as barbearias cadastradas
  - Buscar barbearias por nome ou endereço
  - Ver preview de uma barbearia (3 serviços + 3 produtos + 3 barbeiros)
  - Decidir qual barbearia escolher antes de criar conta

### Frontend Admin Panel
- Usuários **autenticados** podem:
  - Trocar de barbearia (switch shop)
  - Gerenciar apenas a barbearia selecionada (multi-tenant)

---

## 📋 Endpoints Públicos

### 1. Listar Todas as Barbearias

**GET** `/api/barbershops/public`

**✅ Sem Autenticação Requerida**

**Query Params (opcionais):**
- `search` - Busca por nome ou endereço (case-insensitive)

**Exemplos:**
```bash
# Listar todas
GET http://localhost:3000/api/barbershops/public

# Buscar por nome
GET http://localhost:3000/api/barbershops/public?search=centro
```

**Response 200:**
```json
[
  {
    "id": "aa713b89-bd93-49e0-9822-20986d3c25f9",
    "name": "BarberPro Centro",
    "phone": "(11) 98765-4321",
    "address": "Rua Augusta, 1234 - Centro, São Paulo - SP",
    "openingTime": "09:00",
    "closingTime": "20:00",
    "logo": null
  },
  {
    "id": "488381a4-18bf-4530-aca2-c1c7f7a99ecd",
    "name": "BarberPro Zona Sul",
    "phone": "(11) 97654-3210",
    "address": "Av. Paulista, 500 - Bela Vista, São Paulo - SP",
    "openingTime": "10:00",
    "closingTime": "21:00",
    "logo": null
  }
]
```

**Campos Retornados:**
- `id` - UUID da barbearia
- `name` - Nome da barbearia
- `phone` - Telefone de contato
- `address` - Endereço completo
- `openingTime` - Horário de abertura (formato HH:mm)
- `closingTime` - Horário de fechamento (formato HH:mm)
- `logo` - URL do logotipo (nullable)

---

### 2. Buscar Detalhes de Barbearia (com Preview)

**GET** `/api/barbershops/public/:shopId`

**✅ Sem Autenticação Requerida**

**URL Params:**
- `shopId` - UUID da barbearia

**Exemplo:**
```bash
GET http://localhost:3000/api/barbershops/public/aa713b89-bd93-49e0-9822-20986d3c25f9
```

**Response 200:**
```json
{
  "shop": {
    "id": "aa713b89-bd93-49e0-9822-20986d3c25f9",
    "name": "BarberPro Centro",
    "phone": "(11) 98765-4321",
    "address": "Rua Augusta, 1234 - Centro, São Paulo - SP",
    "openingTime": "09:00",
    "closingTime": "20:00",
    "intervalMinutes": 30,
    "logo": null
  },
  "services": [
    {
      "id": "2f4a36f4-8dbd-460f-bc05-5d6340468d67",
      "name": "Day Off Masculino",
      "description": "Experiência completa: corte, barba, massagem relaxante e bebida",
      "category": "Especial",
      "price": 180.00,
      "duration": 150,
      "image": null
    },
    {
      "id": "8b4e9a36-02b8-4cdb-ba5f-15957372672d",
      "name": "Pacote Noivo",
      "description": "Tratamento completo para o dia especial",
      "category": "Especial",
      "price": 150.00,
      "duration": 120,
      "image": null
    },
    {
      "id": "0f0420f4-d8fd-474d-9041-11fd8b81bb35",
      "name": "Luzes/Mechas",
      "description": "Aplicação de luzes ou mechas estilizadas",
      "category": "Tratamento",
      "price": 100.00,
      "duration": 120,
      "image": null
    }
  ],
  "products": [
    {
      "id": "b8ff8315-bbbf-4e73-96a2-c256f742f589",
      "name": "Kit Pente + Escova",
      "description": "Set profissional para acabamento",
      "category": "Acessórios",
      "price": 55.00,
      "image": null
    },
    {
      "id": "014ccca6-1535-4473-b076-8232b453a5b5",
      "name": "Spray Texturizador",
      "description": "Volume e textura duradoura",
      "category": "Spray",
      "price": 52.00,
      "image": null
    },
    {
      "id": "71bf0c8e-15c8-4df6-ba77-c691814979a9",
      "name": "Óleo para Barba",
      "description": "Hidratação e brilho para barbas",
      "category": "Barba",
      "price": 48.00,
      "image": null
    }
  ],
  "barbers": [
    {
      "id": "64e604ef-28d7-4038-af25-80a6d95a02da",
      "name": "Pedro Navalheiro",
      "nickname": "Pedrão",
      "description": "Expert em barbas e bigodes. Campeão de competições.",
      "specialties": ["Barba Completa", "Bigode", "Design"],
      "rating": 4.9,
      "avatar": null,
      "role": "BARBER"
    },
    {
      "id": "e7a0b883-076e-4bdb-a9b6-29076424415c",
      "name": "Marina Costa",
      "nickname": "Mari",
      "description": "Cabeleireira especialista em cortes femininos e coloração",
      "specialties": ["Coloração", "Mechas", "Cortes Femininos"],
      "rating": 4.9,
      "avatar": null,
      "role": "HAIRDRESSER"
    },
    {
      "id": "ec6d6130-fdac-4014-8775-afb7935b6496",
      "name": "João Barbeiro",
      "nickname": "Joãozinho",
      "description": "Especialista em cortes clássicos e modernos. 10 anos de experiência.",
      "specialties": ["Corte Social", "Barba", "Degradê"],
      "rating": 4.8,
      "avatar": null,
      "role": "BARBER"
    }
  ]
}
```

**Regras de Negócio:**
- Retorna no máximo **3 serviços** (ordenados por preço DESC)
- Retorna no máximo **3 produtos** (ordenados por preço DESC)
- Retorna no máximo **3 barbeiros** (ordenados por rating DESC)
- Apenas itens ativos são retornados
- Serviços com `deletedAt` não são incluídos

**Caso de Erro:**
```json
{
  "statusCode": 404,
  "message": "Barbearia não encontrada"
}
```

---

## 🔧 Implementação Técnica

### Decorator @Public()
Criado decorator personalizado para marcar rotas sem autenticação:

**Arquivo:** `src/common/decorators/public.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### JwtAuthGuard Modificado
Guard atualizado para respeitar decorator `@Public()`:

**Arquivo:** `src/common/guards/jwt-auth.guard.ts`
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;  // Bypass JWT validation
    }
    return super.canActivate(context);
  }
}
```

### Controller
**Arquivo:** `src/barbershops/barbershops.controller.ts`
```typescript
@ApiTags('barbershops')
@Controller('barbershops')
export class BarbershopsController {
  // Rotas públicas marcadas com @Public()
  @Public()
  @Get('public')
  async findAllPublic(@Query('search') search?: string) {
    return this.barbershopsService.findAllPublic(search);
  }

  @Public()
  @Get('public/:shopId')
  async findOnePublic(@Param('shopId') shopId: string) {
    return this.barbershopsService.findOnePublic(shopId);
  }

  // Demais rotas protegidas com JWT...
}
```

### Service
**Arquivo:** `src/barbershops/barbershops.service.ts`
```typescript
async findAllPublic(search?: string) {
  return this.prisma.barbershop.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      openingTime: true,
      closingTime: true,
      logo: true,
    },
    orderBy: { name: 'asc' },
  });
}

async findOnePublic(shopId: string) {
  const shop = await this.prisma.barbershop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      openingTime: true,
      closingTime: true,
      intervalMinutes: true,
      logo: true,
    },
  });

  if (!shop) {
    throw new NotFoundException('Barbearia não encontrada');
  }

  // Buscar top 3 de cada categoria
  const services = await this.prisma.service.findMany({
    where: { shopId, active: true, deletedAt: null },
    select: { id, name, description, category, price, duration, image },
    orderBy: { price: 'desc' },
    take: 3,
  });

  const products = await this.prisma.product.findMany({
    where: { shopId, active: true },
    select: { id, name, description, category, price, image },
    orderBy: { price: 'desc' },
    take: 3,
  });

  const barbers = await this.prisma.barber.findMany({
    where: { shopId, active: true },
    select: { id, name, nickname, description, specialties, rating, avatar, role },
    orderBy: { rating: 'desc' },
    take: 3,
  });

  return { shop, services, products, barbers };
}
```

---

## 🧪 Testando

### Script de Teste Automatizado
**Arquivo:** `test-public-barbershops.ps1`

```powershell
.\test-public-barbershops.ps1
```

**Resultado esperado:**
```
========================================
  TESTE DE ROTAS PUBLICAS
========================================

[1/3] GET /barbershops/public
  [OK] Retornou 2 barbearia(s)

[2/3] GET /barbershops/public?search=centro
  [OK] Busca funcionando

[3/3] GET /barbershops/public/:shopId (com preview)
  [OK] Preview completo
     Shop: BarberPro Centro
     Servicos: 3
     Produtos: 3
     Barbeiros: 3

========================================
RESULTADO: 3/3 testes passaram
[OK] Todos testes passaram!
========================================
```

### Teste Manual com cURL
```bash
# 1. Listar todas barbearias
curl http://localhost:3000/api/barbershops/public

# 2. Buscar com filtro
curl "http://localhost:3000/api/barbershops/public?search=centro"

# 3. Detalhes com preview
curl http://localhost:3000/api/barbershops/public/aa713b89-bd93-49e0-9822-20986d3c25f9
```

---

## 🚀 Integração Frontend

### React/Next.js Example

```typescript
// Listar barbearias (sem auth)
export async function getBarbershops(search?: string) {
  const url = new URL('http://localhost:3000/api/barbershops/public');
  if (search) url.searchParams.append('search', search);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch barbershops');
  return res.json();
}

// Detalhes com preview (sem auth)
export async function getBarbershopPreview(shopId: string) {
  const res = await fetch(`http://localhost:3000/api/barbershops/public/${shopId}`);
  if (!res.ok) throw new Error('Failed to fetch barbershop');
  return res.json();
}
```

### Componente de Exemplo

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function BarbershopsList() {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadShops() {
      const data = await getBarbershops(search);
      setShops(data);
    }
    loadShops();
  }, [search]);

  return (
    <div>
      <input 
        type="text" 
        placeholder="Buscar barbearia..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      <ul>
        {shops.map(shop => (
          <li key={shop.id}>
            <h3>{shop.name}</h3>
            <p>{shop.address}</p>
            <p>{shop.phone}</p>
            <p>Horário: {shop.openingTime} - {shop.closingTime}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

- [x] Decorator `@Public()` criado
- [x] JwtAuthGuard modificado para respeitar `@Public()`
- [x] Rotas públicas no controller implementadas
- [x] Service methods `findAllPublic()` e `findOnePublic()` criados
- [x] Busca por nome/endereço funcionando (case-insensitive)
- [x] Preview com top 3 de cada categoria
- [x] Ordenação por preço (serviços/produtos) e rating (barbeiros)
- [x] Apenas itens ativos retornados
- [x] Tratamento de erros (404 para shop não encontrado)
- [x] Script de teste automatizado criado
- [x] Todos testes passando (3/3)
- [x] Documentação completa

---

## 🎉 Conclusão

Rotas públicas **100% funcionais** e prontas para integração com frontend!

**Benefícios:**
- ✅ Usuários podem explorar barbearias **sem criar conta**
- ✅ Preview mostra conteúdo atrativo (melhores serviços/produtos/barbeiros)
- ✅ Busca facilita encontrar barbearia desejada
- ✅ Implementação segura com decorator dedicado
- ✅ Sem dados sensíveis expostos (apenas informações públicas)

**Próximo passo:** Integrar com tela home do frontend!
