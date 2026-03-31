import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateClientDto) {
    // ADMIN/BARBER só podem criar clientes do próprio shop
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');

    let linkedUserId: string | undefined;
    if (dto.email || dto.phone) {
      const candidateUser = await this.prisma.user.findFirst({
        where: {
          shopId: requester.shopId,
          role: UserRole.CLIENT,
          OR: [
            ...(dto.email ? [{ email: dto.email }] : []),
            ...(dto.phone ? [{ phone: dto.phone }] : []),
          ],
        },
        select: { id: true },
      });

      if (candidateUser) {
        const alreadyLinked = await this.prisma.client.findFirst({
          where: { userId: candidateUser.id },
          select: { id: true },
        });

        if (!alreadyLinked) {
          linkedUserId = candidateUser.id;
        }
      }
    }

    const client = await this.prisma.client.create({
      data: {
        shopId: requester.shopId,
        userId: linkedUserId,
        name: dto.name,
        nickname: dto.nickname,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        phone: dto.phone,
        cpf: dto.cpf,
        email: dto.email,
        addresses: dto.addresses ? { create: dto.addresses } : undefined,
        active: true,
      },
      include: { addresses: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE_CLIENT',
        entity: 'Client',
        entityId: client.id,
        userId: requester.id,
        shopId: requester.shopId,
        details: `Cliente cadastrado: ${client.name}`,
      },
    });

    return client;
  }

  async findAll(requester: any, search?: string) {
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');
    const clients = await this.prisma.client.findMany({
      where: {
        shopId: requester.shopId,
        active: true,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { addresses: true },
      orderBy: { name: 'asc' },
    });

    if (search) {
      await this.prisma.auditLog.create({
        data: {
          action: 'SEARCH_CLIENTS',
          entity: 'Client',
          entityId: 'SEARCH', // Placeholder para buscas
          userId: requester.id,
          shopId: requester.shopId,
          details: `Busca por clientes com termo: ${search}`,
        },
      });
    }

    return clients;
  }

  async findOne(requester: any, id: string) {
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { addresses: true },
    });
    if (!client || client.shopId !== requester.shopId)
      throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(requester: any, id: string, dto: UpdateClientDto) {
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');
    const shopId = requester.shopId;

    const updated = await this.prisma.client.update({
      where: { id, shopId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        addresses: dto.addresses ? { deleteMany: {}, create: dto.addresses } : undefined,
      },
      include: { addresses: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_CLIENT',
        entity: 'Client',
        entityId: id,
        userId: requester.id,
        shopId,
        details: `Cliente atualizado: ${updated.name}`,
      },
    });

    return updated;
  }

  async softDelete(requester: any, id: string) {
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');
    const shopId = requester.shopId;
    
    const client = await this.prisma.client.update({
      where: { id, shopId },
      data: { active: false },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE_CLIENT',
        entity: 'Client',
        entityId: id,
        userId: requester.id,
        shopId,
        details: `Cliente desativado: ${client.name}`,
      },
    });

    return client;
  }

  async export(requester: any, id: string) {
    if (requester.shopId == null) throw new ForbiddenException('Sem barbearia vinculada');
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { addresses: true },
    });
    if (!client || client.shopId !== requester.shopId)
      throw new NotFoundException('Cliente não encontrado');
    // Exporta todos os dados do cliente (LGPD)
    return client;
  }

  async hardDelete(requester: any, id: string) {
    if (requester.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN pode hard delete');
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client || client.shopId !== requester.shopId)
      throw new NotFoundException('Cliente não encontrado');
    await this.prisma.address.deleteMany({ where: { clientId: id } });
    await this.prisma.favoriteBarbershop.deleteMany({ where: { clientId: id } });
    return this.prisma.client.delete({ where: { id } });
  }
}
