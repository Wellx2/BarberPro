import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { UpdatePlansContentDto } from './dto/update-plans-content.dto';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { QuickSetupDto } from './dto/quick-setup.dto';
import { SubscriptionTier, SubscriptionStatus, UserRole, TeamMemberRole, BarberWorkModel, ModuleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BarbershopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Cria uma nova barbearia e seu respectivo dono (ADMIN)
   */
  async create(dto: CreateBarbershopDto) {
    const { name, phone, address, ownerEmail, ownerName, ownerPassword } = dto;

    // Verificar se já existe usuário com este e-mail
    const existingUser = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      throw new BadRequestException('E-mail do proprietário já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    return this.prisma.$transaction(async (tx) => {
      // 1. Criar a barbearia
      const shop = await tx.barbershop.create({
        data: {
          name,
          phone,
          address,
          primaryColor: '#f59e0b',
        },
      });

      // 2. Criar o usuário dono
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: UserRole.ADMIN,
          shopId: shop.id,
          active: true,
        },
      });

      // 3. Inicializar Hero Settings
      await tx.barbershopHeroSettings.create({
        data: {
          shopId: shop.id,
          title: `Bem-vindo à ${name}`,
          subtitle: 'Os melhores profissionais da região',
        },
      });

      // 4. Inicializar Conteúdo de Planos
      await tx.barbershopPlansContent.create({
        data: {
          shopId: shop.id,
        },
      });

      // 5. Inicializar Módulos padrão
      const defaultModules = [
        ModuleType.AGENDA,
        ModuleType.CAIXA,
        ModuleType.PLANOS,
      ];

      for (const moduleType of defaultModules) {
        await tx.barbershopModule.create({
          data: {
            shopId: shop.id,
            moduleType,
            enabled: true,
            enabledAt: new Date(),
          },
        });
      }

      return { shop, user };
    });
  }

  /**
   * Configuração rápida de barbearia com dados automáticos
   */
  async quickSetup(dto: QuickSetupDto) {
    const { shop, user } = await this.create(dto);

    await this.prisma.$transaction(async (tx) => {
      // 1. Gerar Serviços
      if (dto.servicesCount && dto.servicesCount > 0) {
        const serviceTemplates = [
          { name: 'Corte Masculino', price: 50, duration: 30, category: 'Cabelo' },
          { name: 'Barba', price: 30, duration: 20, category: 'Barba' },
          { name: 'Sobrancelha', price: 15, duration: 15, category: 'Estética' },
          { name: 'Combo Corte + Barba', price: 70, duration: 50, category: 'Combos' },
          { name: 'Pezinho', price: 10, duration: 10, category: 'Cabelo' },
          { name: 'Corte Kids', price: 40, duration: 30, category: 'Cabelo' },
          { name: 'Progressiva Masculina', price: 100, duration: 90, category: 'Tratamentos' },
          { name: 'Luzes', price: 120, duration: 120, category: 'Cor' },
          { name: 'Pigmentação', price: 40, duration: 30, category: 'Cor' },
          { name: 'Hidratação', price: 30, duration: 20, category: 'Tratamentos' },
        ];

        for (let i = 0; i < Math.min(dto.servicesCount, serviceTemplates.length); i++) {
          await tx.service.create({
            data: {
              shopId: shop.id,
              ...serviceTemplates[i],
            },
          });
        }
      }

      // 2. Gerar Produtos
      if (dto.productsCount && dto.productsCount > 0) {
        const productTemplates = [
          { name: 'Pomada Modeladora', price: 45, category: 'Finalização', stock: 20 },
          { name: 'Óleo para Barba', price: 35, category: 'Cuidado Barba', stock: 15 },
          { name: 'Shampoo 3 em 1', price: 55, category: 'Higiene', stock: 10 },
          { name: 'Gel Fixador', price: 20, category: 'Finalização', stock: 25 },
          { name: 'After Shave', price: 40, category: 'Pós-barba', stock: 12 },
          { name: 'Cera de Bigode', price: 25, category: 'Cuidado Barba', stock: 8 },
        ];

        for (let i = 0; i < Math.min(dto.productsCount, productTemplates.length); i++) {
          await tx.product.create({
            data: {
              shopId: shop.id,
              ...productTemplates[i],
            },
          });
        }
      }

      // 3. Gerar Barbeiros
      if (dto.barbersCount && dto.barbersCount > 0) {
        const barberNames = ['Felipe', 'Ricardo', 'Bruno', 'Gabriel', 'Tiago', 'Lucas'];
        for (let i = 0; i < Math.min(dto.barbersCount, barberNames.length); i++) {
          await tx.barber.create({
            data: {
              shopId: shop.id,
              name: barberNames[i],
              nickname: barberNames[i],
              role: TeamMemberRole.BARBER,
              workModel: BarberWorkModel.COMMISSION_ONLY,
              commissionRate: 50,
              active: true,
            },
          });
        }

        // Se criou o dono e pediu barbeiros, adicionar o dono como barbeiro também?
        // Vamos apenas garantir que o dono tenha acesso, o que já foi feito.
      }

      // 4. Gerar Planos de Assinatura para Clientes
      if (dto.plansCount && dto.plansCount > 0) {
        const planTemplates = [
          { name: 'Plano Básico', price: 99, benefits: ['Até 2 cortes/mês', '10% desc. em produtos'], description: 'Ideal para quem corta o cabelo 1x por mês' },
          { name: 'Plano Pro', price: 180, benefits: ['Até 4 serviços/mês', '15% desc. em produtos', 'Bebida grátis'], isPopular: true, description: 'Cabelo e barba sempre alinhados' },
          { name: 'Plano VIP', price: 290, benefits: ['Serviços ilimitados', '20% desc. em produtos', 'Reserva prioritária'], description: 'A experiência completa' },
        ];

        for (let i = 0; i < Math.min(dto.plansCount, planTemplates.length); i++) {
          await tx.plan.create({
            data: {
              shopId: shop.id,
              ...planTemplates[i],
            },
          });
        }
      }
    });

    return { message: 'Barbearia configurada com sucesso!', shopId: shop.id };
  }

  // ===== ROTAS PÚBLICAS =====
  /**
   * Lista todas as barbearias (público - sem autenticação)
   */
  async findAllPublic(search?: string) {
    return this.prisma.barbershop.findMany({
      where: {
        active: true,
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        whatsapp: true,
        email: true,
        address: true,
        openingTime: true,
        closingTime: true,
        logo: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        heroSettings: {
          select: {
            title: true,
            subtitle: true,
            backgroundImage: true
          }
        }
        // amenities: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca dados públicos de uma barbearia específica
   * Retorna: 3 serviços, 3 produtos, 3 barbeiros (preview)
   */
  async findOnePublic(identifier: string) {
    const shop = await this.prisma.barbershop.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        whatsapp: true,
        email: true,
        address: true,
        openingTime: true,
        closingTime: true,
        intervalMinutes: true,
        logo: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        heroSettings: {
          select: {
            title: true,
            subtitle: true,
            backgroundImage: true
          }
        }
        // amenities: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // Buscar 3 serviços mais vendidos/populares
    const services = await this.prisma.service.findMany({
      where: { shopId: shop.id, active: true, deletedAt: null },
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
      where: { shopId: shop.id, active: true },
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
      where: { shopId: shop.id, active: true },
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

    // Buscar 6 últimas avaliações da loja
    const reviews = await this.prisma.review.findMany({
      where: {
        barber: {
          shopId: shop.id,
        },
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        date: true,
        barber: {
          select: { id: true, name: true, avatar: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 6,
    });

    return {
      shop,
      services,
      products,
      barbers,
      reviews,
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
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
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
    const features = this.getFeaturesByTier(shop.subscriptionTier || SubscriptionTier.BASIC);

    return {
      subscription: {
        tier: shop.subscriptionTier || ('BASIC' as any),
        status: shop.subscriptionStatus || SubscriptionStatus.ACTIVE,
        startDate: shop.subscriptionStartDate,
        endDate: shop.subscriptionEndDate,
        maxTeamMembers: shop.maxTeamMembers || 2,
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

    const tier = shop.subscriptionTier || ('BASIC' as any);
    const features = this.getFeaturesByTier(tier);

    // Validar se os módulos solicitados estão disponíveis no plano
    if (dto.modulesEnabled) {
      if (dto.modulesEnabled.products && !features.hasProducts) {
        throw new BadRequestException(
          'Módulo de Produtos não disponível no plano atual. Faça upgrade para o plano PLUS ou superior.',
        );
      }

      if (dto.modulesEnabled.financial && !features.hasFinancialDashboard) {
        throw new BadRequestException(
          'Dashboard Financeiro não disponível no plano atual. Faça upgrade para o plano PLUS.',
        );
      }

      if (dto.modulesEnabled.reports && !features.hasAdvancedReports) {
        throw new BadRequestException(
          'Relatórios Avançados não disponíveis no plano atual. Faça upgrade para os planos PLUS, PRO ou MASTER.',
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
   * Atualiza a assinatura do KlypBarber (apenas SUPER_ADMIN)
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

      // Se está fazendo downgrade de um plano que tinha produtos para um que não tem (atualmente todos tem, mas mantendo lógica de segurança)
      if ((shop.subscriptionTier as any) === 'PRO' && !newFeatures.hasProducts) {
        const productsCount = await this.prisma.product.count({
          where: { shopId, active: true },
        });

        if (productsCount > 0) {
          throw new BadRequestException(
            `Não é possível fazer downgrade para ${dto.subscriptionTier}. ` +
            `Barbearia possui ${productsCount} produtos cadastrados. ` +
            `Desative todos os produtos ou mantenha o plano PRO.`,
          );
        }
      }

      // Se está fazendo downgrade para SIMPLE e tem módulos financeiros em uso
      if (
        (dto.subscriptionTier as any) === 'BASIC' &&
        (shop.subscriptionTier as any) !== 'BASIC'
      ) {
        const financialData = await this.prisma.serviceOrder.count({
          where: { shopId, status: 'OPEN' },
        });

        if (financialData > 0) {
          throw new BadRequestException(
            `Não é possível fazer downgrade para o plano BASIC. ` +
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
      maxTeamMembers: 2,
      hasFinancialDashboard: true,
      hasCommissionReports: true,
      commissionReportPeriods: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
      hasProducts: true,
      hasInventory: true,
      hasProductReports: true,
      hasAdvancedReports: true,
      hasAIAnalysis: false,
      hasPrioritySupport: false,
      hasConfigurationSupport: false,
      hasAuditLogs: false, // Bloqueado no BASIC
      hasWhiteLabel: false, // Bloqueado no BASIC
    };

    switch (tier as any) {
      case 'BASIC':
        return baseFeatures;

      case 'PLUS':
        return {
          ...baseFeatures,
          maxTeamMembers: 6,
          hasAuditLogs: true,
          hasWhiteLabel: true,
        };

      case 'PRO':
        return {
          ...baseFeatures,
          maxTeamMembers: 20,
          hasAIAnalysis: true,
          hasPrioritySupport: true,
          hasAuditLogs: true,
          hasWhiteLabel: true,
        };

      case 'MASTER':
        return {
          ...baseFeatures,
          maxTeamMembers: 999, // Ilimitado
          hasAIAnalysis: true,
          hasPrioritySupport: true,
          hasConfigurationSupport: true,
          hasAuditLogs: true,
          hasWhiteLabel: true,
        };

      default:
        return baseFeatures;
    }
  }
}
