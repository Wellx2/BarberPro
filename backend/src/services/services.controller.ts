import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DisableServiceDto } from './dto/disable-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Endpoint PÚBLICO para listar serviços de uma barbearia específica
  @Get('public/shop/:shopId')
  @ApiOperation({ summary: 'Listar serviços de uma barbearia (público)' })
  async findByShop(@Param('shopId') shopId: string) {
    return this.servicesService.findByShop(shopId);
  }

  // Rotas protegidas
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.servicesService.findAll(user);
  }

  // Endpoints de Destaque (Featured) - ANTES de :id para evitar conflito de rota
  @Get('featured')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Listar serviços em destaque (máx 3)' })
  async findFeatured(@CurrentUser() user: any) {
    return this.servicesService.findFeatured(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.servicesService.findOne(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async disable(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DisableServiceDto) {
    return this.servicesService.disable(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RemoveServiceDto) {
    return this.servicesService.remove(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get(':id/disabled-periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listDisabledPeriods(@CurrentUser() user: any, @Param('id') id: string) {
    return this.servicesService.listDisabledPeriods(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id/toggle-featured')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Alternar destaque do serviço' })
  async toggleFeatured(@CurrentUser() user: any, @Param('id') id: string) {
    return this.servicesService.toggleFeatured(user, id);
  }
}
