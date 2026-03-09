import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, Matches } from 'class-validator';

export class CreateAgendaLockDto {
  @ApiProperty({
    description: 'ID do colaborador (barbeiro)',
    example: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  teamMemberId: string;

  @ApiProperty({
    description: 'Data do bloqueio (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    description: 'Hora de início (HH:mm)',
    example: '14:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de término (HH:mm)',
    example: '18:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime: string;

  @ApiProperty({
    description: 'Motivo do bloqueio',
    example: 'Consulta médica',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Se deve forçar cancelamento de agendamentos conflitantes',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forceOverride?: boolean;
}
