import { IsString, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nome do plano', example: 'Premium' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Preço do plano', example: 99.9 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Benefícios do plano',
    example: ['Agendamento prioritário', '10% desconto em produtos', 'Sem taxa de cancelamento'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  benefits: string[];

  @ApiProperty({ description: 'Desconto em serviços (%)', example: 15, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;
}
