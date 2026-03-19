# ⚡ Smoke Tests - Integração Financeira

## 🎯 Objetivo
Testes rápidos (5-10 min) para validar que a integração básica está funcionando após deploy.

---

## ✅ Checklist Rápido

### Pré-requisitos (30 segundos)
- [ ] Backend rodando (`http://localhost:3000`)
- [ ] Frontend rodando (`http://localhost:5173`)
- [ ] Usuário ADMIN logado
- [ ] Console do navegador aberto (F12)

---

### Teste 1: Saúde Financeira Carrega (1 min)
1. [ ] Acessar Painel Administrativo
2. [ ] Tab "Saúde Financeira" carrega automaticamente
3. [ ] Spinner aparece brevemente
4. [ ] 4 cards principais exibem valores
5. [ ] Console sem erros vermelhos
6. [ ] Network: `GET /api/financial/analytics` retorna 200

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 2: Troca de Período (30 seg)
1. [ ] Clicar em "Hoje"
2. [ ] Clicar em "30 Dias"
3. [ ] Valores mudam
4. [ ] Sem erros no console

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 3: Caixa Operacional (1 min)
1. [ ] Navegar para tab "Caixa"
2. [ ] Data de hoje aparece no header
3. [ ] 4 cards carregam (Recebido, Pendente, Total, Ticket)
4. [ ] Comissões por barbeiro visíveis
5. [ ] Network: `GET /api/financial/cashier/daily` retorna 200

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 4: Navegação de Data (30 seg)
1. [ ] Clicar na seta ← (dia anterior)
2. [ ] Data muda
3. [ ] Valores atualizam
4. [ ] Clicar em "Hoje"
5. [ ] Volta para data atual

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 5: Processar Pagamento (1 min)
1. [ ] Verificar se há invoices pendentes
2. [ ] Se não houver, pular este teste ⏭️
3. [ ] Clicar em uma invoice pendente
4. [ ] Modal abre
5. [ ] Clicar em "PIX"
6. [ ] Loading aparece
7. [ ] Notificação de sucesso
8. [ ] Invoice sai da lista
9. [ ] Network: `PATCH /api/invoices/:id` retorna 200

**✅ PASSOU** | **❌ FALHOU** | **⏭️ PULADO**

---

### Teste 6: Error Handling (1 min)
1. [ ] Desligar backend (Ctrl+C)
2. [ ] Trocar período fiscal
3. [ ] Error state aparece
4. [ ] Mensagem clara de erro
5. [ ] Botão "Tentar Novamente" visível
6. [ ] Religar backend
7. [ ] Clicar em "Tentar Novamente"
8. [ ] Dados carregam normalmente

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 7: Responsividade Mobile (1 min)
1. [ ] Abrir DevTools (F12)
2. [ ] Ativar device toolbar
3. [ ] Selecionar iPhone SE
4. [ ] Verificar Saúde Financeira
5. [ ] Cards empilham em 1 coluna
6. [ ] Texto legível
7. [ ] Verificar Caixa
8. [ ] Tudo acessível e legível

**✅ PASSOU** | **❌ FALHOU**

---

### Teste 8: Dark Mode (30 seg)
1. [ ] Ativar dark mode
2. [ ] Verificar Saúde Financeira
3. [ ] Backgrounds escuros
4. [ ] Texto legível (contraste ok)
5. [ ] Verificar Caixa
6. [ ] Tudo visível em dark mode

**✅ PASSOU** | **❌ FALHOU**

---

## 📊 Resultado Final

**Total de testes:** 8  
**Passaram:** ___  
**Falharam:** ___  
**Pulados:** ___  

**Tempo total:** ___ minutos

---

## ✅ Critério de Aprovação

Para aprovar em smoke test:
- [ ] Todos os testes marcados como "PASSOU"
- [ ] Nenhum erro crítico no console
- [ ] Requisições retornam 200 OK
- [ ] UI responsiva funciona

---

## 🚨 Se algum teste falhou

1. **Verificar logs do backend** no terminal
2. **Verificar console do browser** para erros JavaScript
3. **Verificar Network tab** para falhas de requisição
4. **Consultar** [QA_FINANCIAL_INTEGRATION.md](./QA_FINANCIAL_INTEGRATION.md) para testes detalhados
5. **Reportar bug** com detalhes completos

---

## 📝 Notas Rápidas

**Testador:** _______________  
**Data:** _______________  
**Build:** _______________  
**Browser:** _______________  

**Observações:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Status:** [ ] ✅ SMOKE TEST APROVADO [ ] ❌ REQUER INVESTIGAÇÃO
