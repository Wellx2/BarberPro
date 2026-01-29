import { IsEnum, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { OrderItemType } from '@prisma/client';

/**
 * DTO para adicionar item à comanda existente
 */
export class AddOrderItemDto {
  @IsEnum(OrderItemType)
  type: OrderItemType;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
