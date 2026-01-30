import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterShopDto } from './dto/register-shop.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole, AuthProvider } from '@prisma/client';

const BCRYPT_SALT = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerShop(dto: RegisterShopDto) {
    // Verifica se já existe barbearia com o mesmo nome ou CNPJ
    const whereConditions = [];
    if (dto.shopName) whereConditions.push({ name: dto.shopName });
    if (dto.cnpj) whereConditions.push({ cnpj: dto.cnpj });

    if (whereConditions.length > 0) {
      const exists = await this.prisma.barbershop.findFirst({
        where: { OR: whereConditions },
      });
      if (exists) throw new BadRequestException('Barbearia já cadastrada');
    }

    // Cria barbearia
    const shop = await this.prisma.barbershop.create({
      data: {
        name: dto.shopName,
        cnpj: dto.cnpj,
        phone: dto.phone,
        openingTime: '09:00',
        closingTime: '20:00',
        intervalMinutes: 30,
        loyaltyEnabled: true,
        subscriptionEnabled: true,
      },
    });

    // Cria usuário ADMIN
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: UserRole.ADMIN,
        shopId: shop.id,
        active: true,
      },
    });

    // Gera tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      shop,
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');
    
    // Verificar se usuário usa OAuth e não tem senha
    if (user.provider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw new UnauthorizedException('Por favor, use o login com Google para acessar sua conta');
    }
    
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: dto.refreshToken,
        active: true,
      },
    });
    if (!user) throw new UnauthorizedException('Refresh token inválido');
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      role: user.role,
      shopId: user.shopId,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    // Armazena hash do refresh token

  // ===== MÉTODOS OAUTH GOOGLE =====

  async googleLogin(googleUser: any) {
    // Buscar usuário existente pelo Google ID ou email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { provider: AuthProvider.GOOGLE, providerId: googleUser.providerId },
          { email: googleUser.email },
        ],
      },
      include: { shop: true },
    });

    if (user) {
      // Atualizar informações do usuário existente
      if (user.provider !== AuthProvider.GOOGLE) {
        // Usuário já existe com login local, migrar para OAuth
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: AuthProvider.GOOGLE,
            providerId: googleUser.providerId,
            avatar: googleUser.avatar || user.avatar,
            emailVerified: true,
          },
          include: { shop: true },
        });
      }
    } else {
      // Criar novo usuário CLIENT (sem vinculação a shop)
      user = await this.prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          provider: AuthProvider.GOOGLE,
          providerId: googleUser.providerId,
          avatar: googleUser.avatar,
          emailVerified: true,
          role: UserRole.CLIENT,
          active: true,
        },
        include: { shop: true },
      });
    }

    // Gerar tokens JWT
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        ...user,
        passwordHash: undefined,
        refreshToken: undefined,
      },
      accessToken,
      refreshToken,
    };
  }
    const hash = await bcrypt.hash(refreshToken, BCRYPT_SALT);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }
}
