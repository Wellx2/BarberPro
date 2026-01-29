import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateBarberDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  specialties: string[];

  @IsOptional()
  @IsUrl()
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
}
