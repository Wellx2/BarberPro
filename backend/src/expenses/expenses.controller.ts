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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

/**
 * Controller para Despesas/Custos Operacionais
 */
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(UserRole.ADMIN)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('isPaid') isPaid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (isPaid !== undefined) filters.isPaid = isPaid === 'true';
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.expensesService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.findOne(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(user, id, dto);
  }

  @Patch(':id/pay')
  markAsPaid(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { paidDate?: string; paymentMethod?: string },
  ) {
    return this.expensesService.markAsPaid(
      user,
      id,
      body.paidDate ? new Date(body.paidDate) : undefined,
      body.paymentMethod,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.remove(user, id);
  }
}
