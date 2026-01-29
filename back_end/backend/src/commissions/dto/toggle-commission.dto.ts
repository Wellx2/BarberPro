import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class ToggleCommissionDto {
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
