import { Module } from '@nestjs/common';
import { SupplyItemsService } from './supply-items.service';
import { SupplyItemsController } from './supply-items.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SupplyItemsController],
    providers: [SupplyItemsService],
    exports: [SupplyItemsService],
})
export class SupplyItemsModule { }
