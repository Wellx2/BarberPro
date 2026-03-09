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
  Req,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
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
  async create(@Req() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get()
  async findAll(@Req() req) {
    return this.servicesService.findAll(req.user);
  }

  // Endpoints de Destaque (Featured) - ANTES de :id para evitar conflito de rota
  @Get('featured')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Listar serviços em destaque (máx 3)' })
  async findFeatured(@Req() req) {
    return this.servicesService.findFeatured(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.servicesService.findOne(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async disable(@Req() req, @Param('id') id: string, @Body() dto: DisableServiceDto) {
    return this.servicesService.disable(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Req() req, @Param('id') id: string, @Body() dto: RemoveServiceDto) {
    return this.servicesService.remove(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Get(':id/disabled-periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listDisabledPeriods(@Req() req, @Param('id') id: string) {
    return this.servicesService.listDisabledPeriods(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @RequireModule(ModuleType.SERVICOS)
  @ApiBearerAuth()
  @Patch(':id/toggle-featured')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Alternar destaque do serviço' })
  async toggleFeatured(@Req() req, @Param('id') id: string) {
    return this.servicesService.toggleFeatured(req.user, id);
  }
}
