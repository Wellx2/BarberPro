import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';

@Injectable()
export class BarbershopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.barbershop.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { cnpj: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.barbershop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');
    return shop;
  }

  async update(id: string, dto: UpdateBarbershopDto) {
    // Apenas SUPER_ADMIN pode alterar dados de barbearia
    return this.prisma.barbershop.update({
      where: { id },
      data: { ...dto },
    });
  }

  async switchBarbershop(userId: string, shopId: string) {
    // Permite ao usuário mudar de barbearia/franquia
    const shop = await this.prisma.barbershop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Barbearia não encontrada');
    return this.prisma.user.update({
      where: { id: userId },
      data: { shopId },
    });
  }
}
