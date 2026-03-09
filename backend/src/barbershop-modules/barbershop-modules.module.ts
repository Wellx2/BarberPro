import { Module } from '@nestjs/common';
import { BarbershopModulesService } from './barbershop-modules.service';
import { BarbershopModulesController } from './barbershop-modules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // Configuração para guards
  ],
  controllers: [BarbershopModulesController],
  providers: [BarbershopModulesService],
  exports: [BarbershopModulesService], // Exportar para uso em outros módulos
})
export class BarbershopModulesModule {}
