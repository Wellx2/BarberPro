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
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DisableServiceDto } from './dto/disable-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Req() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user, dto);
  }

  @Get()
  async findAll(@Req() req, @Query('active') active?: boolean) {
    return this.servicesService.findAll(req.user, active);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.servicesService.findOne(req.user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(req.user, id, dto);
  }

  @Patch(':id/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async disable(@Req() req, @Param('id') id: string, @Body() dto: DisableServiceDto) {
    return this.servicesService.disable(req.user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Req() req, @Param('id') id: string, @Body() dto: RemoveServiceDto) {
    return this.servicesService.remove(req.user, id, dto);
  }

  @Get(':id/disabled-periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listDisabledPeriods(@Req() req, @Param('id') id: string) {
    return this.servicesService.listDisabledPeriods(req.user, id);
  }
}
