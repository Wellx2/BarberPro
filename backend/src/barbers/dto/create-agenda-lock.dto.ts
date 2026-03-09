import { IsNotEmpty, IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateAgendaLockDto {
  @IsNotEmpty()
  @IsString()
  barberId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conflictingAppointmentIds?: string[]; // IDs dos agendamentos que serão cancelados
}
