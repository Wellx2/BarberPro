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

  @ApiPropertyOptional({ description: 'Categoria do produto' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Descrição do produto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'URL da imagem do produto' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Produto ativo', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
