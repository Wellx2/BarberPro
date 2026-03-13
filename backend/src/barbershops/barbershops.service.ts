import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { UpdatePlansContentDto } from './dto/update-plans-content.dto';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BarbershopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  // ===== ROTAS PÚBLICAS =====
  /**
   * Lista todas as barbearias (público - sem autenticação)
   */
  async findAllPublic(search?: string) {
    return this.prisma.barbershop.findMany({
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {},
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        openingTime: true,
        closingTime: true,
        logo: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        // amenities: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca dados públicos de uma barbearia específica
   * Retorna: 3 serviços, 3 produtos, 3 barbeiros (preview)
   */
  async findOnePublic(shopId: string) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        openingTime: true,
        closingTime: true,
        intervalMinutes: true,
        logo: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        // amenities: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // Buscar 3 serviços mais vendidos/populares
    const services = await this.prisma.service.findMany({
      where: { shopId, active: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        duration: true,
        image: true,
      },
      orderBy: { price: 'desc' }, // Ordenar por preço (mais caros primeiro como destaque)
      take: 3,
    });

    // Buscar 3 produtos top
    const products = await this.prisma.product.findMany({
      where: { shopId, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        image: true,
      },
      orderBy: { price: 'desc' },
      take: 3,
    });

    // Buscar 3 barbeiros com melhor avaliação
    const barbers = await this.prisma.barber.findMany({
      where: { shopId, active: true },
      select: {
        id: true,
        name: true,
        nickname: true,
        description: true,
        specialties: true,
        rating: true,
        avatar: true,
        role: true,
      },
      orderBy: { rating: 'desc' },
      take: 3,
    });

    return {
      shop,
      services,
      products,
      barbers,
    };
  }

  // ===== ROTAS PROTEGIDAS =====

  async findAll(search?: string) {
    return this.prisma.barbershop.findMany({
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { cnpj: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {},
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');
    return shop;
  }

  async update(id: string, dto: UpdateBarbershopDto) {
    // Apenas SUPER_ADMIN pode alterar dados de barbearia
    return this.prisma.barbershop.update({
      where: { id },
      data: { ...dto },
    });
  }

  async switchBarbershop(userId: string, shopId: string) {
    // 1. Validar que a barbearia existe
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // 2. Buscar usuário atual
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3. Validar acesso à barbearia
    if (user.role !== 'SUPER_ADMIN' && user.shopId !== shopId) {
      // Verifica se o usuário tem permissão adicional na tabela UserShopAccess
      const access = await this.prisma.userShopAccess.findUnique({
        where: {
          userId_shopId: {
            userId: user.id,
            shopId: shopId,
          },
        },
      });

      if (!access || !access.isActive) {
        throw new ForbiddenException('Você não tem permissão para acessar esta barbearia');
      }
    }

    // 4. Atualizar shopId do usuário no banco
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { shopId },
    });

    // 5. Gerar NOVOS tokens JWT com shopId atualizado
    const payload = {
      sub: updatedUser.id,
      role: updatedUser.role,
      shopId: updatedUser.shopId, // Novo shopId
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // 6. Salvar hash do novo refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    // 7. Retornar dados da operação + novos tokens
    return {
      message: 'Barbearia alterada com sucesso',
      shop,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        shopId: updatedUser.shopId,
        active: updatedUser.active,
        // Não retornar campos sensíveis
      },
      accessToken,
      refreshToken,
    };
  }

  // ===== HERO SETTINGS =====
  async getHeroSettings(shopId: string) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    let hero = await this.prisma.barbershopHeroSettings.findUnique({
      where: { shopId },
    });

    // Se não existe, criar com defaults
    if (!hero) {
      hero = await this.prisma.barbershopHeroSettings.create({
        data: { shopId },
      });
    }

    return hero;
  }

  async updateHeroSettings(shopId: string, dto: UpdateHeroDto) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    return this.prisma.barbershopHeroSettings.upsert({
      where: { shopId },
      create: { shopId, ...dto },
      update: dto,
    });
  }

  // ===== PLANS CONTENT =====
  async getPlansContent(shopId: string) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    let content = await this.prisma.barbershopPlansContent.findUnique({
      where: { shopId },
    });

    // Se não existe, criar com defaults
    if (!content) {
      content = await this.prisma.barbershopPlansContent.create({
        data: { shopId },
      });
    }

    return content;
  }

  async updatePlansContent(shopId: string, dto: UpdatePlansContentDto) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    return this.prisma.barbershopPlansContent.upsert({
      where: { shopId },
      create: { shopId, ...dto },
      update: dto,
    });
  }

  /**
   * Retorna informações de assinatura e features disponíveis baseado no plano
   */
  async getSubscriptionInfo(shopId: string) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        maxTeamMembers: true,
        modulesEnabled: true,
      },
    });

    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    // Mapear features baseado no tier
    const features = this.getFeaturesByTier(shop.subscriptionTier || SubscriptionTier.SIMPLE);

    return {
      subscription: {
        tier: shop.subscriptionTier || SubscriptionTier.SIMPLE,
        status: shop.subscriptionStatus || SubscriptionStatus.ACTIVE,
        startDate: shop.subscriptionStartDate,
        endDate: shop.subscriptionEndDate,
        maxTeamMembers: shop.maxTeamMembers || 3,
        features,
      },
      modulesEnabled: shop.modulesEnabled || {
        clientPlans: true,
        products: false,
        cashier: true,
        financial: false,
        reports: false,
      },
    };
  }

  /**
   * Atualizar configuração de módulos habilitados
   */
  async updateModules(shopId: string, dto: UpdateModulesDto) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        subscriptionTier: true,
        modulesEnabled: true,
      },
    });

    if (!shop) throw new NotFoundException('Barbearia não encontrada');

    const tier = shop.subscriptionTier || SubscriptionTier.SIMPLE;
    const features = this.getFeaturesByTier(tier);

    // Validar se os módulos solicitados estão disponíveis no plano
    if (dto.modulesEnabled) {
      if (dto.modulesEnabled.products && !features.hasProducts) {
        throw new BadRequestException(
          'Módulo de Produtos não disponível no plano atual. Faça upgrade para Premium.',
        );
      }

      if (dto.modulesEnabled.financial && !features.hasFinancialDashboard) {
        throw new BadRequestException(
          'Dashboard Financeiro não disponível no plano atual. Faça upgrade para Plus ou Premium.',
        );
      }

      if (dto.modulesEnabled.reports && !features.hasAdvancedReports) {
        throw new BadRequestException(
          'Relatórios Avançados não disponíveis no plano atual. Faça upgrade para Plus ou Premium.',
        );
      }
    }

    // Mesclar configurações existentes com novas
    const currentModules = (shop.modulesEnabled as any) || {};
    const updatedModules = {
      ...currentModules,
      ...dto.modulesEnabled,
    };

    return this.prisma.barbershop.update({
      where: { id: shopId },
      data: {
        modulesEnabled: updatedModules,
      },
    });
  }

  /**
   * Atualiza a assinatura do BarberPro (apenas SUPER_ADMIN)
   * Configura o plano contratado pela barbearia
   */
  async updateSubscription(shopId: string, dto: UpdateSubscriptionDto) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
      include: {
        barbers: { where: { active: true } },
      },
    });

    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // Validar limite de membros se diminuindo maxTeamMembers
    if (dto.maxTeamMembers !== undefined) {
      const currentTeamCount = shop.barbers.length;

      if (dto.maxTeamMembers < currentTeamCount) {
        throw new BadRequestException(
          `Não é possível reduzir o limite para ${dto.maxTeamMembers} membros. ` +
          `Barbearia possui ${currentTeamCount} membros ativos. Desative membros primeiro.`,
        );
      }
    }

    // Validar se tier está sendo downgraded e possui limitações
    if (dto.subscriptionTier && dto.subscriptionTier !== shop.subscriptionTier) {
      const newFeatures = this.getFeaturesByTier(dto.subscriptionTier);

      // Se está fazendo downgrade de PREMIUM para PLUS/SIMPLE e tem produtos cadastrados
      if (shop.subscriptionTier === SubscriptionTier.PREMIUM && !newFeatures.hasProducts) {
        const productsCount = await this.prisma.product.count({
          where: { shopId, active: true },
        });

        if (productsCount > 0) {
          throw new BadRequestException(
            `Não é possível fazer downgrade para ${dto.subscriptionTier}. ` +
            `Barbearia possui ${productsCount} produtos cadastrados. ` +
            `Desative todos os produtos ou mantenha o plano PREMIUM.`,
          );
        }
      }

      // Se está fazendo downgrade para SIMPLE e tem módulos financeiros em uso
      if (
        dto.subscriptionTier === SubscriptionTier.SIMPLE &&
        shop.subscriptionTier !== SubscriptionTier.SIMPLE
      ) {
        const financialData = await this.prisma.serviceOrder.count({
          where: { shopId, status: 'OPEN' },
        });

        if (financialData > 0) {
          throw new BadRequestException(
            `Não é possível fazer downgrade para SIMPLE. ` +
            `Existe ${financialData} comanda(s) em aberto. ` +
            `Finalize todas as comandas antes de fazer downgrade.`,
          );
        }
      }
    }

    // Atualizar assinatura
    const updated = await this.prisma.barbershop.update({
      where: { id: shopId },
      data: {
        subscriptionTier: dto.subscriptionTier,
        subscriptionStatus: dto.subscriptionStatus,
        subscriptionStartDate: dto.subscriptionStartDate
          ? new Date(dto.subscriptionStartDate)
          : undefined,
        subscriptionEndDate: dto.subscriptionEndDate
          ? new Date(dto.subscriptionEndDate)
          : undefined,
        maxTeamMembers: dto.maxTeamMembers,
      },
    });

    return {
      ...updated,
      features: this.getFeaturesByTier(updated.subscriptionTier),
    };
  }

  /**
   * Retorna features disponíveis baseado no tier da assinatura
   */
  private getFeaturesByTier(tier: SubscriptionTier) {
    const baseFeatures = {
      hasAppointments: true,
      hasCashier: true,
      maxTeamMembers: 3,
      hasFinancialDashboard: false,
      hasCommissionReports: false,
      commissionReportPeriods: [],
      hasProducts: false,
      hasInventory: false,
      hasProductReports: false,
      hasAdvancedReports: false,
      hasAIAnalysis: false,
      hasPrioritySupport: false,
      hasConfigurationSupport: false,
    };

    switch (tier) {
      case SubscriptionTier.SIMPLE:
        return baseFeatures;

      case SubscriptionTier.PLUS:
        return {
          ...baseFeatures,
          maxTeamMembers: 10,
          hasFinancialDashboard: true,
          hasCommissionReports: true,
          commissionReportPeriods: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
          hasAdvancedReports: true,
        };

      case SubscriptionTier.PREMIUM:
        return {
          ...baseFeatures,
          maxTeamMembers: 999, // Ilimitado
          hasFinancialDashboard: true,
          hasCommissionReports: true,
          commissionReportPeriods: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL'],
          hasProducts: true,
          hasInventory: true,
          hasProductReports: true,
          hasAdvancedReports: true,
          hasAIAnalysis: true,
          hasPrioritySupport: true,
          hasConfigurationSupport: true,
        };

      default:
        return baseFeatures;
    }
  }
}
