import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class CheckConflictsDto {
  @IsNotEmpty()
  @IsString()
  barberId: string;

  @IsOptional()
  @IsString()
  teamMemberId?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD',
  })
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;
}
