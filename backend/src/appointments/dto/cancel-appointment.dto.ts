import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'Motivo do cancelamento (obrigatório)' })
  @IsString()
  @IsNotEmpty({ message: 'Motivo do cancelamento é obrigatório' })
  @MinLength(5, { message: 'Motivo deve ter no mínimo 5 caracteres' })
  cancelReason: string;
}
