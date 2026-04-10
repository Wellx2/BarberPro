import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BarbershopsService } from './barbershops.service';
import { BarbershopOnboardingService } from './onboarding.service';
import { BarbershopsController } from './barbershops.controller';
import { BarbershopOnboardingController } from './onboarding.controller';
import { PublicBarbershopsController } from './public-barbershops.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BarbershopModulesModule } from '../barbershop-modules/barbershop-modules.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    BarbershopModulesModule,
  ],
  controllers: [
    PublicBarbershopsController, 
    BarbershopsController, 
    BarbershopOnboardingController
  ],
  providers: [BarbershopsService, BarbershopOnboardingService],
  exports: [BarbershopsService, BarbershopOnboardingService],
})
export class BarbershopsModule {}
