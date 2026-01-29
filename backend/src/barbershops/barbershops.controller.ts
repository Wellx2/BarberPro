import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { BarbershopsService } from './barbershops.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';

@Controller('barbershops')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class BarbershopsController {
  constructor(private readonly barbershopsService: BarbershopsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findAll(@Query('search') search?: string) {
    return this.barbershopsService.findAll(search);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.barbershopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateBarbershopDto) {
    return this.barbershopsService.update(id, dto);
  }

  @Post('switch')
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.BARBER)
  async switchBarbershop(@Req() req, @Body('shopId') shopId: string) {
    // Permite ao usuário mudar de barbearia/franquia
    return this.barbershopsService.switchBarbershop(req.user.id, shopId);
  }
}
