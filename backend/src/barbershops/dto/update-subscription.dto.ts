import { IsEnum, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Enums temporários até migration ser executada
enum SubscriptionTier {
  SIMPLE = 'SIMPLE',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM',
}

enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionTier,
    description: 'Plano de assinatura do BarberPro',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier;

  @ApiProperty({
    enum: SubscriptionStatus,
    description: 'Status da assinatura',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({
    description: 'Data de início da assinatura',
    example: '2026-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  subscriptionStartDate?: string;

  @ApiProperty({
    description: 'Data de término da assinatura',
    example: '2026-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  subscriptionEndDate?: string;

  @ApiProperty({
    description: 'Número máximo de membros da equipe permitido',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeamMembers?: number;
}
