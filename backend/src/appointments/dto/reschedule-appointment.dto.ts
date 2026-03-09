import { IsISO8601, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'Nova data e hora do agendamento (ISO 8601)' })
  @IsISO8601()
  @IsNotEmpty()
  date: string;
}
