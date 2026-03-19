# 🐛 Guia de Troubleshooting - Sistema de Logs Detalhados

## Console do Navegador COMPLETO - Como Diagnosticar

O sistema agora possui **logs detalhados em TODOS os componentes** para rastrear problemas de carregamento.

---

## 🔍 Como Acessar o Console

### Chrome/Edge:
1. Pressione `F12` ou `Ctrl + Shift + I`
2. Clique na aba **Console**
3. Recarregue a página (`Ctrl + R`)

### Firefox:
1. Pressione `F12` ou `Ctrl + Shift + K`
2. Aba **Console**
3. Recarregue a página

---

## 📊 Sequência Esperada de Logs (Fluxo Normal)

### 1. **ShopContext Inicialização**
```
✅ Usando cache localStorage: 2 barbearias
OU
⚠️ Sem cache localStorage, buscando backend...
```

### 2. **Fetch de Barbearias**
```
🔄 Buscando barbearias do backend...
✅ 2 barbearias carregadas: ["Barbearia Paulista", "Barbearia Vila Madalena"]
```

### 3. **Seleção de Barbearia**
```
🎯 Usando primeira barbearia válida do cache: Barbearia Paulista
OU
💾 Barbearia detectada via localStorage: Barbearia Paulista
```

### 4. **Home.tsx Carregamento**
```
🏠 Home: shop.id mudou para: uuid-da-barbearia-123
🔄 Home: Carregando serviços para shop: uuid-da-barbearia-123 Barbearia Paulista
✅ Home: 8 serviços carregados
🔄 Home: Carregando produtos para shop: uuid-da-barbearia-123 Barbearia Paulista
✅ Home: 3 produtos carregados
```

### 5. **Services/Products Components**
```
🔍 serviceService.list: Buscando serviços para barbershopId: uuid-123
🌐 serviceService.list: URL: /services/public/shop/uuid-123
✅ serviceService.list: 8 serviços retornados
```

---

## ❌ Erros Comuns e Soluções

### **ERRO 1: "shop.id é MOCK"**
```
❌ Home: shop.id é MOCK (shop-1), não carregando do backend
```

**Causa**: Backend não está retornando barbearias reais ou localStorage está com dados antigos.

**Solução**:
```javascript
// No Console do navegador:
localStorage.clear();
sessionStorage.clear();
// Recarregar página
location.reload();
```

---

### **ERRO 2: "shop.id vazio, aguardando..."**
```
⚠️ Home: shop.id vazio, aguardando...
```

**Causa**: Backend demorou mais que o esperado ou falhou.

**Solução**:
1. Verificar se backend está rodando: `http://localhost:3000/api/barbershops/public`
2. Ver logs do backend no terminal
3. Limpar cache e recarregar

---

### **ERRO 3: "Backend retornou 0 barbearias"**
```
⚠️ Backend retornou 0 barbearias
```

**Causa**: Banco de dados vazio ou endpoint incorreto.

**Solução Backend**:
```bash
# Verificar se há barbearias no banco
cd backend
npm run seed  # Se tiver script de seed
```

OU criar manualmente via Prisma Studio:
```bash
cd backend
npx prisma studio
# Criar barbearias na interface web
```

---

### **ERRO 4: Requisição falhou com erro 404**
```
❌ serviceService.list: Erro na requisição: AxiosError
Status: 404
Data: { message: "Not Found" }
```

**Causa**: Endpoint não existe no backend ou rota incorreta.

**Solução Backend**: Verificar se endpoint está implementado:
```typescript
// backend/src/services/services.controller.ts
@Get('public/shop/:barbershopId')
async findByShop(@Param('barbershopId') barbershopId: string) {
  return this.servicesService.findByBarbershop(barbershopId);
}
```

---

### **ERRO 5: Requisição falhou com erro 401/403**
```
Status: 401
Data: { message: "Unauthorized" }
```

**Causa**: Token expirado ou rota requer autenticação.

**Solução**:
```javascript
// Limpar tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
// Fazer login novamente
```

---

### **ERRO 6: CORS Blocked**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin 'http://localhost:3001' has been blocked by CORS
```

**Causa**: Backend não está configurado para aceitar requisições do frontend.

**Solução Backend**:
```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
});
```

---

### **ERRO 7: Network Error**
```
❌ serviceService.list: Erro na requisição: AxiosError: Network Error
```

**Causa**: Backend não está rodando ou URL base incorreta.

**Solução**:
1. Verificar se backend está rodando: `http://localhost:3000`
2. Verificar `frontend/src/services/api.ts`:
   ```typescript
   const api = axios.create({
     baseURL: 'http://localhost:3000/api',
   });
   ```

---

## 🏪 ShopSelector Travado

### **Sintoma**: Modal abre mas fica cinza/não carrega
```
🏪 ShopSelector: Renderizando com 0 barbearias
⚠️ ShopSelector: Apenas 0 barbearia(s), não renderizando
```

**Causa**: Shops não foram carregadas ainda.

**Solução**: Aguardar logs de:
```
✅ 2 barbearias carregadas: [...]
```

Se não aparecer em 5 segundos, verificar backend.

---

## 📝 Checklist de Diagnóstico Completo

### Frontend:
- [ ] Console mostra `✅ X barbearias carregadas`?
- [ ] `shop.id` é UUID válido (não `shop-1`)?
- [ ] Logs de `serviceService.list` mostram sucesso?
- [ ] Logs de `productService.list` mostram sucesso?
- [ ] ShopSelector mostra lista de barbearias?

### Backend:
- [ ] Servidor rodando em `http://localhost:3000`?
- [ ] Endpoint `/api/barbershops/public` retorna JSON?
- [ ] Endpoint `/api/services/public/shop/:id` retorna JSON?
- [ ] Endpoint `/api/products/public/shop/:id` retorna JSON?
- [ ] CORS configurado corretamente?
- [ ] Banco de dados tem dados de teste?

---

## 🔧 Como Testar Endpoints Manualmente

### 1. Testar Barbearias:
```bash
curl http://localhost:3000/api/barbershops/public
```

Esperado:
```json
[
  {
    "id": "uuid-123",
    "name": "Barbearia Paulista",
    "address": "Av. Paulista, 1000",
    "active": true
  },
  ...
]
```

### 2. Testar Serviços:
```bash
# Substitua UUID_DA_BARBEARIA pelo ID real
curl http://localhost:3000/api/services/public/shop/UUID_DA_BARBEARIA
```

### 3. Testar Produtos:
```bash
curl http://localhost:3000/api/products/public/shop/UUID_DA_BARBEARIA
```

---

## 🆘 Último Recurso: Reset Completo

Se nada funcionar, reset total:

### Frontend:
```bash
cd frontend
# Limpar cache e node_modules
rm -rf node_modules .vite dist
npm install
npm run dev
```

### Backend:
```bash
cd backend
# Reset banco de dados
npx prisma migrate reset --force
npx prisma db seed  # Se tiver seed

# OU criar dados manualmente
npx prisma studio
```

### Navegador:
```javascript
// Console do navegador
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('barberpro');
location.reload();
```

---

## 📞 Como Reportar Problemas

Ao reportar problema, **SEMPRE** incluir:

1. **Prints do console completo** (com todos os logs)
2. **Resposta do backend** (`curl` nos endpoints acima)
3. **Navegador e versão** (Chrome 120, Firefox 121, etc.)
4. **Sistema operacional** (Windows 11, macOS, Linux)
5. **Passos para reproduzir** (sequência exata de cliques)

---

## 🎯 Exemplo de Report Bem Feito

```
PROBLEMA: Serviços não carregam na tela inicial

LOGS DO CONSOLE:
✅ Usando cache localStorage: 2 barbearias
🏠 Home: shop.id mudou para: abc-123-def
🔄 Home: Carregando serviços para shop: abc-123-def Barbearia Paulista
❌ Home: Erro ao carregar serviços: AxiosError
Status: 404
Data: { message: "Not Found" }

TESTE CURL:
$ curl http://localhost:3000/api/services/public/shop/abc-123-def
{"statusCode":404,"message":"Not Found"}

NAVEGADOR: Chrome 120
OS: Windows 11
PASSOS: 
1. Abrir http://localhost:3001
2. Aguardar 3 segundos
3. Serviços não aparecem
```

---

## ✅ Status Saudável (Tudo Funcionando)

Console deveria ter:
```
✅ Usando cache localStorage: 2 barbearias
✅ 2 barbearias carregadas: ["Barbearia A", "Barbearia B"]
🎯 Usando primeira barbearia válida do cache: Barbearia A
🏠 Home: shop.id mudou para: uuid-valido-123
🔄 Home: Carregando serviços para shop: uuid-valido-123 Barbearia A
🔍 serviceService.list: Buscando serviços para barbershopId: uuid-valido-123
✅ serviceService.list: 8 serviços retornados
✅ Home: 8 serviços carregados
(repetir para produtos)
```

Se você ver isso, **TUDO ESTÁ FUNCIONANDO PERFEITAMENTE**! 🎉
