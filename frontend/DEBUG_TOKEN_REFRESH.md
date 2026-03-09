# 🔍 Debug - Refresh Token Não Funciona

## Logs Adicionados

Com os logs que acabei de adicionar, você conseguirá ver exatamente o que está acontecendo:

### 1. No Login
```
🔐 Login response: { hasAccessToken: true, hasRefreshToken: true, user: {...} }
✅ Tokens salvos no localStorage
```

### 2. Quando Token Expira
```
🔄 Token expirado. Tentando renovar...
📤 Enviando refresh token: eyJhbGciOiJIUzI1Ni...
✅ Resposta do refresh: { access_token: "..." }
✅ Token renovado com sucesso!
```

### 3. Se Falhar
```
❌ Falha ao renovar token: 401 { message: "Invalid refresh token" }
🚪 Limpando sessão e redirecionando para login...
```

## Como Debugar

### Passo 1: Abra o Console do Navegador
```
F12 → Console
```

### Passo 2: Faça Login
Veja se aparece:
```
✅ Tokens salvos no localStorage
```

### Passo 3: Verifique os Tokens no LocalStorage
```javascript
// Cole no console:
console.log('Token:', localStorage.getItem('token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

### Passo 4: Tente Editar um Produto
Espere aparecer os logs do refresh automático.

## Possíveis Problemas

### ❌ Problema 1: Backend Retorna Formato Diferente
**Sintoma:** Log mostra `❌ Resposta do refresh não contém token`

**Solução:** Verificar o que o backend está retornando:
```typescript
// O backend pode retornar:
{ access_token: "..." }  // ✅ Suportado
{ accessToken: "..." }   // ✅ Suportado
{ token: "..." }         // ❌ NÃO suportado
```

### ❌ Problema 2: Refresh Token Inválido
**Sintoma:** `❌ Falha ao renovar token: 401`

**Causas possíveis:**
1. Refresh token expirou (7 dias)
2. Formato incorreto (deveria ser camelCase)
3. Backend não encontra o usuário

**Teste manual no console:**
```javascript
const refreshToken = localStorage.getItem('refresh_token');

fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
})
.then(r => r.json())
.then(data => console.log('Resposta:', data))
.catch(err => console.error('Erro:', err));
```

### ❌ Problema 3: CORS
**Sintoma:** Erro de CORS no console

**Verificar no backend:**
```typescript
// main.ts deve ter:
app.enableCors({
  origin: ['http://localhost:5173'], // ← Porta do frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### ❌ Problema 4: Endpoint Errado
**Sintoma:** 404 Not Found

**Verificar:**
- Backend rodando na porta 3000? ✅
- Endpoint `/auth/refresh` existe? ✅
- URL base correta? `http://localhost:3000`

## Teste Completo

### 1. Limpe o Cache
```javascript
// Cole no console:
localStorage.clear();
location.reload();
```

### 2. Faça Login Novamente
Anote os logs que aparecem.

### 3. Cole o Refresh Token no jwt.io
```
https://jwt.io
```

Verifique:
- ✅ Token está válido (exp > data atual)?
- ✅ Contém campos: sub, email, role?

### 4. Edite um Produto
Acompanhe os logs do console.

## Solução Rápida: Aumentar Tempo do Token (Temporário)

Se quiser testar sem refresh, aumente o tempo no backend:

```typescript
// backend/src/auth/auth.service.ts
access_token: this.jwtService.sign(payload, {
  expiresIn: '24h' // ← Era 15m
}),
```

**⚠️ Isso é apenas para debug! Em produção use 15m.**

## Próximos Passos

1. **Rode o frontend** com console aberto
2. **Faça login** e veja os logs
3. **Edite um produto** e observe o refresh
4. **Copie os logs** que aparecerem e me envie

Eu ajudarei a identificar exatamente onde está falhando! 🕵️
