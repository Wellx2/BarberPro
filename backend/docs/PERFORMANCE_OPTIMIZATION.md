# 🚀 Otimização de Performance - BarberPro Backend

## Problema Identificado
Com apenas 2 barbearias, o frontend já apresenta lentidão ao trocar de unidade. Com 300-1000 barbearias, será inviável sem otimizações.

---

## ✅ Otimizações Implementadas no Frontend
- ✅ Removido bloqueio de UI durante carregamento inicial
- ✅ Cache localStorage prioritário (não faz fetch se tem dados válidos)
- ✅ Fetch assíncrono em background (não bloqueia renderização)
- ✅ Removido delay artificial de 300ms ao trocar barbearia

---

## 🔧 Otimizações CRÍTICAS para Backend

### 1. **Paginação na Listagem Pública** 
**Prioridade: ALTA**

#### Problema Atual:
```typescript
// backend/src/barbershops/barbershops.controller.ts
@Get('public')
async findAllPublic() {
  // Retorna TODAS as barbearias de uma vez
  return this.barbershopsService.findAll({ where: { active: true } });
}
```

#### Solução:
```typescript
// backend/src/barbershops/barbershops.controller.ts
@Get('public')
async findAllPublic(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '50',
  @Query('search') search?: string,
  @Query('lat') lat?: string,
  @Query('lng') lng?: string,
  @Query('radius') radius?: string, // em km
) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Filtros dinâmicos
  const where: any = { active: true };
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Buscar apenas os campos necessários (economia de banda)
  const barbershops = await this.prisma.barbershop.findMany({
    where,
    skip,
    take: limitNum,
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      image: true,
      latitude: true,
      longitude: true,
      active: true,
      createdAt: true,
      settings: {
        select: {
          subscriptionEnabled: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Contar total para paginação
  const total = await this.prisma.barbershop.count({ where });

  return {
    data: barbershops,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}
```

#### Frontend Atualização:
```typescript
// frontend/src/services/barbershopService.ts
async listPublic(page = 1, limit = 50) {
  const response = await api.get('/barbershops/public', {
    params: { page, limit }
  });
  return response.data.data; // Retorna array de barbearias
}
```

---

### 2. **Cache Redis** 
**Prioridade: ALTA**

#### Instalar Redis:
```bash
# Docker
docker run --name redis-barberpro -p 6379:6379 -d redis:alpine

# NPM packages
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store
```

#### Configuração:
```typescript
// backend/src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 minutos
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

#### Uso no Controller:
```typescript
// backend/src/barbershops/barbershops.controller.ts
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';

@Controller('barbershops')
@UseInterceptors(CacheInterceptor)
export class BarbershopsController {
  
  @Get('public')
  @CacheKey('barbershops_public_list')
  @CacheTTL(300) // 5 minutos
  async findAllPublic(@Query() query: any) {
    // ... código de paginação
  }
}
```

#### Invalidar Cache ao Criar/Atualizar:
```typescript
// backend/src/barbershops/barbershops.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BarbershopsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(data: CreateBarbershopDto) {
    const barbershop = await this.prisma.barbershop.create({ data });
    
    // Invalidar cache
    await this.cacheManager.del('barbershops_public_list');
    
    return barbershop;
  }

  async update(id: string, data: UpdateBarbershopDto) {
    const barbershop = await this.prisma.barbershop.update({
      where: { id },
      data,
    });
    
    // Invalidar cache
    await this.cacheManager.del('barbershops_public_list');
    
    return barbershop;
  }
}
```

---

### 3. **Índices no Banco de Dados**
**Prioridade: MÉDIA**

```prisma
// backend/prisma/schema.prisma
model Barbershop {
  id        String   @id @default(uuid())
  name      String
  address   String
  latitude  Float?
  longitude Float?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([active]) // Índice para filtrar ativas
  @@index([name]) // Índice para busca por nome
  @@index([latitude, longitude]) // Índice para busca geográfica
  @@index([createdAt]) // Índice para ordenação
}
```

#### Aplicar:
```bash
cd backend
npx prisma migrate dev --name add_barbershop_indexes
```

---

### 4. **CDN para Imagens**
**Prioridade: MÉDIA**

#### Opções:
- **Cloudinary** (gratuito até 25GB)
- **AWS S3 + CloudFront**
- **Vercel Blob Storage**

#### Exemplo Cloudinary:
```bash
npm install cloudinary
```

```typescript
// backend/src/upload/upload.service.ts
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'barberpro/shops',
      transformation: [
        { width: 800, height: 600, crop: 'fill' }, // Resize automático
        { quality: 'auto', fetch_format: 'auto' }, // Otimização
      ],
    });
    
    return result.secure_url; // URL da CDN
  }
}
```

---

### 5. **Busca Geográfica Otimizada**
**Prioridade: BAIXA (futuro)**

Para buscar barbearias próximas ao usuário:

```typescript
// backend/src/barbershops/barbershops.controller.ts
@Get('nearby')
async findNearby(
  @Query('lat') lat: string,
  @Query('lng') lng: string,
  @Query('radius') radius: string = '5', // km
) {
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  // Fórmula Haversine no PostgreSQL
  const barbershops = await this.prisma.$queryRaw`
    SELECT 
      id, name, address, phone, image, latitude, longitude,
      (
        6371 * acos(
          cos(radians(${userLat})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${userLng})) + 
          sin(radians(${userLat})) * 
          sin(radians(latitude))
        )
      ) AS distance
    FROM "Barbershop"
    WHERE active = true
    HAVING distance < ${radiusKm}
    ORDER BY distance
    LIMIT 10
  `;

  return barbershops;
}
```

---

## 📊 Impacto Esperado

### Sem Otimizações:
- 1000 barbearias = ~500KB JSON
- Tempo de resposta: ~2-5 segundos
- Sem cache, requisição a cada mudança
- **Resultado: INVIÁVEL**

### Com Otimizações:
- Paginação (50 por vez) = ~25KB JSON ✅
- Cache Redis = resposta instantânea (< 50ms) ✅
- Índices = queries 10x mais rápidas ✅
- CDN = imagens servidas globalmente ✅
- **Resultado: ESCALÁVEL até 10.000+ barbearias**

---

## 🎯 Prioridade de Implementação

### Semana 1 (CRÍTICO):
1. ✅ **Paginação no endpoint `/barbershops/public`**
2. ✅ **Select apenas campos necessários**

### Semana 2 (IMPORTANTE):
3. ⏳ **Cache Redis com invalidação automática**
4. ⏳ **Índices no banco de dados**

### Semana 3 (MELHORIAS):
5. ⏳ **CDN para imagens (Cloudinary)**
6. ⏳ **Busca geográfica otimizada**

---

## 🧪 Como Testar Performance

### 1. Criar 1000 barbearias de teste:
```typescript
// backend/scripts/seed-barbershops.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando 1000 barbearias...');
  
  for (let i = 1; i <= 1000; i++) {
    await prisma.barbershop.create({
      data: {
        name: `Barbearia ${i}`,
        address: `Rua Teste ${i}, Centro`,
        phone: `(11) 9${String(i).padStart(8, '0')}`,
        email: `shop${i}@barberpro.com`,
        latitude: -23.5505 + (Math.random() * 0.1),
        longitude: -46.6333 + (Math.random() * 0.1),
        active: true,
      },
    });
    
    if (i % 100 === 0) {
      console.log(`${i} barbearias criadas...`);
    }
  }
  
  console.log('✅ 1000 barbearias criadas!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 2. Medir tempo de resposta:
```bash
# Antes da otimização
time curl http://localhost:3000/api/barbershops/public

# Depois da otimização
time curl http://localhost:3000/api/barbershops/public?page=1&limit=50
```

### 3. Monitorar queries lentas:
```typescript
// backend/src/main.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) { // Queries > 100ms
    console.warn(`🐢 Query lenta (${e.duration}ms): ${e.query}`);
  }
});
```

---

## 📞 Suporte

Se precisar de ajuda para implementar qualquer otimização, consulte:
- [NestJS Cache](https://docs.nestjs.com/techniques/caching)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Cloudinary Docs](https://cloudinary.com/documentation)
