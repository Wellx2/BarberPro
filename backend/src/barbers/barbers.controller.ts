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
import { BarbersService } from './barbers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ModuleType } from '@prisma/client';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { DisableBarberDto } from './dto/disable-barber.dto';
import { RemoveBarberDto } from './dto/remove-barber.dto';
import { UpdateBarberWorkModelDto } from './dto/update-barber-work-model.dto';
import { CreateAgendaLockDto } from './dto/create-agenda-lock.dto';
import { CheckConflictsDto } from './dto/check-conflicts.dto';

@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.GESTAO_TIME)
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Req() req, @Body() dto: CreateBarberDto) {
    return this.barbersService.create(req.user, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async findAll(@Req() req, @Query('active') active?: boolean) {
    return this.barbersService.findAll(req.user, active);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async findOne(@Req() req, @Param('id') id: string) {
    return this.barbersService.findOne(req.user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateBarberDto) {
    return this.barbersService.update(req.user, id, dto);
  }

  @Patch(':id/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async disable(@Req() req, @Param('id') id: string, @Body() dto: DisableBarberDto) {
    return this.barbersService.disable(req.user, id, dto);
  }

  @Patch(':id/work-model')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateWorkModel(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateBarberWorkModelDto,
  ) {
    return this.barbersService.updateWorkModel(req.user, id, dto);
  }

  // Endpoints de bloqueio de agenda
  @Post('agenda-locks/check-conflicts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async checkConflicts(@Req() req, @Body() dto: CheckConflictsDto) {
    return this.barbersService.checkAgendaConflicts(req.user, dto);
  }

  @Post('agenda-locks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async createAgendaLock(@Req() req, @Body() dto: CreateAgendaLockDto) {
    return this.barbersService.createAgendaLock(req.user, dto);
  }

  @Get(':id/agenda-locks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async getAgendaLocks(@Req() req, @Param('id') id: string) {
    return this.barbersService.getAgendaLocks(req.user, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Req() req, @Param('id') id: string, @Body() dto: RemoveBarberDto) {
    return this.barbersService.remove(req.user, id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleActive(@Req() req, @Param('id') id: string) {
    return this.barbersService.toggleActive(req.user, id);
  }

  @Get(':id/available-slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  async getAvailableSlots(@Req() req, @Param('id') id: string, @Query('date') date: string) {
    return this.barbersService.getAvailableSlots(req.user, id, date);
  }
}
