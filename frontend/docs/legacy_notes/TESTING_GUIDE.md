# 🧪 Guia de Testes - Integração Financeira

## 📚 Documentação Completa de QA

Este guia centraliza todos os recursos de teste criados para validar a integração do sistema financeiro.

---

## 📋 Tipos de Teste Disponíveis

### 1. 🔍 Validação Técnica Automatizada
**Arquivo:** `scripts/validate-financial-integration.js`  
**Tempo:** ~5 segundos  
**Objetivo:** Verificar estrutura de código, imports, exports e implementação

**Como executar:**
```bash
node scripts/validate-financial-integration.js
```

**O que valida:**
- ✅ Arquivos criados/modificados existem
- ✅ Exports corretos no financialService
- ✅ Imports corretos nos componentes
- ✅ Estados de loading implementados
- ✅ Tratamento de erro 401 implementado
- ✅ Remoção de código mock
- ✅ Uso correto da API

**Critério de sucesso:** Todas as verificações passam sem erros

---

### 2. 🧬 Testes Unitários
**Arquivo:** `src/services/__tests__/financialService.test.ts`  
**Tempo:** ~10 segundos  
**Objetivo:** Validar lógica do financialService isoladamente

**Como executar:**
```bash
npm test
# Ou específico:
npm test -- financialService.test.ts
```

**Cobertura:**
- ✅ getFinancialAnalytics com diferentes períodos
- ✅ getDailyCashierAnalytics com diferentes datas
- ✅ processInvoicePayment com todos os métodos (PIX, Cash, Credit, Debit)
- ✅ Cálculos de margem, prejuízo, ticket médio
- ✅ Edge cases (valores decimais, listas vazias)
- ✅ Tratamento de erros da API
- ✅ Validação de tipos TypeScript

**Critério de sucesso:** 100% dos testes passam

---

### 3. ⚡ Smoke Tests
**Arquivo:** `SMOKE_TEST_FINANCIAL.md`  
**Tempo:** 5-10 minutos  
**Objetivo:** Validação rápida pós-deploy que integração básica funciona

**Como executar:**
1. Abrir `SMOKE_TEST_FINANCIAL.md`
2. Seguir checklist de 8 testes
3. Marcar cada teste como Passou/Falhou

**Testes incluídos:**
1. Saúde Financeira carrega
2. Troca de período funciona
3. Caixa Operacional carrega
4. Navegação de data funciona
5. Processar pagamento funciona
6. Error handling funciona
7. Responsividade mobile
8. Dark mode funciona

**Critério de sucesso:** Todos os 8 testes passam

---

### 4. 🎯 Plano de QA Completo
**Arquivo:** `QA_FINANCIAL_INTEGRATION.md`  
**Tempo:** 1-2 horas  
**Objetivo:** Validação detalhada de todos os cenários

**Como executar:**
1. Abrir `QA_FINANCIAL_INTEGRATION.md`
2. Executar 32 casos de teste organizados em módulos
3. Documentar bugs encontrados
4. Preencher estatísticas

**Módulos testados:**
- 📊 Saúde Financeira (10 casos)
- 💰 Caixa Operacional (11 casos)
- ⚠️ Estados de Erro e Loading (5 casos)
- 📱 Responsividade e UX (4 casos)
- ⚡ Performance (2 casos)

**Critério de sucesso:** 
- Todos casos críticos passam
- Nenhum bug crítico
- Performance < 500ms
- Mobile/Tablet/Desktop funcionam

---

## 🚀 Fluxo Recomendado de Testes

### Fase 1: Desenvolvimento ✍️
```bash
# Durante implementação
npm test -- --watch
```
- Rodar testes unitários em modo watch
- Validar cada função enquanto desenvolve

### Fase 2: Pré-Commit 📝
```bash
# Antes de commitar
node scripts/validate-financial-integration.js
npm test
```
- Validação técnica automática
- Todos testes unitários devem passar
- Sem erros de compilação

### Fase 3: Pós-Deploy (Dev/Staging) 🚀
1. **Smoke Tests** (5-10 min)
   - Abrir `SMOKE_TEST_FINANCIAL.md`
   - Executar 8 testes rápidos
   - Se algum falhar → investigar antes de QA completo

2. **QA Completo** (1-2 horas)
   - Abrir `QA_FINANCIAL_INTEGRATION.md`
   - Executar todos os 32 casos de teste
   - Documentar bugs
   - Gerar relatório

### Fase 4: Pré-Produção 🎯
- Smoke tests novamente
- Validar em diferentes browsers (Chrome, Firefox, Safari, Edge)
- Validar em dispositivos reais (iOS, Android)
- Performance testing (Lighthouse)

---

## 📊 Matriz de Decisão

| Situação | Teste Recomendado | Tempo |
|----------|-------------------|-------|
| Desenvolvimento ativo | Testes unitários (watch) | Contínuo |
| Antes de commitar | Validação técnica + unitários | 15 seg |
| Após deploy em dev | Smoke tests | 5-10 min |
| Antes de homologação | QA completo | 1-2 horas |
| Hotfix crítico | Smoke tests | 5-10 min |
| Release para produção | QA completo + smoke em prod | 1-2 horas |

---

## 🐛 Reportando Bugs

Se encontrar bugs durante os testes, documente usando este template:

```markdown
### BUG-XXX: [Título curto]
**Severidade:** Crítico | Alto | Médio | Baixo
**Módulo:** Saúde Financeira | Caixa | API
**Caso de Teste:** TC-XXX

**Descrição:**
[Descreva o bug de forma clara]

**Passos para Reproduzir:**
1. ...
2. ...
3. ...

**Resultado Esperado:**
[O que deveria acontecer]

**Resultado Atual:**
[O que realmente acontece]

**Console Errors:**
```javascript
[Cole erros do console]
```

**Network:**
```
Request: GET /api/financial/analytics
Status: 500
Response: { error: "..." }
```

**Screenshot:**
[Anexar se possível]

**Ambiente:**
- Browser: Chrome 120
- OS: Windows 11
- Viewport: 1920x1080
```

---

## ✅ Critérios de Aceite Gerais

Para aprovar a integração para produção:

### Obrigatório ✅
- [ ] Validação técnica passa sem erros
- [ ] 100% testes unitários passam
- [ ] Smoke tests passam (8/8)
- [ ] Casos de teste críticos passam (TC-019, TC-024, TC-025)
- [ ] Nenhum erro no console em happy path
- [ ] Performance < 500ms nas APIs
- [ ] Funciona em Chrome, Firefox, Safari
- [ ] Responsivo mobile/tablet/desktop
- [ ] Dark mode funcional

### Desejável 🎯
- [ ] QA completo sem bugs críticos
- [ ] Máximo 2 bugs de alta severidade
- [ ] Performance < 300ms
- [ ] Lighthouse score > 90
- [ ] Acessibilidade WCAG AA
- [ ] Testes em dispositivos reais

---

## 📞 Suporte

**Dúvidas sobre testes?**
- Consultar [FINANCIAL_INTEGRATION_COMPLETE.md](./FINANCIAL_INTEGRATION_COMPLETE.md)
- Consultar [FINANCIAL_SYSTEM_DOCUMENTATION.md](./FINANCIAL_SYSTEM_DOCUMENTATION.md)
- Abrir issue no repositório

**Problemas com backend?**
- Verificar logs do NestJS
- Consultar documentação em `../backend/README.md`
- Verificar se seed foi executado

---

## 🔄 Manutenção dos Testes

### Quando atualizar os testes:

**Novos endpoints:**
- Adicionar testes unitários em `financialService.test.ts`
- Adicionar casos de teste em `QA_FINANCIAL_INTEGRATION.md`
- Atualizar validação em `validate-financial-integration.js`

**Mudanças na UI:**
- Atualizar casos de teste de UX no QA
- Atualizar screenshots se houver
- Validar responsividade novamente

**Mudanças no contrato da API:**
- Atualizar mocks nos testes unitários
- Atualizar interfaces TypeScript
- Revalidar todos os casos de teste

---

## 📈 Métricas de Qualidade

### Cobertura de Testes
| Módulo | Cobertura | Status |
|--------|-----------|--------|
| financialService.ts | 100% | ✅ |
| AdminDashboard (financial) | Manual QA | ✅ |
| Cashier | Manual QA | ✅ |

### Bugs por Severidade (Histórico)
| Severidade | Abertos | Fechados | Total |
|------------|---------|----------|-------|
| Crítico | 0 | 0 | 0 |
| Alto | 0 | 0 | 0 |
| Médio | 0 | 0 | 0 |
| Baixo | 0 | 0 | 0 |

---

**Última atualização:** 04/02/2026  
**Versão dos testes:** 1.0.0  
**Status:** ✅ Documentação completa
