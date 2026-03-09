# 🎯 BarberPro - Análise Completa do Sistema e Roadmap MVP

## 📊 Status Atual da Implementação

### ✅ COMPLETO (Frontend + Backend)

#### Autenticação & Autorização
- [x] Login com JWT
- [x] Refresh Token
- [x] Roles: CLIENT, BARBER, ADMIN, SUPER_ADMIN
- [x] Guards e middleware de autorização
- [x] Multi-tenant (shopId no JWT)

#### Gestão de Barbearias
- [x] CRUD de barbearias (backend)
- [x] Listagem pública de unidades
- [x] Troca de unidade (frontend implementado)
- [x] Deep linking (subdomain + query params)
- [x] Geolocalização

#### Gestão de Equipe
- [x] CRUD de barbeiros/colaboradores
- [x] Roles de equipe (BARBER, MANAGER)
- [x] Modelos de trabalho (Comissão, Salário, Aluguel cadeira)
- [x] Bloqueio de agenda (frontend + backend)
- [x] Verificação de conflitos de horários

#### Gestão de Serviços
- [x] CRUD de serviços
- [x] Categorização
- [x] Preços e durações
- [x] Ativar/desativar serviços

#### Gestão de Produtos
- [x] CRUD de produtos
- [x] Controle de estoque
- [x] Movimentações de estoque
- [x] Alertas de estoque mínimo
- [x] Código de barras

#### Gestão de Planos
- [x] CRUD de planos de assinatura
- [x] Benefícios configuráveis
- [x] Visualização de planos na Home

#### Financeiro (Parcial)
- [x] Dashboard financeiro (analytics)
- [x] Caixa (registrar vendas)
- [x] Histórico de vendas
- [x] Notas fiscais (invoices)
- [x] Relatórios por período

#### UI/UX
- [x] Layout responsivo
- [x] Dark mode
- [x] Componentes reutilizáveis
- [x] Feedback visual (toasts, alerts)
- [x] Loading states
- [x] Error handling

---

### ⚠️ PARCIALMENTE IMPLEMENTADO

#### Agendamentos
- [x] **Frontend**: Tela de agendamento na Home
- [x] **Frontend**: Seleção de serviço, barbeiro, horário
- [ ] **Backend**: API de appointments (precisa melhorias)
- [ ] **Backend**: Validações de conflito de horário
- [ ] **Backend**: Notificações de agendamento
- [ ] **Integração**: Frontend → Backend (atualmente usa mock)

#### Dashboard Cliente
- [x] **Frontend**: Estrutura básica
- [ ] **Backend**: Endpoints específicos para cliente
- [ ] **Funcionalidade**: Meus agendamentos (precisa API)
- [ ] **Funcionalidade**: Histórico de serviços
- [ ] **Funcionalidade**: Gerenciar assinatura

#### Dashboard Barbeiro
- [x] **Frontend**: Estrutura básica
- [ ] **Backend**: Endpoints específicos para barbeiro
- [ ] **Funcionalidade**: Agenda do dia (precisa API)
- [ ] **Funcionalidade**: Marcar serviço como concluído
- [ ] **Funcionalidade**: Comissões do mês

---

### ❌ NÃO IMPLEMENTADO (CRÍTICO PARA MVP)

#### 1. Sistema de Agendamentos Completo

**Backend - API de Appointments**
```typescript
❌ POST   /api/v1/appointments           - Criar agendamento
❌ GET    /api/v1/appointments          - Listar agendamentos
❌ GET    /api/v1/appointments/:id      - Buscar por ID
❌ PATCH  /api/v1/appointments/:id      - Atualizar status
❌ DELETE /api/v1/appointments/:id      - Cancelar agendamento
❌ GET    /api/v1/appointments/barber/:id - Agenda do barbeiro
❌ GET    /api/v1/appointments/client/:id - Agendamentos do cliente
```

**Database - Tabelas**
```sql
❌ appointments
❌ appointment_services (relação N:N com services)
```

**Frontend - Integrações**
```tsx
❌ src/pages/Booking.tsx         - Integrar com API real
❌ src/pages/client/*            - Dashboard cliente com agendamentos
❌ src/pages/barber/*            - Dashboard barbeiro com agenda
```

#### 2. Fluxo Agendamento → Financeiro

**Problema Atual**: Não existe conexão entre agendamentos e sistema financeiro.

**O que precisa**:
```typescript
❌ Quando barbeiro marca serviço como "CONCLUÍDO":
   - Appointment.status = "COMPLETED"
   - Appointment.payment_status = "PENDING"
   
❌ No Caixa, admin vê serviços concluídos pendentes:
   - GET /appointments?status=COMPLETED&paymentStatus=PENDING
   
❌ Ao registrar pagamento:
   - POST /sales (cria venda vinculada ao appointment)
   - UPDATE appointment SET payment_status = "PAID"
   - Gera invoice automático
```

#### 3. Ordem de Serviço (Service Order)

**Funcionalidade**: Documento que barbeiro recebe ao iniciar atendimento.

```typescript
❌ Frontend: Componente ServiceOrder
   - Dados do cliente
   - Serviços contratados
   - Observações
   - QR Code para pagamento (PIX)
   
❌ Backend: Endpoint para gerar ordem
   GET /appointments/:id/service-order
   
❌ Impressão/PDF: Gerar documento para impressão
```

#### 4. Dashboard Cliente Funcional

```tsx
❌ src/pages/client/ClientDashboard.tsx
   - Meus próximos agendamentos
   - Histórico de serviços
   - Plano ativo (se tiver)
   - Serviços restantes no plano
   - Barbeiros favoritos
   - Botão "Novo Agendamento"
```

#### 5. Dashboard Barbeiro Funcional

```tsx
❌ src/pages/barber/BarberDashboard.tsx
   - Agenda do dia (timeline visual)
   - Próximo cliente
   - Botão "Iniciar atendimento"
   - Botão "Concluir atendimento"
   - Resumo de comissões do mês
   - Avaliações recebidas
```

#### 6. Notificações

```typescript
❌ Email: Confirmação de agendamento
❌ Email: Lembrete 24h antes
❌ SMS/WhatsApp: Lembrete 1h antes
❌ Push: Notificação para barbeiro (novo agendamento)
```

#### 7. Sistema de Avaliações

```sql
❌ Tabela: reviews
   - appointment_id
   - client_id
   - barber_id
   - rating (1-5)
   - comment
   
❌ Atualizar rating médio do barbeiro
❌ Exibir avaliações no perfil do barbeiro
```

---

## 🎯 Roadmap MVP - Prioridades

### Sprint 1 (1-2 semanas) - CRÍTICO ⚠️

#### API de Appointments (Backend)

**Arquivo**: `backend/src/appointments/appointments.module.ts` (criar)

```typescript
// 1. Criar módulo Appointments
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentService]),
    ServicesModule,
    TeamModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
```

**Tarefas**:
- [ ] Criar entidade `Appointment`
- [ ] Criar entidade `AppointmentService` (relação N:N)
- [ ] Implementar DTOs (Create, Update, Filter)
- [ ] Implementar service com validações
- [ ] Implementar controller com todos os endpoints
- [ ] Adicionar TenantGuard (multi-tenant)
- [ ] Validar conflitos de horário
- [ ] Testes unitários

**Estimativa**: 3-4 dias

#### Integração Frontend → Appointments API

**Arquivo**: `frontend/src/services/appointmentService.ts` (atualizar)

```typescript
// 2. Remover mock e usar API real
export const appointmentService = {
  async create(data: CreateAppointmentDto) {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  
  async list(filters?: AppointmentFilters) {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  },
  
  async getById(id: string) {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  
  async updateStatus(id: string, status: AppointmentStatus) {
    const response = await api.patch(`/appointments/${id}`, { status });
    return response.data;
  },
  
  async cancel(id: string, reason: string) {
    const response = await api.delete(`/appointments/${id}`, { data: { reason } });
    return response.data;
  },
  
  async getBarberSchedule(barberId: string, date: string) {
    const response = await api.get(`/appointments/barber/${barberId}`, {
      params: { date }
    });
    return response.data;
  },
  
  async getClientAppointments(clientId: string) {
    const response = await api.get(`/appointments/client/${clientId}`);
    return response.data;
  },
};
```

**Tarefas**:
- [ ] Atualizar `appointmentService.ts`
- [ ] Atualizar componente `Booking.tsx`
- [ ] Adicionar loading states
- [ ] Adicionar error handling
- [ ] Validar dados antes de enviar
- [ ] Feedback visual ao usuário

**Estimativa**: 2 dias

#### Dashboard Cliente

**Arquivo**: `frontend/src/pages/client/ClientDashboard.tsx` (criar/atualizar)

```tsx
export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    // Carregar agendamentos
    const appts = await appointmentService.getClientAppointments(user.id);
    setAppointments(appts);
    
    // Carregar assinatura ativa (se houver)
    const sub = await subscriptionService.getActive(user.id);
    setSubscription(sub);
  };
  
  return (
    <Container>
      {/* Próximos agendamentos */}
      <Card>
        <h2>Próximos Agendamentos</h2>
        {appointments.filter(a => a.status === 'CONFIRMED').map(appt => (
          <AppointmentCard key={appt.id} appointment={appt} />
        ))}
      </Card>
      
      {/* Plano ativo */}
      {subscription && (
        <Card>
          <h2>Meu Plano</h2>
          <p>Serviços restantes: {subscription.remainingServices}</p>
          <p>Válido até: {subscription.endDate}</p>
        </Card>
      )}
      
      {/* Botão novo agendamento */}
      <Button onClick={() => navigate('/booking')}>
        Novo Agendamento
      </Button>
    </Container>
  );
};
```

**Tarefas**:
- [ ] Criar estrutura do dashboard
- [ ] Listar próximos agendamentos
- [ ] Mostrar histórico
- [ ] Exibir plano ativo
- [ ] Botão para novo agendamento
- [ ] Cancelar agendamento

**Estimativa**: 2 dias

#### Dashboard Barbeiro

**Arquivo**: `frontend/src/pages/barber/BarberDashboard.tsx` (criar/atualizar)

```tsx
export const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<Appointment[]>([]);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  
  useEffect(() => {
    loadSchedule();
  }, []);
  
  const loadSchedule = async () => {
    const today = new Date().toISOString().split('T')[0];
    const schedule = await appointmentService.getBarberSchedule(user.id, today);
    setTodaySchedule(schedule);
    
    // Encontrar próximo agendamento
    const next = schedule.find(a => a.status === 'CONFIRMED');
    setCurrentAppointment(next || null);
  };
  
  const handleStartService = async (id: string) => {
    await appointmentService.updateStatus(id, 'IN_PROGRESS');
    loadSchedule();
  };
  
  const handleCompleteService = async (id: string) => {
    await appointmentService.updateStatus(id, 'COMPLETED');
    addNotification('Serviço concluído! Aguardando pagamento no Caixa.', 'success');
    loadSchedule();
  };
  
  return (
    <Container>
      {/* Próximo cliente */}
      {currentAppointment && (
        <Card className="bg-amber-50">
          <h2>Próximo Cliente</h2>
          <p className="text-2xl font-bold">{currentAppointment.clientName}</p>
          <p>{currentAppointment.serviceName}</p>
          <p>{currentAppointment.time}</p>
          <Button onClick={() => handleStartService(currentAppointment.id)}>
            Iniciar Atendimento
          </Button>
        </Card>
      )}
      
      {/* Agenda do dia */}
      <Card>
        <h2>Agenda do Dia</h2>
        <Timeline appointments={todaySchedule} />
      </Card>
      
      {/* Resumo financeiro */}
      <Card>
        <h2>Comissões do Mês</h2>
        <p className="text-3xl font-bold text-green-600">R$ 2.345,00</p>
      </Card>
    </Container>
  );
};
```

**Tarefas**:
- [ ] Criar timeline visual da agenda
- [ ] Card de próximo cliente destacado
- [ ] Botão "Iniciar atendimento"
- [ ] Botão "Concluir atendimento"
- [ ] Resumo de comissões
- [ ] Auto-refresh a cada minuto

**Estimativa**: 3 dias

**Total Sprint 1**: 10-12 dias

---

### Sprint 2 (1 semana) - IMPORTANTE 📊

#### Integração Agendamento → Caixa → Financeiro

**Backend**: Atualizar Sales API

```typescript
// Ao criar venda, verificar se veio de agendamento
@Post()
async create(@Body() dto: CreateSaleDto) {
  const sale = await this.salesService.create(dto);
  
  // Se venda tem appointment_id, atualizar status
  if (dto.appointmentId) {
    await this.appointmentsService.updatePaymentStatus(
      dto.appointmentId,
      'PAID'
    );
  }
  
  // Gerar invoice automaticamente
  const invoice = await this.invoicesService.createFromSale(sale);
  
  return { sale, invoice };
}
```

**Frontend**: Atualizar Caixa

```tsx
// Listar serviços concluídos pendentes de pagamento
const [pendingServices, setPendingServices] = useState<Appointment[]>([]);

useEffect(() => {
  loadPendingServices();
}, []);

const loadPendingServices = async () => {
  const services = await appointmentService.list({
    status: 'COMPLETED',
    paymentStatus: 'PENDING',
    shopId: currentShop.id,
  });
  setPendingServices(services);
};

const handleRegisterPayment = async (appointment: Appointment) => {
  // Criar venda vinculada ao appointment
  const sale = await salesService.create({
    appointmentId: appointment.id,
    saleType: 'SERVICE',
    total: appointment.totalAmount,
    paymentMethod: selectedPaymentMethod,
    teamMemberId: appointment.barberId,
    clientId: appointment.clientId,
  });
  
  addNotification('Pagamento registrado com sucesso!', 'success');
  loadPendingServices(); // Atualizar lista
};
```

**Tarefas**:
- [ ] Backend: Vincular sales com appointments
- [ ] Backend: Auto-atualizar payment_status
- [ ] Backend: Gerar invoice automático
- [ ] Frontend: Listar serviços pendentes no Caixa
- [ ] Frontend: Botão "Registrar Pagamento"
- [ ] Frontend: Atualizar lista após pagamento

**Estimativa**: 4 dias

#### Ordem de Serviço (Service Order)

```tsx
// Componente para exibir/imprimir ordem de serviço
export const ServiceOrder: React.FC<{ appointmentId: string }> = ({ appointmentId }) => {
  const [order, setOrder] = useState<ServiceOrderData | null>(null);
  
  useEffect(() => {
    loadOrder();
  }, [appointmentId]);
  
  const loadOrder = async () => {
    const data = await appointmentService.getServiceOrder(appointmentId);
    setOrder(data);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="service-order">
      <div className="header">
        <img src={shop.logo} alt={shop.name} />
        <h1>Ordem de Serviço #{order.id}</h1>
      </div>
      
      <div className="client-info">
        <h2>Cliente</h2>
        <p>{order.clientName}</p>
        <p>{order.clientPhone}</p>
      </div>
      
      <div className="services">
        <h2>Serviços</h2>
        {order.services.map(service => (
          <div key={service.id}>
            <span>{service.name}</span>
            <span>R$ {service.price}</span>
          </div>
        ))}
      </div>
      
      <div className="barber">
        <h2>Barbeiro</h2>
        <p>{order.barberName}</p>
      </div>
      
      <div className="total">
        <h2>Total: R$ {order.total}</h2>
      </div>
      
      {order.pixQrCode && (
        <div className="qr-code">
          <img src={order.pixQrCode} alt="QR Code PIX" />
          <p>Escaneie para pagar via PIX</p>
        </div>
      )}
      
      <Button onClick={handlePrint}>Imprimir</Button>
    </div>
  );
};
```

**Tarefas**:
- [ ] Backend: Endpoint GET /appointments/:id/service-order
- [ ] Frontend: Componente ServiceOrder
- [ ] Estilo para impressão (@media print)
- [ ] Gerar QR Code PIX (se configurado)
- [ ] Botão no dashboard do barbeiro

**Estimativa**: 3 dias

**Total Sprint 2**: 7 dias

---

### Sprint 3 (opcional) - MELHORIAS 🎨

#### Notificações
- [ ] Email: Confirmação de agendamento
- [ ] Email: Lembrete 24h antes
- [ ] SMS/WhatsApp integração

#### Sistema de Avaliações
- [ ] Tabela reviews
- [ ] Após serviço concluído, enviar link para avaliar
- [ ] Exibir rating médio do barbeiro

#### Melhorias UX
- [ ] Animações suaves
- [ ] Skeleton loaders
- [ ] Drag & drop na agenda
- [ ] Confirmação de ações críticas

---

## 📈 Métricas de Sucesso MVP

### Fluxo Completo Funcionando

1. ✅ Cliente agenda serviço
2. ✅ Barbeiro vê na agenda
3. ✅ Barbeiro marca como concluído
4. ✅ Admin registra pagamento no Caixa
5. ✅ Sistema gera invoice automático
6. ✅ Financeiro atualiza com venda

### Performance
- [ ] Listagem de agendamentos < 500ms
- [ ] Criação de agendamento < 1s
- [ ] Dashboard carrega < 2s

### Qualidade
- [ ] Zero erros no console
- [ ] Zero warnings de TypeScript
- [ ] Cobertura de testes > 70%

---

## 🚀 Como Começar

### 1. Criar Branch para MVP

```bash
git checkout -b feature/mvp-appointments-flow
```

### 2. Backend - Appointments Module

```bash
cd backend
nest g module appointments
nest g controller appointments
nest g service appointments
```

### 3. Criar Migrations

```bash
npm run migration:generate -- -n CreateAppointmentsTables
npm run migration:run
```

### 4. Frontend - Atualizar Services

```bash
cd frontend
# Atualizar src/services/appointmentService.ts
# Remover mocks do localStorage
```

### 5. Testar Fluxo Completo

1. Iniciar backend: `npm run start:dev`
2. Iniciar frontend: `npm run start:dev`
3. Fazer login como Cliente
4. Criar agendamento
5. Fazer login como Barbeiro
6. Ver agendamento na agenda
7. Marcar como concluído
8. Fazer login como Admin
9. Registrar pagamento no Caixa
10. Ver venda no Financeiro

---

## 📞 Suporte e Dúvidas

Para qualquer dúvida sobre a implementação, consulte:

- **Diagramas**: Este documento (diagramas Mermaid)
- **Documentação Backend**: `/backend/README.md`
- **Documentação Frontend**: `/frontend/README.md`
- **API Docs**: `http://localhost:3000/api/docs` (Swagger)

---

**Última atualização**: 13 de fevereiro de 2026  
**Versão**: MVP Roadmap v1.0  
**Status**: 🟡 60% Implementado - 40% Faltando  
**Prioridade**: 🔴 ALTA - Finalizar Sprint 1 e 2 para lançamento
