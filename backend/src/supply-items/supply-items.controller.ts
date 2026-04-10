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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SupplyItemsService } from './supply-items.service';
import { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import { UpdateSupplyItemDto } from './dto/update-supply-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
    create(@CurrentUser() user: any, @Body() dto: CreateSupplyItemDto) {
        return this.supplyItemsService.create(user, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os insumos (com alerta de estoque baixo)' })
    @ApiQuery({ name: 'category', required: false })
    findAll(@CurrentUser() user: any, @Query('category') category?: string) {
        return this.supplyItemsService.findAll(user, category);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Listar categorias de insumos cadastradas' })
    listCategories(@CurrentUser() user: any) {
        return this.supplyItemsService.listCategories(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar insumo por ID' })
    findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.supplyItemsService.findOne(user, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Atualizar informações de um insumo' })
    update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateSupplyItemDto) {
        return this.supplyItemsService.update(user, id, dto);
    }

    @Patch(':id/adjust')
    @ApiOperation({ summary: 'Ajustar quantidade (+/-) de um insumo' })
    adjustQuantity(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() body: { delta: number; notes?: string },
    ) {
        return this.supplyItemsService.adjustQuantity(user, id, body.delta, body.notes);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Remover (desativar) um insumo' })
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.supplyItemsService.remove(user, id);
    }
}
