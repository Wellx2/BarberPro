import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { BarbershopsService } from './barbershops.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { UpdatePlansContentDto } from './dto/update-plans-content.dto';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SwitchBarbershopDto } from './dto/switch-barbershop.dto';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { QuickSetupDto } from './dto/quick-setup.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('barbershops')
@Controller('barbershops')
export class BarbershopsController {
  constructor(private readonly barbershopsService: BarbershopsService) {}

  // ===== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) =====
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Listar todas as barbearias (público)' })
  async findAllPublic(@Query('search') search?: string) {
    return this.barbershopsService.findAllPublic(search);
  }

  @Public()
  @Get('public/:shopId')
  @ApiOperation({
    summary: 'Buscar dados públicos de uma barbearia (3 serviços, 3 produtos, 3 barbeiros)',
  })
  async findOnePublic(@Param('shopId') shopId: string) {
    return this.barbershopsService.findOnePublic(shopId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar uma nova barbearia (apenas SUPER_ADMIN)' })
  async create(@Body() dto: CreateBarbershopDto) {
    return this.barbershopsService.create(dto);
  }

  @Post('quick-setup')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Configuração rápida de barbearia com dados automáticos (apenas SUPER_ADMIN)' })
  async quickSetup(@Body() dto: QuickSetupDto) {
    return this.barbershopsService.quickSetup(dto);
  }

  // ===== ROTAS PROTEGIDAS =====
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar perfil da barbearia (SUPER_ADMIN ou ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateBarbershopDto, @Req() req) {
    // SUPER_ADMIN pode editar qualquer barbearia
    // ADMIN só pode editar a própria barbearia (tenant guard valida)
    return this.barbershopsService.update(id, dto);
  }

  @Patch(':shopId/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar assinatura do KlypBarber (apenas SUPER_ADMIN)' })
  async updateSubscription(@Param('shopId') shopId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.barbershopsService.updateSubscription(shopId, dto);
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Trocar de barbearia (apenas SUPER_ADMIN pode trocar entre diferentes shops)' })
  async switchBarbershop(@CurrentUser() user: any, @Body() dto: SwitchBarbershopDto) {
    return this.barbershopsService.switchBarbershop(user.id, dto.shopId);
  }

  // ===== HERO SETTINGS =====
  @Get(':shopId/hero')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar configurações do hero' })
  async getHeroSettings(@Param('shopId') shopId: string) {
    return this.barbershopsService.getHeroSettings(shopId);
  }

  @Patch(':shopId/hero')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar hero dinâmico' })
  async updateHeroSettings(@Param('shopId') shopId: string, @Body() dto: UpdateHeroDto) {
    return this.barbershopsService.updateHeroSettings(shopId, dto);
  }

  // ===== PLANS CONTENT =====
  @Get(':shopId/plans-content')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar conteúdo da página de planos' })
  async getPlansContent(@Param('shopId') shopId: string) {
    return this.barbershopsService.getPlansContent(shopId);
  }

  @Patch(':shopId/plans-content')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar conteúdo da página de planos' })
  async updatePlansContent(@Param('shopId') shopId: string, @Body() dto: UpdatePlansContentDto) {
    return this.barbershopsService.updatePlansContent(shopId, dto);
  }

  // ===== MÓDULOS E CONFIGURAÇÕES =====
  @Get(':shopId/subscription')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar informações de assinatura e features disponíveis' })
  async getSubscriptionInfo(@Param('shopId') shopId: string) {
    return this.barbershopsService.getSubscriptionInfo(shopId);
  }

  @Patch(':shopId/modules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar módulos habilitados' })
  async updateModules(@Param('shopId') shopId: string, @Body() dto: UpdateModulesDto) {
    return this.barbershopsService.updateModules(shopId, dto);
  }
}
