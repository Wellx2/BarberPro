import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveBarberDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
