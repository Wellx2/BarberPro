import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBarbershopDto {
  @ApiProperty({ example: 'Barbearia do João' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'barbearia-do-joao', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Rua das Flores, 123', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'admin@barbearia.com' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  ownerPassword: string;
}
