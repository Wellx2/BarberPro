import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const BCRYPT_SALT = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: any, dto: CreateUserDto) {
    // SUPER_ADMIN pode criar qualquer perfil; ADMIN só pode criar usuários do próprio shop
    if (requester.role === UserRole.ADMIN && dto.role === UserRole.ADMIN) {
      throw new ForbiddenException('Apenas SUPER_ADMIN pode criar outro ADMIN');
    }
    if (requester.role === UserRole.ADMIN && requester.shopId !== dto.shopId) {
      throw new ForbiddenException('ADMIN só pode criar usuários da própria barbearia');
    }
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Não é permitido criar SUPER_ADMIN por API');
    }
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, BCRYPT_SALT) : undefined;
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        shopId: dto.shopId,
        active: true,
      },
    });
    return user;
  }

  async findAll(requester: any, role?: UserRole) {
    const where: any = {};
    if (requester.role === UserRole.ADMIN) {
      where.shopId = requester.shopId;
    }
    if (role) {
      where.role = role;
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (requester.role === UserRole.ADMIN && user.shopId !== requester.shopId) {
      throw new ForbiddenException('Acesso negado');
    }
    return user;
  }

  async update(requester: any, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (requester.role === UserRole.ADMIN && user.shopId !== requester.shopId) {
      throw new ForbiddenException('Acesso negado');
    }

    const updateData: any = { ...dto };
    delete updateData.password;

    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);
      updateData.passwordHash = passwordHash;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(requester: any, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (requester.role === UserRole.ADMIN && user.shopId !== requester.shopId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async hardDelete(id: string) {
    // Apenas SUPER_ADMIN
    return this.prisma.user.delete({ where: { id } });
  }
}
