import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemType } from '@prisma/client';

/**
 * DTO para criar um item da comanda
 */
export class CreateOrderItemDto {
  @IsEnum(OrderItemType)
  @IsNotEmpty()
  type: OrderItemType;

  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

/**
 * DTO para criar uma nova comanda/ordem de serviço
 */
export class CreateServiceOrderDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsUUID()
  @IsNotEmpty()
  barberId: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsOptional()
  items?: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
