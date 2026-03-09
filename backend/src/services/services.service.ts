import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DisableServiceDto } from './dto/disable-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Método público para buscar serviços por shopId (sem autenticação)
  async findByShop(shopId: string) {
    return this.prisma.service.findMany({
      where: {
        shopId,
        deletedAt: null, // Filtrar serviços não deletados
      },
      orderBy: { name: 'asc' },
    });
  }

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
        image: dto.image,
        active: dto.active ?? true,
      },
    });
    await this.logAction('CREATE', service.id, requester.id, requester.shopId, 'Serviço criado');
    return service;
  }

  async findAll(requester: any) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    return this.prisma.service.findMany({
      where: {
        shopId: requester.shopId,
        deletedAt: null, // Filtrar serviços não deletados
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.shopId !== requester.shopId || service.deletedAt !== null)
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
    if (!service || service.shopId !== requester.shopId || service.deletedAt !== null)
      throw new NotFoundException('Serviço não encontrado');
    
    // Soft delete com timestamp (sempre)
    await this.prisma.service.update({ 
      where: { id }, 
      data: { deletedAt: new Date() } 
    });
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

  // Métodos de Destaque (Featured)
  async findFeatured(requester: any) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    return this.prisma.service.findMany({
      where: {
        shopId: requester.shopId,
        featured: true,
        deletedAt: null, // Filtrar serviços não deletados
      },
      take: 3,
      orderBy: { name: 'asc' },
    });
  }

  async toggleFeatured(requester: any, id: string) {
    const service = await this.findOne(requester, id);

    // Limitar a 3 destaques
    const featuredCount = await this.prisma.service.count({
      where: { shopId: requester.shopId, featured: true, deletedAt: null },
    });

    if (!service.featured && featuredCount >= 3) {
      throw new BadRequestException('Limite de 3 serviços em destaque atingido (máximo por loja)');
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: { featured: !service.featured },
    });

    await this.logAction(
      'TOGGLE_FEATURED',
      id,
      requester.id,
      requester.shopId,
      `Destaque ${updated.featured ? 'ativado' : 'desativado'}`,
    );

    return updated;
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
