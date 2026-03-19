# 🎯 REQUISITOS BACKEND - Sistema de Agendamentos

**Desenvolvedor Backend:** Beck  
**Data:** 18/02/2026  
**Prioridade:** 🔥 CRÍTICA  
**Status:** PENDENTE IMPLEMENTAÇÃO

---

## ⚠️ REGRA DE OURO

> **"NÃO FAZER GAMBIARRA NO FRONTEND"**  
> Todas as validações de negócio, logs de auditoria e notificações devem estar **100% NO BACKEND**.  
> O frontend apenas consome a API e exibe os dados/erros retornados.

---

## 📋 ÍNDICE

1. [Validações Obrigatórias](#1-validações-obrigatórias)
2. [Campos de Auditoria](#2-campos-de-auditoria)
3. [Sistema de Notificações](#3-sistema-de-notificações)
4. [Integração com Ordem de Serviço](#4-integração-com-ordem-de-serviço)
5. [Endpoints Necessários](#5-endpoints-necessários)
6. [Exemplos de Implementação](#6-exemplos-de-implementação)
7. [Testes Obrigatórios](#7-testes-obrigatórios)
8. [Checklist de Implementação](#8-checklist-de-implementação)

---

## 1. VALIDAÇÕES OBRIGATÓRIAS

### 1.1 ❌ Não Permitir Datas Passadas

**Regra:** Não é possível criar agendamento para data/hora que já passou.

```typescript
// appointments.service.ts
async create(dto: CreateAppointmentDto, userId: string) {
  const scheduledFor = new Date(dto.date);
  const now = new Date();
  
  // VALIDAÇÃO 1: Data/hora não pode ser no passado
  if (scheduledFor <= now) {
    throw new BadRequestException(
      'Não é possível agendar para data/hora passada'
    );
  }
  
  // ... resto da lógica
}
```

**Erro esperado:**
```json
{
  "statusCode": 400,
  "message": "Não é possível agendar para data/hora passada",
  "error": "Bad Request"
}
```

---

### 1.2 ⏰ Não Permitir Horário Anterior ao Atual (Mesmo Dia)

**Regra:** Se está agendando para HOJE, não pode escolher horário que já passou.

**Exemplo:**
- Agora: 13:45
- Tentativa: Agendar para 13:35 de hoje ❌
- Permitido: Agendar para 14:00 de hoje ✅

```typescript
async create(dto: CreateAppointmentDto, userId: string) {
  const scheduledFor = new Date(dto.date);
  const now = new Date();
  
  // VALIDAÇÃO 2: Se é hoje, horário deve ser futuro
  const isSameDay = 
    scheduledFor.getFullYear() === now.getFullYear() &&
    scheduledFor.getMonth() === now.getMonth() &&
    scheduledFor.getDate() === now.getDate();
  
  if (isSameDay && scheduledFor <= now) {
    const minTime = now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    throw new BadRequestException(
      `Não é possível agendar para horário anterior. Horário mínimo para hoje: ${minTime}`
    );
  }
  
  // ... resto da lógica
}
```

**Erro esperado:**
```json
{
  "statusCode": 400,
  "message": "Não é possível agendar para horário anterior. Horário mínimo para hoje: 13:45",
  "error": "Bad Request"
}
```

---

### 1.3 🔒 Validar Conflito de Horários

**Regra:** Barbeiro não pode ter 2 agendamentos ao mesmo tempo (considerar duração dos serviços).

```typescript
async checkScheduleConflict(
  barberId: string,
  startTime: Date,
  durationMinutes: number
): Promise<boolean> {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  
  // Buscar agendamentos do barbeiro no mesmo dia
  const appointments = await this.appointmentRepository.find({
    where: {
      barberId,
      status: In(['SCHEDULED', 'COMPLETED']),
      date: Between(
        new Date(startTime.setHours(0, 0, 0, 0)),
        new Date(startTime.setHours(23, 59, 59, 999))
      )
    }
  });
  
  // Verificar se há overlap
  for (const apt of appointments) {
    const aptStart = new Date(apt.date);
    const aptEnd = new Date(aptStart.getTime() + apt.totalDuration * 60000);
    
    // Há conflito se:
    // - Novo agendamento começa durante outro OU
    // - Novo agendamento termina durante outro OU
    // - Novo agendamento engloba outro completamente
    const hasConflict = 
      (startTime >= aptStart && startTime < aptEnd) || // Começa durante
      (endTime > aptStart && endTime <= aptEnd) ||     // Termina durante
      (startTime <= aptStart && endTime >= aptEnd);     // Engloba
    
    if (hasConflict) {
      return true;
    }
  }
  
  return false;
}

// No create:
async create(dto: CreateAppointmentDto, userId: string) {
  // ... validações anteriores
  
  // Calcular duração total
  const totalDuration = await this.calculateTotalDuration(dto.serviceIds);
  
  // VALIDAÇÃO 3: Verificar conflito
  const hasConflict = await this.checkScheduleConflict(
    dto.barberId,
    scheduledFor,
    totalDuration
  );
  
  if (hasConflict) {
    throw new ConflictException(
      'Horário indisponível. O barbeiro já possui agendamento neste horário.'
    );
  }
  
  // ... resto da lógica
}
```

**Erro esperado:**
```json
{
  "statusCode": 409,
  "message": "Horário indisponível. O barbeiro já possui agendamento neste horário.",
  "error": "Conflict"
}
```

---

### 1.4 🕐 Validar Horário de Funcionamento

**Regra:** Agendamento deve caber completamente no horário de expediente.

```typescript
async validateBusinessHours(
  barbershopId: string,
  startTime: Date,
  durationMinutes: number
): Promise<void> {
  const barbershop = await this.barbershopRepository.findOne({
    where: { id: barbershopId }
  });
  
  if (!barbershop) {
    throw new NotFoundException('Barbearia não encontrada');
  }
  
  const dayOfWeek = startTime.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Buscar horário de funcionamento do dia
  const schedule = barbershop.schedule?.[dayOfWeek];
  
  if (!schedule || !schedule.open) {
    throw new BadRequestException(
      'Barbearia fechada no dia selecionado'
    );
  }
  
  // Extrair horas de início e fim
  const [openHour, openMin] = schedule.openingTime.split(':').map(Number);
  const [closeHour, closeMin] = schedule.closingTime.split(':').map(Number);
  
  const opening = new Date(startTime);
  opening.setHours(openHour, openMin, 0, 0);
  
  const closing = new Date(startTime);
  closing.setHours(closeHour, closeMin, 0, 0);
  
  // Calcular fim do agendamento
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  
  // VALIDAÇÃO 4: Inicio >= abertura E fim <= fechamento
  if (startTime < opening || endTime > closing) {
    throw new BadRequestException(
      `Horário fora do expediente. Funcionamento: ${schedule.openingTime} - ${schedule.closingTime}`
    );
  }
}
```

---

### 1.5 ✅ Resumo de Validações

| # | Validação | Status Code | Mensagem |
|---|-----------|-------------|----------|
| 1 | Data passada | 400 | "Não é possível agendar para data/hora passada" |
| 2 | Horário anterior (hoje) | 400 | "Não é possível agendar para horário anterior. Horário mínimo para hoje: HH:mm" |
| 3 | Conflito de horário | 409 | "Horário indisponível. O barbeiro já possui agendamento neste horário." |
| 4 | Fora do expediente | 400 | "Horário fora do expediente. Funcionamento: HH:mm - HH:mm" |
| 5 | Barbeiro inativo | 400 | "Barbeiro indisponível" |
| 6 | Horário bloqueado | 409 | "Horário bloqueado: [motivo]" |

---

## 2. CAMPOS DE AUDITORIA

### 2.1 📊 Schema do Prisma (Atualizar)

```prisma
model Appointment {
  id            String            @id @default(uuid())
  barbershopId  String
  clientId      String
  barberId      String
  serviceIds    String[]
  date          DateTime
  status        AppointmentStatus @default(SCHEDULED)
  totalPrice    Decimal           @default(0)
  totalDuration Int               @default(0) // em minutos
  notes         String?
  
  // 🔥 AUDITORIA - OBRIGATÓRIO
  createdAt     DateTime          @default(now())
  createdBy     String            // ID do usuário que criou
  updatedAt     DateTime          @updatedAt
  updatedBy     String?           // ID do último usuário que atualizou
  
  // 🔥 CANCELAMENTO - OBRIGATÓRIO
  cancelledAt   DateTime?
  cancelledBy   String?           // ID do usuário que cancelou
  cancellationReason String?      // Motivo OBRIGATÓRIO ao cancelar
  
  // 🔥 SOFT DELETE
  deletedAt     DateTime?
  deletedBy     String?
  
  // Relacionamentos
  barbershop    Barbershop        @relation(fields: [barbershopId], references: [id])
  client        User              @relation("ClientAppointments", fields: [clientId], references: [id])
  barber        User              @relation("BarberAppointments", fields: [barberId], references: [id])
  creator       User              @relation("CreatedAppointments", fields: [createdBy], references: [id])
  
  @@index([barbershopId, date])
  @@index([barberId, date, status])
  @@index([clientId])
  @@index([createdBy])
  @@map("appointments")
}

enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  CANCELLED_BY_BARBER
  NO_SHOW
}
```

### 2.2 🔧 Implementação no Service

```typescript
// appointments.service.ts

async create(dto: CreateAppointmentDto, userId: string) {
  // ... validações
  
  const appointment = this.appointmentRepository.create({
    barbershopId: user.shopId, // Inferir do token
    clientId: dto.clientId,
    barberId: dto.barberId,
    serviceIds: dto.serviceIds,
    date: scheduledFor,
    status: AppointmentStatus.SCHEDULED,
    totalPrice: totalPrice,
    totalDuration: totalDuration,
    notes: dto.notes,
    
    // 🔥 AUDITORIA
    createdAt: new Date(),
    createdBy: userId, // Quem criou (ID do JWT)
    updatedAt: new Date(),
    updatedBy: userId
  });
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.log(
    `[APPOINTMENT_CREATED] User ${userId} created appointment ${appointment.id} ` +
    `for client ${dto.clientId} with barber ${dto.barberId} at ${scheduledFor.toISOString()}`
  );
  
  return appointment;
}

async update(id: string, dto: UpdateAppointmentDto, userId: string) {
  const appointment = await this.findOne(id);
  
  // Atualizar campos
  Object.assign(appointment, dto);
  
  // 🔥 AUDITORIA
  appointment.updatedAt = new Date();
  appointment.updatedBy = userId;
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.log(
    `[APPOINTMENT_UPDATED] User ${userId} updated appointment ${id}. ` +
    `Changes: ${JSON.stringify(dto)}`
  );
  
  return appointment;
}

async cancel(id: string, userId: string, reason: string) {
  if (!reason || reason.trim().length === 0) {
    throw new BadRequestException(
      'Motivo do cancelamento é obrigatório'
    );
  }
  
  const appointment = await this.findOne(id);
  
  if (appointment.status !== AppointmentStatus.SCHEDULED) {
    throw new BadRequestException(
      'Apenas agendamentos com status SCHEDULED podem ser cancelados'
    );
  }
  
  // Determinar tipo de cancelamento
  const user = await this.userRepository.findOne({ where: { id: userId } });
  const isBarberOrAdmin = ['BARBER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  
  appointment.status = isBarberOrAdmin 
    ? AppointmentStatus.CANCELLED_BY_BARBER 
    : AppointmentStatus.CANCELLED;
  
  // 🔥 AUDITORIA DE CANCELAMENTO
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = userId;
  appointment.cancellationReason = reason.trim();
  appointment.updatedAt = new Date();
  appointment.updatedBy = userId;
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.warn(
    `[APPOINTMENT_CANCELLED] User ${userId} (${user.role}) cancelled appointment ${id}. ` +
    `Reason: ${reason}`
  );
  
  // 🔔 NOTIFICAÇÃO (ver seção 3)
  await this.sendCancellationNotification(appointment, user);
  
  return appointment;
}

async softDelete(id: string, userId: string) {
  const appointment = await this.findOne(id);
  
  // 🔥 AUDITORIA DE DELEÇÃO
  appointment.deletedAt = new Date();
  appointment.deletedBy = userId;
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.warn(
    `[APPOINTMENT_DELETED] User ${userId} soft-deleted appointment ${id}`
  );
  
  return appointment;
}
```

---

## 3. SISTEMA DE NOTIFICAÇÕES

### 3.1 📢 Tipos de Notificações

```typescript
// notifications/dto/notification.dto.ts
export enum NotificationType {
  NEW_APPOINTMENT = 'NEW_APPOINTMENT',
  APPOINTMENT_CANCELLED_BY_CLIENT = 'APPOINTMENT_CANCELLED_BY_CLIENT',
  APPOINTMENT_CANCELLED_BY_BARBER = 'APPOINTMENT_CANCELLED_BY_BARBER',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED'
}

export interface CreateNotificationDto {
  type: NotificationType;
  recipientId: string;      // ID do usuário que receberá
  title: string;
  message: string;
  data?: Record<string, any>; // Dados extras (IDs, links, etc)
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channels?: ('IN_APP' | 'EMAIL' | 'SMS')[]; // Canais de envio
}
```

### 3.2 🔔 Implementação do Service de Notificações

```typescript
// notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService
  ) {}
  
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      read: false,
      createdAt: new Date()
    });
    
    await this.notificationRepository.save(notification);
    
    // Enviar por múltiplos canais
    if (dto.channels) {
      await Promise.allSettled([
        dto.channels.includes('EMAIL') && this.sendEmail(notification),
        dto.channels.includes('SMS') && this.sendSMS(notification),
        dto.channels.includes('PUSH') && this.sendPush(notification)
      ]);
    }
    
    return notification;
  }
  
  async sendEmail(notification: Notification): Promise<void> {
    // Implementação de email
  }
  
  async sendSMS(notification: Notification): Promise<void> {
    // Implementação de SMS
  }
  
  async sendPush(notification: Notification): Promise<void> {
    // Implementação de push notification
  }
}
```

### 3.3 📨 Notificações Específicas

#### 3.3.1 Cliente Cancelou → Notificar Barbeiro

```typescript
// appointments.service.ts
async sendCancellationNotification(
  appointment: Appointment,
  canceller: User
): Promise<void> {
  const isClient = canceller.role === 'CLIENT';
  
  if (isClient) {
    // Cliente cancelou → notificar barbeiro
    const barber = await this.userRepository.findOne({
      where: { id: appointment.barberId }
    });
    
    await this.notificationsService.create({
      type: NotificationType.APPOINTMENT_CANCELLED_BY_CLIENT,
      recipientId: barber.id,
      title: 'Agendamento Cancelado',
      message: `${canceller.name} cancelou o agendamento de ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")}`,
      data: {
        appointmentId: appointment.id,
        clientName: canceller.name,
        clientPhone: canceller.phone,
        scheduledFor: appointment.date,
        cancellationReason: appointment.cancellationReason,
        cancelledAt: appointment.cancelledAt
      },
      priority: 'HIGH',
      channels: ['IN_APP', 'EMAIL'] // Email é importante!
    });
    
  } else {
    // Barbeiro/Admin cancelou → notificar cliente
    const client = await this.userRepository.findOne({
      where: { id: appointment.clientId }
    });
    
    await this.notificationsService.create({
      type: NotificationType.APPOINTMENT_CANCELLED_BY_BARBER,
      recipientId: client.id,
      title: 'Agendamento Cancelado',
      message: `Seu agendamento com ${canceller.name} (${format(appointment.date, "dd/MM 'às' HH:mm")}) foi cancelado. Motivo: ${appointment.cancellationReason}`,
      data: {
        appointmentId: appointment.id,
        barberName: canceller.name,
        barbershopPhone: appointment.barbershop.phone,
        scheduledFor: appointment.date,
        cancellationReason: appointment.cancellationReason,
        cancelledAt: appointment.cancelledAt
      },
      priority: 'URGENT',
      channels: ['IN_APP', 'EMAIL', 'SMS'] // Cliente DEVE saber!
    });
  }
}
```

#### 3.3.2 Horário Mudou → Notificar Barbeiro

```typescript
async reschedule(
  id: string,
  newDate: Date,
  userId: string
): Promise<Appointment> {
  const appointment = await this.findOne(id);
  const oldDate = appointment.date;
  
  // Validações de novo horário...
  
  // Atualizar
  appointment.date = newDate;
  appointment.updatedAt = new Date();
  appointment.updatedBy = userId;
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.log(
    `[APPOINTMENT_RESCHEDULED] User ${userId} rescheduled appointment ${id} ` +
    `from ${oldDate.toISOString()} to ${newDate.toISOString()}`
  );
  
  // 🔔 NOTIFICAÇÃO
  const barber = await this.userRepository.findOne({
    where: { id: appointment.barberId }
  });
  
  const client = await this.userRepository.findOne({
    where: { id: appointment.clientId }
  });
  
  await this.notificationsService.create({
    type: NotificationType.APPOINTMENT_RESCHEDULED,
    recipientId: barber.id,
    title: 'Agendamento Reagendado',
    message: `${client.name} alterou o horário do agendamento`,
    data: {
      appointmentId: appointment.id,
      clientName: client.name,
      oldScheduledFor: oldDate,
      newScheduledFor: newDate,
      rescheduledBy: userId,
      rescheduledAt: new Date()
    },
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  });
  
  return appointment;
}
```

#### 3.3.3 Novo Agendamento → Notificar Barbeiro

```typescript
async create(dto: CreateAppointmentDto, userId: string) {
  // ... validações e criação
  
  const appointment = await this.appointmentRepository.save(newAppointment);
  
  // 🔔 NOTIFICAÇÃO
  const barber = await this.userRepository.findOne({
    where: { id: dto.barberId }
  });
  
  const client = await this.userRepository.findOne({
    where: { id: dto.clientId }
  });
  
  const services = await this.serviceRepository.findByIds(dto.serviceIds);
  
  await this.notificationsService.create({
    type: NotificationType.NEW_APPOINTMENT,
    recipientId: barber.id,
    title: 'Novo Agendamento',
    message: `${client.name} agendou para ${format(appointment.date, "dd/MM 'às' HH:mm")}`,
    data: {
      appointmentId: appointment.id,
      clientName: client.name,
      clientPhone: client.phone,
      scheduledFor: appointment.date,
      services: services.map(s => s.name),
      totalDuration: appointment.totalDuration,
      totalPrice: appointment.totalPrice
    },
    priority: 'NORMAL',
    channels: ['IN_APP']
  });
  
  return appointment;
}
```

---

## 4. INTEGRAÇÃO COM ORDEM DE SERVIÇO

### 4.1 🔗 Criar Ordem de Serviço ao Completar

```typescript
// appointments.service.ts
async complete(id: string, userId: string): Promise<{
  appointment: Appointment;
  serviceOrder: ServiceOrder;
}> {
  const appointment = await this.findOne(id);
  
  if (appointment.status !== AppointmentStatus.SCHEDULED) {
    throw new BadRequestException(
      'Apenas agendamentos com status SCHEDULED podem ser completados'
    );
  }
  
  // Atualizar appointment
  appointment.status = AppointmentStatus.COMPLETED;
  appointment.updatedAt = new Date();
  appointment.updatedBy = userId;
  
  await this.appointmentRepository.save(appointment);
  
  // 📝 LOG
  this.logger.log(
    `[APPOINTMENT_COMPLETED] User ${userId} completed appointment ${id}`
  );
  
  // 🔥 CRIAR ORDEM DE SERVIÇO AUTOMATICAMENTE
  const serviceOrder = await this.serviceOrderService.create({
    barbershopId: appointment.barbershopId,
    appointmentId: appointment.id,
    clientId: appointment.clientId,
    barberId: appointment.barberId,
    services: await this.buildServiceOrderItems(appointment.serviceIds),
    products: appointment.products || [],
    totalAmount: appointment.totalPrice,
    paymentStatus: 'PENDING',
    completedAt: new Date(),
    completedBy: userId
  });
  
  // 📝 LOG
  this.logger.log(
    `[SERVICE_ORDER_CREATED] Automatically created service order ${serviceOrder.id} ` +
    `from appointment ${appointment.id}`
  );
  
  // 🔔 NOTIFICAÇÃO
  await this.notificationsService.create({
    type: NotificationType.APPOINTMENT_COMPLETED,
    recipientId: appointment.clientId,
    title: 'Atendimento Concluído',
    message: 'Obrigado por utilizar nossos serviços! Avalie sua experiência.',
    data: {
      appointmentId: appointment.id,
      serviceOrderId: serviceOrder.id,
      totalAmount: serviceOrder.totalAmount
    },
    priority: 'NORMAL',
    channels: ['IN_APP']
  });
  
  return { appointment, serviceOrder };
}

private async buildServiceOrderItems(serviceIds: string[]) {
  const services = await this.serviceRepository.findByIds(serviceIds);
  
  return services.map(service => ({
    serviceId: service.id,
    serviceName: service.name,
    quantity: 1,
    price: service.price
  }));
}
```

### 4.2 📊 Schema da Ordem de Serviço

```prisma
model ServiceOrder {
  id              String            @id @default(uuid())
  barbershopId    String
  appointmentId   String            @unique // Vínculo com agendamento
  clientId        String
  barberId        String
  
  totalAmount     Decimal
  paymentStatus   PaymentStatus     @default(PENDING)
  paymentMethod   PaymentMethod?
  
  // Itens
  serviceItems    ServiceOrderItem[]
  productItems    ProductOrderItem[]
  
  // Auditoria
  completedAt     DateTime
  completedBy     String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relacionamentos
  barbershop      Barbershop        @relation(fields: [barbershopId], references: [id])
  appointment     Appointment       @relation(fields: [appointmentId], references: [id])
  client          User              @relation("ClientOrders", fields: [clientId], references: [id])
  barber          User              @relation("BarberOrders", fields: [barberId], references: [id])
  
  @@index([barbershopId, completedAt])
  @@index([barberId, completedAt])
  @@map("service_orders")
}

model ServiceOrderItem {
  id              String        @id @default(uuid())
  serviceOrderId  String
  serviceId       String
  serviceName     String        // Desnormalizado para histórico
  quantity        Int           @default(1)
  price           Decimal
  
  serviceOrder    ServiceOrder  @relation(fields: [serviceOrderId], references: [id])
  service         Service       @relation(fields: [serviceId], references: [id])
  
  @@map("service_order_items")
}

model ProductOrderItem {
  id              String        @id @default(uuid())
  serviceOrderId  String
  productId       String
  productName     String        // Desnormalizado para histórico
  quantity        Int
  price           Decimal       // Preço unitário
  
  serviceOrder    ServiceOrder  @relation(fields: [serviceOrderId], references: [id])
  product         Product       @relation(fields: [productId], references: [id])
  
  @@map("product_order_items")
}

enum PaymentStatus {
  PENDING
  PAID
  CANCELLED
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  PIX
}
```

---

## 5. ENDPOINTS NECESSÁRIOS

### 5.1 POST /api/appointments (Criar)

**Request Body:**
```json
{
  "clientId": "uuid",
  "barberId": "uuid",
  "serviceIds": ["uuid"],
  "date": "2026-02-20T14:30:00.000Z",
  "notes": "string"
}
```

**Validações:**
- ✅ clientId, barberId, serviceIds obrigatórios
- ✅ Data não pode ser passada
- ✅ Horário não pode ser anterior ao atual (hoje)
- ✅ Verificar conflito de horário
- ✅ Verificar horário de funcionamento
- ✅ Barbeiro deve estar ativo
- ✅ Verificar horários bloqueados

**Response 201:**
```json
{
  "id": "uuid",
  "barbershopId": "uuid",
  "clientId": "uuid",
  "barberId": "uuid",
  "serviceIds": ["uuid"],
  "date": "2026-02-20T14:30:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 80.00,
  "totalDuration": 60,
  "createdAt": "2026-02-18T10:30:00.000Z",
  "createdBy": "uuid",
  "updatedAt": "2026-02-18T10:30:00.000Z",
  "updatedBy": "uuid"
}
```

---

### 5.2 PATCH /api/appointments/:id (Reagendar)

**Request Body:**
```json
{
  "date": "2026-02-21T15:00:00.000Z"
}
```

**Ações:**
- ✅ Validar nova data (mesmas regras do create)
- ✅ Verificar conflitos
- ✅ Atualizar `updatedAt` e `updatedBy`
- ✅ Enviar notificação para barbeiro

---

### 5.3 PATCH /api/appointments/:id/cancel (Cancelar)

**Request Body:**
```json
{
  "cancellationReason": "Motivo obrigatório"
}
```

**Validações:**
- ✅ `cancellationReason` é **OBRIGATÓRIO**
- ✅ Apenas status SCHEDULED pode ser cancelado
- ✅ Determinar se foi cliente ou barbeiro que cancelou (pelo JWT)

**Ações:**
- ✅ Atualizar status para CANCELLED ou CANCELLED_BY_BARBER
- ✅ Preencher `cancelledAt`, `cancelledBy`, `cancellationReason`
- ✅ Enviar notificação para a outra parte
- ✅ Liberar horário na agenda

---

### 5.4 PATCH /api/appointments/:id/complete (Completar)

**Permissões:** ADMIN, BARBER

**Ações:**
- ✅ Atualizar status para COMPLETED
- ✅ **CRIAR ORDEM DE SERVIÇO AUTOMATICAMENTE**
- ✅ Preencher auditoria
- ✅ Enviar notificação para cliente (avaliação)

**Response:**
```json
{
  "appointment": { ... },
  "serviceOrder": {
    "id": "uuid",
    "appointmentId": "uuid",
    "totalAmount": 80.00,
    "paymentStatus": "PENDING",
    ...
  }
}
```

---

### 5.5 GET /api/appointments (Listar)

**Query Params:**
- `date` - Filtrar por data específica
- `barberId` - Filtrar por barbeiro
- `clientId` - Filtrar por cliente
- `status` - Filtrar por status
- `startDate` e `endDate` - Período

**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2026-02-20T14:30:00.000Z",
    "status": "SCHEDULED",
    "client": {
      "id": "uuid",
      "name": "João Silva",
      "phone": "(11) 98765-4321"
    },
    "barber": {
      "id": "uuid",
      "name": "Carlos Barbeiro"
    },
    "services": [
      { "id": "uuid", "name": "Corte", "price": 50.00 }
    ],
    "totalPrice": 80.00,
    "totalDuration": 60,
    "createdAt": "2026-02-18T10:30:00.000Z",
    "createdBy": "uuid"
  }
]
```

---

## 6. EXEMPLOS DE IMPLEMENTAÇÃO

### 6.1 Controller Completo

```typescript
// appointments.controller.ts
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiTags('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
  
  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado' })
  @ApiResponse({ status: 400, description: 'Validação falhou' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return this.appointmentsService.create(dto, userId);
  }
  
  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  async findAll(@Query() filters: AppointmentFilters) {
    return this.appointmentsService.findAll(filters);
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento (reagendar)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @Request() req
  ) {
    const userId = req.user.id;
    
    // Se está alterando a data, é um reagendamento
    if (dto.date) {
      return this.appointmentsService.reschedule(id, new Date(dto.date), userId);
    }
    
    return this.appointmentsService.update(id, dto, userId);
  }
  
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiBody({ schema: { properties: { cancellationReason: { type: 'string' } } } })
  async cancel(
    @Param('id') id: string,
    @Body('cancellationReason') reason: string,
    @Request() req
  ) {
    const userId = req.user.id;
    return this.appointmentsService.cancel(id, userId, reason);
  }
  
  @Patch(':id/complete')
  @Roles('ADMIN', 'BARBER')
  @ApiOperation({ summary: 'Completar agendamento' })
  async complete(
    @Param('id') id: string,
    @Request() req
  ) {
    const userId = req.user.id;
    return this.appointmentsService.complete(id, userId);
  }
}
```

---

## 7. TESTES OBRIGATÓRIOS

### 7.1 Testes Unitários (Jest)

```typescript
// appointments.service.spec.ts
describe('AppointmentsService', () => {
  describe('Validations', () => {
    it('should reject past dates', async () => {
      const pastDate = new Date('2024-01-01T10:00:00Z');
      
      await expect(
        service.create({
          clientId: 'uuid',
          barberId: 'uuid',
          serviceIds: ['uuid'],
          date: pastDate.toISOString()
        }, 'userId')
      ).rejects.toThrow('Não é possível agendar para data/hora passada');
    });
    
    it('should reject past time on same day', async () => {
      // Mock: now = 13:45
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        ...new Date('2026-02-18T13:45:00Z'),
      }));
      
      const pastTime = new Date('2026-02-18T13:35:00Z');
      
      await expect(
        service.create({
          clientId: 'uuid',
          barberId: 'uuid',
          serviceIds: ['uuid'],
          date: pastTime.toISOString()
        }, 'userId')
      ).rejects.toThrow('Não é possível agendar para horário anterior');
    });
    
    it('should reject overlapping appointments', async () => {
      // Criar appointment 15:00-16:00
      await service.create({
        clientId: 'client1',
        barberId: 'barber1',
        serviceIds: ['service1'], // 60min
        date: '2026-02-26T15:00:00Z'
      }, 'user1');
      
      // Tentar criar 15:30-16:30
      await expect(
        service.create({
          clientId: 'client2',
          barberId: 'barber1',
          serviceIds: ['service1'],
          date: '2026-02-26T15:30:00Z'
        }, 'user2')
      ).rejects.toThrow('Horário indisponível');
    });
    
    it('should reject out of business hours', async () => {
      // Mock: barbearia fecha às 18:00, serviço dura 60min
      await expect(
        service.create({
          clientId: 'uuid',
          barberId: 'uuid',
          serviceIds: ['service1'],
          date: '2026-02-26T17:30:00Z' // Terminaria às 18:30
        }, 'userId')
      ).rejects.toThrow('Horário fora do expediente');
    });
  });
  
  describe('Audit', () => {
    it('should track who created appointment', async () => {
      const result = await service.create(validDto, 'user123');
      
      expect(result.createdBy).toBe('user123');
      expect(result.createdAt).toBeDefined();
    });
    
    it('should track cancellation details', async () => {
      const appointment = await service.create(validDto, 'user1');
      
      const result = await service.cancel(
        appointment.id,
        'user2',
        'Cliente solicitou'
      );
      
      expect(result.cancelledBy).toBe('user2');
      expect(result.cancelledAt).toBeDefined();
      expect(result.cancellationReason).toBe('Cliente solicitou');
    });
  });
  
  describe('Notifications', () => {
    it('should notify barber when client cancels', async () => {
      const notificationSpy = jest.spyOn(notificationsService, 'create');
      
      await service.cancel(appointmentId, clientUserId, 'Motivo');
      
      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.APPOINTMENT_CANCELLED_BY_CLIENT,
          recipientId: barberId
        })
      );
    });
    
    it('should notify client when barber cancels', async () => {
      const notificationSpy = jest.spyOn(notificationsService, 'create');
      
      await service.cancel(appointmentId, barberUserId, 'Emergência');
      
      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.APPOINTMENT_CANCELLED_BY_BARBER,
          recipientId: clientId
        })
      );
    });
  });
  
  describe('Service Order Integration', () => {
    it('should create service order when completing appointment', async () => {
      const serviceOrderSpy = jest.spyOn(serviceOrderService, 'create');
      
      const result = await service.complete(appointmentId, userId);
      
      expect(result.appointment.status).toBe('COMPLETED');
      expect(result.serviceOrder).toBeDefined();
      expect(serviceOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: appointmentId
        })
      );
    });
  });
});
```

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Beck) - PRIORIDADE CRÍTICA 🔥

#### Validações
- [ ] Implementar validação de data passada
- [ ] Implementar validação de horário anterior (mesmo dia)
- [ ] Implementar verificação de conflitos de horário
- [ ] Implementar validação de horário de funcionamento
- [ ] Implementar validação de barbeiro ativo
- [ ] Implementar validação de horários bloqueados

#### Auditoria
- [ ] Adicionar campos no schema Prisma (createdBy, updatedBy, etc)
- [ ] Executar migration
- [ ] Implementar preenchimento de campos de auditoria no create
- [ ] Implementar preenchimento de campos de auditoria no update
- [ ] Implementar campos de cancelamento (cancelledBy, reason)
- [ ] Implementar soft delete (deletedBy, deletedAt)
- [ ] Adicionar logs estruturados em todas as operações

#### Notificações
- [ ] Criar schema de Notificações
- [ ] Implementar NotificationsService
- [ ] Implementar notificação: novo agendamento → barbeiro
- [ ] Implementar notificação: cancelamento por cliente → barbeiro
- [ ] Implementar notificação: cancelamento por barbeiro → cliente  
- [ ] Implementar notificação: reagendamento → barbeiro
- [ ] Implementar notificação: agendamento completado → cliente
- [ ] Implementar canais: IN_APP, EMAIL, SMS (priorizar IN_APP + EMAIL)

#### Integração Ordem de Serviço
- [ ] Criar schema ServiceOrder e relacionadas
- [ ] Implementar ServiceOrderService.create()
- [ ] Vincular criação automática ao completar appointment
- [ ] Garantir vínculo appointmentId único
- [ ] Implementar cálculo de totalAmount
- [ ] Implementar listagem de ordens de serviço no cashier

#### Endpoints
- [ ] Implementar POST /appointments com todas validações
- [ ] Implementar GET /appointments com filtros
- [ ] Implementar GET /appointments/:id
- [ ] Implementar PATCH /appointments/:id (reagendar)
- [ ] Implementar PATCH /appointments/:id/cancel (motivo obrigatório)
- [ ] Implementar PATCH /appointments/:id/complete (criar ordem)
- [ ] Implementar GET /financial/cashier/daily (histórico do dia)

#### Testes
- [ ] Testes unitários de validações
- [ ] Testes unitários de auditoria
- [ ] Testes unitários de notificações
- [ ] Testes de integração (appointment → service order)
- [ ] Testes E2E de fluxo completo
- [ ] Testes de permissões por role
- [ ] Cobertura mínima: 80%

#### Documentação
- [ ] Atualizar Swagger com todas validações
- [ ] Documentar códigos de erro (400, 409, etc)
- [ ] Adicionar exemplos de request/response
- [ ] Documentar regras de negócio
- [ ] Atualizar README com novas features

### Frontend - APENAS UX (Não fazer validações de negócio!)

- [ ] Exibir mensagens de erro do backend
- [ ] Desabilitar visualmente datas passadas no calendário
- [ ] Desabilitar visualmente horários passados (hoje)
- [ ] Implementar tela de notificações (listar e marcar como lida)
- [ ] Exibir histórico de cancelamentos com motivo
- [ ] Integrar relatório do cashier no AdminDashboard
- [ ] Adicionar feedback visual de horários bloqueados
- [ ] Exibir duração e preço total calculados

---

## 📞 DÚVIDAS E DEFINIÇÕES PENDENTES

### Para Discutir com o Time:

1. **Tempo mínimo de antecedência para cancelamento?**
   - Sugestão: 2 horas antes do agendamento
   - Cliente que cancela com menos de 2h recebe advertência?

2. **Limite de reagendamentos?**
   - Sugestão: Máximo 2 reagendamentos por appointment
   - Após isso, deve criar novo agendamento

3. **Sistema de multa por no-show?**
   - Cliente não comparece sem cancelar?
   - Bloquear novos agendamentos até justificar?
   - Cobrar taxa de no-show?

4. **Confirmação de agendamento?**
   - Enviar lembrete X horas antes?
   - Cliente precisa confirmar presença?
   - Marcar automaticamente como NO_SHOW se não confirmar?

5. **Prioridade de notificações:**
   - Email apenas para cancelamentos e lembretes?
   - SMS apenas para urgências?
   - Push notification para tudo?

6. **Restrição de múltiplos agendamentos:**
   - Cliente pode ter mais de 1 agendamento ativo ao mesmo tempo?
   - Máximo de quantos agendamentos futuros?

---

## ✅ RESUMO EXECUTIVO

### Responsabilidades:

**BACKEND (Beck):**
- ✅ 100% das validações de negócio
- ✅ 100% da auditoria (logs, timestamps, userIds)
- ✅ 100% das notificações
- ✅ 100% da integração com ordem de serviço
- ✅ Retornar erros claros e estruturados

**FRONTEND:**
- ✅ Renderizar dados da API
- ✅ Exibir mensagens de erro do backend
- ✅ UX básica (desabilitar datas/horários visualmente)
- ✅ Enviar dados no formato correto
- ❌ NÃO fazer validações de negócio
- ❌ NÃO fazer lógica complexa

### Fluxo Ideal:

1. Frontend envia request → Backend
2. Backend valida TUDO
3. Backend retorna sucesso OU erro estruturado
4. Frontend exibe resultado
5. Backend envia notificações assíncronas
6. Backend cria ordem de serviço automaticamente

### Métricas de Sucesso:

- ✅ Zero validações duplicadas (frontend + backend)
- ✅ 100% de rastreabilidade (createdBy, updatedBy em tudo)
- ✅ Notificações entregues em <5 segundos
- ✅ Ordem de serviço criada automaticamente ao completar
- ✅ Logs estruturados para análise

---

## 🎯 PRIORIZAÇÃO

### SPRINT 1 (Semana 1):
1. Validações críticas (data passada, conflito)
2. Campos de auditoria (migration + implementação)
3. Endpoint de criação com validações

### SPRINT 2 (Semana 2):
1. Sistema de notificações (IN_APP)
2. Cancelamento com notificação
3. Reagendamento com notificação

### SPRINT 3 (Semana 3):
1. Integração com ordem de serviço
2. Endpoint de completar com criação automática
3. Relatório do cashier

### SPRINT 4 (Semana 4):
1. Testes automatizados
2. Documentação completa
3. Melhorias de performance

---

**Desenvolvedor Backend:** Beck  
**Documento criado:** 18/02/2026  
**Última atualização:** 18/02/2026  
**Versão:** 1.0  
**Status:** 🔥 AGUARDANDO IMPLEMENTAÇÃO

---

## 📨 CONTATO

Para dúvidas sobre este documento:
- Frontend: [Seu contato]
- Backend: Beck

**Канал prioritário:** Slack #backend-appointments
