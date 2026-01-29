import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AddressesService } from './addresses/addresses.service';
import { FavoritesService } from './favorites/favorites.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientsController],
  providers: [ClientsService, AddressesService, FavoritesService],
  exports: [ClientsService],
})
export class ClientsModule {}
