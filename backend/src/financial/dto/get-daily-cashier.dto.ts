import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDailyCashierDto {
  @ApiProperty({ description: 'ID da barbearia' })
  @IsString()
  shopId: string;

  @ApiProperty({ description: 'Data (formato YYYY-MM-DD)', example: '2026-02-04' })
  @IsDateString()
  date: string;
}
