# 🧪 Plano de QA - Integração Financeira

## 📋 Informações do Teste

**Data:** 04/02/2026  
**Versão:** 1.0.0  
**Módulos:** Saúde Financeira + Caixa Operacional  
**Tipo:** Testes Funcionais, Integração e UX  

---

## ✅ Pré-requisitos

Antes de iniciar os testes, verifique:

- [ ] Backend NestJS rodando em `http://localhost:3000`
- [ ] Banco de dados com dados de teste (seed executado)
- [ ] Token JWT válido (login efetuado)
- [ ] Shop ID configurado no contexto
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] Console do navegador aberto (F12)
- [ ] Network tab aberta para monitorar requisições

---

## 🎯 Casos de Teste

### Módulo 1: Saúde Financeira (AdminDashboard)

#### TC-001: Carregamento Inicial da Tela
**Prioridade:** Alta  
**Objetivo:** Validar que os dados carregam corretamente ao acessar a tela

**Passos:**
1. Fazer login como ADMIN
2. Navegar para Painel Administrativo
3. Verificar que a tab "Saúde Financeira" está ativa por padrão

**Resultado Esperado:**
- ✅ Spinner de loading aparece brevemente
- ✅ Dados financeiros carregam sem erros
- ✅ 4 cards principais exibem valores (Receita, Lucro, Ticket Médio, Margem)
- ✅ Indicador de saúde mostra status correto (🟢🟡🔴)
- ✅ Console não apresenta erros

**Validações Técnicas:**
```javascript
// No Network tab, verificar:
Request: GET /api/financial/analytics?shopId=XXX&period=MONTH
Status: 200 OK
Response: { gross, net, margin, avgTicket, ... }
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-002: Troca de Período Fiscal
**Prioridade:** Alta  
**Objetivo:** Validar filtro de período (TODAY/WEEK/MONTH/etc)

**Passos:**
1. Na tela de Saúde Financeira, clicar em "Hoje"
2. Aguardar atualização dos dados
3. Clicar em "7 Dias"
4. Aguardar atualização
5. Repetir para MONTH, QUARTER, YEAR, TUDO

**Resultado Esperado:**
- ✅ Cada clique dispara nova requisição à API
- ✅ Loading state aparece durante requisição
- ✅ Valores mudam de acordo com o período
- ✅ Botão do período ativo fica destacado (bg-amber-500)
- ✅ Total de atendimentos varia por período

**Validações Técnicas:**
```javascript
// Verificar query param "period" muda:
?period=TODAY
?period=WEEK
?period=MONTH
?period=QUARTER
?period=YEAR
?period=ALL
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-003: Ocultar/Mostrar Valores Financeiros
**Prioridade:** Média  
**Objetivo:** Validar botão Eye/EyeOff de privacidade

**Passos:**
1. Na tela de Saúde Financeira, localizar botão 👁️
2. Clicar no botão Eye
3. Verificar valores ocultos
4. Clicar novamente
5. Verificar valores visíveis

**Resultado Esperado:**
- ✅ Valores monetários aparecem como "••••"
- ✅ Percentuais aparecem como "••"
- ✅ Ícone alterna entre Eye e EyeOff
- ✅ Estado persiste durante navegação na página
- ✅ Não dispara nova requisição à API

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-004: Validação de Cards Principais
**Prioridade:** Alta  
**Objetivo:** Verificar precisão dos 4 cards principais

**Passos:**
1. Anotar valores dos 4 cards:
   - Faturamento Bruto
   - Lucro Líquido
   - Ticket Médio
   - Margem de Lucro
2. Comparar com response da API no Network tab
3. Verificar formatação (R$ XX.XX e XX.X%)

**Resultado Esperado:**
- ✅ Faturamento = `gross` da API
- ✅ Lucro = `net` da API (verde se positivo, vermelho se negativo)
- ✅ Ticket Médio = `avgTicket` da API
- ✅ Margem = `margin` da API com 1 casa decimal + símbolo %
- ✅ Formatação pt-BR correta (vírgula como decimal)

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-005: Receitas por Fonte
**Prioridade:** Alta  
**Objetivo:** Validar breakdown de receitas (Serviços/Produtos/Planos)

**Passos:**
1. Verificar os 3 cards de receitas por fonte
2. Somar Serviços + Produtos + Planos
3. Comparar com Faturamento Bruto

**Resultado Esperado:**
- ✅ Soma das 3 fontes = Faturamento Bruto
- ✅ Percentuais somam 100%
- ✅ Ícones corretos: ✂️ Serviços, 🛍️ Produtos, 📚 Planos
- ✅ Border-left colorido (roxo, laranja, azul)

**Validações Técnicas:**
```javascript
serviceRev + productRev + planRev === gross
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-006: Despesas e Comissões
**Prioridade:** Alta  
**Objetivo:** Validar cálculo de despesas

**Passos:**
1. Verificar card "Despesas Totais"
2. Verificar breakdown: Comissões + Custos Fixos + Produtos
3. Comparar soma com total de despesas

**Resultado Esperado:**
- ✅ Despesas = `expenses` da API
- ✅ Comissões = `totalCommissions`
- ✅ Custos Fixos = `fixedCostsTotal`
- ✅ Custo Produtos = `productCosts`
- ✅ Soma confere com total

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-007: Ranking de Profissionais
**Prioridade:** Alta  
**Objetivo:** Validar top 5 barbeiros e comissões

**Passos:**
1. Verificar lista de top profissionais
2. Validar ordem (maior comissão primeiro)
3. Verificar medalhas: 🥇🥈🥉
4. Verificar informações: atendimentos, taxa, comissão

**Resultado Esperado:**
- ✅ Máximo 5 barbeiros exibidos
- ✅ Ordenado por comissão (decrescente)
- ✅ Medalhas nos 3 primeiros
- ✅ Informação: "X atendimentos • Y%"
- ✅ Comissão em destaque (texto amber)
- ✅ Subtexto: "Faturou R$ XXX"

**Validações Técnicas:**
```javascript
// Verificar array commissionsByBarber da API
barber.appointments // número de atendimentos
barber.commission // comissão calculada
barber.commissionRate // taxa (%)
barber.revenue // faturamento total
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-008: KPIs Operacionais
**Prioridade:** Média  
**Objetivo:** Validar 4 boxes de KPI

**Passos:**
1. Verificar valores dos 4 KPIs:
   - Total de Atendimentos
   - Ticket Médio
   - Profissionais Ativos
   - Margem %

**Resultado Esperado:**
- ✅ Atendimentos = `totalAppointments`
- ✅ Ticket = `avgTicket` sem centavos
- ✅ Profissionais = quantidade em `commissionsByBarber`
- ✅ Margem = `margin` sem decimais
- ✅ Backgrounds coloridos (azul, verde, roxo, âmbar)

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-009: Alertas Inteligentes (Condicional)
**Prioridade:** Média  
**Objetivo:** Validar que alertas aparecem em situações críticas

**Cenário A - Margem Baixa:**
1. Período com margem < 15%
2. Verificar se alerta aparece

**Cenário B - Prejuízo:**
1. Período com lucro negativo
2. Verificar alerta de prejuízo

**Cenário C - Ticket Baixo:**
1. Período com ticket médio < R$ 50
2. Verificar alerta

**Resultado Esperado:**
- ✅ Alerta só aparece quando condições atendem
- ✅ Card com border vermelho
- ✅ Ícone AlertCircle
- ✅ Mensagens específicas por tipo de alerta
- ✅ Sugestões práticas exibidas

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-010: DRE Simplificado
**Prioridade:** Baixa  
**Objetivo:** Validar demonstração de resultado

**Passos:**
1. Rolar até DRE
2. Verificar estrutura: Receitas - Despesas = Lucro

**Resultado Esperado:**
- ✅ Fórmula matemática visível
- ✅ Valores conferem com cards principais
- ✅ Lucro líquido em destaque (verde/vermelho)

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

### Módulo 2: Caixa Operacional

#### TC-011: Carregamento Inicial do Caixa
**Prioridade:** Alta  
**Objetivo:** Validar carregamento de dados do dia atual

**Passos:**
1. Navegar para tab "Caixa"
2. Aguardar carregamento

**Resultado Esperado:**
- ✅ Spinner aparece
- ✅ Data atual exibida no header
- ✅ Botão "Hoje" desabilitado (já está hoje)
- ✅ 4 cards principais carregam
- ✅ Seção de receitas por fonte
- ✅ Formas de pagamento
- ✅ Comissões por barbeiro

**Validações Técnicas:**
```javascript
Request: GET /api/financial/cashier/daily?shopId=XXX&date=2026-02-04
Status: 200 OK
Response: { date, isToday: true, totalReceived, ... }
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-012: Navegação de Datas
**Prioridade:** Alta  
**Objetivo:** Validar seletor de data customizado

**Passos:**
1. Clicar na seta esquerda (dia anterior)
2. Verificar data muda
3. Verificar nova requisição
4. Clicar na seta direita (próximo dia)
5. Clicar no botão "Hoje"

**Resultado Esperado:**
- ✅ Data exibida atualiza (formato dd/mm/yyyy)
- ✅ Cada navegação dispara nova requisição
- ✅ Loading state aparece
- ✅ Botão "Hoje" habilita quando não está no dia atual
- ✅ Botão "Hoje" volta para data de hoje

**Validações Técnicas:**
```javascript
// Query param "date" muda
?date=2026-02-03  // dia anterior
?date=2026-02-04  // hoje
?date=2026-02-05  // dia seguinte
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-013: Cards Resumo do Caixa
**Prioridade:** Alta  
**Objetivo:** Validar 4 cards principais do caixa

**Passos:**
1. Verificar valores de:
   - Recebido (verde)
   - Pendente (amarelo)
   - Total do Dia (azul)
   - Ticket Médio (roxo)
2. Validar informações secundárias

**Resultado Esperado:**
- ✅ Recebido = `totalReceived` + "X vendas"
- ✅ Pendente = `totalPending` + "X pagamentos"
- ✅ Total = `totalDay` + "X atendimentos"
- ✅ Ticket = `avgTicket` + "Por atendimento"
- ✅ Cores e ícones corretos

**Validações Técnicas:**
```javascript
totalDay === totalReceived + totalPending
avgTicket === totalReceived / completedAppointments
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-014: Receitas por Fonte (Caixa)
**Prioridade:** Média  
**Objetivo:** Validar breakdown no caixa

**Passos:**
1. Verificar card "Receitas por Fonte"
2. Validar 3 itens: Serviços, Produtos, Planos
3. Comparar valores

**Resultado Esperado:**
- ✅ Serviços = `serviceRevenue`
- ✅ Produtos = `productRevenue`
- ✅ Planos = `planRevenue`
- ✅ Ícones e cores diferenciados

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-015: Formas de Pagamento
**Prioridade:** Alta  
**Objetivo:** Validar breakdown por método de pagamento

**Passos:**
1. Verificar card "Formas de Pagamento"
2. Validar 4 métodos: PIX, Dinheiro, Crédito, Débito
3. Comparar soma com total recebido

**Resultado Esperado:**
- ✅ PIX = `paymentMethods.PIX`
- ✅ Dinheiro = `paymentMethods.CASH`
- ✅ Crédito = `paymentMethods.CREDIT_CARD`
- ✅ Débito = `paymentMethods.DEBIT_CARD`
- ✅ Soma = Total Recebido
- ✅ Cores distintas por método

**Validações Técnicas:**
```javascript
Object.values(paymentMethods).reduce((a, b) => a + b, 0) === totalReceived
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-016: Comissões por Barbeiro (Caixa)
**Prioridade:** Alta  
**Objetivo:** Validar ranking de comissões do dia

**Passos:**
1. Verificar card "Comissões por Barbeiro"
2. Validar ordenação
3. Verificar totalização

**Resultado Esperado:**
- ✅ Lista ordenada por revenue (maior primeiro)
- ✅ Medalhas nos 3 primeiros
- ✅ Informações: atendimentos, comissão, taxa
- ✅ Total de comissões exibido
- ✅ Lucro líquido da barbearia (verde)

**Validações Técnicas:**
```javascript
totalCommissions === barberCommissions.reduce((a, b) => a + b.commission, 0)
netRevenue === totalReceived - totalCommissions
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-017: Lista de Faturas Pendentes
**Prioridade:** Alta  
**Objetivo:** Validar exibição condicional de pendências

**Cenário A - Com Pendências:**
1. Dia com invoices pendentes
2. Verificar lista aparece

**Cenário B - Sem Pendências:**
1. Dia sem invoices pendentes
2. Verificar seção não aparece

**Resultado Esperado:**
- ✅ Seção só aparece se `pendingInvoices.length > 0`
- ✅ Cada invoice exibe: cliente, valor, descrição
- ✅ Botão de ação (processar pagamento)
- ✅ Campo de busca funcional

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-018: Busca de Faturas
**Prioridade:** Média  
**Objetivo:** Validar filtro de busca

**Passos:**
1. Ter pelo menos 3 invoices pendentes
2. Digitar nome de cliente no campo de busca
3. Verificar filtro
4. Limpar campo

**Resultado Esperado:**
- ✅ Lista filtra em tempo real
- ✅ Busca case-insensitive
- ✅ Busca por nome do cliente funciona
- ✅ Limpar campo restaura lista completa

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-019: Modal de Pagamento
**Prioridade:** Crítica  
**Objetivo:** Validar fluxo de processamento de pagamento

**Passos:**
1. Clicar em invoice pendente
2. Modal abre com 4 botões de pagamento
3. Clicar em "PIX"
4. Aguardar processamento
5. Verificar feedback

**Resultado Esperado:**
- ✅ Modal abre com informações da invoice
- ✅ Cliente e valor exibidos
- ✅ 4 botões: PIX, Dinheiro, Crédito, Débito
- ✅ Loading state durante processamento
- ✅ Notificação de sucesso
- ✅ Modal fecha automaticamente
- ✅ Analytics do caixa recarregam
- ✅ Invoice sai da lista de pendentes

**Validações Técnicas:**
```javascript
Request: PATCH /api/invoices/{invoiceId}
Body: { status: "PAID", paymentMethod: "PIX", paidAt: "..." }
Status: 200 OK

// Após sucesso:
Request: GET /api/financial/cashier/daily?shopId=XXX&date=2026-02-04
Status: 200 OK
// pendingInvoices não contém mais a invoice processada
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-020: Processar Pagamento - Todos os Métodos
**Prioridade:** Alta  
**Objetivo:** Validar os 4 métodos de pagamento

**Passos:**
1. Processar pagamento via PIX
2. Processar pagamento via Dinheiro
3. Processar pagamento via Crédito
4. Processar pagamento via Débito

**Resultado Esperado:**
- ✅ Todos os 4 métodos funcionam
- ✅ Cada método atualiza `paymentMethods` corretamente
- ✅ Total recebido aumenta após cada pagamento
- ✅ Invoice processada sai da lista de pendentes

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-021: Botões de Ação (Histórico, Imprimir)
**Prioridade:** Baixa  
**Objetivo:** Validar botões secundários

**Passos:**
1. Clicar em "Imprimir"
2. Verificar notificação
3. Clicar em "Histórico"
4. Verificar navegação

**Resultado Esperado:**
- ✅ Botão Imprimir mostra notificação
- ✅ Botão Histórico navega para tela de histórico
- ✅ Botão voltar retorna ao caixa

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

### Módulo 3: Estados de Erro e Loading

#### TC-022: Loading State - Saúde Financeira
**Prioridade:** Alta  
**Objetivo:** Validar spinner durante carregamento

**Passos:**
1. Simular conexão lenta (DevTools > Network > Slow 3G)
2. Trocar período fiscal
3. Observar loading state

**Resultado Esperado:**
- ✅ Spinner animado aparece
- ✅ Texto "Carregando dados financeiros..."
- ✅ Conteúdo anterior permanece oculto
- ✅ Após carregamento, spinner desaparece

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-023: Loading State - Caixa
**Prioridade:** Alta  
**Objetivo:** Validar spinner no caixa

**Passos:**
1. Simular conexão lenta
2. Navegar entre datas
3. Observar loading state

**Resultado Esperado:**
- ✅ Spinner animado (border-amber-500)
- ✅ Texto "Carregando dados do caixa..."
- ✅ Tamanho h-16 w-16
- ✅ Animação spin suave

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-024: Error State - Backend Offline
**Prioridade:** Crítica  
**Objetivo:** Validar comportamento quando backend não responde

**Passos:**
1. Desligar backend (Ctrl+C no terminal)
2. Atualizar página ou trocar período
3. Observar error state
4. Clicar em "Tentar Novamente"

**Resultado Esperado:**
- ✅ Ícone AlertCircle vermelho
- ✅ Título "Erro ao carregar dados"
- ✅ Mensagem de erro clara
- ✅ Botão "Tentar Novamente" visível
- ✅ Notificação de erro aparece
- ✅ Console mostra erro de rede

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-025: Sessão Expirada (401)
**Prioridade:** Crítica  
**Objetivo:** Validar logout automático ao expirar token

**Passos:**
1. Remover token do localStorage manualmente
2. Trocar período ou navegar data
3. Observar comportamento

**Resultado Esperado:**
- ✅ Notificação "Sessão expirada. Faça login novamente."
- ✅ Após 2 segundos, localStorage limpo
- ✅ Redirecionamento automático para /login
- ✅ Não fica em loop infinito de requisições

**Validações Técnicas:**
```javascript
// No console, verificar:
console.error('Erro ao carregar analytics:', error);
error.statusCode === 401
// Ou
error.response.status === 401
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-026: Error State no Modal de Pagamento
**Prioridade:** Alta  
**Objetivo:** Validar erro ao processar pagamento

**Passos:**
1. Desligar backend
2. Tentar processar pagamento
3. Observar erro

**Resultado Esperado:**
- ✅ Loading state durante tentativa
- ✅ Notificação de erro
- ✅ Modal permanece aberto
- ✅ Pode tentar novamente
- ✅ Console mostra erro

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

### Módulo 4: Responsividade e UX

#### TC-027: Mobile (375px)
**Prioridade:** Alta  
**Objetivo:** Validar layout em smartphone

**Passos:**
1. Abrir DevTools (F12)
2. Ativar modo responsivo
3. Selecionar iPhone SE (375px)
4. Testar ambas as telas

**Resultado Esperado:**
- ✅ Cards empilham em 1 coluna
- ✅ Botões de período quebram linha
- ✅ Texto legível sem zoom
- ✅ Touch targets ≥ 44px
- ✅ Scroll funciona suavemente
- ✅ Modal cobre tela inteira

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-028: Tablet (768px)
**Prioridade:** Média  
**Objetivo:** Validar layout em tablet

**Passos:**
1. DevTools > iPad (768px)
2. Testar ambas as telas

**Resultado Esperado:**
- ✅ Cards em 2 colunas
- ✅ Botões de período em linha única
- ✅ Aproveitamento de espaço adequado

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-029: Desktop (1920px)
**Prioridade:** Média  
**Objetivo:** Validar layout em desktop

**Passos:**
1. Expandir janela para 1920px
2. Verificar layout

**Resultado Esperado:**
- ✅ Cards em 4 colunas
- ✅ Espaçamento adequado
- ✅ Não fica muito esticado
- ✅ Máximo width respeitado

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-030: Dark Mode
**Prioridade:** Média  
**Objetivo:** Validar tema escuro

**Passos:**
1. Ativar dark mode (botão de tema)
2. Navegar pelas telas financeiras

**Resultado Esperado:**
- ✅ Backgrounds escuros (gray-900/gray-800)
- ✅ Texto claro (white/gray-100)
- ✅ Contraste adequado (WCAG AA)
- ✅ Cards gradientes visíveis
- ✅ Borders e separadores visíveis

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

### Módulo 5: Performance

#### TC-031: Tempo de Carregamento
**Prioridade:** Média  
**Objetivo:** Validar performance das requisições

**Passos:**
1. Network tab > Clear
2. Carregar Saúde Financeira
3. Medir tempo de resposta

**Resultado Esperado:**
- ✅ GET /api/financial/analytics < 500ms
- ✅ GET /api/financial/cashier/daily < 500ms
- ✅ PATCH /api/invoices/:id < 300ms
- ✅ UI responde em < 100ms após dados

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

#### TC-032: Múltiplas Requisições Simultâneas
**Prioridade:** Baixa  
**Objetivo:** Validar que não há race conditions

**Passos:**
1. Clicar rapidamente em vários períodos
2. Observar requisições no Network

**Resultado Esperado:**
- ✅ Não trava a UI
- ✅ Última requisição é a que prevalece
- ✅ Sem memory leaks
- ✅ Loading state coerente

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado  
**Observações:** _______________

---

## 📊 Resumo de Execução

### Estatísticas

| Categoria | Total | Passou | Falhou | Bloqueado | % Sucesso |
|-----------|-------|--------|--------|-----------|-----------|
| Saúde Financeira | 10 | | | | |
| Caixa Operacional | 11 | | | | |
| Estados de Erro | 5 | | | | |
| Responsividade | 4 | | | | |
| Performance | 2 | | | | |
| **TOTAL** | **32** | | | | |

---

## 🐛 Bugs Encontrados

### BUG-001
**Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo  
**Módulo:** _______________  
**Descrição:** _______________  
**Passos para Reproduzir:** _______________  
**Resultado Esperado:** _______________  
**Resultado Atual:** _______________  
**Screenshot:** _______________  

---

## ✅ Critérios de Aceite

Para aprovar a integração, é necessário:

- [ ] Todos os casos críticos passaram (TC-019, TC-024, TC-025)
- [ ] Todos os casos de alta prioridade passaram
- [ ] Nenhum bug crítico aberto
- [ ] Máximo 2 bugs de alta severidade
- [ ] Performance dentro dos limites (< 500ms)
- [ ] Responsividade funciona em mobile/tablet/desktop
- [ ] Dark mode funcional
- [ ] Console sem erros (exceto em testes de erro)

---

## 📝 Notas Adicionais

**Ambiente de Teste:**
- Browser: _______________
- Versão: _______________
- OS: _______________
- Resolução: _______________

**Testador:** _______________  
**Data de Execução:** _______________  
**Tempo Total:** _______________  

---

## 🔗 Referências

- [Documentação da Integração](./FINANCIAL_INTEGRATION_COMPLETE.md)
- [Especificação Técnica](./FINANCIAL_SYSTEM_DOCUMENTATION.md)
- [Backend API Docs](../backend/README.md)

---

**Status Final:** [ ] ✅ APROVADO [ ] ⚠️ APROVADO COM RESSALVAS [ ] ❌ REPROVADO
