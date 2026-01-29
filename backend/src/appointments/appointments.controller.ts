import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@CurrentUser() user: any, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(user, createAppointmentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por data (ISO 8601)' })
  @ApiQuery({ name: 'barberId', required: false, description: 'Filtrar por barbeiro' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  findAll(
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('barberId') barberId?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll(user, { date, barberId, status });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Cancelar agendamento' })
  cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() cancelAppointmentDto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user, id, cancelAppointmentDto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Completar agendamento' })
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.complete(user, id);
  }
}
