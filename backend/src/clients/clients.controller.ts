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
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ModuleAccessGuard, RequireModule } from '../common/guards/module-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ModuleType } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard, ModuleAccessGuard)
@RequireModule(ModuleType.CLIENTES)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async create(@CurrentUser() user: any, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.clientsService.findAll(user, search);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async softDelete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.softDelete(user, id);
  }

  @Get(':id/export')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async export(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.export(user, id);
  }

  @Delete(':id/permanently')
  @Roles(UserRole.ADMIN)
  async hardDelete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.hardDelete(user, id);
  }
}
