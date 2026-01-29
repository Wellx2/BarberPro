import { Controller, Post, Patch, Delete, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AddressDto } from '../dto/address.dto';

@Controller('clients/:clientId/addresses')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async add(@Param('clientId') clientId: string, @Body() dto: AddressDto) {
    return this.addressesService.addAddress(clientId, dto);
  }

  @Patch(':addressId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async update(@Param('addressId') addressId: string, @Body() dto: AddressDto) {
    return this.addressesService.updateAddress(addressId, dto);
  }

  @Delete(':addressId')
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async delete(@Param('addressId') addressId: string) {
    return this.addressesService.deleteAddress(addressId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BARBER)
  async list(@Param('clientId') clientId: string) {
    return this.addressesService.listAddresses(clientId);
  }
}
