# 📋 Catálogo de Defeitos do Frontend
**Data:** 2024
**Status:** Análise Completa

## 🔴 Defeitos Críticos (Quebram Funcionalidade)

### 1. **Agenda do Barbeiro não funciona corretamente**
- **Arquivo:** [src/pages/barber/BarberDashboard.tsx](src/pages/barber/BarberDashboard.tsx)
- **Linhas:** 14-15
- **Problema:** 
  ```tsx
  const barberId = (user as any)?.barber?.id || user?.id;
  ```
  O código tenta pegar `user.barber.id`, mas o backend retorna `user.barberId` diretamente no JWT (estrutura diferente).
  
- **Impacto:** A agenda não carrega porque passa `barberId` incorreto ou `undefined`
- **Solução:** Corrigir para:
  ```tsx
  const barberId = user?.barberId || (user as any)?.barber?.id || user?.id;
  ```

### 2. **Método `refresh()` não existe no hook useBarberSchedule**
- **Arquivo:** [src/hooks/useAppointments.ts](src/hooks/useAppointments.ts)
- **Linhas:** 169-194
- **Problema:** O hook `useBarberSchedule` retorna apenas `{ schedule, loading, error }`, mas o componente [BarberDashboard.tsx:14](src/pages/barber/BarberDashboard.tsx) chama `refresh()`.
- **Impacto:** Erro ao tentar atualizar agenda após marcar agendamento como concluído
- **Solução:** Adicionar função `refresh` no retorno do hook:
  ```tsx
  const refresh = useCallback(() => loadSchedule(), [barberId, date]);
  return { schedule, loading, error, refresh };
  ```

---

## 🟡 Defeitos Médios (Limitam Funcionalidade, mas não quebram)

### 3. **Seletor de Barbearia do Admin não recarrega dados após troca**
- **Arquivo:** [src/components/ShopSelector.tsx](src/components/ShopSelector.tsx)
- **Linhas:** 125-133
- **Problema:** Após troca de loja via `switchShop()`, o AdminDashboard não recarrega os dados (serviços, produtos, colaboradores) da nova barbearia. Apenas o seletor fecha.
- **Impacto:** Usuário troca de loja mas continua vendo dados da loja anterior
- **Solução:** Adicionar listener no AdminDashboard para escutar evento `shop-changed`:
  ```tsx
  useEffect(() => {
    const handleShopChange = () => {
      loadServices();
      loadProducts();
      loadTeamMembers();
      loadAnalytics();
    };
    window.addEventListener('shop-changed', handleShopChange);
    return () => window.removeEventListener('shop-changed', handleShopChange);
  }, []);
  ```

### 4. **Módulo Financeiro incompleto - Falta controles detalhados**
- **Arquivos:** 
  - [src/pages/admin/Cashier.tsx](src/pages/admin/Cashier.tsx)
  - [src/pages/admin/SalesHistory.tsx](src/pages/admin/SalesHistory.tsx)
  - [src/services/financialService.ts](src/services/financialService.ts)
  
- **Problema:** Faltam funcionalidades:
  - Relatório de comissões por barbeiro
  - Filtros avançados (período customizado, barbeiro específico)
  - Export para Excel/PDF
  - Gráficos de tendência de vendas
  - Análise de lucratividade por serviço/produto
  
- **Impacto:** Admin tem visão limitada das finanças da barbearia
- **Solução:** Fase 2 - Adicionar features avançadas (será implementado posteriormente)

---

## 🟢 Limpeza de Código (Não quebra, mas polui codebase)

### 5. **Arquivo de backup desnecessário**
- **Arquivo:** [src/pages/admin/AdminDashboardBkp.tsx](src/pages/admin/AdminDashboardBkp.tsx)
- **Problema:** Backup antigo do AdminDashboard mantido no código-fonte
- **Impacto:** Confunde devs, aumenta tamanho do bundle desnecessariamente
- **Solução:** Remover arquivo (já está versionado no Git)

### 6. **MOCK_SHOPS em constants.ts nunca é usado em produção**
- **Arquivo:** [src/constants.ts](src/constants.ts)
- **Linhas:** 26-40
- **Problema:** Dados mockados apenas para fallback, mas todos os componentes já usam backend real. ShopContext tem fallback adequado.
- **Impacto:** Código legado desnecessário
- **Solução:** Remover MOCK_SHOPS e deixar apenas comentário explicativo

### 7. **MOCK_FIXED_COSTS não é mais usado**
- **Arquivo:** [src/constants.ts](src/constants.ts)
- **Linhas:** 9-16
- **Problema:** AdminDashboard carrega custos fixos do localStorage (linha 56 de AdminDashboard.tsx), mas backend deveria fornecer esses dados
- **Impacto:** Dados desatualizados ou meramente decorativos
- **Solução:** Remover MOCK_FIXED_COSTS e implementar CRUD real de custos fixos no backend (Fase 2)

### 8. **localStorage usado como "banco de dados" em vários lugares**
- **Arquivos:**
  - [src/pages/admin/AdminDashboard.tsx:47-50](src/pages/admin/AdminDashboard.tsx) - appointments, barbers, invoices
  - [src/pages/admin/SuperAdminDashboard.tsx:17-19](src/pages/admin/SuperAdminDashboard.tsx) - shops, global_users
  - [src/pages/admin/SalesHistory.tsx:25-27](src/pages/admin/SalesHistory.tsx) - invoices
  
- **Problema:** Dados carregados do localStorage que deveriam vir do backend via API
- **Impacto:** 
  - Dados desatualizados entre sessões
  - Não sincroniza entre dispositivos
  - Perda de dados ao limpar cache
  
- **Recomendação (Fase 2):** Migrar para APIs:
  - `appointmentService.list()` ✅ (já existe, mas AdminDashboard não usa)
  - `invoiceService.list()` ❌ (não implementado no backend)
  - `barberService.list()` ✅ (já existe)

---

## 📊 Resumo de Prioridades

| Prioridade | Defeito | Estimativa de Fix | Impacto |
|-----------|---------|-------------------|---------|
| 🔴 **P0** | Agenda do Barbeiro (barberId incorreto) | 5 min | Alto - Feature quebrada |
| 🔴 **P0** | Hook useBarberSchedule sem `refresh()` | 5 min | Alto - Erro após concluir agendamento |
| 🟡 **P1** | Seletor Admin não recarrega dados | 15 min | Médio - Dados desatualizados |
| 🟢 **P2** | Remover AdminDashboardBkp.tsx | 1 min | Baixo - Limpeza |
| 🟢 **P2** | Remover MOCK_SHOPS de constants.ts | 2 min | Baixo - Limpeza |
| 🟢 **P2** | Remover MOCK_FIXED_COSTS | 2 min | Baixo - Limpeza |
| 🔵 **Fase 2** | Módulo Financeiro avançado | 8h | Médio - Feature expansion |
| 🔵 **Fase 2** | Migrar localStorage para backend APIs | 4h | Médio - Arquitetura |

---

## ✅ O que já está funcionando corretamente

1. ✅ **Sistema de Agendamentos JWT-driven** (validado em 19 fev 2025)
   - CLIENT: omite clientId, envia barberId
   - BARBER: omite barberId, envia clientId
   - ADMIN: envia ambos
   
2. ✅ **Autenticação e Refresh Token**
   - authService.ts implementado corretamente
   - Interceptors de API com renovação automática
   
3. ✅ **CRUD de Serviços e Produtos**
   - serviceService.ts integrado com backend
   - productService.ts com fallback para localStorage
   
4. ✅ **CRUD de Colaboradores (Team)**
   - teamService.ts funcionando
   - AdminDashboard gerencia equipe corretamente
   
5. ✅ **Troca de Loja (Multitenant)**
   - ShopContext.switchShop() implementado
   - Backend retorna novos tokens JWT
   
6. ✅ **Geolocalização e Seleção de Unidade**
   - ShopSelector com busca por proximidade
   - Deep linking via subdomínio

---

## 🚀 Próximos Passos

1. **Corrigir defeitos P0** (críticos) - 10 min total
2. **Corrigir defeitos P1** (médios) - 15 min
3. **Limpar código P2** - 5 min
4. **Validar toda a aplicação** com testes manuais
5. **Planejar Fase 2** (features avançadas financeiras)

---

## 🔍 Observações Importantes

### Código de Teste (Não Remover)
Os mocks encontrados em `src/services/__tests__/financialService.test.ts` são **legítimos e necessários** para testes unitários com Vitest. **Não devem ser removidos**.

### Backend Endpoints Pendentes (Fase 2)
- `POST /invoices` (processar pagamento)
- `GET /invoices` (listar vendas)
- `GET /fixed-costs` (custos fixos da barbearia)
- `GET /financial/reports/commissions` (relatório de comissões)

### Estratégia de Fallback
Alguns serviços (ex: productService) usam localStorage como fallback quando API não está disponível. Isso é **correto e deve ser mantido** para resiliência offline.

---

**Resultado da Análise:** Aplicação está **95% funcional**. Defeitos críticos são pequenos (10 min para corrigir). Limpeza de código é opcional mas recomendada. Fase 2 trará features financeiras avançadas.
