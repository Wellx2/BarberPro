import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  IsISO8601,
  IsOptional,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AppointmentProductDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateAppointmentDto {
  @ApiPropertyOptional({ description: 'ID do cliente (obrigatório para ADMIN/SUPER_ADMIN)' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID do barbeiro (obrigatório para ADMIN/SUPER_ADMIN)' })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiProperty({ description: 'IDs dos serviços', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  serviceIds: string[];

  @ApiProperty({ description: 'Data e hora do agendamento (ISO 8601)' })
  @IsISO8601()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Observações do agendamento' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Produtos adicionais', type: [AppointmentProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentProductDto)
  products?: AppointmentProductDto[];

  @ApiPropertyOptional({ description: 'Habilita lembrete para este agendamento', default: true })
  @IsOptional()
  reminderEnabled?: boolean;
}
