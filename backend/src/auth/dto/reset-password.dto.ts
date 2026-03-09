import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'token_recebido_por_email', description: 'Token de recuperação de senha' })
    @IsString()
    @IsNotEmpty({ message: 'Token é obrigatório' })
    token: string;

    @ApiProperty({ example: 'nova_senha123', description: 'A nova senha do usuário' })
    @IsString()
    @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
    @IsNotEmpty({ message: 'Nova senha é obrigatória' })
    newPassword: string;
}
