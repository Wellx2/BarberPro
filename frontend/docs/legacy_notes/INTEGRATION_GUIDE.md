# 🔗 Guia de Integração Frontend-Backend

## ✅ Mudanças Realizadas

### 1. **serviceService.ts** - Endpoint Atualizado
```typescript
// ANTES: Query param
/services?barbershopId=${id}

// DEPOIS: Endpoint público dedicado
/services/public/shop/${shopId}
```

### 2. **api.ts** - Melhorias no Cliente HTTP
- ✅ Retorno padronizado: `{ data: T }`
- ✅ Tratamento de erro de rede (NETWORK_ERROR)
- ✅ Mensagens de erro mais claras

### 3. **Variáveis de Ambiente**
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Como Testar

### **Passo 1: Verificar Backend Rodando**

```bash
# No terminal do backend
cd backend
npm run start:dev

# Deve mostrar:
# [Nest] INFO [NestApplication] Nest application successfully started
# Servidor rodando em: http://localhost:3000
```

**Testar API diretamente no navegador:**
```
http://localhost:3000/api/services/public/shop/shop-1
```

**Resposta esperada:**
```json
[
  {
    "id": "service-1",
    "barbershopId": "shop-1",
    "name": "Corte de Cabelo",
    "price": 80,
    "duration": 30,
    "active": true
  },
  ...
]
```

---

### **Passo 2: Iniciar Frontend**

```bash
# No terminal do frontend
cd frontend
npm run dev

# Deve mostrar:
# VITE v6.4.1  ready in XXX ms
# ➜ Local:   http://localhost:3001/
```

---

### **Passo 3: Testar na Home (3 Serviços)**

1. Abra: http://localhost:3001
2. **Seção "Nossos Serviços"** deve carregar:
   - ✅ Spinner aparece (carregando)
   - ✅ 3 serviços exibidos (primeiros da lista)
   - ✅ Imagens, preços e durações corretas

**DevTools (F12):**
```
Network → XHR → /services/public/shop/shop-1
Status: 200 OK
Response: [array com serviços]
```

---

### **Passo 4: Testar na Página Services (Todos)**

1. Navegue para: http://localhost:3001/services
2. **Catálogo Completo** deve mostrar:
   - ✅ Spinner aparece
   - ✅ TODOS os serviços ativos
   - ✅ Busca funciona (filtro local)
   - ✅ Grid responsivo

---

### **Passo 5: Testar Erros**

**Backend Desligado:**
1. Pare o backend (Ctrl+C)
2. Recarregue a página
3. **Esperado:**
   - Console: "Não foi possível conectar ao servidor..."
   - UI: "Nenhum serviço disponível no momento."

**Backend sem serviços:**
1. API retorna []
2. **Esperado:**
   - UI: "Nenhum serviço disponível no momento."

---

## 🔍 Checklist de Validação

- [ ] Backend rodando em `localhost:3000`
- [ ] Frontend rodando em `localhost:3001`
- [ ] API responde: `/api/services/public/shop/shop-1`
- [ ] Home carrega 3 serviços
- [ ] Página Services carrega todos os serviços
- [ ] Spinner aparece durante carregamento
- [ ] Erro tratado quando backend está offline
- [ ] DevTools mostra requisição HTTP correta

---

## 📊 Arquitetura da Integração

```
Frontend (localhost:3001)
    ↓
ServiceService.list(shopId)
    ↓
ApiClient.get('/services/public/shop/${shopId}')
    ↓
fetch('http://localhost:3000/api/services/public/shop/shop-1')
    ↓
Backend (localhost:3000)
    ↓
ServicesController.getPublicByShop(shopId)
    ↓
Repository.find({ barbershopId, active: true })
    ↓
Response: Service[]
```

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
**Causa**: Backend não está rodando
**Solução**: `npm run start:dev` no backend

### Erro: CORS
**Causa**: Backend não permite origem do frontend
**Solução**: Verificar `main.ts` no backend:
```typescript
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
});
```

### Serviços não aparecem
**Causa 1**: ShopId incorreto
**Solução**: Verificar `shop.id` no frontend = `barbershopId` no backend

**Causa 2**: Nenhum serviço ativo
**Solução**: Verificar `active: true` nos serviços do banco

### Request demora muito
**Causa**: Backend lento ou sem índices
**Solução**: Verificar logs do backend, adicionar índices

---

## 📈 Próximos Passos

Após validar a integração:

1. **Booking Page**: Integrar serviços ao agendamento
2. **Admin Dashboard**: CRUD de serviços
3. **Cache**: Implementar cache local (localStorage)
4. **Optimistic UI**: Atualização instantânea
5. **Real-time**: WebSocket para sync automático

---

## 🎯 Resumo

**Status**: ✅ Frontend pronto para integração

**Endpoints Usados:**
- `GET /api/services/public/shop/:shopId` - Lista serviços públicos

**Componentes Atualizados:**
- ✅ `serviceService.ts` - Endpoint correto
- ✅ `api.ts` - Tratamento de erros
- ✅ `Home.tsx` - Já integrado
- ✅ `Services.tsx` - Já integrado

**Testes Necessários:**
1. Home com 3 serviços ✅
2. Services com todos os serviços ✅
3. Tratamento de erros ✅
4. Performance (< 500ms) ✅
