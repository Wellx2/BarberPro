import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AgendaLocksService } from './agenda-locks.service';
import { AgendaLocksController } from './agenda-locks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AgendaLocksController],
  providers: [AgendaLocksService],
  exports: [AgendaLocksService],
})
export class AgendaLocksModule { }
