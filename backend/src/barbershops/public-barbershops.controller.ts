import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BarbershopsService } from './barbershops.service';

@ApiTags('public')
@Controller('public/barbershops')
export class PublicBarbershopsController {
  constructor(private readonly barbershopsService: BarbershopsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todas as barbearias (público - sem autenticação necessária)',
    description: 'Endpoint público para listar barbearias. Não requer autenticação.',
  })
  async findAllPublic(@Query('search') search?: string) {
    return this.barbershopsService.findAllPublic(search);
  }

  @Public()
  @Get(':shopId')
  @ApiOperation({
    summary: 'Buscar dados públicos de uma barbearia',
    description:
      'Retorna dados básicos da barbearia + 3 serviços (mais caros), 3 produtos (mais caros) e 3 barbeiros (melhor avaliados). Não requer autenticação.',
  })
  async findOnePublic(@Param('shopId') shopId: string) {
    return this.barbershopsService.findOnePublic(shopId);
  }
}
