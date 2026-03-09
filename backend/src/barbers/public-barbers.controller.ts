import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BarbersService } from './barbers.service';

@ApiTags('barbers')
@Controller('barbers')
export class PublicBarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Public()
  @Get('public/shop/:shopId')
  @ApiOperation({ summary: 'Listar barbeiros publicos por barbearia' })
  async findPublicByShop(@Param('shopId') shopId: string) {
    return this.barbersService.findPublicByShop(shopId);
  }
}
