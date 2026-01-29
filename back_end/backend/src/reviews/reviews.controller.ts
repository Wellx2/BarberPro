import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar avaliação (apenas CLIENT)' })
  create(@CurrentUser() user: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar avaliações (público)' })
  findAll(@Query('barberId') barberId?: string) {
    return this.reviewsService.findAll(barberId);
  }

  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Listar avaliações de um barbeiro (público)' })
  findByBarber(@Param('barberId') barberId: string) {
    return this.reviewsService.findByBarber(barberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar avaliação por ID (público)' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}
