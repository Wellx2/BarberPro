import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}
