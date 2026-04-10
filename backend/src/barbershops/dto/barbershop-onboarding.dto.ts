import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class BarbershopOnboardingDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionTier)
  subscriptionTier: SubscriptionTier;
}
