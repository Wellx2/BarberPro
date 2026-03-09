import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
