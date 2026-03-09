import { Module } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { BarbersController } from './barbers.controller';
import { PublicBarbersController } from './public-barbers.controller';
import { TeamMembersController } from './team-members.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BarbersController, PublicBarbersController, TeamMembersController],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}
