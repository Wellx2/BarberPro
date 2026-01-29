import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  cancelReason: string;
}
