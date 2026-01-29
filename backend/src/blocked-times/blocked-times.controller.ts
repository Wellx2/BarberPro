import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('blocked-times')
@ApiBearerAuth()
@Controller('blocked-times')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class BlockedTimesController {
  constructor(private readonly blockedTimesService: BlockedTimesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Criar bloqueio de horário' })
  create(@CurrentUser() user: any, @Body() createBlockedTimeDto: CreateBlockedTimeDto) {
    return this.blockedTimesService.create(user, createBlockedTimeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Listar bloqueios de horário' })
  findAll(
    @CurrentUser() user: any,
    @Query('barberId') barberId?: string,
    @Query('date') date?: string,
  ) {
    return this.blockedTimesService.findAll(user, barberId, date);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Buscar bloqueio por ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blockedTimesService.findOne(user, id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Deletar bloqueio de horário' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blockedTimesService.remove(user, id);
  }
}
