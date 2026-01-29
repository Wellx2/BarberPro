import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateCommissionDto {
  @IsString()
  barberId: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsEnum(CommissionType)
  type: CommissionType;

  @IsNumber()
  @Min(0)
  value: number; // Porcentagem (0-100) ou valor fixo

  @IsOptional()
  @IsNumber()
  @Min(0)
  minTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTarget?: number;

  @IsBoolean()
  @IsOptional()
  applyOnServices?: boolean;

  @IsBoolean()
  @IsOptional()
  applyOnProducts?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
