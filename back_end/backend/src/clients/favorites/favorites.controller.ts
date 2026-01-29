import { Controller, Post, Delete, Get, Param, UseGuards, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FavoriteBarbershopDto } from '../dto/favorite-barbershop.dto';

@Controller('clients/:clientId/favorites')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async favorite(@Param('clientId') clientId: string, @Body() dto: FavoriteBarbershopDto) {
    return this.favoritesService.favorite(clientId, dto.barbershopId);
  }

  @Delete(':barbershopId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async unfavorite(
    @Param('clientId') clientId: string,
    @Param('barbershopId') barbershopId: string,
  ) {
    return this.favoritesService.unfavorite(clientId, barbershopId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async list(@Param('clientId') clientId: string) {
    return this.favoritesService.listFavorites(clientId);
  }
}
