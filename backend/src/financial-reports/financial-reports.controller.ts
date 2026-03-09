import { Controller, Get, Query, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ModuleType } from '@prisma/client';

/**
 * Controller para Relatórios Financeiros
 *
 * Endpoints para análise financeira completa:
 * - Relatórios por período (diário, semanal, mensal, anual)
 * - Análise de custos
 * - Performance de barbeiros
 * - Produtos/serviços mais vendidos
 *
 * Acesso restrito a ADMINs
 */
@Controller('financial-reports')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.FINANCEIRO)
@Roles(UserRole.ADMIN)
export class FinancialReportsController {
  constructor(private readonly financialReportsService: FinancialReportsService) {}

  /**
   * Relatório Consolidado Personalizado
   * Query params: startDate, endDate (formato ISO)
   */
  @Get('consolidated')
  async getConsolidated(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialReportsService.getConsolidatedReport(
      req.user,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Relatório Diário
   * Query param: date (formato ISO, ex: 2026-01-29)
   */
  @Get('daily')
  async getDaily(@Req() req, @Query('date') date: string) {
    return this.financialReportsService.getDailyReport(req.user, new Date(date));
  }

  /**
   * Relatório Semanal
   * Query param: weekStart (data de início da semana)
   */
  @Get('weekly')
  async getWeekly(@Req() req, @Query('weekStart') weekStart: string) {
    return this.financialReportsService.getWeeklyReport(req.user, new Date(weekStart));
  }

  /**
   * Relatório Quinzenal
   * Query param: startDate (data de início)
   */
  @Get('fortnightly')
  async getFortnightly(@Req() req, @Query('startDate') startDate: string) {
    return this.financialReportsService.getFortnightlyReport(req.user, new Date(startDate));
  }

  /**
   * Relatório Mensal
   * Path params: year, month
   * Exemplo: /financial-reports/monthly/2026/1
   */
  @Get('monthly/:year/:month')
  async getMonthly(
    @Req() req,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.financialReportsService.getMonthlyReport(req.user, year, month);
  }

  /**
   * Relatório Anual com breakdown mensal
   * Path param: year
   * Exemplo: /financial-reports/annual/2026
   */
  @Get('annual/:year')
  async getAnnual(@Req() req, @Param('year', ParseIntPipe) year: number) {
    return this.financialReportsService.getAnnualReport(req.user, year);
  }

  /**
   * Top Produtos e Serviços Mais Vendidos
   * Query params:
   * - startDate, endDate (período)
   * - limit (quantidade de itens, padrão 10)
   * - days (atalho: 7, 15, 30, 45 para últimos N dias)
   */
  @Get('top-selling')
  async getTopSelling(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    let start: Date;
    let end: Date = new Date();

    if (days) {
      // Usar atalho de dias
      const daysNum = parseInt(days, 10);
      start = new Date();
      start.setDate(start.getDate() - daysNum);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Padrão: últimos 30 dias
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.financialReportsService.getTopSellingItems(req.user, start, end, limitNum);
  }

  /**
   * Performance Detalhada de um Barbeiro
   * Path param: barberId
   * Query params: startDate, endDate
   */
  @Get('barber-performance/:barberId')
  async getBarberPerformance(
    @Req() req,
    @Param('barberId') barberId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialReportsService.getBarberPerformance(
      req.user,
      barberId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Análise Detalhada de Custos
   * Query params: startDate, endDate
   */
  @Get('costs-analysis')
  async getCostsAnalysis(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialReportsService.getCostsAnalysis(
      req.user,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
