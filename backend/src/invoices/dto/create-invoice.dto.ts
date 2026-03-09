import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType, PaymentMethod } from '@prisma/client';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID do plano (se tipo PLAN)' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ description: 'Valor da fatura', example: 150.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: InvoiceType, description: 'Tipo da fatura: PLAN, SERVICE ou PRODUCT' })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Descrição da fatura' })
  @IsOptional()
  @IsString()
  description?: string;
}
