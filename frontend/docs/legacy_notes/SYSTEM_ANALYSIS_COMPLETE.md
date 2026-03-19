# 📊 BarberPro - Análise Visual Completa do Sistema

## 🎯 Propósito

Este documento consolida **todos os diagramas e análises** do sistema BarberPro para:
- ✅ Identificar o que já está implementado
- ❌ Mapear o que falta para o MVP
- 📅 Planejar sprints de desenvolvimento
- 🔄 Visualizar fluxos de dados críticos

---

## 📐 Diagramas Disponíveis

### 1. Arquitetura Geral do Sistema

**Visualiza**: Todas as camadas (Frontend, Backend, Database) e suas conexões.

**Destaque**: Componentes críticos para MVP estão em amarelo/vermelho.

**Ver em**: [MVP_ROADMAP_COMPLETE.md](./MVP_ROADMAP_COMPLETE.md) - Diagrama 1

---

### 2. Fluxo de Agendamento Completo

**Sequência**:
```
Cliente Agenda → Barbeiro Visualiza → Marca Concluído → 
Admin Registra Pagamento → Sistema Atualiza Financeiro
```

**Status Atual**: ❌ **NÃO FUNCIONA END-TO-END**
- ✅ Frontend de agendamento existe
- ❌ Backend API incompleta
- ❌ Integração com Caixa não existe
- ❌ Dashboard Barbeiro não funcional

**Ver em**: [MVP_ROADMAP_COMPLETE.md](./MVP_ROADMAP_COMPLETE.md) - Diagrama 2

---

### 3. Modelo de Dados Completo

**Entidades Principais**:
- 👤 Users
- 🏪 Barbershops
- 👥 Team Members
- ✂️ Services
- 🛍️ Products
- 📅 **Appointments** (crítico - precisa implementar)
- 💵 Sales
- 📄 Invoices
- 📦 Stock Movements

**Relacionamentos Críticos**:
- Appointments → Sales (precisa implementar)
- Appointments → Team Members (atendimento)
- Sales → Invoices (auto-gerar nota)

**Ver em**: [SHOP_SWITCHING_PERMISSIONS.md](./SHOP_SWITCHING_PERMISSIONS.md) - Diagrama ER

---

### 4. Cronograma de Desenvolvimento

**Sprint 1 (10-12 dias)** - CRÍTICO:
- API Appointments Backend (4 dias)
- Integração Frontend (2 dias)
- Dashboard Cliente (2 dias)
- Dashboard Barbeiro (3 dias)

**Sprint 2 (7 dias)** - IMPORTANTE:
- Integração Agenda → Caixa (4 dias)
- Ordem de Serviço (3 dias)

**Sprint 3** - OPCIONAL:
- Notificações
- Avaliações
- Melhorias UX

**Ver em**: [MVP_ROADMAP_COMPLETE.md](./MVP_ROADMAP_COMPLETE.md) - Diagrama Gantt

---

### 5. Jornada do Cliente

**Etapas**:
1. 🔍 Descoberta (site, unidades próximas)
2. 📅 Agendamento (escolher serviço, barbeiro, horário)
3. ⏰ Lembretes (24h e 1h antes)
4. ✂️ Atendimento (barbeiro marca início/fim)
5. 💰 Pagamento (caixa, nota fiscal)
6. ⭐ Avaliação (feedback)

**Pontos de Fricção Atuais**:
- ⚠️ Agendamento não salva no backend
- ❌ Barbeiro não vê agendamentos reais
- ❌ Cliente não vê seus agendamentos

**Ver em**: Diagrama Journey acima

---

### 6. Status de Implementação (Mindmap)

**Legenda**:
- ✅ **Verde**: Implementado e funcionando
- ⚠️ **Amarelo**: Parcialmente implementado
- ❌ **Vermelho**: Não implementado (crítico)

**Resumo Geral**:
- **60%** do sistema está pronto
- **40%** falta implementar
- **Foco**: Sistema de agendamentos end-to-end

**Ver em**: Diagrama Mindmap acima

---

## 🚨 Pontos Críticos para MVP

### 1️⃣ API de Appointments (Backend)

**Status**: ❌ Não existe

**Impacto**: Sistema inteiro de agendamentos não funciona

**Arquivos a criar**:
```
backend/src/appointments/
  ├── appointments.module.ts
  ├── appointments.controller.ts
  ├── appointments.service.ts
  ├── entities/
  │   ├── appointment.entity.ts
  │   └── appointment-service.entity.ts
  ├── dto/
  │   ├── create-appointment.dto.ts
  │   ├── update-appointment.dto.ts
  │   └── filter-appointment.dto.ts
  └── __tests__/
```

**Endpoints necessários**:
```typescript
POST   /api/v1/appointments              - Criar agendamento
GET    /api/v1/appointments              - Listar (com filtros)
GET    /api/v1/appointments/:id          - Buscar por ID
PATCH  /api/v1/appointments/:id          - Atualizar status
DELETE /api/v1/appointments/:id          - Cancelar
GET    /api/v1/appointments/barber/:id   - Agenda do barbeiro
GET    /api/v1/appointments/client/:id   - Agendamentos do cliente
```

**Prioridade**: 🔴 **CRÍTICA** - Bloqueia todo o fluxo

---

### 2️⃣ Dashboard Cliente Funcional

**Status**: ⚠️ Estrutura existe, mas sem dados reais

**Impacto**: Cliente não consegue ver/gerenciar seus agendamentos

**Arquivo**: `frontend/src/pages/client/ClientDashboard.tsx`

**Funcionalidades necessárias**:
- [ ] Listar próximos agendamentos
- [ ] Mostrar histórico de serviços
- [ ] Exibir plano ativo (se tiver)
- [ ] Botão "Novo Agendamento"
- [ ] Cancelar agendamento

**Prioridade**: 🔴 **CRÍTICA**

---

### 3️⃣ Dashboard Barbeiro Funcional

**Status**: ⚠️ Estrutura existe, mas sem dados reais

**Impacto**: Barbeiro não vê sua agenda do dia

**Arquivo**: `frontend/src/pages/barber/BarberDashboard.tsx`

**Funcionalidades necessárias**:
- [ ] Timeline visual da agenda do dia
- [ ] Card destacado: próximo cliente
- [ ] Botão "Iniciar atendimento"
- [ ] Botão "Concluir atendimento"
- [ ] Resumo de comissões do mês

**Prioridade**: 🔴 **CRÍTICA**

---

### 4️⃣ Integração Agendamento → Caixa

**Status**: ❌ Não existe conexão

**Impacto**: Pagamentos não ficam vinculados aos agendamentos

**Necessário**:
1. Quando barbeiro marca "Concluído":
   - `appointment.status = "COMPLETED"`
   - `appointment.payment_status = "PENDING"`

2. No Caixa, listar serviços pendentes:
   ```typescript
   GET /appointments?status=COMPLETED&paymentStatus=PENDING
   ```

3. Ao registrar pagamento:
   ```typescript
   POST /sales {
     appointmentId: "xxx",
     saleType: "SERVICE",
     total: 50.00,
     paymentMethod: "CARD"
   }
   
   // Automaticamente:
   UPDATE appointments SET payment_status = "PAID"
   INSERT INTO invoices ...
   ```

**Prioridade**: 🔴 **CRÍTICA**

---

### 5️⃣ Ordem de Serviço

**Status**: ❌ Não existe

**Impacto**: Barbeiro não tem documento para trabalhar

**Funcionalidade**: 
- Gerar documento com dados do cliente, serviços, preço
- QR Code PIX para pagamento
- Impressão/PDF

**Prioridade**: 🟡 **MÉDIA** (pode ser Sprint 2)

---

## 📋 Checklist para Lançamento MVP

### Pré-requisitos (Sprint 1)

- [ ] **Backend**: Criar módulo Appointments
- [ ] **Backend**: Implementar todos os endpoints
- [ ] **Backend**: Criar migrations das tabelas
- [ ] **Backend**: Adicionar validações de conflito
- [ ] **Backend**: Testes unitários (>70% cobertura)

- [ ] **Frontend**: Atualizar appointmentService.ts (remover mock)
- [ ] **Frontend**: Integrar Booking.tsx com API real
- [ ] **Frontend**: Criar ClientDashboard funcional
- [ ] **Frontend**: Criar BarberDashboard funcional
- [ ] **Frontend**: Adicionar loading states e error handling

### Integração (Sprint 2)

- [ ] **Backend**: Vincular Sales com Appointments
- [ ] **Backend**: Auto-atualizar payment_status
- [ ] **Backend**: Auto-gerar invoices

- [ ] **Frontend**: Listar serviços pendentes no Caixa
- [ ] **Frontend**: Registrar pagamento vinculado
- [ ] **Frontend**: Criar componente ServiceOrder

### Testes End-to-End

- [ ] **Fluxo Completo**: Cliente → Agenda → Barbeiro → Caixa → Financeiro
- [ ] **Validações**: Conflitos de horário
- [ ] **Permissões**: Multi-tenant funcionando
- [ ] **Performance**: < 2s para carregar dashboard

### Deploy

- [ ] **Staging**: Deploy em ambiente de teste
- [ ] **Homologação**: Testes com usuários reais
- [ ] **Produção**: Deploy final

---

## 🎯 Métricas de Sucesso

### Funcionalidade
✅ Cliente consegue agendar online  
✅ Barbeiro vê agenda atualizada em tempo real  
✅ Admin registra pagamento vinculado ao serviço  
✅ Sistema gera nota fiscal automaticamente  
✅ Financeiro mostra vendas consolidadas  

### Performance
✅ Listagem de agendamentos < 500ms  
✅ Criação de agendamento < 1s  
✅ Dashboard carrega < 2s  

### Qualidade
✅ Zero erros no console do navegador  
✅ Zero warnings TypeScript  
✅ Cobertura de testes > 70%  

---

## 📅 Timeline Estimado

| Sprint | Duração | Entregas |
|--------|---------|----------|
| **Sprint 1** | 10-12 dias | API Appointments + Dashboards |
| **Sprint 2** | 7 dias | Integração Caixa + Ordem Serviço |
| **Sprint 3** | 5-7 dias | Notificações + Avaliações (opcional) |
| **Testes** | 2 dias | Testes end-to-end |
| **Deploy** | 3 dias | Staging → Homologação → Produção |
| **TOTAL** | **~4 semanas** | MVP completo em produção |

---

## 🚀 Próximos Passos Imediatos

### 1. Criar Branch

```bash
git checkout -b feature/mvp-appointments-system
```

### 2. Backend - Iniciar Appointments Module

```bash
cd backend
nest g module appointments
nest g controller appointments
nest g service appointments
```

### 3. Criar Entities

```typescript
// backend/src/appointments/entities/appointment.entity.ts

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Barbershop)
  @JoinColumn({ name: 'shop_id' })
  shop: Barbershop;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => TeamMember)
  @JoinColumn({ name: 'barber_id' })
  barber: TeamMember;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time' })
  appointmentTime: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @OneToMany(() => AppointmentService, (as) => as.appointment, { cascade: true })
  services: AppointmentService[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
```

### 4. Criar Migration

```bash
npm run migration:generate -- -n CreateAppointmentsTables
npm run migration:run
```

### 5. Implementar Service

```typescript
// backend/src/appointments/appointments.service.ts

@Injectable()
export class AppointmentsService {
  async create(dto: CreateAppointmentDto, userId: string, shopId: string) {
    // 1. Validar horário disponível
    const hasConflict = await this.checkTimeConflict(
      dto.barberId,
      dto.appointmentDate,
      dto.appointmentTime,
      dto.durationMinutes,
    );

    if (hasConflict) {
      throw new ConflictException('Horário indisponível');
    }

    // 2. Calcular valor total
    const services = await this.servicesRepository.findByIds(dto.serviceIds);
    const totalAmount = services.reduce((sum, s) => sum + s.price, 0);

    // 3. Criar agendamento
    const appointment = this.appointmentsRepository.create({
      shopId,
      clientId: userId,
      barberId: dto.barberId,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      durationMinutes: dto.durationMinutes,
      totalAmount,
      notes: dto.notes,
      services: services.map(s => ({
        serviceId: s.id,
        price: s.price,
        durationMinutes: s.durationMinutes,
      })),
    });

    await this.appointmentsRepository.save(appointment);

    // 4. Enviar notificações (TODO: Sprint 3)
    // await this.notificationsService.sendAppointmentConfirmation(appointment);

    return appointment;
  }

  async findBarberSchedule(barberId: string, date: string) {
    return this.appointmentsRepository.find({
      where: {
        barberId,
        appointmentDate: date,
        status: Not(AppointmentStatus.CANCELLED),
      },
      relations: ['client', 'services'],
      order: { appointmentTime: 'ASC' },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.appointmentsRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    appointment.status = status;

    if (status === AppointmentStatus.COMPLETED) {
      appointment.completedAt = new Date();
    }

    return this.appointmentsRepository.save(appointment);
  }

  // ... outros métodos
}
```

### 6. Frontend - Atualizar appointmentService.ts

```typescript
// frontend/src/services/appointmentService.ts

import { api } from './api';

export const appointmentService = {
  async create(data: CreateAppointmentDto) {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  async list(filters?: AppointmentFilters) {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  },

  async getBarberSchedule(barberId: string, date: string) {
    const response = await api.get(`/appointments/barber/${barberId}`, {
      params: { date },
    });
    return response.data;
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const response = await api.patch(`/appointments/${id}`, { status });
    return response.data;
  },

  // ... outros métodos
};
```

---

## 📞 Referências

- **Documentação Completa**: [MVP_ROADMAP_COMPLETE.md](./MVP_ROADMAP_COMPLETE.md)
- **Permissões**: [SHOP_SWITCHING_PERMISSIONS.md](./SHOP_SWITCHING_PERMISSIONS.md)
- **Backend Integration**: [BACKEND_INTEGRATION_COMPLETE.md](./BACKEND_INTEGRATION_COMPLETE.md)
- **API Swagger**: http://localhost:3000/api/docs

---

**Última atualização**: 13 de fevereiro de 2026  
**Versão**: 1.0  
**Status do Sistema**: 🟡 60% Completo  
**Próximo Marco**: Sprint 1 - API Appointments (10-12 dias)
