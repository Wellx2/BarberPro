import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdateBarbershopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  openingTime?: string;

  @IsOptional()
  @IsString()
  closingTime?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  intervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  subscriptionEnabled?: boolean;
}
