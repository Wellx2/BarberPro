import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
        costPrice: dto.costPrice,
        unit: dto.unit,
        category: dto.category,
        description: dto.description,
        formulation: dto.formulation,
        howToUse: dto.howToUse,
        recommendedFor: dto.recommendedFor,
        image: dto.image,
        active: dto.active !== undefined ? dto.active : true,
      },
    });

    await this.logAction('CREATE', product.id, requester.id, requester.shopId, 'Produto criado');
    return product;
  }

  async findAll(requester: any) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    return this.prisma.product.findMany({
      where: {
        shopId: requester.shopId,
        deletedAt: null, // Filtrar produtos não deletados
      },
      orderBy: { name: 'asc' },
    });
  }

  // Método público para buscar produtos por shopId (sem autenticação)
  async findByShop(shopId: string) {
    return this.prisma.product.findMany({
      where: {
        shopId,
        deletedAt: null, // Filtrar produtos não deletados
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== requester.shopId || product.deletedAt !== null) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async update(requester: any, id: string, dto: UpdateProductDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    const shopId = requester.shopId;

    const updated = await this.prisma.product.update({
      where: { id, shopId },
      data: { ...dto },
    });

    await this.logAction('UPDATE', id, requester.id, shopId, `Produto atualizado: ${updated.name}`);
    return updated;
  }

  async disable(requester: any, id: string, dto: DisableProductDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    const shopId = requester.shopId;

    const updated = await this.prisma.product.update({
      where: { id, shopId },
      data: { active: false },
    });

    await this.logAction('DISABLE', id, requester.id, shopId, dto.reason || 'Produto desativado');
    return updated;
  }

  async remove(requester: any, id: string, dto: RemoveProductDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    const shopId = requester.shopId;

    // Soft delete com timestamp (validando shopId no where)
    await this.prisma.product.update({ 
      where: { id, shopId }, 
      data: { deletedAt: new Date() } 
    });
    
    await this.logAction('REMOVE', id, requester.id, shopId, dto.reason || 'Produto removido (soft delete)');

    return { message: 'Produto removido com sucesso' };
  }

  // Métodos de Destaque (Featured)
  async findFeatured(requester: any) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    return this.prisma.product.findMany({
      where: {
        shopId: requester.shopId,
        featured: true,
        deletedAt: null, // Filtrar produtos não deletados
      },
      take: 3,
      orderBy: { name: 'asc' },
    });
  }

  async toggleFeatured(requester: any, id: string) {
    const product = await this.findOne(requester, id);

    // Limitar a 3 destaques
    const featuredCount = await this.prisma.product.count({
      where: { shopId: requester.shopId, featured: true, deletedAt: null },
    });

    if (!product.featured && featuredCount >= 3) {
      throw new BadRequestException('Limite de 3 produtos em destaque atingido (máximo por loja)');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { featured: !product.featured },
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
        entity: 'PRODUCT',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
