import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    requester: any,
    filters?: {
      action?: string;
      entity?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');
    if (requester.role !== UserRole.ADMIN && requester.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Apenas administradores podem ver relatórios de log');
    }

    const where: any = { shopId: requester.shopId };

    if (filters?.action && filters.action !== 'ALL') {
      where.action = filters.action;
    }

    if (filters?.entity && filters.entity !== 'ALL') {
      where.entity = filters.entity;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    // Default pagination settings if not provided
    const page = Number(filters?.page || 1);
    const limit = Number(filters?.limit || 50);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // O Prisma model original de AuditLog não definiu '@relation' para o usuário.
    // Assim, nós juntamos os nomes dos usuários manualmente aqui.
    if (logs.length > 0) {
      const uniqueUserIds = [...new Set(logs.map(log => log.userId).filter(id => id))];
      
      const users = await this.prisma.user.findMany({
        where: { id: { in: uniqueUserIds as string[] } },
        select: { id: true, name: true, role: true },
      });

      const userMap = new Map();
      users.forEach(u => userMap.set(u.id, u));

      const enrichedLogs = logs.map(log => ({
        ...log,
        user: log.userId ? userMap.get(log.userId) : null,
      }));

      return {
        data: enrichedLogs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}
