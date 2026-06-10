import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterShopDto } from './dto/register-shop.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole, AuthProvider, SubscriptionStatus } from '@prisma/client';
import { BarbershopModulesService } from '../barbershop-modules/barbershop-modules.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { randomBytes } from 'crypto';
import { RegisterClientDto } from './dto/register-client.dto';
import { NotificationChannel, NotificationPriority } from '../notifications/dto/notification.enums';

const BCRYPT_SALT = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly barbershopModulesService: BarbershopModulesService,
    private readonly notificationsService: NotificationsService,
  ) { }

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

    // Gera slug amigável e único
    let baseSlug = dto.shopName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    let slug = baseSlug;
    let count = 1;
    while (true) {
      const exists = await this.prisma.barbershop.findFirst({
        where: { slug },
      });
      if (!exists) break;
      slug = `${baseSlug}${count}`;
      count++;
    }

    // Cria barbearia
    const shop = await this.prisma.barbershop.create({
      data: {
        name: dto.shopName,
        cnpj: dto.cnpj,
        phone: dto.phone,
        address: dto.address,
        slug,
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

    // Inicializa todos os módulos habilitados por padrão
    await this.barbershopModulesService.initializeDefaultModules(shop.id, user.id);

    return {
      shop,
      user,
      accessToken,
      refreshToken,
    };
  }

  async registerClient(dto: RegisterClientDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: UserRole.CLIENT,
        active: true,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);

    return {
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
    // Decodifica o refresh token para pegar o userId (payload.sub)
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Busca usuário pelo ID do payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    // Verifica se o refresh token enviado corresponde ao hash salvo
    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado. Faça login novamente.');
    }

    const isValidToken = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isValidToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Gera novos tokens
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
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

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

  // ===== PASSWORD RECOVERY =====

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Por segurança, não informamos se o email existe ou não
    if (!user || user.provider !== AuthProvider.LOCAL) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };
    }

    // Gerar token de recuperação (simples para MVP)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hora de validade

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires: expires,
      },
    });

    // Enviar e-mail real via NotificationsService
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.notificationsService.create({
      type: 'FORGOT_PASSWORD' as any,
      recipientId: user.id,
      title: 'Recuperação de Senha - KlypBarber',
      message: `Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha:\n\n${resetUrl}\n\nO link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.EMAIL],
      data: { resetToken, resetUrl }
    });


    return { message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const users = await this.prisma.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpires: { gt: new Date() },
      },
    });

    // Busca manual pois o token está hasheado no banco
    let targetUser = null;
    for (const user of users) {
      const isValid = await bcrypt.compare(dto.token, user.resetToken);
      if (isValid) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT);

    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ===== PROFILE UPDATE =====

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Apenas incluir no updateData os campos explicitamente fornecidos no DTO
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    // Tratar e-mail separadamente: só incluir se mudou de fato
    if (dto.email !== undefined) {
      const newEmail = dto.email.trim().toLowerCase();
      const currentEmail = (user.email || '').trim().toLowerCase();

      if (newEmail !== currentEmail) {
        // Verificar se o novo e-mail já pertence a outro usuário
        const emailConflict = await this.prisma.user.findUnique({
          where: { email: newEmail },
        });
        if (emailConflict && emailConflict.id !== userId) {
          throw new BadRequestException('Este e-mail já está em uso por outro usuário');
        }
        updateData.email = newEmail;
      }
    }

    // Se estiver alterando a senha
    if (dto.password) {
      // Validar senha atual por segurança
      if (!dto.currentPassword) {
        throw new BadRequestException('Você deve informar a senha atual para criar uma nova senha');
      }

      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('A senha atual informada está incorreta');
      }

      updateData.passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);
    }

    // Garantir que currentPassword não vá para o Prisma
    delete updateData.currentPassword;

    // Se não há nada para atualizar, retornar o usuário atual sem chamar o banco
    if (Object.keys(updateData).length === 0) {
      return {
        message: 'Nenhuma alteração detectada',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    };
  }
}
