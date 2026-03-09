import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModulesDto {
  @ApiPropertyOptional({
    description: 'Módulos habilitados',
    example: {
      clientPlans: true,
      products: true,
      cashier: true,
      financial: false,
      reports: false,
    },
  })
  @IsOptional()
  @IsObject()
  modulesEnabled?: {
    clientPlans?: boolean;
    products?: boolean;
    cashier?: boolean;
    financial?: boolean;
    reports?: boolean;
  };
}
