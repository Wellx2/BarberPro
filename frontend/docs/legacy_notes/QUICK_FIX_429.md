# 🚀 GUIA RÁPIDO - Correção 429 Too Many Requests

## ⚡ PROBLEMA
Backend está bloqueando requisições do frontend com erro **429 Too Many Requests** devido ao Throttler.

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Localizar o Backend
```bash
cd backend  # ou o caminho onde está seu backend NestJS
```

### Passo 2: Abrir o arquivo principal
```bash
code src/main.ts  # ou use seu editor preferido
```

### Passo 3: Comentar o Throttler Guard

Procure por linha similar a:
```typescript
app.useGlobalGuards(new ThrottlerGuard());
```

**Comente** essa linha:
```typescript
// ❌ TEMPORÁRIO: Comentar para desabilitar throttler em dev
// app.useGlobalGuards(new ThrottlerGuard());
```

### Passo 4: Reiniciar Backend
```bash
npm run start:dev
```

Aguarde ver:
```
[Nest] LOG [NestApplication] Nest application successfully started
```

### Passo 5: Limpar Cache do Frontend

No navegador (F12 → Console):
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Passo 6: Iniciar Frontend
```bash
cd ../frontend  # voltar para pasta do frontend
npm run dev
```

### Passo 7: Verificar Logs

Deve aparecer no console:
```javascript
✅ API Response: { status: 200, dataLength: 2 }
✅ 2 barbearias carregadas
```

---

## 🎯 Alternativa: Se não encontrar ThrottlerGuard no main.ts

Procure em `app.module.ts`:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // ✅ MUDE: 60000 (1 minuto)
        limit: 200,  // ✅ MUDE: 200 requisições
      },
    ]),
  ],
})
```

---

## 📋 Checklist

- [ ] Backend: Comentou `ThrottlerGuard` no `main.ts`
- [ ] Backend reiniciado (`npm run start:dev`)
- [ ] Frontend: Cache limpo (localStorage + sessionStorage)
- [ ] Frontend reiniciado (`npm run dev`)
- [ ] Console mostra "✅ 2 barbearias carregadas"
- [ ] ShopSelector mostra lista de barbearias
- [ ] Home exibe serviços e produtos

---

## 📚 Documentação Completa

Ver [BACKEND_FIX_THROTTLER.md](BACKEND_FIX_THROTTLER.md) para:
- 4 opções de correção (dev vs produção)
- Guard customizado com whitelist
- Testes com curl
- Troubleshooting completo

---

**Tempo estimado**: 5 minutos
**Prioridade**: 🔴 CRÍTICA
