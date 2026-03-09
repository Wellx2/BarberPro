# 🚨 CORREÇÃO BACKEND - 429 Too Many Requests

## ❌ Problema Identificado

O backend está retornando **429 Too Many Requests** para os endpoints públicos:
- `/api/barbershops/public`
- `/api/barbershops`

Isso acontece porque o **Throttler** (proteção contra rate limiting) do NestJS está bloqueando requisições legítimas do frontend.

```bash
❌ GET http://localhost:3000/api/barbershops/public 429 (Too Many Requests)
ThrottlerException: Too Many Requests
```

---

## ✅ SOLUÇÃO - Configurar Throttler no Backend

### Opção 1: Excluir Endpoints Públicos do Throttler (RECOMENDADO)

Endpoints públicos como `/barbershops/public`, `/services/public`, `/products/public` **NÃO devem ter throttling** restritivo.

#### Arquivo: `backend/src/barbershops/barbershops.controller.ts`

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('barbershops')
export class BarbershopsController {
  constructor(private readonly barbershopsService: BarbershopsService) {}

  // ✅ EXCLUIR do throttler (sem limite)
  @SkipThrottle()
  @Get('public')
  async findAllPublic() {
    return this.barbershopsService.findAll({ 
      where: { active: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        image: true,
        latitude: true,
        longitude: true,
        active: true,
        settings: true,
      }
    });
  }

  // OU: Aumentar limite apenas para esse endpoint
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req/min
  @Get()
  async findAll() {
    return this.barbershopsService.findAll();
  }
}
```

---

### Opção 2: Configurar Throttler Global com Limites Maiores

#### Arquivo: `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ✅ Configurar throttler com limites maiores
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 segundo
        limit: 10,  // 10 requisições por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 50,  // 50 requisições por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 200, // 200 requisições por minuto
      },
    ]),
    // ... outros módulos
  ],
})
export class AppModule {}
```

---

### Opção 3: Desabilitar Throttler em Desenvolvimento

#### Arquivo: `backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ... outras configurações

  // ✅ Desabilitar throttler em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const throttlerGuard = app.get(ThrottlerGuard);
    app.useGlobalGuards(throttlerGuard);
    console.warn('⚠️ Throttler desabilitado em desenvolvimento');
  }

  await app.listen(3000);
}
bootstrap();
```

**OU** comentar o guard global:

```typescript
// ❌ COMENTAR TEMPORARIAMENTE:
// app.useGlobalGuards(new ThrottlerGuard());
```

---

### Opção 4: Excluir Múltiplos Endpoints (Recomendado para Produção)

#### Arquivo: `backend/src/common/throttler-guard.custom.ts` (criar novo)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // ✅ Excluir endpoints públicos
    const publicEndpoints = [
      '/api/barbershops/public',
      '/api/services/public',
      '/api/products/public',
      '/api/barbers/public',
      '/api/auth/login',
      '/api/auth/register',
    ];
    
    return publicEndpoints.some(endpoint => url.startsWith(endpoint));
  }
}
```

#### Usar o guard customizado no `app.module.ts`:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/throttler-guard.custom';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // ✅ Usar guard customizado
    },
  ],
})
export class AppModule {}
```

---

## 🧪 Como Testar

### 1. No Backend

**Verifique se o throttler está configurado:**

```bash
cd backend

# Procure por @nestjs/throttler no package.json
grep -i throttler package.json

# Procure por ThrottlerModule no código
grep -r "ThrottlerModule" src/
```

### 2. Aplique uma das soluções acima

### 3. Reinicie o backend

```bash
npm run start:dev
```

### 4. Teste o endpoint manualmente

```bash
# Faça 10 requisições seguidas:
for i in {1..10}; do
  echo "Requisição $i:"
  curl http://localhost:3000/api/barbershops/public
  echo ""
done

# ✅ Todas devem retornar 200 (não 429)
```

---

## 📋 Verificação Frontend

Após corrigir o backend, teste o frontend:

### 1. Limpar cache

```javascript
// Console do navegador (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Verificar logs

Deve aparecer:
```javascript
✅ API Response: { status: 200, dataLength: 2 }
✅ 2 barbearias carregadas: ["Nome 1", "Nome 2"]
```

**NÃO deve aparecer**:
```javascript
❌ GET http://localhost:3000/api/barbershops/public 429
```

---

## 🎯 Recomendação Final

**Para ambiente de DESENVOLVIMENTO**: Use **Opção 3** (desabilitar throttler)
**Para ambiente de PRODUÇÃO**: Use **Opção 4** (guard customizado com whitelist)

### Diferença:
- **Desenvolvimento**: Sem throttler, mais ágil para testar
- **Produção**: Throttler ativo, mas endpoints públicos excluídos para não bloquear usuários

---

## 🔍 Diagnóstico Adicional

Se AINDA aparecer 429 após as correções:

### 1. Verifique se as mudanças foram aplicadas:

```bash
cd backend

# Encontre onde ThrottlerGuard está sendo usado:
grep -r "ThrottlerGuard" src/ --include="*.ts"

# Verifique o app.module.ts:
cat src/app.module.ts | grep -A 10 "ThrottlerModule"
```

### 2. Verifique logs do backend:

O backend deve logar:
```
[Nest] 12345  - 13/02/2026 10:00:00 LOG [RouterExplorer] Mapped {/barbershops/public, GET} route
```

### 3. Teste com curl:

```bash
# Requisição única:
curl -i http://localhost:3000/api/barbershops/public

# Deve retornar:
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "abc-123",
    "name": "Barbearia Paulista",
    ...
  }
]
```

---

## 📚 Documentação NestJS Throttler

Links úteis:
- [NestJS Throttler Docs](https://docs.nestjs.com/security/rate-limiting)
- [@nestjs/throttler npm](https://www.npmjs.com/package/@nestjs/throttler)
- [Custom Throttler Guard](https://github.com/nestjs/throttler#customization)

---

## ✅ Checklist de Correção

Marque conforme aplicar:

- [ ] Identificou onde ThrottlerModule está configurado
- [ ] Escolheu uma das 4 opções de correção
- [ ] Aplicou as mudanças no código do backend
- [ ] Reiniciou o backend (`npm run start:dev`)
- [ ] Testou endpoint com curl (10 requisições seguidas sem 429)
- [ ] Limpou cache do frontend (localStorage + sessionStorage)
- [ ] Recarregou frontend e verificou logs (✅ sem erros 429)
- [ ] ShopSelector mostra lista de barbearias
- [ ] Home page exibe serviços e produtos

---

## 🚀 Próximos Passos

Após corrigir o backend:

1. **Frontend voltará a funcionar normalmente**
2. **ShopSelector mostrará barbearias**
3. **Home page carregará serviços e produtos**
4. **Todas as funcionalidades estarão operacionais**

---

**Data**: 13/02/2026
**Prioridade**: 🔴 CRÍTICA (bloqueia toda a aplicação)
**Tempo estimado de correção**: 5-10 minutos
