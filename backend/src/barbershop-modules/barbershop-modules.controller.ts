import { Controller, Get, Patch, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { BarbershopModulesService } from './barbershop-modules.service';
import { UpdateModuleDto, BulkUpdateModulesDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('barbershop-modules')
@Controller('barbershop-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BarbershopModulesController {
  constructor(private readonly barbershopModulesService: BarbershopModulesService) { }

  @Get('shop/:shopId')
  @UseGuards(TenantGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os módulos de uma barbearia' })
  @ApiParam({ name: 'shopId', description: 'ID da barbearia' })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos retornada com sucesso',
  })
  async findByShop(@Param('shopId') shopId: string, @CurrentUser() user: any) {
    // ADMIN só pode ver módulos da própria barbearia
    if (user.role === UserRole.ADMIN && user.shopId !== shopId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar módulos de outra barbearia',
      );
    }

    return this.barbershopModulesService.findByShop(shopId);
  }

  @Get('shop/:shopId/enabled')
  @UseGuards(TenantGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Listar módulos habilitados de uma barbearia' })
  @ApiParam({ name: 'shopId', description: 'ID da barbearia' })
  async findEnabledByShop(@Param('shopId') shopId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN && user.shopId !== shopId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar módulos de outra barbearia',
      );
    }

    return this.barbershopModulesService.findEnabledByShop(shopId);
  }

  @Patch('shop/:shopId/module/:moduleType')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Atualizar status de um módulo (SUPER_ADMIN apenas)',
  })
  @ApiParam({ name: 'shopId', description: 'ID da barbearia' })
  @ApiParam({
    name: 'moduleType',
    enum: ModuleType,
    description: 'Tipo do módulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo atualizado com sucesso',
  })
  async updateModule(
    @Param('shopId') shopId: string,
    @Param('moduleType') moduleType: ModuleType,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: any,
  ) {
    return this.barbershopModulesService.updateModule(shopId, moduleType, dto, user.id);
  }

  @Patch('shop/:shopId/bulk')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Atualizar múltiplos módulos de uma vez (SUPER_ADMIN apenas)',
  })
  @ApiParam({ name: 'shopId', description: 'ID da barbearia' })
  @ApiResponse({
    status: 200,
    description: 'Módulos atualizados com sucesso',
  })
  async bulkUpdate(
    @Param('shopId') shopId: string,
    @Body() dto: BulkUpdateModulesDto,
    @CurrentUser() user: any,
  ) {
    return this.barbershopModulesService.bulkUpdate(shopId, dto, user.id);
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Listar todas as barbearias e seus módulos (SUPER_ADMIN apenas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Overview de módulos de todas as barbearias',
  })
  async getAllShopsModules() {
    return this.barbershopModulesService.getAllShopsModules();
  }
}
