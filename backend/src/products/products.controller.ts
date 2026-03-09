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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DisableProductDto } from './dto/disable-product.dto';
import { RemoveProductDto } from './dto/remove-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Endpoint PÚBLICO para listar produtos de uma barbearia específica
  @Get('public/shop/:shopId')
  @ApiOperation({ summary: 'Listar produtos de uma barbearia (público)' })
  async findByShop(@Param('shopId') shopId: string) {
    return this.productsService.findByShop(shopId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Criar produto' })
  create(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(user, createProductDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(@CurrentUser() user: any) {
    return this.productsService.findAll(user);
  }

  // Endpoints de Destaque (Featured) - ANTES de :id para evitar conflito de rota
  @Get('featured')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Listar produtos em destaque (máx 3)' })
  findFeatured(@CurrentUser() user: any) {
    return this.productsService.findFeatured(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Atualizar produto' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(user, id, updateProductDto);
  }

  @Patch(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Desativar produto' })
  disable(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() disableProductDto: DisableProductDto,
  ) {
    return this.productsService.disable(user, id, disableProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Remover produto (soft delete)' })
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() removeProductDto: RemoveProductDto,
  ) {
    return this.productsService.remove(user, id, removeProductDto);
  }

  @Patch(':id/toggle-featured')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequireModule(ModuleType.PRODUTOS)
  @ApiOperation({ summary: 'Alternar destaque do produto' })
  toggleFeatured(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.toggleFeatured(user, id);
  }
}
