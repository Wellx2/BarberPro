import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DisableServiceDto } from './dto/disable-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateServiceDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    const service = await this.prisma.service.create({
      data: {
        shopId: requester.shopId,
        name: dto.name,
        duration: dto.duration,
        price: dto.price,
        category: dto.category,
        description: dto.description,
        active: dto.active ?? true,
      },
    });
    await this.logAction('CREATE', service.id, requester.id, requester.shopId, 'Serviço criado');
    return service;
  }

  async findAll(requester: any, active?: boolean) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    return this.prisma.service.findMany({
      where: {
        shopId: requester.shopId,
        ...(active !== undefined ? { active } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId)
      throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async update(requester: any, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId)
      throw new NotFoundException('Serviço não encontrado');
    const updated = await this.prisma.service.update({
      where: { id },
      data: { ...dto },
    });
    await this.logAction('UPDATE', id, requester.id, requester.shopId, 'Serviço atualizado');
    return updated;
  }

  async disable(requester: any, id: string, dto: DisableServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId)
      throw new NotFoundException('Serviço não encontrado');
    await this.prisma.serviceDisabledPeriod.create({
      data: {
        serviceId: id,
        shopId: requester.shopId,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        reason: dto.reason,
      },
    });
    await this.logAction('DISABLE', id, requester.id, requester.shopId, dto.reason);
    return { message: 'Serviço desativado para o período informado' };
  }

  async remove(requester: any, id: string, dto: RemoveServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId)
      throw new NotFoundException('Serviço não encontrado');
    // Verifica vínculos com barbeiros, agendamentos, etc
    const hasAppointments = await this.prisma.appointmentService.findFirst({
      where: { serviceId: id },
    });
    if (hasAppointments) {
      // Soft delete: marca como inativo
      await this.prisma.service.update({ where: { id }, data: { active: false } });
      await this.logAction(
        'REMOVE',
        id,
        requester.id,
        requester.shopId,
        dto.reason + ' (soft delete: serviço vinculado a agendamentos)',
      );
      return { message: 'Serviço desativado (soft delete, pois há vínculos)' };
    }
    // Se não houver vínculos, pode remover fisicamente
    await this.prisma.serviceDisabledPeriod.deleteMany({ where: { serviceId: id } });
    await this.prisma.service.delete({ where: { id } });
    await this.logAction('REMOVE', id, requester.id, requester.shopId, dto.reason);
    return { message: 'Serviço removido com sucesso' };
  }

  async listDisabledPeriods(requester: any, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId)
      throw new NotFoundException('Serviço não encontrado');
    return this.prisma.serviceDisabledPeriod.findMany({
      where: { serviceId: id },
      orderBy: { startDate: 'asc' },
    });
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'SERVICE',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
