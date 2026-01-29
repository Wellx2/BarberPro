import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { DisableBarberDto } from './dto/disable-barber.dto';
import { RemoveBarberDto } from './dto/remove-barber.dto';
import { UpdateBarberWorkModelDto } from './dto/update-barber-work-model.dto';
import { BarberWorkModel } from '@prisma/client';

@Injectable()
export class BarbersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateBarberDto) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    const barber = await this.prisma.barber.create({
      data: {
        shopId: requester.shopId,
        name: dto.name,
        nickname: dto.nickname,
        description: dto.description,
        specialties: dto.specialties,
        avatar: dto.avatar,
        experienceYears: dto.experienceYears,
        services: dto.services,
        active: true,
      },
    });
    await this.logAction('CREATE', barber.id, requester.id, requester.shopId, 'Barbeiro criado');
    return barber;
  }

  async findAll(requester: any, active?: boolean) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    return this.prisma.barber.findMany({
      where: {
        shopId: requester.shopId,
        ...(active !== undefined ? { active } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    return barber;
  }

  async update(requester: any, id: string, dto: UpdateBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    // Barbeiro só pode editar o próprio perfil
    if (requester.role === 'BARBER' && requester.id !== id) {
      throw new ForbiddenException('Você só pode editar seu próprio perfil');
    }
    const updated = await this.prisma.barber.update({
      where: { id },
      data: { ...dto },
    });
    await this.logAction('UPDATE', id, requester.id, requester.shopId, 'Barbeiro atualizado');
    return updated;
  }

  async disable(requester: any, id: string, dto: DisableBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    const updated = await this.prisma.barber.update({
      where: { id },
      data: { active: false },
    });
    await this.logAction('DISABLE', id, requester.id, requester.shopId, dto.reason);
    return updated;
  }

  async remove(requester: any, id: string, dto: RemoveBarberDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId)
      throw new NotFoundException('Barbeiro não encontrado');
    await this.prisma.barber.update({ where: { id }, data: { active: false } });
    await this.logAction('REMOVE', id, requester.id, requester.shopId, dto.reason);
    // Soft delete: marca como inativo, não remove fisicamente
    return { message: 'Barbeiro removido (soft delete)' };
  }

  /**
   * Atualizar modelo de trabalho e remuneração do barbeiro
   */
  async updateWorkModel(requester: any, id: string, dto: UpdateBarberWorkModelDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber || barber.shopId !== requester.shopId) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Validações baseadas no modelo de trabalho
    if (dto.workModel === BarberWorkModel.CHAIR_RENT && !dto.chairRentalFee) {
      throw new BadRequestException('Aluguel de cadeira requer valor de chairRentalFee');
    }

    if (
      (dto.workModel === BarberWorkModel.SALARY ||
        dto.workModel === BarberWorkModel.SALARY_COMMISSION) &&
      !dto.monthlySalary
    ) {
      throw new BadRequestException('Modelo com salário requer valor de monthlySalary');
    }

    const updated = await this.prisma.barber.update({
      where: { id },
      data: {
        workModel: dto.workModel,
        monthlySalary: dto.monthlySalary,
        chairRentalFee: dto.chairRentalFee,
      },
    });

    await this.logAction(
      'UPDATE_WORK_MODEL',
      id,
      requester.id,
      requester.shopId,
      `Modelo atualizado para ${dto.workModel}`,
    );

    return updated;
  }

  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'BARBER',
        entityId,
        userId,
        shopId,
        details,
      },
    });
  }
}
