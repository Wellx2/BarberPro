import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHeroDto {
  @ApiPropertyOptional({ description: 'Título do hero' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Subtítulo do hero' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'URL da imagem de fundo' })
  @IsOptional()
  @IsUrl()
  backgroundImage?: string;
}
