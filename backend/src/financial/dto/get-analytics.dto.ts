import { IsEnum, IsOptional, IsString, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsPeriod {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

export class GetAnalyticsDto {
  @ApiProperty({ description: 'ID da barbearia' })
  @IsString()
  shopId: string;

  @ApiProperty({ description: 'Período de análise', enum: AnalyticsPeriod })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;

  @ApiPropertyOptional({
    description: 'Data inicial (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final (ISO 8601)',
    example: '2026-02-04T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
