import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CompleteServiceOrderDto } from './dto/complete-service-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, OrderStatus, ModuleType } from '@prisma/client';

/**
 * Controller para Comandas/Ordens de Serviço
 *
 * Gerencia todo o fluxo de atendimento:
 * - Abertura de comanda
 * - Adição de itens (serviços, produtos, extras)
 * - Finalização com pagamento
 * - Histórico completo de atendimentos
 */
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.CAIXA)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  /**
   * Cria nova comanda
   * Permite: ADMIN, BARBER
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async create(@Req() req, @Body() dto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(req.user, dto);
  }

  /**
   * Lista comandas com filtros opcionais
   * Permite: ADMIN, BARBER
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findAll(
    @Req() req,
    @Query('status') status?: OrderStatus,
    @Query('clientId') clientId?: string,
    @Query('barberId') barberId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (clientId) filters.clientId = clientId;
    if (barberId) filters.barberId = barberId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.serviceOrdersService.findAll(req.user, filters);
  }

  /**
   * Busca comanda específica por ID de agendamento
   * Permite: ADMIN, BARBER
   * ⚠️ DEVE vir ANTES de @Get(':id') para evitar conflito de rota no NestJS
   */
  @Get('appointment/:appointmentId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findByAppointmentId(@Req() req, @Param('appointmentId') appointmentId: string) {
    return this.serviceOrdersService.findByAppointmentId(req.user, appointmentId);
  }

  /**
   * Busca comanda específica
   * Permite: ADMIN, BARBER
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findOne(@Req() req, @Param('id') id: string) {
    return this.serviceOrdersService.findOne(req.user, id);
  }

  /**
   * Adiciona item à comanda
   * Permite: ADMIN, BARBER
   */
  @Post(':id/items')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async addItem(@Req() req, @Param('id') orderId: string, @Body() dto: AddOrderItemDto) {
    return this.serviceOrdersService.addItem(req.user, orderId, dto);
  }

  /**
   * Remove item da comanda
   * Permite: ADMIN, BARBER
   */
  @Delete(':id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async removeItem(@Req() req, @Param('id') orderId: string, @Param('itemId') itemId: string) {
    return this.serviceOrdersService.removeItem(req.user, orderId, itemId);
  }

  /**
   * Inicia atendimento (muda status para IN_PROGRESS)
   * Permite: ADMIN, BARBER
   */
  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async startService(@Req() req, @Param('id') id: string) {
    return this.serviceOrdersService.startService(req.user, id);
  }

  /**
   * Finaliza comanda e registra pagamento
   * Permite: ADMIN, BARBER
   */
  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async complete(@Req() req, @Param('id') id: string, @Body() dto: CompleteServiceOrderDto) {
    return this.serviceOrdersService.complete(req.user, id, dto);
  }

  /**
   * Cancela comanda
   * Permite: ADMIN
   */
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  async cancel(@Req() req, @Param('id') id: string, @Body('reason') reason: string) {
    return this.serviceOrdersService.cancel(req.user, id, reason);
  }

  /**
   * Histórico de atendimentos do cliente
   * Permite: ADMIN, BARBER
   */
  @Get('client/:clientId/history')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async getClientHistory(@Req() req, @Param('clientId') clientId: string) {
    return this.serviceOrdersService.getClientHistory(req.user, clientId);
  }

  /**
   * Histórico de atendimentos do barbeiro
   * Permite: ADMIN, BARBER (próprio histórico)
   */
  @Get('barber/:barberId/history')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async getBarberHistory(
    @Req() req,
    @Param('barberId') barberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.serviceOrdersService.getBarberHistory(req.user, barberId, filters);
  }
}
