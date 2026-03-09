import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsEmail,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TeamMemberRole } from '@prisma/client';

export class UpdateBarberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
