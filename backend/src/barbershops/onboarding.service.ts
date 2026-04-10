import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BarbershopOnboardingDto } from './dto/barbershop-onboarding.dto';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { BarbershopModulesService } from '../barbershop-modules/barbershop-modules.service';

@Injectable()
export class BarbershopOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modulesService: BarbershopModulesService,
  ) { }

  /**
   * Cria uma solicitação de onboarding (Barbearia inativa)
   */
  async createRequest(userId: string, dto: BarbershopOnboardingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.shopId) throw new BadRequestException('Usuário já possui uma barbearia vinculada');

    // Verifica se já existe barbearia com o mesmo nome
    const existing = await this.prisma.barbershop.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new BadRequestException('Já existe uma barbearia com este nome');

    // Cria a barbearia inativa e pendente
    const shop = await this.prisma.barbershop.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        cnpj: dto.cnpj,
        active: false,
        subscriptionStatus: SubscriptionStatus.PENDING,
        subscriptionTier: dto.subscriptionTier,
        openingTime: '09:00',
        closingTime: '20:00',
        intervalMinutes: 30,
      },
    });

    // Vincula o usuário à barbearia (mas mantém role CLIENT até aprovação)
    await this.prisma.user.update({
      where: { id: userId },
      data: { shopId: shop.id },
    });

    return {
      message: 'Solicitação de onboarding criada com sucesso. Aguardando aprovação.',
      shopId: shop.id,
    };
  }

  /**
   * Lista todas as solicitações pendentes (Para Super Admin)
   */
  async listPendingRequests() {
    return this.prisma.barbershop.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.PENDING,
        active: false,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Aprova uma solicitação, ativando a barbearia e promovendo o usuário
   */
  async approveRequest(shopId: string) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
      include: { users: true },
    });

    if (!shop) throw new NotFoundException('Barbearia não encontrada');
    if (shop.subscriptionStatus !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Esta barbearia não possui uma solicitação pendente');
    }

    // Ativa a barbearia
    await this.prisma.barbershop.update({
      where: { id: shopId },
      data: {
        active: true,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: new Date(),
      },
    });

    // Promove o(s) usuário(s) vinculado(s) a ADMIN
    for (const user of shop.users) {
      if (user.role === UserRole.CLIENT) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
        });

        // Inicializa módulos padrão se for o primeiro admin
        await this.modulesService.initializeDefaultModules(shopId, user.id);
      }
    }

    return { message: 'Barbearia ativada e usuários promovidos com sucesso.' };
  }

  /**
   * Inativa uma solicitação (Para Super Admin)
   */
  async rejectRequest(shopId: string) {
    await this.prisma.barbershop.update({
      where: { id: shopId },
      data: { subscriptionStatus: SubscriptionStatus.CANCELLED },
    });
    return { message: 'Solicitação rejeitada.' };
  }
}
