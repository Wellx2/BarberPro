import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BarbershopsService } from './barbershops.service';
import { BarbershopsController } from './barbershops.controller';
import { PublicBarbershopsController } from './public-barbershops.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // Registra JwtModule para gerar tokens
  ],
  controllers: [PublicBarbershopsController, BarbershopsController],
  providers: [BarbershopsService],
  exports: [BarbershopsService],
})
export class BarbershopsModule {}
