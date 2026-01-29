import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DisableProductDto } from './dto/disable-product.dto';
import { RemoveProductDto } from './dto/remove-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateProductDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const product = await this.prisma.product.create({
      data: {
        shopId: requester.shopId,
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
        category: dto.category,
        description: dto.description,
        image: dto.image,
        active: dto.active !== undefined ? dto.active : true,
      },
    });

    await this.logAction('CREATE', product.id, requester.id, requester.shopId, 'Produto criado');
    return product;
  }

  async findAll(requester: any, active?: boolean) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    return this.prisma.product.findMany({
      where: {
        shopId: requester.shopId,
        ...(active !== undefined ? { active } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== requester.shopId) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async update(requester: any, id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== requester.shopId) {
      throw new NotFoundException('Produto não encontrado');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { ...dto },
    });

    await this.logAction('UPDATE', id, requester.id, requester.shopId, 'Produto atualizado');
    return updated;
  }

  async disable(requester: any, id: string, dto: DisableProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== requester.shopId) {
      throw new NotFoundException('Produto não encontrado');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });

    await this.logAction('DISABLE', id, requester.id, requester.shopId, dto.reason);
    return updated;
  }

  async remove(requester: any, id: string, dto: RemoveProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== requester.shopId) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Soft delete
    await this.prisma.product.update({ where: { id }, data: { active: false } });
    await this.logAction('REMOVE', id, requester.id, requester.shopId, dto.reason);

    return { message: 'Produto removido (soft delete)' };
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
        entity: 'PRODUCT',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
