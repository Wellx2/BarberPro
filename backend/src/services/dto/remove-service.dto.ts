import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveServiceDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
