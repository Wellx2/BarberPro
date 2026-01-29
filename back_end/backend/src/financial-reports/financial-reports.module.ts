import { Module } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { FinancialReportsController } from './financial-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialReportsController],
  providers: [FinancialReportsService],
  exports: [FinancialReportsService],
})
export class FinancialReportsModule {}
