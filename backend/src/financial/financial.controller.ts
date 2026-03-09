import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsPeriod } from './dto/get-analytics.dto';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) { }

  @Get('analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter analytics financeiros por período' })
  @ApiQuery({
    name: 'shopId',
    required: false,
    type: String,
    description: 'Obrigatório para SUPER_ADMIN. Para ADMIN, usa automaticamente o shopId do JWT.',
  })
  @ApiQuery({ name: 'period', required: true, enum: AnalyticsPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAnalytics(
    @CurrentUser() user: any,
    @Query('period') period: AnalyticsPeriod,
    @Query('shopId') shopId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getAnalytics(user, shopId, period, startDate, endDate);
  }

  @Get('cashier/daily')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter relatório diário do caixa' })
  @ApiQuery({
    name: 'shopId',
    required: false,
    type: String,
    description: 'Obrigatório para SUPER_ADMIN. Para ADMIN, usa automaticamente o shopId do JWT.',
  })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Formato: YYYY-MM-DD' })
  async getDailyCashier(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.financialService.getDailyCashier(user, shopId, date);
  }

  @Get('opportunities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BARBER)
  @ApiOperation({ summary: 'Obter oportunidades de vendas preditivas baseadas em recorrência' })
  async getSalesOpportunities(@CurrentUser() user: any) {
    return this.financialService.getSalesOpportunities(user);
  }

  @Get('retention')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter métricas de retenção de clientes' })
  async getRetentionMetrics(@CurrentUser() user: any) {
    return this.financialService.getRetentionMetrics(user);
  }

  @Get('assets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar ativos físicos da barbearia com cálculo de depreciação e alertas de troca' })
  async getAssets(@CurrentUser() user: any) {
    return this.financialService.getAssets(user);
  }
}
