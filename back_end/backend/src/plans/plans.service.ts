import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        price: dto.price,
        benefits: dto.benefits,
        discount: dto.discount,
      },
    });

    await this.logAction('CREATE', plan.id, requester.id, null, 'Plano criado');
    return plan;
  }

  async findAll() {
    return this.prisma.plan.findMany({
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

    const updated = await this.prisma.plan.update({
      where: { id },
      data: { ...dto },
    });

    await this.logAction('UPDATE', id, requester.id, null, 'Plano atualizado');
    return updated;
  }

  async remove(requester: any, id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    await this.prisma.plan.delete({ where: { id } });

    await this.logAction('DELETE', id, requester.id, null, 'Plano deletado');
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
