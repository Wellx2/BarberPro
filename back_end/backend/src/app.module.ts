import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BarbershopsModule } from './barbershops/barbershops.module';
import { UsersModule } from './users/users.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BlockedTimesModule } from './blocked-times/blocked-times.module';
import { PlansModule } from './plans/plans.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReviewsModule } from './reviews/reviews.module';
// Novos módulos financeiros
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FinancialReportsModule } from './financial-reports/financial-reports.module';
import { CommissionsModule } from './commissions/commissions.module';

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 100,
    }),

    // Prisma
    PrismaModule,

    // Módulos de negócio
    AuthModule,
    BarbershopsModule,
    UsersModule,
    BarbersModule,
    ServicesModule,
    ClientsModule,
    ProductsModule,
    AppointmentsModule,
    BlockedTimesModule,
    PlansModule,
    InvoicesModule,
    ReviewsModule,

    // Módulos Financeiros
    ServiceOrdersModule,
    ExpensesModule,
    FinancialReportsModule,
    CommissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
