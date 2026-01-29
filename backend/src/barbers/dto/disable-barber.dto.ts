import { IsNotEmpty, IsString } from 'class-validator';

export class DisableBarberDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
