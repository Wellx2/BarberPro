import {
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiPropertyOptional({
    description: 'ID da barbearia (obrigatório para SUPER_ADMIN, ignorado para ADMIN)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

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

  @ApiPropertyOptional({ description: 'Validade em meses', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  benefitMonths?: number;

  @ApiPropertyOptional({ description: 'Quantidade de serviços inclusos', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  benefitServices?: number;

  @ApiPropertyOptional({ description: 'Quantidade de produtos inclusos', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  benefitProducts?: number;

  @ApiPropertyOptional({ description: 'Percentual de cashback', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  benefitMoneyback?: number;

  @ApiPropertyOptional({ description: 'Descrição detalhada do plano' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Se é o plano mais popular', example: true })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Se o plano está ativo', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
