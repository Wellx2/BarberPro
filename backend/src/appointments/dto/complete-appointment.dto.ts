import { IsArray, IsOptional, IsUUID, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ExtraProductDto {
    @ApiPropertyOptional()
    @IsUUID()
    id: string;

    @ApiPropertyOptional()
    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CompleteAppointmentDto {
    @ApiPropertyOptional({ type: [ExtraProductDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExtraProductDto)
    products?: ExtraProductDto[];
}
