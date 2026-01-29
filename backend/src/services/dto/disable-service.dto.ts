import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ServiceDisabledType {
  DAY = 'DAY',
  PERIOD = 'PERIOD',
  RECURRING_DAY = 'RECURRING_DAY',
}

export class DisableServiceDto {
  @IsNotEmpty()
  @IsEnum(ServiceDisabledType)
  type: ServiceDisabledType;

  @IsOptional()
  @IsDateString()
  date?: string; // Para DAY ou RECURRING_DAY

  @IsOptional()
  @IsDateString()
  startDate?: string; // Para PERIOD

  @IsOptional()
  @IsDateString()
  endDate?: string; // Para PERIOD

  @IsNotEmpty()
  @IsString()
  reason: string;
}
