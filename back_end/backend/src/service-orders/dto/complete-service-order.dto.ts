import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/**
 * DTO para finalizar comanda (fechar conta)
 */
export class CompleteServiceOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number; // Desconto adicional em reais
}
