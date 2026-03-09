# 🚀 PLANO DE AÇÃO - MVP EM 1 SEMANA

## ⏰ PRAZO: LANÇAR SEMANA QUE VEM

**Data de hoje**: 13 de fevereiro de 2026  
**Prazo final**: 20 de fevereiro de 2026 (7 dias)  
**Tempo disponível HOJE**: 2 horas (até 18:00)

---

## 🎯 MVP MÍNIMO - O QUE É ESSENCIAL

Para lançar, precisamos do **FLUXO PRINCIPAL funcionando**:

```
Cliente → Agenda Serviço → Barbeiro vê agenda → Marca concluído → 
Admin registra pagamento no Caixa → Financeiro atualiza automaticamente
```

### ✅ O que JÁ temos (60%)
- Autenticação completa
- Gestão de Barbearias/Equipe/Serviços/Produtos
- Tela de Agendamento (frontend)
- Caixa para registrar vendas
- Dashboard Financeiro

### ❌ O que FALTA (CRÍTICO)
1. **Backend API de Appointments** (0%)
2. **Dashboard Barbeiro funcional** (mostra agenda)
3. **Dashboard Cliente funcional** (mostra agendamentos)
4. **Integração Agenda → Caixa** (link entre appointment e sale)

---

## 📅 SPRINT REORGANIZADO - 7 DIAS

### 🔴 Dia 1 (HOJE - 13/02) - 2 HORAS
**FOCO**: Criar base da API de Appointments

### 🔴 Dia 2 (14/02) - Implementação Core
**FOCO**: Completar CRUD Appointments + integrar frontend

### 🟡 Dia 3 (15/02) - Dashboards
**FOCO**: Dashboard Barbeiro + Dashboard Cliente

### 🟡 Dia 4 (16/02) - Integração Caixa
**FOCO**: Ligar Agenda → Caixa → Financeiro

### 🟢 Dia 5 (17/02) - Refinamentos
**FOCO**: UX, validações, testes

### 🟢 Dia 6 (18/02) - Testes Finais
**FOCO**: Testar fluxo completo end-to-end

### 🚀 Dia 7 (19/02) - Deploy
**FOCO**: Subir para produção

---

## 🕐 HOJE (13/02) - 2 HORAS DE CÓDIGO

### 🎯 Objetivo
Criar a **estrutura base da API de Appointments** no backend e preparar **serviço no frontend**.

---

## 📦 TAREFAS BACKEND (1h30min)

### Tarefa B1: Criar módulo Appointments (15min)
```bash
cd backend
nest g module appointments
nest g controller appointments
nest g service appointments
```

### Tarefa B2: Criar Entity Appointment (20min)

**Arquivo**: `backend/src/appointments/entities/appointment.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Barbershop } from '../../barbershops/entities/barbershop.entity';
import { TeamMember } from '../../team/entities/team-member.entity';
import { Service } from '../../services/entities/service.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 60 })
  duration: number; // em minutos

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  saleId: string; // Link para venda no caixa

  // Relacionamentos
  @ManyToOne(() => User, { eager: true })
  client: User;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => Barbershop, { eager: true })
  barbershop: Barbershop;

  @Column('uuid')
  barbershopId: string;

  @ManyToOne(() => TeamMember, { eager: true })
  barber: TeamMember;

  @Column('uuid')
  barberId: string;

  @ManyToMany(() => Service, { eager: true })
  @JoinTable({
    name: 'appointment_services',
    joinColumn: { name: 'appointmentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' }
  })
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Tarefa B3: Criar DTOs básicos (20min)

**Arquivo**: `backend/src/appointments/dto/create-appointment.dto.ts`

```typescript
import { IsUUID, IsDateString, IsArray, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  duration: number;

  @IsUUID()
  clientId: string;

  @IsUUID()
  barbershopId: string;

  @IsUUID()
  barberId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Arquivo**: `backend/src/appointments/dto/update-appointment.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus, PaymentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
```

### Tarefa B4: Implementar Service básico (35min)

**Arquivo**: `backend/src/appointments/appointments.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // 1. Validar conflito de horário
    const hasConflict = await this.checkTimeConflict(
      createAppointmentDto.barberId,
      new Date(createAppointmentDto.scheduledAt),
      createAppointmentDto.duration
    );

    if (hasConflict) {
      throw new BadRequestException('Conflito de horário com outro agendamento');
    }

    // 2. Buscar serviços e calcular preço total
    const services = await this.servicesRepository.findByIds(createAppointmentDto.serviceIds);
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);

    // 3. Criar agendamento
    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      scheduledAt: new Date(createAppointmentDto.scheduledAt),
      services,
      totalPrice,
      status: AppointmentStatus.SCHEDULED
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAll(filters: {
    barbershopId?: string;
    barberId?: string;
    clientId?: string;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.barber', 'barber')
      .leftJoinAndSelect('appointment.services', 'services')
      .leftJoinAndSelect('appointment.barbershop', 'barbershop');

    if (filters.barbershopId) {
      query.andWhere('appointment.barbershopId = :barbershopId', { barbershopId: filters.barbershopId });
    }

    if (filters.barberId) {
      query.andWhere('appointment.barberId = :barberId', { barberId: filters.barberId });
    }

    if (filters.clientId) {
      query.andWhere('appointment.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    query.orderBy('appointment.scheduledAt', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['client', 'barber', 'services', 'barbershop']
    });

    if (!appointment) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Se estiver alterando horário, validar conflitos
    if (updateAppointmentDto.scheduledAt) {
      const hasConflict = await this.checkTimeConflict(
        appointment.barberId,
        new Date(updateAppointmentDto.scheduledAt),
        updateAppointmentDto.duration || appointment.duration,
        id // Excluir o próprio agendamento da verificação
      );

      if (hasConflict) {
        throw new BadRequestException('Conflito de horário com outro agendamento');
      }
    }

    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentsRepository.save(appointment);
  }

  private async checkTimeConflict(
    barberId: string,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const endTime = new Date(scheduledAt.getTime() + duration * 60000);

    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .where('appointment.barberId = :barberId', { barberId })
      .andWhere('appointment.status NOT IN (:...statuses)', {
        statuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
      })
      .andWhere('appointment.scheduledAt < :endTime', { endTime })
      .andWhere('appointment.scheduledAt + (appointment.duration * interval \'1 minute\') > :scheduledAt', {
        scheduledAt
      });

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeAppointmentId', { excludeAppointmentId });
    }

    const conflictingAppointments = await query.getCount();
    return conflictingAppointments > 0;
  }
}
```

### Tarefa B5: Implementar Controller básico (20min)

**Arquivo**: `backend/src/appointments/appointments.controller.ts`

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from './entities/appointment.entity';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  findAll(
    @Query('barbershopId') barbershopId?: string,
    @Query('barberId') barberId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll({
      barbershopId,
      barberId,
      clientId,
      status,
      startDate,
      endDate
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
```

### Tarefa B6: Registrar no módulo (10min)

**Arquivo**: `backend/src/appointments/appointments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Service])
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}
```

### Tarefa B7: Registrar no App Module (5min)

**Arquivo**: `backend/src/app.module.ts`

Adicionar import:
```typescript
import { AppointmentsModule } from './appointments/appointments.module';
```

Adicionar no array `imports`:
```typescript
imports: [
  // ... outros módulos
  AppointmentsModule,
],
```

### Tarefa B8: Criar Migration (10min)

```bash
cd backend
npm run migration:generate -- -n CreateAppointments
npm run migration:run
```

---

## 🎨 TAREFAS FRONTEND (30min)

### Tarefa F1: Atualizar appointmentService.ts (15min)

**Arquivo**: `frontend/src/services/appointmentService.ts`

```typescript
import api from './api';

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  totalPrice: number;
  notes?: string;
  saleId?: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  barber: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  barbershop: {
    id: string;
    name: string;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  scheduledAt: string;
  duration: number;
  clientId: string;
  barbershopId: string;
  barberId: string;
  serviceIds: string[];
  notes?: string;
}

export interface UpdateAppointmentDto {
  scheduledAt?: string;
  duration?: number;
  status?: Appointment['status'];
  paymentStatus?: Appointment['paymentStatus'];
  notes?: string;
}

export interface AppointmentFilters {
  barbershopId?: string;
  barberId?: string;
  clientId?: string;
  status?: Appointment['status'];
  startDate?: string;
  endDate?: string;
}

class AppointmentService {
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    const response = await api.post('/appointments', data);
    return response.data;
  }

  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  }

  async findOne(id: string): Promise<Appointment> {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  }

  async cancel(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  }

  async markAsCompleted(id: string): Promise<Appointment> {
    return this.update(id, { status: 'COMPLETED' });
  }

  async markAsInProgress(id: string): Promise<Appointment> {
    return this.update(id, { status: 'IN_PROGRESS' });
  }

  // Helpers para dashboards
  async getBarberSchedule(barberId: string, date: Date): Promise<Appointment[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.findAll({
      barberId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  async getClientAppointments(clientId: string): Promise<Appointment[]> {
    return this.findAll({ clientId });
  }

  async getPendingPayments(barbershopId: string): Promise<Appointment[]> {
    return this.findAll({
      barbershopId,
      status: 'COMPLETED',
      paymentStatus: 'PENDING'
    });
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
```

### Tarefa F2: Atualizar index.ts dos services (2min)

**Arquivo**: `frontend/src/services/index.ts`

Verificar se appointmentService está exportado:
```typescript
export { appointmentService } from './appointmentService';
export type { Appointment, CreateAppointmentDto } from './appointmentService';
```

### Tarefa F3: Criar hook useAppointments (13min)

**Arquivo**: `frontend/src/hooks/useAppointments.ts`

```typescript
import { useState, useEffect } from 'react';
import { appointmentService, Appointment, AppointmentFilters } from '../services/appointmentService';
import { useToast } from '../components/feedback';

export function useAppointments(filters?: AppointmentFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.findAll(filters);
      setAppointments(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao carregar agendamentos';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [JSON.stringify(filters)]);

  const refresh = () => {
    loadAppointments();
  };

  return {
    appointments,
    loading,
    error,
    refresh
  };
}
```

---

## 📝 RESUMO DO QUE FAZER AGORA (2h)

### ✅ BACKEND (Enviar para IA do Backend)

**Copie e cole esta instrução:**

```
TAREFA URGENTE - 1h30min

Criar módulo completo de Appointments com:

1. Criar estrutura (15min):
   - nest g module appointments
   - nest g controller appointments
   - nest g service appointments

2. Implementar Entity (20min):
   - Arquivo: backend/src/appointments/entities/appointment.entity.ts
   - Ver código completo em "ACTION_PLAN_1_WEEK_MVP.md" seção "Tarefa B2"

3. Criar DTOs (20min):
   - CreateAppointmentDto
   - UpdateAppointmentDto
   - Ver código em "ACTION_PLAN_1_WEEK_MVP.md" seção "Tarefa B3"

4. Implementar Service (35min):
   - CRUD completo
   - Validação de conflitos de horário
   - Cálculo automático de preço
   - Ver código em "ACTION_PLAN_1_WEEK_MVP.md" seção "Tarefa B4"

5. Implementar Controller (20min):
   - 5 endpoints REST
   - Query params para filtros
   - Ver código em "ACTION_PLAN_1_WEEK_MVP.md" seção "Tarefa B5"

6. Registrar módulos (5min):
   - AppointmentsModule
   - App.module.ts

7. Criar migration (10min):
   - npm run migration:generate -- -n CreateAppointments
   - npm run migration:run

FOCO: Código limpo, tipado, com validações
```

### ✅ FRONTEND (Você fará agora)

**Tarefas:**

1. ✅ Atualizar `appointmentService.ts` com integração real da API (15min)
2. ✅ Criar hook `useAppointments.ts` (13min)
3. ✅ Exportar no index.ts (2min)

**Total**: 30 minutos

---

## 🌙 AMANHÃ (14/02) - DIA INTEIRO

### Backend (Manhã - 4h)
- ✅ Testar todos os endpoints
- ✅ Adicionar validações extras (horário comercial, etc)
- ✅ Criar endpoint específico para dashboard barbeiro
- ✅ Criar endpoint para conflitos de horário
- ✅ Documentar API (Swagger)

### Frontend (Manhã - 4h)
- ✅ Integrar página Booking.tsx com API real
- ✅ Remover todos os mocks de localStorage
- ✅ Adicionar loading states e error handling
- ✅ Testar fluxo completo de agendamento

### Backend + Frontend (Tarde - 4h)
- ✅ Criar Dashboard Barbeiro funcional
- ✅ Criar Dashboard Cliente funcional
- ✅ Timeline de agendamentos do dia
- ✅ Botões de ação (Iniciar, Concluir, Cancelar)

---

## 📆 PRÓXIMOS DIAS (15-19/02)

### Dia 3 (15/02) - Integração Caixa
**Backend**:
- Adicionar link `appointment_id` na tabela `sales`
- Endpoint: `POST /sales/from-appointment/:appointmentId`
- Atualizar `paymentStatus` automaticamente

**Frontend**:
- Listar agendamentos concluídos pendentes no Caixa
- Botão "Registrar Pagamento" cria sale + atualiza appointment
- Atualizar dashboard financeiro automaticamente

### Dia 4 (16/02) - Ordem de Serviço
**Backend**:
- Endpoint: `GET /appointments/:id/service-order`
- Gerar PDF da ordem de serviço

**Frontend**:
- Componente ServiceOrder
- Imprimir/Download PDF
- QR Code para pagamento PIX

### Dia 5 (17/02) - Refinamentos
- Validações extras
- Mensagens de erro amigáveis
- Loading skeletons
- Responsividade mobile

### Dia 6 (18/02) - Testes
- Testar fluxo completo end-to-end
- Corrigir bugs encontrados
- Performance (otimizar queries)

### Dia 7 (19/02) - Deploy
- Build de produção
- Configurar variáveis de ambiente
- Deploy backend + frontend
- Smoke tests em produção

---

## 🎯 CRITÉRIOS DE SUCESSO

### MVP Funcional inclui:

✅ **Fluxo de Agendamento**
- [ ] Cliente consegue agendar serviço
- [ ] Sistema valida conflitos de horário
- [ ] Cliente recebe confirmação

✅ **Dashboard Barbeiro**
- [ ] Vê agenda do dia
- [ ] Consegue marcar serviço como concluído
- [ ] Vê próximos agendamentos

✅ **Dashboard Cliente**
- [ ] Vê seus agendamentos
- [ ] Pode cancelar (se não iniciado)
- [ ] Histórico de atendimentos

✅ **Caixa Integrado**
- [ ] Lista serviços concluídos pendentes
- [ ] Registra pagamento
- [ ] Atualiza financeiro automaticamente

✅ **Dashboard Financeiro**
- [ ] Mostra vendas do dia
- [ ] Mostra comissões dos barbeiros
- [ ] Gráficos atualizados em tempo real

---

## 🚨 PRIORIDADES

### 🔴 CRÍTICO (Sem isso não lança)
1. API Appointments completa
2. Dashboard Barbeiro funcional
3. Dashboard Cliente funcional
4. Integração Agenda → Caixa

### 🟡 IMPORTANTE (Melhorar UX)
1. Ordem de Serviço
2. Validações robustas
3. Mensagens de erro claras
4. Loading states bonitos

### 🟢 DESEJÁVEL (Pode lançar sem)
1. Notificações por email/SMS
2. Sistema de avaliações
3. Relatórios avançados
4. Gestão de comissões automática

---

## 📞 COMUNICAÇÃO ENTRE TIMES

### Backend → Frontend
Quando o backend terminar uma tarefa, avisar:
- ✅ Endpoint criado: [método] [rota]
- ✅ Response structure (exemplo JSON)
- ✅ Possíveis erros e status codes

### Frontend → Backend
Quando precisar de algo específico:
- Endpoint necessário
- Dados que precisa receber
- Filtros/parâmetros necessários

---

## 🎉 VAMOS LANÇAR!

**Foco de hoje**: Criar base sólida da API  
**Foco de amanhã**: Integrar tudo  
**Resto da semana**: Refinamento e testes  

**IMPORTANTE**: Código limpo > Código rápido  
Melhor ter MVP pequeno funcionando 100% do que sistema grande quebrado.

---

**Última atualização**: 13/02/2026 - 16:00  
**Status**: 🚀 EM EXECUÇÃO  
**Próxima revisão**: Amanhã 09:00
