import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async favorite(clientId: string, barbershopId: string) {
    // Evita duplicidade
    const exists = await this.prisma.favoriteBarbershop.findUnique({
      where: { clientId_barbershopId: { clientId, barbershopId } },
    });
    if (exists) return exists;
    return this.prisma.favoriteBarbershop.create({
      data: { clientId, barbershopId },
    });
  }

  async unfavorite(clientId: string, barbershopId: string) {
    return this.prisma.favoriteBarbershop.delete({
      where: { clientId_barbershopId: { clientId, barbershopId } },
    });
  }

  async listFavorites(clientId: string) {
    return this.prisma.favoriteBarbershop.findMany({
      where: { clientId },
      include: { barbershop: true },
    });
  }
}
