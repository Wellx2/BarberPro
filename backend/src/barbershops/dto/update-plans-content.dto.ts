import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlansContentDto {
  @ApiPropertyOptional({ description: 'Título do hero da página de planos' })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiPropertyOptional({ description: 'Subtítulo do hero da página de planos' })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional({ description: 'Título do benefício 1' })
  @IsOptional()
  @IsString()
  benefit1Title?: string;

  @ApiPropertyOptional({ description: 'Texto do benefício 1' })
  @IsOptional()
  @IsString()
  benefit1Text?: string;

  @ApiPropertyOptional({ description: 'Título do benefício 2' })
  @IsOptional()
  @IsString()
  benefit2Title?: string;

  @ApiPropertyOptional({ description: 'Texto do benefício 2' })
  @IsOptional()
  @IsString()
  benefit2Text?: string;

  @ApiPropertyOptional({ description: 'Título do benefício 3' })
  @IsOptional()
  @IsString()
  benefit3Title?: string;

  @ApiPropertyOptional({ description: 'Texto do benefício 3' })
  @IsOptional()
  @IsString()
  benefit3Text?: string;
}
