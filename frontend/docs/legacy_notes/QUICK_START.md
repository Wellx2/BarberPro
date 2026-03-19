# 🚀 Quick Start - Testes Imediatos

## ⚡ Como Testar em 5 Minutos

### 1. **Garantir que o servidor está rodando**
```bash
cd "d:\Meus docs\Curso IA\barberpro\frontend"
npm run dev
# Deve estar rodando em http://localhost:3000
```

### 2. **Testar Geolocalização (ShopSelector)**

**Ação:**
1. Abra [http://localhost:3000](http://localhost:3000)
2. Clique na imagem/ícone da loja (ou botão que abre o modal)
3. Você deve ver:
   - ✅ Paulista com distância (ex: 2.5 km)
   - ✅ Morumbi com distância (ex: 8.9 km)
   - ✅ Botão azul "Encontrar meu local"
   - ✅ Botão cinza "Recalcular distâncias"

**Clique em "Encontrar meu local":**
- ✅ Navegador pede permissão de geolocalização
- ✅ Clique "Permitir"
- ✅ Distâncias podem atualizar (dependendo de sua localização)
- ✅ Se apenas 1 loja < 2km: Auto-seleciona e fecha

---

### 3. **Testar Deep Linking por Subdomain**

**Ação:**
1. Abra [http://paulista.barberpro.com:3000](http://paulista.barberpro.com:3000)
   - (Nota: Em produção sem :3000)
2. Verifique:
   - ✅ Nenhum modal de seleção (SÓ 1 loja = Paulista)
   - ✅ Título da aba deve ser "Paulista - Sistema de Agendamento"
   - ✅ Página carrega direto com Paulista

**Alternativa se subdomain não funcionar:**
1. Abra [http://localhost:3000?shopId=shop-2](http://localhost:3000?shopId=shop-2)
2. Verifique:
   - ✅ Morumbi auto-selecionado
   - ✅ Nenhum modal
   - ✅ Título mostra "Morumbi - ..."

---

### 4. **Testar Compartilhamento + QR Code**

**Pré-requisito:**
- Estar logado como Barbeiro ou Admin

**Ação:**
1. Abra [http://localhost:3000/barber/dashboard](http://localhost:3000/barber/dashboard)
   - Se não logado, faça login (qualquer credencial mock funciona)
2. Procure por botão "Compartilhar" (ícone Share2)
3. Clique em "Compartilhar"
4. Modal "Compartilhar Link" abre:
   - ✅ Link direto: `https://paulista.barberpro.com`
   - ✅ Link alternativo com query param
   - ✅ Botões: WhatsApp, E-mail
   - ✅ **Novo botão roxo: "Gerar QR Code"**

---

### 5. **Testar QR Code Generator**

**Ação:**
1. No modal "Compartilhar Link"
2. Clique em "Gerar QR Code" (botão roxo, col-span-2)
3. Novo modal abre: "PAULISTA - Gerar QR Code para agendamentos"

**Dentro do modal de QR Code:**
- ✅ QR Code visível (preto e branco, quadrado)
- ✅ Link codificado mostrado abaixo
- ✅ Botão "Baixar QR Code (PNG)" → Clique
  - Arquivo `qrcode-paulista.png` deve ser baixado
- ✅ Botão "Imprimir" → Clique
  - Abre preview de impressão do navegador
  - Mostra QR code formatado para imprimir
- ✅ Botão "Copiar link" → Clique
  - Toast deve aparecer "Link copiado para a área de transferência!"
  - Botão muda para verde com ✓ por 2 segundos

**Dicas e Tamanhos:**
- ✅ Seção "💡 Dicas de Uso" listando 5 dicas
- ✅ Seção "📏 Tamanhos Recomendados" com 4 opções

---

## 🔍 O Que Verificar

### ✅ Compilação
```bash
# Abra o terminal do VS Code (Ctrl + `)
# Verifique se há erros no console

Procure por:
- "error TS" → PROBLEMA
- "No errors found" → OK ✅
```

### ✅ Navegador Console
```
Abra DevTools (F12)
Aba "Console"

Procure por:
- ❌ Erros em vermelho
- ❌ "Cannot find module"
- ❌ "undefined is not a function"

Se não vê nada em vermelho = OK ✅
```

### ✅ Network (se QR Code não aparecer)
```
F12 → Network → Reload
Procure por requisições falhadas (em vermelho)
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Verifique console (F12). Se erro de `qrcode.react`, reinstale: `npm install qrcode.react` |
| Geolocalização não funciona | Verifique permissão do navegador. Em "Configurações > Privacidade > Localização" |
| Modal não fecha após selecionar loja | Verifique se apenas 1 loja está disponível. Se 2+, deve clicar manualmente |
| Distâncias não mostram | Autorize geolocalização e clique "Encontrar meu local" |
| Link no QR code está errado | Verifique `constants.ts` - shop.name deve estar correto |

---

## 📱 Testar em Mobile (Dev Tools)

1. Abra DevTools (F12)
2. Clique no ícone "Toggle device emulation" (Ctrl+Shift+M)
3. Selecione "iPhone 12" ou similar
4. Teste:
   - ✅ Modal ShopSelector responsivo
   - ✅ Botões são touchable (44x44px mín)
   - ✅ Texto legível sem scroll horizontal
   - ✅ QR Code Generator modal encaixa na tela

---

## ✨ Checklist de Sucesso

- [ ] ShopSelector mostra distâncias
- [ ] Botão "Encontrar meu local" funciona
- [ ] Deep linking com subdomain seleciona loja automática
- [ ] Deep linking com query param funciona
- [ ] Modal Compartilhar abre com botão QR Code
- [ ] QR Code Generator modal abre
- [ ] QR Code visível no modal
- [ ] Botão "Baixar" baixa PNG
- [ ] Botão "Imprimir" abre preview
- [ ] Botão "Copiar link" mostra toast ✓
- [ ] Zero erros no console do navegador
- [ ] Nenhum erro TS no compilador

---

## 🎯 Próximas Features (Já Planejadas)

Após validar isso, prontos para:
1. **Google OAuth** - Login social
2. **Ratings/Avaliações** - Clientes avaliam barbeiros
3. **Dark Mode** - Modo escuro
4. **Notifications** - Notificações em tempo real

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. **Verifique console (F12)** - Qual é o erro exato?
2. **Verifique Network** - Há requisições falhadas?
3. **Verifique compilação** - `npm run dev` mostra erro?
4. **Limpe cache** - Ctrl+Shift+Delete → Limpar dados do site

---

## 🎬 Demonstração Rápida

Se quiser demonstrar para alguém:

**Roteiro (2 minutos):**
1. Abra home → Mostre ShopSelector com distâncias
2. Clique "Encontrar meu local" → Autorize → Mostre atualização
3. Faça login como barbeiro
4. Clique "Compartilhar" no dashboard
5. Clique "Gerar QR Code"
6. Mostre QR Code → Clique "Baixar"
7. Mostre arquivo baixado
8. Volte → Clique "Imprimir" → Mostre preview formatado

**Resultado:** Pessoa vê:
- ✨ Geolocalização inteligente funcionando
- ✨ QR Code gerando em 2 cliques
- ✨ Download/Impressão prontos para usar

---

## 📊 Estrutura de Teste

```
Frontend
├── Home.tsx (Testa 1, 2)
├── BarberDashboard.tsx (Testa 3, 4, 5)
└── components/
    ├── ShopSelector.tsx (Geolocalização)
    ├── ShareLink.tsx (Compartilhamento)
    └── QRCodeGenerator.tsx (QR Code)
```

---

## 🚀 Ir para Produção

Quando estiver 100% confiante:

1. **Configurar DNS**
   - Adicionar wildcard subdomain: `*.barberpro.com`
   - Apontar para mesmo servidor

2. **Deploy**
   - `npm run build`
   - Upload para hospedagem
   - Testar com URLs reais

3. **Monitoramento**
   - Analytics de qual loja é mais acessada
   - Rastrear geolocalização (com consentimento)
   - Contabilizar QR codes gerados

---

**Pronto? Comece testando agora! 🎉**
