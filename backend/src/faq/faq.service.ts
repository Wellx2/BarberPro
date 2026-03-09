import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateFaqDto) {
    // Validar se é ADMIN ou SUPER_ADMIN
    if (requester.role !== 'ADMIN' && requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas administradores podem criar FAQs');
    }

    // Se não for SUPER_ADMIN, validar tenant
    if (requester.role === 'ADMIN' && dto.shopId !== requester.shopId) {
      throw new ForbiddenException('Você só pode criar FAQs para sua barbearia');
    }

    return this.prisma.barbershopFaq.create({
      data: {
        shopId: dto.shopId,
        question: dto.question,
        answer: dto.answer,
        displayOrder: dto.displayOrder ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  async findByShop(shopId: string, activeOnly = true) {
    return this.prisma.barbershopFaq.findMany({
      where: {
        shopId,
        ...(activeOnly ? { active: true } : {}),
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const faq = await this.prisma.barbershopFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ não encontrado');
    return faq;
  }

  async update(requester: any, id: string, dto: UpdateFaqDto) {
    const faq = await this.prisma.barbershopFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ não encontrado');

    // Validar tenant
    if (requester.role === 'ADMIN' && faq.shopId !== requester.shopId) {
      throw new ForbiddenException('Você só pode editar FAQs da sua barbearia');
    }

    return this.prisma.barbershopFaq.update({
      where: { id },
      data: dto,
    });
  }

  async remove(requester: any, id: string) {
    const faq = await this.prisma.barbershopFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ não encontrado');

    // Validar tenant
    if (requester.role === 'ADMIN' && faq.shopId !== requester.shopId) {
      throw new ForbiddenException('Você só pode deletar FAQs da sua barbearia');
    }

    return this.prisma.barbershopFaq.delete({ where: { id } });
  }
}
