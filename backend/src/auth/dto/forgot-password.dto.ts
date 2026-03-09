import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'usuario@email.com', description: 'E-mail do usuário para recuperação' })
    @IsEmail({}, { message: 'E-mail inválido' })
    @IsNotEmpty({ message: 'E-mail é obrigatório' })
    email: string;
}
