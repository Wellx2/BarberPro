# 🔗 Deep Linking - Guia de Configuração

## Overview

O sistema de **Deep Linking por Subdomain** permite que barbeiros e administradores compartilhem links únicos que automaticamente selecionam a barbearia correta quando o cliente acessa.

---

## 🎯 Como Funciona

### Exemplo
- Cliente recebe link: `https://paulista.barberpro.com`
- Sistema detecta subdomain `paulista`
- Auto-seleciona a barbearia **Paulista**
- Cliente vê apenas essa barbearia ✅

---

## 📋 Configuração Necessária

### 1. DNS (Seu Domínio)

Para cada barbearia, configure um subdomain wildcard no seu DNS:

```
DNS Record (Wildcard):
*.barberpro.com    A    192.168.1.100
```

Ou subdomínios específicos:
```
paulista.barberpro.com     A    192.168.1.100
morumbi.barberpro.com      A    192.168.1.100
```

### 2. Servidor (Seu Servidor/Vercel)

Se usar **Vercel** ou similar, configure:
```
Domain: barberpro.com
Wildcard: *.barberpro.com
```

Se usar **seu servidor**, configure redirecionamento para aceitar qualquer subdomain.

### 3. Sistema Frontend

**JÁ IMPLEMENTADO** ✅

O código em `src/context/ShopContext.tsx` detecta automaticamente:

```tsx
// Detecta subdomain da URL
const hostname = window.location.hostname;
const subdomain = hostname.split('.')[0];

// Converte nome para slug (ex: "Paulista" → "paulista")
const slugify = (str: string) => 
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// Compara com nomes de lojas
const foundFromSubdomain = shops.find(s => slugify(s.name) === subdomain);
```

---

## 🚀 Como Usar

### Para Barbeiros:

1. Clique em **Compartilhar** no Dashboard
2. Copie o link subdomain (ex: `https://paulista.barberpro.com`)
3. Compartilhe via:
   - **WhatsApp**: Botão automático gera link formatado
   - **E-mail**: Botão automático prepara mensagem
   - **Redes Sociais**: Cole direto na bio/posts
   - **QR Code**: Imprima para colocar na barbearia

### Para Admins:

Mesmo processo no Admin Dashboard:

1. Clique em **Compartilhar**
2. Copie o link
3. Distribua para seus clientes

---

## 🔄 Fallbacks (Ordem de Precedência)

Se o subdomain não funcionar, o sistema tenta em ordem:

1. ✅ **Subdomain**: `paulista.barberpro.com`
2. ✅ **Query Param**: `?shopId=shop-123`
3. ✅ **LocalStorage**: Última unidade acessada
4. ✅ **Padrão**: Primeira unidade da lista

---

## 📝 Exemplos de Links

| Cenário | Link |
|---------|------|
| Deep Linking | `https://paulista.barberpro.com` |
| Query Param | `https://barberpro.com?shopId=shop-001` |
| Com Página | `https://paulista.barberpro.com/book` |

---

## ✨ Casos de Uso

### 1. Marketing por Whatsapp
```
Barbeiro envia:
"Oi! Agende seu corte por aqui: https://paulista.barberpro.com"
```

Cliente clica → Já vê apenas a agenda de Paulista ✅

### 2. Impressão de QR Code
```
Imprima QR com: https://paulista.barberpro.com
Cole na parede da barbearia
Cliente escaneia → Auto-abre Paulista
```

### 3. Bio no Instagram
```
Bio: "Agende em paulista.barberpro.com"
```

### 4. Email Marketing
```
Subject: "Agende seu corte em Paulista"
Body: "Clique aqui para agendar: paulista.barberpro.com"
```

---

## 🔒 Privacidade & Segurança

✅ **Não expõe outras barbearias**: Cada link é específico

✅ **Sem dados sensíveis**: Apenas seleciona a loja

✅ **Funciona offline**: Detecção local no browser

✅ **Responsável**: Clientes só veem sua barbearia

---

## 🛠️ Troubleshooting

### Problema: Link não funciona
**Solução**: 
- Verifique DNS (espere 24-48h para propagação)
- Use o link com Query Param como fallback: `?shopId=xxx`
- Teste em modo incógnito

### Problema: Subdomain vira "www"
**Solução**:
- Configure DNS corretamente
- Ou use Query Param como alternativa

### Problema: Detecta subdomain errado
**Solução**:
- Verifique slugify: "Paulista" → "paulista" ✅
- "Shopping Center" → "shopping-center" ✅
- Caracteres especiais são removidos

---

## 📱 Mobile-First

O sistema é **100% responsivo**:
- ✅ Funciona em iPhones/Android
- ✅ Abre em navegador, WhatsApp, etc
- ✅ Não requer app nativo

---

## 🎯 Próximas Implementações

- [ ] QR Code generator integrado
- [ ] Analytics de compartilhamentos
- [ ] Limite de acessos por link
- [ ] Agendamentos programados
- [ ] Campanhas de compartilhamento automático

---

## 📞 Suporte

Para dúvidas sobre Deep Linking:
1. Verifique configuração DNS
2. Teste URL manualmente
3. Use Query Param como fallback
4. Consulte logs do servidor
