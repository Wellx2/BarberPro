import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { ToggleCommissionDto } from './dto/toggle-commission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  /**
   * POST /commissions
   * Criar nova regra de comissão
   * Requer: ADMIN
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateCommissionDto) {
    return this.commissionsService.create(user, dto);
  }

  /**
   * GET /commissions
   * Listar todas as comissões com filtros opcionais
   * Requer: ADMIN, BARBER (visualiza apenas as próprias)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  findAll(
    @CurrentUser() user: any,
    @Query('barberId') barberId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('productId') productId?: string,
    @Query('active') active?: string,
  ) {
    // Se for barbeiro, só pode ver as próprias comissões
    const filters = {
      barberId: user.role === UserRole.BARBER ? user.barberId : barberId,
      serviceId,
      productId,
      active: active ? active === 'true' : undefined,
    };

    return this.commissionsService.findAll(user, filters);
  }

  /**
   * GET /commissions/barber/:barberId
   * Buscar todas as comissões de um barbeiro
   * Requer: ADMIN, BARBER (apenas próprio)
   */
  @Get('barber/:barberId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  findByBarber(@CurrentUser() user: any, @Param('barberId') barberId: string) {
    // Validar se barbeiro está tentando acessar outro barbeiro
    if (user.role === UserRole.BARBER && user.barberId !== barberId) {
      throw new Error('Barbeiro só pode visualizar as próprias comissões');
    }

    return this.commissionsService.findByBarber(user, barberId);
  }

  /**
   * POST /commissions/barber/:barberId/default
   * Configurar comissões padrão para um barbeiro
   * Requer: ADMIN
   */
  @Post('barber/:barberId/default')
  @Roles(UserRole.ADMIN)
  setDefaultCommissions(
    @CurrentUser() user: any,
    @Param('barberId') barberId: string,
    @Body() body: { serviceCommission: number; productCommission?: number },
  ) {
    return this.commissionsService.setDefaultCommissions(
      user,
      barberId,
      body.serviceCommission,
      body.productCommission,
    );
  }

  /**
   * GET /commissions/:id
   * Buscar uma comissão específica
   * Requer: ADMIN, BARBER
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commissionsService.findOne(user, id);
  }

  /**
   * PATCH /commissions/:id
   * Atualizar comissão (editar porcentagem, valores, etc)
   * Requer: ADMIN
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.commissionsService.update(user, id, dto);
  }

  /**
   * PATCH /commissions/:id/toggle
   * Ativar/Desativar comissão
   * Requer: ADMIN
   */
  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  toggle(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ToggleCommissionDto) {
    return this.commissionsService.toggle(user, id, dto);
  }

  /**
   * DELETE /commissions/:id
   * Remover comissão permanentemente
   * Requer: ADMIN
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string, @Query('reason') reason?: string) {
    return this.commissionsService.remove(user, id, reason);
  }
}
