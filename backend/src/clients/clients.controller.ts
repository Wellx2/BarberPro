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
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async create(@Req() req, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.user, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findAll(@Req() req, @Query('search') search?: string) {
    return this.clientsService.findAll(req.user, search);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async findOne(@Req() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(req.user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async softDelete(@Req() req, @Param('id') id: string) {
    return this.clientsService.softDelete(req.user, id);
  }

  @Get(':id/export')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async export(@Req() req, @Param('id') id: string) {
    return this.clientsService.export(req.user, id);
  }

  @Delete(':id/permanently')
  @Roles(UserRole.ADMIN)
  async hardDelete(@Req() req, @Param('id') id: string) {
    return this.clientsService.hardDelete(req.user, id);
  }
}
