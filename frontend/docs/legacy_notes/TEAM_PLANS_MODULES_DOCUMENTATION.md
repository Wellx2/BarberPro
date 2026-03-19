# Documentação: Sistema de Módulos e Planos de Assinatura

## 📋 Resumo das Implementações

Este documento descreve as novas funcionalidades implementadas no sistema BarberPro relacionadas ao gerenciamento de equipe, planos de assinatura e controle de módulos.

---

## ✅ 1. Gestão de Equipe (Team Management)

### 1.1 Tipos de Colaboradores
O sistema suporta os seguintes tipos de profissionais:
- **Barbeiro(a)** - `BARBER`
- **Cabelereiro(a)** - `HAIRDRESSER`
- **Manicure** - `MANICURIST`
- **Recepcionista** - `RECEPTIONIST`
- **Caixa** - `CASHIER`
- **Faxineiro(a)** - `CLEANER`
  **Outros** - `Other`

### 1.2 CRUD Completo de Colaboradores
- ✅ **Criar** novo colaborador com: nome, e-mail, telefone, cargo, especialidades, comissão, foto
- ✅ **Visualizar** todos os colaboradores em cards informativos
- ✅ **Editar** informações do colaborador
- ✅ **Ativar/Desativar** colaborador (soft toggle)
- ✅ **Excluir** colaborador com motivo obrigatório (soft delete)

### 1.3 Funcionalidade "Trancar Agenda"
Permite bloquear a agenda de um colaborador para:
- Férias
- Consultas médicas
- Treinamentos
- Outros motivos

**Fluxo:**
1. Selecionar colaborador
2. Informar data, horário inicial, horário final e motivo
3. Sistema verifica conflitos com agendamentos existentes
4. Se houver conflitos:
   - Mostra lista de agendamentos afetados
   - Permite confirmar mesmo assim
   - Ao confirmar, cancela os agendamentos e notifica clientes automaticamente
   - Sugere novas datas para remarcação
5. Se não houver conflitos, confirma o bloqueio imediatamente

---

## ✅ 2. Gestão de Planos de Assinatura (Para Clientes)

### 2.1 CRUD Completo de Planos
- ✅ **Criar** novo plano com:
  - Nome, preço, validade (meses)
  - Serviços inclusos
  - Produtos inclusos
  - Percentual de cashback
  - Descrição
- ✅ **Visualizar** todos os planos em cards
- ✅ **Editar** plano existente
- ✅ **Ativar/Desativar** plano
- ✅ **Excluir** plano (apenas se estiver inativo)

### 2.2 Interface
- Cards visuais com badges de status (Ativo/Inativo)
- Preview em tempo real durante criação/edição
- Planos inativos aparecem em grayscale
- Botão de exclusão desabilitado para planos ativos

---

## ✅ 3. Sistema de Planos de Assinatura da Barbearia

### 3.1 Estrutura de Planos

O sistema implementa **3 níveis de planos** que a BARBEARIA contrata do sistema:

#### 🔵 **Plano Simples**
**Recursos inclusos:**
- ✅ Sistema de agendamentos
- ✅ Gestão de equipe (até 3 funcionários)
- ✅ Fechamento de caixa
- ❌ Dashboard financeiro
- ❌ Relatórios de comissão
- ❌ Módulo de produtos
- ❌ Controle de estoque
- ❌ Relatórios avançados
- ❌ Análise com IA

#### 🟣 **Plano Plus**
**Recursos inclusos:**
- ✅ Todos os recursos do Simples
- ✅ Gestão de equipe (até 10 funcionários)
- ✅ Dashboard financeiro completo
- ✅ Relatórios de comissão (semanal, quinzenal, mensal)
- ❌ Módulo de produtos
- ❌ Controle de estoque
- ❌ Análise com IA

#### 🟡 **Plano Premium**
**Recursos inclusos:**
- ✅ Todos os recursos do Plus
- ✅ Gestão de equipe (ilimitada)
- ✅ Módulo de produtos completo
- ✅ Controle de estoque avançado
- ✅ Relatórios de produtos:
  - Produtos que mais saem
  - Produtos parados no estoque
- ✅ Relatórios financeiros (mensal, semanal, anual)
- ✅ Configuração personalizada pelo suporte
- ✅ Análise de posicionamento com IA
- ✅ Suporte prioritário

### 3.2 Aba de Configurações

Nova aba "Configurações" no painel administrativo que permite:

#### **Visualização do Plano Atual**
- Plano contratado (Simples/Plus/Premium)
- Data de validade
- Status (Ativo/Expirado/Suspenso)
- Lista de recursos inclusos

#### **Controle de Módulos**
Toggles para ativar/desativar funcionalidades:

1. **Planos para Clientes**
   - Permite criar e vender planos de assinatura aos clientes
   - Disponível em todos os planos

2. **Produtos**
   - Gestão completa de produtos e vendas
   - ⚠️ Disponível apenas no Plano Premium

3. **Caixa**
   - Sistema de fechamento e controle de caixa
   - Disponível em todos os planos

4. **Dashboard Financeiro**
   - Análises financeiras e saúde do negócio
   - ⚠️ Disponível apenas nos Planos Plus e Premium

5. **Relatórios Avançados**
   - Relatórios detalhados de vendas, estoque e comissões
   - ⚠️ Disponível apenas nos Planos Plus e Premium

---

## 📂 Novos Arquivos Criados

### 1. **teamService.ts**
```typescript
src/services/teamService.ts
```
Serviço completo para gerenciamento de equipe e bloqueio de agenda:
- CRUD de colaboradores
- Verificação de conflitos de agenda
- Criação de bloqueios de agenda
- Notificação de clientes afetados

### 2. **Tipos Atualizados em types.ts**
```typescript
// Novos tipos adicionados:
- TeamMember
- TeamMemberRole
- TEAM_ROLE_LABELS
- CreateTeamMemberDto
- UpdateTeamMemberDto
- AgendaLock
- CreateAgendaLockDto
- UpdateAgendaLockDto
- AgendaLockConflict
- ShopSubscriptionTier
- SHOP_TIER_LABELS
- ShopSubscription
- ShopFeatures
- Shop (atualizado com subscription e modulesEnabled)
- Plan (atualizado com campos adicionais)
```

---

## 🔌 Endpoints da API Necessários

### Team Management
```
POST   /team-members                    - Criar colaborador
GET    /team-members                    - Listar colaboradores
GET    /team-members/:id                - Buscar colaborador por ID
PATCH  /team-members/:id                - Atualizar colaborador
DELETE /team-members/:id                - Remover colaborador
PATCH  /team-members/:id/toggle-active  - Ativar/Desativar colaborador
GET    /team-members/:id/available-slots - Horários disponíveis
```

### Agenda Locks
```
POST   /agenda-locks/check-conflicts    - Verificar conflitos
POST   /agenda-locks                    - Criar bloqueio
GET    /agenda-locks                    - Listar bloqueios
PATCH  /agenda-locks/:id                - Atualizar bloqueio
DELETE /agenda-locks/:id                - Remover bloqueio
```

### Plans (Planos para Clientes)
```
GET    /plans                           - Listar planos
GET    /plans/:id                       - Buscar plano por ID
POST   /plans                           - Criar plano
PATCH  /plans/:id                       - Atualizar plano
DELETE /plans/:id                       - Excluir plano
PATCH  /plans/:id/toggle-active         - Ativar/Desativar plano
```

### Shop Configuration
```
PATCH  /barbershops/:id/modules         - Atualizar configuração de módulos
```

---

## 🎯 Estrutura de Dados

### Shop (Atualizado)
```typescript
{
  id: string;
  name: string;
  // ... outros campos
  subscription?: {
    tier: 'SIMPLE' | 'PLUS' | 'PREMIUM';
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
    features: {
      maxTeamMembers: number;
      hasAppointments: boolean;
      hasCashier: boolean;
      hasFinancialDashboard: boolean;
      hasCommissionReports: boolean;
      commissionReportPeriods: ('WEEKLY' | 'BIWEEKLY' | 'MONTHLY')[];
      hasProducts: boolean;
      hasInventory: boolean;
      hasProductReports: boolean;
      hasAdvancedReports: boolean;
      hasAIAnalysis: boolean;
      hasPrioritySupport: boolean;
      hasConfigurationSupport: boolean;
    }
  };
  settings: {
    showBarbers: boolean;
    subscriptionEnabled: boolean;
    allowPayOnLocation: boolean;
    modulesEnabled: {
      clientPlans: boolean;
      products: boolean;
      cashier: boolean;
      financial: boolean;
      reports: boolean;
    };
  };
}
```

### TeamMember
```typescript
{
  id: string;
  shopId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: TeamMemberRole;
  specialties?: string[];
  description?: string;
  commissionRate?: number;
  birthDate?: string;
  hireDate?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### AgendaLock
```typescript
{
  id: string;
  teamMemberId: string;
  teamMemberName?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  lockedBy: string;
  lockedByName?: string;
  conflictingAppointments?: Appointment[];
  notifiedClients?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

### Plan (Atualizado)
```typescript
{
  id: string;
  shopId: string;
  name: string;
  price: number;
  benefitMonths: number;
  benefitServices: number;
  benefitProducts: number;
  benefitMoneyback: number;
  description?: string;
  benefits: string[];
  discount: number;
  active: boolean;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🎨 Interface do Usuário

### Aba "Time"
- Grid responsivo de cards
- Cada card mostra:
  - Avatar do colaborador
  - Nome e cargo
  - Email e telefone
  - Especialidades (tags)
  - Taxa de comissão
  - Badge de status (Ativo/Inativo)
- Botões de ação:
  - Editar
  - Ativar/Desativar
  - Trancar Agenda
  - Excluir

### Aba "Planos"
- Grid responsivo de cards
- Cada card mostra:
  - Nome do plano
  - Preço em destaque
  - Validade
  - Lista de benefícios com checkmarks
  - Badge de status (Ativo/Inativo)
- Botões de ação:
  - Editar
  - Ativar/Desativar
  - Excluir

### Aba "Configurações"
- Card superior: Informações do plano da barbearia
  - Plano contratado (visual destacado)
  - Validade e status
  - Lista de recursos inclusos
- Card inferior: Controle de módulos
  - Toggle switch para cada módulo
  - Módulos bloqueados mostram "Requer upgrade"
  - Avisos visuais sobre limitações

---

## 🚀 Como Testar

### 1. Gestão de Equipe
```typescript
// No AdminDashboard, aba "Time":
1. Clicar em "Adicionar Colaborador"
2. Preencher formulário (nome, cargo, email, telefone, especialidades, comissão)
3. Salvar
4. Testar edição, ativar/desativar e exclusão
5. Testar "Trancar Agenda":
   - Selecionar colaborador ativo
   - Preencher data, horários e motivo
   - Clicar em "Verificar Conflitos"
   - Se houver conflitos, confirmar mesmo assim
```

### 2. Gestão de Planos
```typescript
// No AdminDashboard, aba "Planos":
1. Clicar em "Novo Plano"
2. Preencher: nome, preço, validade, benefícios
3. Ver preview em tempo real
4. Salvar
5. Testar ativar/desativar
6. Tentar excluir (só funciona se estiver inativo)
```

### 3. Configurações de Módulos
```typescript
// No AdminDashboard, aba "Configurações":
1. Ver informações do plano atual
2. Testar toggles de módulos
3. Observar módulos bloqueados (se não estiverem no plano)
```

---

## ⚠️ Considerações Importantes

### Controle de Acesso
- As funcionalidades de módulos devem ser verificadas tanto no **frontend** quanto no **backend**
- O backend deve validar o plano da barbearia antes de permitir operações
- Exemplo: Se a barbearia tem Plano Simples, não deve conseguir criar produtos mesmo que o toggle esteja ativado

### Migração de Dados
- Barbearias existentes devem ter um plano padrão atribuído
- Recomendação: Iniciar com "Plano Simples" ou permitir escolha durante onboarding
- Campo `shop.subscription` é opcional para retrocompatibilidade

### UX/UI
- Módulos bloqueados mostram claramente "Requer upgrade"
- Badges visuais diferenciam itens ativos/inativos
- Estados de loading durante chamadas à API
- Mensagens de erro amigáveis

---

## 📝 Próximos Passos

1. **Backend Implementation:**
   - Implementar todos os endpoints listados
   - Adicionar validação de planos nas rotas protegidas
   - Criar sistema de notificações para clientes afetados por bloqueio de agenda

2. **Melhorias Futuras:**
   - Página de upgrade de plano com comparativo
   - Sistema de billing/pagamento integrado
   - Analytics de uso de módulos
   - Relatórios personalizáveis por plano
   - Integração com IA para análises (Plano Premium)

3. **Testes:**
   - Testes unitários para services
   - Testes de integração para fluxos completos
   - Testes E2E para cenários críticos (bloqueio de agenda com conflitos)

---

## 📞 Suporte

Para dúvidas ou problemas relacionados a estas funcionalidades, consulte:
- Documentação da API: `/docs/api`
- Issues no GitHub: [github.com/Wellx2/BarberPro/issues]
- Email: suporte@barberpro.com

---

**Última atualização:** 13 de fevereiro de 2026  
**Versão:** 2.0.0
