import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleType } from '@prisma/client';

export class UpdateModuleDto {
  @ApiProperty({
    description: 'Status do módulo (ativo/inativo)',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;
}

export class BulkUpdateModulesDto {
  @ApiProperty({
    description: 'Lista de módulos a serem atualizados',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        moduleType: { enum: Object.values(ModuleType) },
        enabled: { type: 'boolean' },
      },
    },
    example: [
      { moduleType: 'PRODUTOS', enabled: true },
      { moduleType: 'MARKETING', enabled: false },
    ],
  })
  modules: Array<{
    moduleType: ModuleType;
    enabled: boolean;
  }>;
}
