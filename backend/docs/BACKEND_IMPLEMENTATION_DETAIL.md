# BarberPro Backend Technical Detail (Source Package)

Este documento contém os trechos de código fundamentais do backend BarberPro para análise técnica e proposição de melhorias.

---

## 🗄️ 1. Modelo de Dados ([prisma/schema.prisma](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/prisma/schema.prisma))

Fragmentos essenciais do esquema multi-tenant.

```prisma
model Barbershop {
  id                  String      @id @default(uuid())
  name                String
  cnpj                String?    @unique
  openingTime         String     @default("09:00")
  closingTime         String     @default("20:00")
  modulesEnabled      Json?      // Toggle de funcionalidades (SaaS)
  active              Boolean    @default(true)
  
  users        User[]
  appointments Appointment[]
  // ... relações parciais
}

model User {
  id             String        @id @default(uuid())
  role           UserRole      @default(CLIENT)
  shopId         String?
  passwordHash   String?
  refreshToken   String?       // JWT Refresh Token persistente
  provider       AuthProvider  @default(LOCAL)
  // ...
}

model Appointment {
  id          String    @id @default(uuid())
  shopId      String
  clientId    String
  barberId    String
  date        DateTime
  status      AppointmentStatus @default(SCHEDULED)
  totalPrice  Float
  // ...
}
```

---

## 🛡️ 2. Isolamento de Dados ([src/common/guards/tenant.guard.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/common/guards/tenant.guard.ts))

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user.role === 'SUPER_ADMIN') return true;

    request.shopId = user.shopId; // Injeção do TenantID global

    if (!user.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia.');
    }
    return true;
  }
}
```

---

## 🔐 3. Lógica de Autenticação ([src/auth/auth.service.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/auth/auth.service.ts))

Gerenciamento de Login e Refresh Token.

```typescript
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role, shopId: user.shopId };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
```

---

## 📅 4. Validação de Agendamentos ([src/appointments/appointments.service.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/appointments/appointments.service.ts))

Regras de negócio e prevenção de conflitos.

```typescript
  async create(requester: any, dto: CreateAppointmentDto) {
    const scheduledFor = new Date(dto.date);
    const endAt = new Date(scheduledFor.getTime() + totalDuration * 60000);

    // Validação de Horário de Funcionamento
    if (startTime < shop.openingTime || endTime > shop.closingTime) {
      throw new BadRequestException(`Horário fora do expediente.`);
    }

    // Validação de Conflitos (Double-booking)
    await this.checkAppointmentConflicts(barber.id, requester.shopId, scheduledFor, endAt);

    // Criação com auditoria (createdBy)
    const appointment = await this.prisma.appointment.create({
      data: {
        shopId: requester.shopId,
        clientId: effectiveClientId,
        barberId: effectiveBarberId,
        date: scheduledFor,
        createdBy: requester.id,
        // ...
      }
    });
    return appointment;
  }
```

---
*Estes dados permitem a análise de segurança, performance e fluxos de dados do backend no NotebookLM.*
