import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ExpenseType, PaymentMethod } from '@prisma/client';

/**
 * DTO para criar despesa operacional
 */
export class CreateExpenseDto {
  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsString()
  @IsNotEmpty()
  category: string; // Subcategoria customizável

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  dueDate: Date;

  @IsOptional()
  paidDate?: Date;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  recurrenceDay?: number; // Dia do mês para despesa recorrente

  @IsOptional()
  @IsString()
  notes?: string;
}
