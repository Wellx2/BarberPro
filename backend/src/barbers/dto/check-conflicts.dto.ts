import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CheckConflictsDto {
  @IsNotEmpty()
  @IsString()
  barberId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;
}
