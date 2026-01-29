import { PartialType } from '@nestjs/mapped-types';
import { CreateCommissionDto } from './create-commission.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCommissionDto extends PartialType(CreateCommissionDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
