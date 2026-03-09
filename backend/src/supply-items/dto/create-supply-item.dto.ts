import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    IsOptional,
    IsBoolean,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupplyUnitType {
    UNIT = 'UNIT',
    BOX = 'BOX',
    PACK = 'PACK',
    ML = 'ML',
    GRAMS = 'GRAMS',
    LITERS = 'LITERS',
    KG = 'KG',
    METERS = 'METERS',
}

export const SUPPLY_UNIT_LABELS: Record<SupplyUnitType, string> = {
    UNIT: 'Unidade',
    BOX: 'Caixa',
    PACK: 'Pacote / Fardo',
    ML: 'Mililitros (ml)',
    GRAMS: 'Gramas (g)',
    LITERS: 'Litros (L)',
    KG: 'Quilograma (kg)',
    METERS: 'Metros (m)',
};

export class CreateSupplyItemDto {
    @ApiProperty({ example: 'Navalha descartável' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Navalha de aço inox para barbearia' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Higiene' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({ enum: SupplyUnitType, example: SupplyUnitType.UNIT })
    @IsEnum(SupplyUnitType)
    unit: SupplyUnitType;

    @ApiProperty({ example: 100 })
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minQuantity?: number;

    @ApiPropertyOptional({ example: 0.75 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    unitCost?: number;

    @ApiPropertyOptional({ example: 75.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    totalCost?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
