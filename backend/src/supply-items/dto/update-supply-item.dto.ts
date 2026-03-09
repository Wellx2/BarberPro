import { PartialType } from '@nestjs/swagger';
import { CreateSupplyItemDto } from './create-supply-item.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupplyItemDto extends PartialType(CreateSupplyItemDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
