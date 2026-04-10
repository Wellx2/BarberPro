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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BarbersService } from '../barbers/barbers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';
import { CreateBarberDto } from '../barbers/dto/create-barber.dto';
import { UpdateBarberDto } from '../barbers/dto/update-barber.dto';
import { DisableBarberDto } from '../barbers/dto/disable-barber.dto';
import { RemoveBarberDto } from '../barbers/dto/remove-barber.dto';

/**
 * Alias para /barbers usando /team-members
 * Mantém compatibilidade com o frontend que espera /team-members
 */
@ApiTags('team-members')
@Controller('team-members')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.GESTAO_TIME)
@ApiBearerAuth()
export class TeamMembersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo colaborador' })
  async create(@CurrentUser() user: any, @Body() dto: CreateBarberDto) {
    return this.barbersService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Listar colaboradores' })
  async findAll(@CurrentUser() user: any, @Query('includeInactive') includeInactive?: boolean) {
    // Se includeInactive não for especificado, retorna apenas ativos (active = true)
    // Se includeInactive = true, retorna todos (active não é filtrado)
    const activeFilter = includeInactive === true ? undefined : true;
    return this.barbersService.findAll(user, activeFilter);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Buscar colaborador por ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.barbersService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Atualizar colaborador' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBarberDto) {
    return this.barbersService.update(user, id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ativar/Desativar colaborador' })
  async toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.barbersService.toggleActive(user, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover colaborador (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RemoveBarberDto) {
    return this.barbersService.remove(user, id, dto);
  }

  @Get(':id/available-slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Buscar horários disponíveis de um colaborador' })
  async getAvailableSlots(@CurrentUser() user: any, @Param('id') id: string, @Query('date') date: string) {
    if (!date) {
      throw new Error('Query parameter "date" is required (format: YYYY-MM-DD)');
    }
    return this.barbersService.getAvailableSlots(user, id, date);
  }
}
