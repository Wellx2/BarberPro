import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveProductDto {
  @ApiProperty({ description: 'Motivo da remoção' })
  @IsString()
  reason: string;
}
