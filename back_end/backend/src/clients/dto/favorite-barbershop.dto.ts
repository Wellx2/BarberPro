import { IsNotEmpty, IsUUID } from 'class-validator';

export class FavoriteBarbershopDto {
  @IsNotEmpty()
  @IsUUID()
  barbershopId: string;
}
