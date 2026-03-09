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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PLANOS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar plano' })
  create(@CurrentUser() user: any, @Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(user, createPlanDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar planos (SUPER_ADMIN pode filtrar por shopId)' })
  findAll(@CurrentUser() user: any, @Query('shopId') shopId?: string) {
    return this.plansService.findAll(user, shopId);
  }

  @Get('public/shop/:shopId')
  @ApiOperation({ summary: 'Listar planos de uma barbearia (público)' })
  findByShop(@Param('shopId') shopId: string) {
    return this.plansService.findByShop(shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID (público)' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PLANOS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(user, id, updatePlanDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PLANOS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar/Desativar plano' })
  toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.plansService.toggleActive(user, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PLANOS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar plano (apenas se inativo)' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.plansService.remove(user, id);
  }
}
