import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, AppointmentStatus, ModuleType } from '@prisma/client';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.AGENDA)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou horário indisponível' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
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

  @Patch(':id/reschedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Reagendar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento reagendado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou horário indisponível' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  reschedule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(user, id, rescheduleAppointmentDto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com sucesso' })
  @ApiResponse({ status: 400, description: 'Motivo obrigatório ou status inválido' })
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
  @ApiResponse({ status: 200, description: 'Agendamento completado com sucesso' })
  @ApiResponse({ status: 400, description: 'Status inválido para completar' })
  complete(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() completeAppointmentDto: CompleteAppointmentDto,
  ) {
    return this.appointmentsService.complete(user, id, completeAppointmentDto);
  }

  @Get('ical/:barberId/:token')
  @Public()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="agenda.ics"')
  @ApiOperation({ summary: 'Sincronizar agenda iCal do barbeiro' })
  async getIcal(
    @Param('barberId') barberId: string,
    @Param('token') token: string,
  ) {
    return this.appointmentsService.getBarberIcal(barberId, token);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar preferências do agendamento (ex: reminderEnabled)' })
  updatePreferences(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { reminderEnabled?: boolean },
  ) {
    return this.appointmentsService.updatePreferences(user, id, body);
  }
}
