import { Module } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { BlockedTimesController } from './blocked-times.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlockedTimesController],
  providers: [BlockedTimesService],
  exports: [BlockedTimesService],
})
export class BlockedTimesModule {}
