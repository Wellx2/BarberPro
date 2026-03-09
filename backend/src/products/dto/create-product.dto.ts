import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Preço do produto' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Quantidade em estoque' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: 'Preço de custo do produto' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'unidade' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Categoria do produto' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Descrição do produto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Formulação/Ingredientes do produto' })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({ description: 'Instruções de uso' })
  @IsOptional()
  @IsString()
  howToUse?: string;

  @ApiPropertyOptional({ description: 'Para quem é recomendado' })
  @IsOptional()
  @IsString()
  recommendedFor?: string;

  @ApiPropertyOptional({ description: 'URL da imagem do produto' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Produto ativo', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
