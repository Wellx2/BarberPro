import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { BarberWorkModel } from '@prisma/client';

export class UpdateBarberWorkModelDto {
  @IsEnum(BarberWorkModel)
  workModel: BarberWorkModel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chairRentalFee?: number;
}
