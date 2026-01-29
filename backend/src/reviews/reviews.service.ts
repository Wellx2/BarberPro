import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateReviewDto) {
    // Valida que appointment existe e está COMPLETED
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        review: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Apenas agendamentos concluídos podem ser avaliados');
    }

    if (appointment.review) {
      throw new BadRequestException('Este agendamento já possui uma avaliação');
    }

    // Valida que o cliente do agendamento é o mesmo que está criando a review
    if (appointment.clientId !== requester.id) {
      throw new ForbiddenException('Você não pode avaliar agendamentos de outros clientes');
    }

    // Valida que o barbeiro existe
    const barber = await this.prisma.barber.findUnique({
      where: { id: dto.barberId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Cria review
    const review = await this.prisma.review.create({
      data: {
        appointmentId: dto.appointmentId,
        barberId: dto.barberId,
        clientId: requester.id,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        barber: {
          select: { id: true, name: true, avatar: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });

    // Atualiza rating do barbeiro (média)
    await this.updateBarberRating(dto.barberId);

    await this.logAction('CREATE', review.id, requester.id, appointment.shopId, 'Review criada');

    return review;
  }

  async findAll(barberId?: string) {
    const whereClause: any = {};

    if (barberId) {
      whereClause.barberId = barberId;
    }

    return this.prisma.review.findMany({
      where: whereClause,
      include: {
        barber: {
          select: { id: true, name: true, avatar: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByBarber(barberId: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const reviews = await this.prisma.review.findMany({
      where: { barberId },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    return {
      barber: {
        id: barber.id,
        name: barber.name,
        avatar: barber.avatar,
        rating: barber.rating,
      },
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviews,
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        barber: {
          select: { id: true, name: true, avatar: true },
        },
        client: {
          select: { id: true, name: true },
        },
        appointment: {
          select: { id: true, date: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    return review;
  }

  private async updateBarberRating(barberId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { barberId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await this.prisma.barber.update({
        where: { id: barberId },
        data: { rating: parseFloat(averageRating.toFixed(2)) },
      });
    }
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'Review',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
