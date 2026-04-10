import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { BarbershopOnboardingService } from './onboarding.service';
import { BarbershopOnboardingDto } from './dto/barbershop-onboarding.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('onboarding')
@Controller('onboarding')
@ApiBearerAuth()
export class BarbershopOnboardingController {
  constructor(private readonly onboardingService: BarbershopOnboardingService) { }

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar abertura de barbearia (Fluxo Cliente -> Admin)' })
  @ApiResponse({ status: 201, description: 'Solicitação criada' })
  async createOnboardingRequest(@Req() req, @Body() dto: BarbershopOnboardingDto) {
    return this.onboardingService.createRequest(req.user.id, dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar solicitações pendentes (Apenas Super Admin)' })
  async listPendingRequests() {
    return this.onboardingService.listPendingRequests();
  }

  @Patch('approve/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar e ativar barbearia (Apenas Super Admin)' })
  async approveOnboarding(@Param('id') id: string) {
    return this.onboardingService.approveRequest(id);
  }

  @Patch('reject/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeitar solicitação (Apenas Super Admin)' })
  async rejectOnboarding(@Param('id') id: string) {
    return this.onboardingService.rejectRequest(id);
  }
}
