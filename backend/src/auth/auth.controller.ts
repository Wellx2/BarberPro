import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterShopDto } from './dto/register-shop.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-shop')
  @HttpCode(HttpStatus.CREATED)
  async registerShop(@Body() dto: RegisterShopDto) {
    return this.authService.registerShop(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-client')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar novo cliente (sem barbearia)' })
  async registerClient(@Body() dto: RegisterClientDto) {
    return this.authService.registerClient(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    return this.authService.logout(req.user.id);
  }

  // Endpoint de debug para verificar se token está válido
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verificar token e retornar usuário atual' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async me(@Req() req) {
    return {
      user: req.user,
      message: 'Token válido',
    };
  }

  // ===== GOOGLE OAUTH ENDPOINTS =====

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Inicia o fluxo de autenticação com Google' })
  @ApiResponse({ status: 302, description: 'Redireciona para Google OAuth' })
  async googleAuth() {
    // Guard redireciona automaticamente para Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  @ApiResponse({ status: 200, description: 'Autenticação bem-sucedida' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    // Processar usuário autenticado pelo Google
    const result = await this.authService.googleLogin(req.user);

    // Redirecionar para o frontend com tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

    return res.redirect(redirectUrl);
  }

  // ===== TESTE ROTA PÚBLICA =====
  @Get('test-public')
  @ApiOperation({ summary: 'Teste de rota pública (sem autenticação)' })
  async testPublic() {
    return { message: 'Rota pública funcionando!', timestamp: new Date().toISOString() };
  }

  // ===== PASSWORD RECOVERY =====

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ===== PROFILE UPDATE =====

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  async updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
