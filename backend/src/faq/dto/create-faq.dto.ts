import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ description: 'ID da barbearia' })
  @IsString()
  shopId: string;

  @ApiProperty({ description: 'Pergunta do FAQ' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Resposta do FAQ' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'FAQ ativo', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
