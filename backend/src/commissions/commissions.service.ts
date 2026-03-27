import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { ToggleCommissionDto } from './dto/toggle-commission.dto';
import { CommissionType } from '@prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar nova regra de comissão
   */
  async create(requester: any, dto: CreateCommissionDto) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    // Validar que barbeiro existe e pertence ao shop
    const barber = await this.prisma.barber.findFirst({
      where: { id: dto.barberId, shopId: requester.shopId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Validar serviceId se fornecido
    if (dto.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, shopId: requester.shopId },
      });
      if (!service) {
        throw new NotFoundException('Serviço não encontrado');
      }
    }

    // Validar productId se fornecido
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, shopId: requester.shopId },
      });
      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }
    }

    // Validar porcentagem se tipo for PERCENTAGE
    if (dto.type === CommissionType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('Porcentagem não pode ser maior que 100%');
    }

    // Validar targets para TIERED
    if (dto.type === CommissionType.TIERED) {
      if (!dto.minTarget || !dto.maxTarget) {
        throw new BadRequestException('Comissão escalonada requer minTarget e maxTarget');
      }
      if (dto.minTarget >= dto.maxTarget) {
        throw new BadRequestException('minTarget deve ser menor que maxTarget');
      }
    }

    // Criar comissão
    const commission = await this.prisma.barberCommission.create({
      data: {
        shopId: requester.shopId,
        barberId: dto.barberId,
        serviceId: dto.serviceId,
        productId: dto.productId,
        type: dto.type,
        value: dto.value,
        minTarget: dto.minTarget,
        maxTarget: dto.maxTarget,
        applyOnServices: dto.applyOnServices ?? true,
        applyOnProducts: dto.applyOnProducts ?? false,
        active: dto.active ?? true,
      },
      include: {
        barber: { select: { name: true } },
        service: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    await this.logAction(
      'CREATE_COMMISSION',
      commission.id,
      requester.id,
      requester.shopId,
      `Comissão criada para ${barber.name}: ${dto.type} ${dto.value}`,
    );

    return commission;
  }

  /**
   * Listar comissões com filtros
   */
  async findAll(
    requester: any,
    filters?: {
      barberId?: string;
      serviceId?: string;
      productId?: string;
      active?: boolean;
    },
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    return this.prisma.barberCommission.findMany({
      where: {
        shopId: requester.shopId,
        barberId: filters?.barberId,
        serviceId: filters?.serviceId,
        productId: filters?.productId,
        active: filters?.active,
      },
      include: {
        barber: { select: { id: true, name: true, workModel: true } },
        service: { select: { id: true, name: true, price: true } },
        product: { select: { id: true, name: true, price: true } },
      },
      orderBy: [{ barberId: 'asc' }, { serviceId: 'asc' }, { productId: 'asc' }],
    });
  }

  /**
   * Buscar comissões de um barbeiro específico
   */
  async findByBarber(requester: any, barberId: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id: barberId, shopId: requester.shopId },
      include: {
        commissions: {
          include: {
            service: { select: { id: true, name: true, price: true } },
            product: { select: { id: true, name: true, price: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    return {
      barber: {
        id: barber.id,
        name: barber.name,
        workModel: barber.workModel,
        monthlySalary: barber.monthlySalary,
        chairRentalFee: barber.chairRentalFee,
      },
      commissions: barber.commissions,
    };
  }

  /**
   * Buscar uma comissão específica
   */
  async findOne(requester: any, id: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const commission = await this.prisma.barberCommission.findFirst({
      where: { id, shopId: requester.shopId },
      include: {
        barber: { select: { id: true, name: true, workModel: true } },
        service: { select: { id: true, name: true, price: true } },
        product: { select: { id: true, name: true, price: true } },
      },
    });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada');
    }

    return commission;
  }

  /**
   * Atualizar comissão (editar porcentagem, targets, etc)
   */
  async update(requester: any, id: string, dto: UpdateCommissionDto) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const existing = await this.prisma.barberCommission.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!existing) {
      throw new NotFoundException('Comissão não encontrada');
    }

    // Validar porcentagem se estiver alterando
    if (dto.type === CommissionType.PERCENTAGE && dto.value && dto.value > 100) {
      throw new BadRequestException('Porcentagem não pode ser maior que 100%');
    }

    // Validar targets para TIERED
    if (dto.type === CommissionType.TIERED || existing.type === CommissionType.TIERED) {
      const minTarget = dto.minTarget ?? existing.minTarget;
      const maxTarget = dto.maxTarget ?? existing.maxTarget;

      if (minTarget && maxTarget && minTarget >= maxTarget) {
        throw new BadRequestException('minTarget deve ser menor que maxTarget');
      }
    }

    const updated = await this.prisma.barberCommission.update({
      where: { id },
      data: {
        type: dto.type,
        value: dto.value,
        minTarget: dto.minTarget,
        maxTarget: dto.maxTarget,
        applyOnServices: dto.applyOnServices,
        applyOnProducts: dto.applyOnProducts,
        active: dto.active,
      },
      include: {
        barber: { select: { name: true } },
        service: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    await this.logAction(
      'UPDATE_COMMISSION',
      id,
      requester.id,
      requester.shopId,
      `Comissão atualizada: ${JSON.stringify(dto)}`,
    );

    return updated;
  }

  /**
   * Ativar/Desativar comissão
   */
  async toggle(requester: any, id: string, dto: ToggleCommissionDto) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const commission = await this.prisma.barberCommission.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada');
    }

    const updated = await this.prisma.barberCommission.update({
      where: { id },
      data: { active: dto.active },
      include: {
        barber: { select: { name: true } },
        service: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    await this.logAction(
      dto.active ? 'ACTIVATE_COMMISSION' : 'DEACTIVATE_COMMISSION',
      id,
      requester.id,
      requester.shopId,
      dto.reason || `Comissão ${dto.active ? 'ativada' : 'desativada'}`,
    );

    return updated;
  }

  /**
   * Remover comissão
   */
  async remove(requester: any, id: string, reason?: string) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const commission = await this.prisma.barberCommission.findFirst({
      where: { id, shopId: requester.shopId },
    });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada');
    }

    await this.prisma.barberCommission.delete({ where: { id } });

    await this.logAction(
      'DELETE_COMMISSION',
      id,
      requester.id,
      requester.shopId,
      reason || 'Comissão removida',
    );

    return { message: 'Comissão removida com sucesso' };
  }

  /**
   * Calcular comissão para um item específico
   * Usado pelo ServiceOrdersService ao adicionar items
   */
  async calculateCommission(
    shopId: string,
    barberId: string,
    serviceId?: string,
    productId?: string,
    itemValue?: number,
  ): Promise<{ rate: number; value: number }> {
    // Buscar regra específica primeiro, depois regra padrão
    const commission = await this.prisma.barberCommission.findFirst({
      where: {
        shopId,
        barberId,
        active: true,
        OR: [
          // Regra específica para este serviço/produto
          { serviceId: serviceId || undefined, productId: productId || undefined },
          // Regra padrão (serviceId e productId null)
          { serviceId: null, productId: null },
        ],
      },
      orderBy: [
        { serviceId: 'desc' }, // Prioriza específico
        { productId: 'desc' },
      ],
    });

    if (!commission) {
      // Fallback para a comissão padrão do perfil do barbeiro se não houver regra específica
      const barber = await this.prisma.barber.findUnique({
        where: { id: barberId },
        select: { commissionRate: true },
      });

      const rate = barber?.commissionRate || 0;
      return {
        rate: rate,
        value: (itemValue || 0) * (rate / 100),
      };
    }

    // Verificar se deve aplicar baseado no tipo de item
    if (serviceId && !commission.applyOnServices) {
      return { rate: 0, value: 0 };
    }

    if (productId && !commission.applyOnProducts) {
      return { rate: 0, value: 0 };
    }

    // Calcular valor da comissão
    let commissionValue = 0;

    switch (commission.type) {
      case CommissionType.PERCENTAGE:
        commissionValue = (itemValue || 0) * (commission.value / 100);
        break;

      case CommissionType.FIXED:
        commissionValue = commission.value;
        break;

      case CommissionType.TIERED:
        // Para TIERED, retornar a porcentagem base
        // A lógica de escalonamento será aplicada no fechamento mensal
        commissionValue = (itemValue || 0) * (commission.value / 100);
        break;
    }

    return {
      rate: commission.value,
      value: commissionValue,
    };
  }

  /**
   * Configurar comissão padrão para um barbeiro
   * Cria regras padrão para serviços e produtos
   */
  async setDefaultCommissions(
    requester: any,
    barberId: string,
    serviceCommission: number,
    productCommission?: number,
  ) {
    if (!requester.shopId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada');
    }

    const barber = await this.prisma.barber.findFirst({
      where: { id: barberId, shopId: requester.shopId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Desativar comissões padrão existentes (serviceId e productId null)
    await this.prisma.barberCommission.updateMany({
      where: {
        shopId: requester.shopId,
        barberId,
        serviceId: null,
        productId: null,
      },
      data: { active: false },
    });

    // Criar nova comissão padrão para serviços
    const serviceCommissionRule = await this.prisma.barberCommission.create({
      data: {
        shopId: requester.shopId,
        barberId,
        type: CommissionType.PERCENTAGE,
        value: serviceCommission,
        applyOnServices: true,
        applyOnProducts: false,
        active: true,
      },
    });

    // Criar comissão para produtos se fornecida
    let productCommissionRule = null;
    if (productCommission !== undefined && productCommission > 0) {
      productCommissionRule = await this.prisma.barberCommission.create({
        data: {
          shopId: requester.shopId,
          barberId,
          type: CommissionType.PERCENTAGE,
          value: productCommission,
          applyOnServices: false,
          applyOnProducts: true,
          active: true,
        },
      });
    }

    await this.logAction(
      'SET_DEFAULT_COMMISSIONS',
      barberId,
      requester.id,
      requester.shopId,
      `Comissões padrão configuradas: Serviços ${serviceCommission}%, Produtos ${productCommission || 0}%`,
    );

    return {
      serviceCommission: serviceCommissionRule,
      productCommission: productCommissionRule,
    };
  }

  /**
   * Log de auditoria
   */
  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entity: 'BarberCommission',
          entityId,
          userId,
          shopId,
          details,
        },
      });
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
    }
  }
}
