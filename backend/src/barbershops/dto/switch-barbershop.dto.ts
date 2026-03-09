import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchBarbershopDto {
  @ApiProperty({
    description: 'ID da barbearia para a qual deseja trocar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'O ID da barbearia é obrigatório' })
  @IsUUID('4', { message: 'O ID da barbearia deve ser um UUID válido' })
  shopId: string;
}
