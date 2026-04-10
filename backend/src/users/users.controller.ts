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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@CurrentUser() user: any, @Body() dto: CreateUserDto) {
    // SUPER_ADMIN pode criar qualquer perfil; ADMIN só pode criar usuários do próprio shop
    return this.usersService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findAll(@CurrentUser() user: any, @Query('role') role?: UserRole) {
    return this.usersService.findAll(user, role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async softDelete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.softDelete(user, id);
  }

  @Delete(':id/permanently')
  @Roles(UserRole.SUPER_ADMIN)
  async hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }
}
