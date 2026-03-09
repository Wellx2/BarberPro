# 🚀 INSTRUÇÕES BACKEND - HOJE (13/02) - 1h30min

## ⚡ OBJETIVO
Criar o **módulo completo de Appointments** no backend com API REST funcional.

---

## 📋 CHECKLIST DE TAREFAS

### ✅ Tarefa 1: Criar estrutura do módulo (15min)
```bash
cd backend
nest g module appointments
nest g controller appointments
nest g service appointments
```

**Resultado esperado:**
- ✅ `src/appointments/appointments.module.ts`
- ✅ `src/appointments/appointments.controller.ts`
- ✅ `src/appointments/appointments.service.ts`

---

### ✅ Tarefa 2: Criar Entity (20min)

**Criar arquivo:** `backend/src/appointments/entities/appointment.entity.ts`

**Copiar e colar este código:**

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
  saleId: string;

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

---

### ✅ Tarefa 3: Criar DTOs (20min)

**Criar arquivo:** `backend/src/appointments/dto/create-appointment.dto.ts`

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

**Criar arquivo:** `backend/src/appointments/dto/update-appointment.dto.ts`

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

---

### ✅ Tarefa 4: Implementar Service (35min)

**Arquivo:** `backend/src/appointments/appointments.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        id
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

---

### ✅ Tarefa 5: Implementar Controller (20min)

**Arquivo:** `backend/src/appointments/appointments.controller.ts`

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

---

### ✅ Tarefa 6: Configurar Module (10min)

**Arquivo:** `backend/src/appointments/appointments.module.ts`

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

---

### ✅ Tarefa 7: Registrar no App Module (5min)

**Arquivo:** `backend/src/app.module.ts`

**Adicionar no topo:**
```typescript
import { AppointmentsModule } from './appointments/appointments.module';
```

**Adicionar no array `imports`:**
```typescript
imports: [
  // ... outros módulos existentes
  AppointmentsModule, // 👈 Adicionar esta linha
],
```

---

### ✅ Tarefa 8: Criar e executar Migration (10min)

```bash
# Gerar migration
npm run migration:generate -- -n CreateAppointments

# Executar migration
npm run migration:run

# Se migration:generate não funcionar, criar manualmente
npm run migration:create -- -n CreateAppointments
```

**Se precisar criar manualmente, use este SQL:**

```sql
CREATE TYPE "appointment_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "scheduledAt" TIMESTAMP NOT NULL,
  "duration" integer DEFAULT 60,
  "status" appointment_status DEFAULT 'SCHEDULED',
  "paymentStatus" payment_status DEFAULT 'PENDING',
  "totalPrice" decimal(10,2) NOT NULL,
  "notes" text,
  "saleId" uuid,
  "clientId" uuid NOT NULL REFERENCES "users"("id"),
  "barbershopId" uuid NOT NULL REFERENCES "barbershops"("id"),
  "barberId" uuid NOT NULL REFERENCES "team_members"("id"),
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "appointment_services" (
  "appointmentId" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "serviceId" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  PRIMARY KEY ("appointmentId", "serviceId")
);

CREATE INDEX "idx_appointments_barber" ON "appointments"("barberId");
CREATE INDEX "idx_appointments_client" ON "appointments"("clientId");
CREATE INDEX "idx_appointments_barbershop" ON "appointments"("barbershopId");
CREATE INDEX "idx_appointments_scheduled" ON "appointments"("scheduledAt");
CREATE INDEX "idx_appointments_status" ON "appointments"("status");
```

---

## 🧪 TESTAR

Após implementar, testar com Postman/Insomnia:

### 1. Criar agendamento
```http
POST http://localhost:3000/appointments
Authorization: Bearer {seu_token}
Content-Type: application/json

{
  "scheduledAt": "2026-02-14T10:00:00.000Z",
  "duration": 60,
  "clientId": "{uuid_do_cliente}",
  "barbershopId": "{uuid_da_barbearia}",
  "barberId": "{uuid_do_barbeiro}",
  "serviceIds": ["{uuid_servico1}", "{uuid_servico2}"],
  "notes": "Cliente prefere corte baixo"
}
```

### 2. Listar agendamentos
```http
GET http://localhost:3000/appointments?barberId={uuid}
Authorization: Bearer {seu_token}
```

### 3. Atualizar status
```http
PATCH http://localhost:3000/appointments/{id}
Authorization: Bearer {seu_token}
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

### 4. Cancelar
```http
DELETE http://localhost:3000/appointments/{id}
Authorization: Bearer {seu_token}
```

---

## ✅ VALIDAR SUCESSO

Após implementar, validar:

- [ ] Servidor sobe sem erros
- [ ] Migration executou com sucesso
- [ ] Tabela `appointments` existe no banco
- [ ] Tabela `appointment_services` existe no banco
- [ ] POST /appointments cria agendamento
- [ ] GET /appointments lista agendamentos
- [ ] GET /appointments/:id retorna detalhes
- [ ] PATCH /appointments/:id atualiza
- [ ] DELETE /appointments/:id cancela
- [ ] Validação de conflito de horário funciona
- [ ] Cálculo de preço automático funciona
- [ ] Relacionamentos carregam (client, barber, services)

---

## 🚨 SE ENCONTRAR PROBLEMAS

### Problema: `findByIds is not a function`
**Solução:** Trocar por:
```typescript
const services = await this.servicesRepository.find({
  where: { id: In(createAppointmentDto.serviceIds) }
});
```

Adicionar import:
```typescript
import { In } from 'typeorm';
```

### Problema: Migration não gera/executa
**Solução:** Rodar SQL manual direto no banco (ver Tarefa 8)

### Problema: Relacionamentos não carregam
**Solução:** Verificar se `eager: true` está nas entities ou adicionar `relations` no findOne

---

## 📝 AVISAR FRONTEND QUANDO TERMINAR

Quando terminar, enviar para frontend:

```
✅ BACKEND PRONTO - Appointments API

Endpoints disponíveis:
- POST /appointments - Criar agendamento
- GET /appointments - Listar (filtros: barbershopId, barberId, clientId, status, startDate, endDate)
- GET /appointments/:id - Buscar por ID
- PATCH /appointments/:id - Atualizar (status, paymentStatus, etc)
- DELETE /appointments/:id - Cancelar (soft delete)

Response padrão:
{
  "id": "uuid",
  "scheduledAt": "2026-02-14T10:00:00.000Z",
  "duration": 60,
  "status": "SCHEDULED",
  "paymentStatus": "PENDING",
  "totalPrice": 50.00,
  "notes": "string",
  "client": { id, name, email },
  "barber": { id, name },
  "barbershop": { id, name },
  "services": [{ id, name, price, duration }],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}

Validações implementadas:
✅ Conflito de horário
✅ Cálculo automático de preço
✅ Status transitions
✅ Multi-tenant (filtros por barbershop)
```

---

**Tempo estimado:** 1h30min  
**Prioridade:** 🔴 CRÍTICA  
**Prazo:** HOJE até 18:00
