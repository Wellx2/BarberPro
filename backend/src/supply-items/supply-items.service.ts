import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import { UpdateSupplyItemDto } from './dto/update-supply-item.dto';

@Injectable()
export class SupplyItemsService {
    constructor(private readonly prisma: PrismaService) { }

    private resolveShopId(requester: any): string {
        if (!requester.shopId) throw new ForbiddenException('Usuário não vinculado a uma barbearia');
        return requester.shopId;
    }

    /**
     * Cria um novo insumo
     */
    async create(requester: any, dto: CreateSupplyItemDto) {
        const shopId = this.resolveShopId(requester);

        return (this.prisma as any).supplyItem.create({
            data: { shopId, ...dto },
        });
    }

    /**
     * Lista todos os insumos com filtros opcionais
     */
    async findAll(requester: any, category?: string, lowStock?: boolean) {
        const shopId = this.resolveShopId(requester);

        const where: any = { shopId, isActive: true };
        if (category) where.category = category;

        const items = await (this.prisma as any).supplyItem.findMany({
            where,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        // Anotação de estoque baixo
        return items.map((item: any) => ({
            ...item,
            isLowStock: item.minQuantity !== null && item.quantity <= item.minQuantity,
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            totalCost: item.totalCost ? Number(item.totalCost) : null,
        }));
    }

    /**
     * Busca um insumo por ID
     */
    async findOne(requester: any, id: string) {
        const shopId = this.resolveShopId(requester);
        const item = await (this.prisma as any).supplyItem.findFirst({
            where: { id, shopId },
        });
        if (!item) throw new NotFoundException('Insumo não encontrado');
        return item;
    }

    /**
     * Atualiza um insumo
     */
    async update(requester: any, id: string, dto: UpdateSupplyItemDto) {
        await this.findOne(requester, id);
        return (this.prisma as any).supplyItem.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * Incrementa ou decrementa a quantidade de um insumo
     */
    async adjustQuantity(requester: any, id: string, delta: number, notes?: string) {
        const shopId = this.resolveShopId(requester);
        const item = await this.findOne(requester, id);
        const newQty = Math.max(0, Number(item.quantity) + delta);

        return (this.prisma as any).supplyItem.update({
            where: { id, shopId },
            data: { quantity: newQty, notes: notes ?? item.notes },
        });
    }

    /**
     * Remove (desativa) um insumo
     */
    async remove(requester: any, id: string) {
        await this.findOne(requester, id);
        await (this.prisma as any).supplyItem.update({
            where: { id },
            data: { isActive: false },
        });
        return { message: 'Insumo removido com sucesso' };
    }

    /**
     * Lista as categorias únicas existentes
     */
    async listCategories(requester: any) {
        const shopId = this.resolveShopId(requester);
        const items = await (this.prisma as any).supplyItem.findMany({
            where: { shopId, isActive: true, category: { not: null } },
            select: { category: true },
            distinct: ['category'],
        });
        return items.map((i: any) => i.category).filter(Boolean);
    }
}
