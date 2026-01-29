import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID do agendamento' })
  @IsString()
  appointmentId: string;

  @ApiProperty({ description: 'ID do barbeiro' })
  @IsString()
  barberId: string;

  @ApiProperty({ description: 'Nota de 1 a 5', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Comentário da avaliação', example: 'Excelente atendimento!' })
  @IsString()
  comment: string;
}
