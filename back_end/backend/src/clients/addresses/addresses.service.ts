import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddressDto } from '../dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async addAddress(clientId: string, dto: AddressDto) {
    return this.prisma.address.create({
      data: { ...dto, clientId },
    });
  }

  async updateAddress(addressId: string, dto: AddressDto) {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { ...dto },
    });
  }

  async deleteAddress(addressId: string) {
    return this.prisma.address.delete({ where: { id: addressId } });
  }

  async listAddresses(clientId: string) {
    return this.prisma.address.findMany({ where: { clientId } });
  }
}
