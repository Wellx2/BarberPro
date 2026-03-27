import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CreateBarbershopDto } from './create-barbershop.dto';

export class QuickSetupDto extends CreateBarbershopDto {
  @ApiProperty({ example: 5, description: 'Número de serviços a serem gerados', default: 5 })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsOptional()
  servicesCount?: number = 5;

  @ApiProperty({ example: 5, description: 'Número de produtos a serem gerados', default: 5 })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsOptional()
  productsCount?: number = 5;

  @ApiProperty({ example: 3, description: 'Número de profissionais a serem gerados', default: 3 })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  barbersCount?: number = 3;

  @ApiProperty({ example: 3, description: 'Número de planos de assinatura a serem gerados', default: 3 })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  plansCount?: number = 3;
}
