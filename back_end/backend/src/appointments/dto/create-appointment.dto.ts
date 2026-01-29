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
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'ID do barbeiro' })
  @IsUUID()
  @IsNotEmpty()
  barberId: string;

  @ApiProperty({ description: 'IDs dos serviços', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  serviceIds: string[];

  @ApiProperty({ description: 'Data e hora do agendamento (ISO 8601)' })
  @IsISO8601()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Produtos adicionais', type: [AppointmentProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentProductDto)
  products?: AppointmentProductDto[];
}
