import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsDateString,
  ValidateNested,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+55)?\d{10,11}$/, { message: 'Telefone inválido. Use DDD + número (ex: 11999999999)' })
  phone: string;

  @IsOptional()
  @Matches(/^\d{11}$/)
  cpf?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];
}
