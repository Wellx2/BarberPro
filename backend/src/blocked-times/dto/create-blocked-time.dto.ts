import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockedType } from '@prisma/client';

export class CreateBlockedTimeDto {
  @ApiProperty({ description: 'ID do barbeiro' })
  @IsString()
  barberId: string;

  @ApiProperty({ enum: BlockedType, description: 'Tipo de bloqueio: DAY, TIME ou RANGE' })
  @IsEnum(BlockedType)
  type: BlockedType;

  @ApiProperty({ description: 'Data do bloqueio (ISO 8601)', example: '2026-01-30T00:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Data final (apenas para RANGE)',
    example: '2026-02-05T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Horário inicial (formato HH:MM)', example: '14:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Horário final (formato HH:MM)', example: '16:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Motivo do bloqueio' })
  @IsOptional()
  @IsString()
  reason?: string;
}
