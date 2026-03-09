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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgendaLocksService } from './agenda-locks.service';
import { CreateAgendaLockDto } from './dto/create-agenda-lock.dto';
import { UpdateAgendaLockDto } from './dto/update-agenda-lock.dto';
import { CheckConflictsDto } from './dto/check-conflicts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('agenda-locks')
@Controller('agenda-locks')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth()
export class AgendaLocksController {
  constructor(private readonly agendaLocksService: AgendaLocksService) {}

  @Post('check-conflicts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verificar conflitos antes de bloquear agenda' })
  @ApiResponse({ status: 200, description: 'Conflitos verificados com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async checkConflicts(@Body() dto: CheckConflictsDto, @CurrentUser() user: any) {
    return this.agendaLocksService.checkConflicts(dto, user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar bloqueio de agenda' })
  @ApiResponse({ status: 201, description: 'Bloqueio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conflitos encontrados' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  create(@Body() dto: CreateAgendaLockDto, @CurrentUser() user: any) {
    return this.agendaLocksService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar bloqueios de agenda' })
  @ApiResponse({ status: 200, description: 'Lista de bloqueios retornada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findAll(
    @CurrentUser() user: any,
    @Query('teamMemberId') teamMemberId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.agendaLocksService.findAll(user, {
      teamMemberId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar bloqueio por ID' })
  @ApiResponse({ status: 200, description: 'Bloqueio encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Bloqueio não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agendaLocksService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar bloqueio' })
  @ApiResponse({ status: 200, description: 'Bloqueio atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Bloqueio não encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateAgendaLockDto, @CurrentUser() user: any) {
    return this.agendaLocksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover bloqueio' })
  @ApiResponse({ status: 200, description: 'Bloqueio removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Bloqueio não encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agendaLocksService.remove(id, user);
  }
}
