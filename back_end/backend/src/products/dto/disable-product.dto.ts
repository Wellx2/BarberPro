import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableProductDto {
  @ApiProperty({ description: 'Motivo da desativação' })
  @IsString()
  reason: string;
}
