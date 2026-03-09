import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SupplyItemsService } from './supply-items.service';
import { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import { UpdateSupplyItemDto } from './dto/update-supply-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('supply-items')
@ApiBearerAuth()
@Controller('supply-items')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(UserRole.ADMIN, UserRole.BARBER)
export class SupplyItemsController {
    constructor(private readonly supplyItemsService: SupplyItemsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Criar novo insumo da barbearia' })
    create(@Req() req, @Body() dto: CreateSupplyItemDto) {
        return this.supplyItemsService.create(req.user, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os insumos (com alerta de estoque baixo)' })
    @ApiQuery({ name: 'category', required: false })
    findAll(@Req() req, @Query('category') category?: string) {
        return this.supplyItemsService.findAll(req.user, category);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Listar categorias de insumos cadastradas' })
    listCategories(@Req() req) {
        return this.supplyItemsService.listCategories(req.user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar insumo por ID' })
    findOne(@Req() req, @Param('id') id: string) {
        return this.supplyItemsService.findOne(req.user, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Atualizar informações de um insumo' })
    update(@Req() req, @Param('id') id: string, @Body() dto: UpdateSupplyItemDto) {
        return this.supplyItemsService.update(req.user, id, dto);
    }

    @Patch(':id/adjust')
    @ApiOperation({ summary: 'Ajustar quantidade (+/-) de um insumo' })
    adjustQuantity(
        @Req() req,
        @Param('id') id: string,
        @Body() body: { delta: number; notes?: string },
    ) {
        return this.supplyItemsService.adjustQuantity(req.user, id, body.delta, body.notes);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Remover (desativar) um insumo' })
    remove(@Req() req, @Param('id') id: string) {
        return this.supplyItemsService.remove(req.user, id);
    }
}
