import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreatePlanDto) {
    // SUPER_ADMIN pode criar plano para qualquer barbearia
    let shopId: string;

    if (requester.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN deve especificar shopId no body
      if (!dto.shopId) {
        throw new BadRequestException('SUPER_ADMIN deve especificar o shopId da barbearia');
      }
      shopId = dto.shopId;

      // Validar que a barbearia existe
      const shop = await this.prisma.barbershop.findUnique({
        where: { id: shopId },
      });
      if (!shop) {
        throw new NotFoundException('Barbearia não encontrada');
      }
    } else {
      // ADMIN usa sua própria barbearia
      if (!requester.shopId) {
        throw new ForbiddenException('Sem barbearia vinculada');
      }
      shopId = requester.shopId;
    }

    const plan = await this.prisma.plan.create({
      data: {
        shopId,
        name: dto.name,
        price: dto.price,
        benefits: dto.benefits,
        discount: dto.discount,
        benefitMonths: dto.benefitMonths || 1,
        benefitServices: dto.benefitServices || 0,
        benefitProducts: dto.benefitProducts || 0,
        benefitMoneyback: dto.benefitMoneyback || 0,
        description: dto.description,
        isPopular: dto.isPopular || false,
        active: dto.active !== undefined ? dto.active : true,
      },
    });

    await this.logAction('CREATE', plan.id, requester.id, shopId, 'Plano criado');
    return plan;
  }

  async findAll(requester: any, shopIdFilter?: string) {
    // SUPER_ADMIN pode listar todos os planos ou filtrar por shopId
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.plan.findMany({
        where: shopIdFilter ? { shopId: shopIdFilter } : {},
        orderBy: { price: 'asc' },
      });
    }

    // ADMIN lista apenas planos da própria barbearia
    if (!requester.shopId) {
      throw new ForbiddenException('Sem barbearia vinculada');
    }

    return this.prisma.plan.findMany({
      where: { shopId: requester.shopId },
      orderBy: { price: 'asc' },
    });
  }

  async findByShop(shopId: string) {
    return this.prisma.plan.findMany({
      where: {
        shopId,
        active: true, // Apenas planos ativos para público
      },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return plan;
  }

  async update(requester: any, id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    // SUPER_ADMIN pode editar qualquer plano
    // ADMIN só pode editar planos da própria barbearia
    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.shopId) {
        throw new ForbiddenException('Sem barbearia vinculada');
      }
      if (plan.shopId !== requester.shopId) {
        throw new ForbiddenException('Você não tem permissão para editar este plano');
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: { ...dto },
    });

    await this.logAction('UPDATE', id, requester.id, plan.shopId, 'Plano atualizado');
    return updated;
  }

  async toggleActive(requester: any, id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    // SUPER_ADMIN pode alterar qualquer plano
    // ADMIN só pode alterar planos da própria barbearia
    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.shopId) {
        throw new ForbiddenException('Sem barbearia vinculada');
      }
      if (plan.shopId !== requester.shopId) {
        throw new ForbiddenException('Você não tem permissão para alterar este plano');
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: { active: !plan.active },
    });

    await this.logAction(
      'TOGGLE_ACTIVE',
      id,
      requester.id,
      requester.shopId,
      `Plano ${updated.active ? 'ativado' : 'desativado'}`,
    );

    return updated;
  }

  async remove(requester: any, id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    // SUPER_ADMIN pode deletar qualquer plano
    // ADMIN só pode deletar planos da própria barbearia
    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.shopId) {
        throw new ForbiddenException('Sem barbearia vinculada');
      }
      if (plan.shopId !== requester.shopId) {
        throw new ForbiddenException('Você não tem permissão para deletar este plano');
      }
    }

    // Apenas planos inativos podem ser deletados
    if (plan.active) {
      throw new BadRequestException(
        'Apenas planos inativos podem ser deletados. Desative o plano primeiro.',
      );
    }

    // Verificar se há usuários usando este plano
    const usersWithPlan = await this.prisma.user.count({
      where: { planId: id },
    });

    if (usersWithPlan > 0) {
      throw new BadRequestException(
        `Este plano não pode ser deletado pois ${usersWithPlan} usuário(s) estão utilizando-o.`,
      );
    }

    await this.prisma.plan.delete({ where: { id } });

    await this.logAction('DELETE', id, requester.id, plan.shopId, 'Plano deletado');
    return { message: 'Plano deletado com sucesso' };
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string | null,
    details?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'Plan',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
