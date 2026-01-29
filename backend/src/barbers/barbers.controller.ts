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
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { DisableBarberDto } from './dto/disable-barber.dto';
import { RemoveBarberDto } from './dto/remove-barber.dto';
import { UpdateBarberWorkModelDto } from './dto/update-barber-work-model.dto';

@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

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

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Req() req, @Param('id') id: string, @Body() dto: RemoveBarberDto) {
    return this.barbersService.remove(req.user, id, dto);
  }
}
