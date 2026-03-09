import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleType } from '@prisma/client';
import { UpdateModuleDto, BulkUpdateModulesDto } from './dto/update-module.dto';

@Injectable()
export class BarbershopModulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os módulos de uma barbearia
   */
  async findByShop(shopId: string) {
    return this.prisma.barbershopModule.findMany({
      where: { shopId },
      orderBy: { moduleType: 'asc' },
    });
  }

  /**
   * Lista módulos habilitados de uma barbearia
   */
  async findEnabledByShop(shopId: string) {
    return this.prisma.barbershopModule.findMany({
      where: { shopId, enabled: true },
      orderBy: { moduleType: 'asc' },
    });
  }

  /**
   * Verifica se barbearia tem acesso a um módulo específico
   */
  async hasAccess(shopId: string, moduleType: ModuleType): Promise<boolean> {
    const module = await this.prisma.barbershopModule.findUnique({
      where: { shopId_moduleType: { shopId, moduleType } },
    });
    return module?.enabled ?? false;
  }

  /**
   * Atualiza status de um módulo (SUPER_ADMIN apenas)
   */
  async updateModule(shopId: string, moduleType: ModuleType, dto: UpdateModuleDto, userId: string) {
    // Verifica se barbearia existe
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    // Busca ou cria o módulo
    const existingModule = await this.prisma.barbershopModule.findUnique({
      where: { shopId_moduleType: { shopId, moduleType } },
    });

    const now = new Date();

    if (existingModule) {
      // Atualiza existente
      return this.prisma.barbershopModule.update({
        where: { id: existingModule.id },
        data: {
          enabled: dto.enabled,
          enabledAt: dto.enabled ? now : existingModule.enabledAt,
          disabledAt: !dto.enabled ? now : existingModule.disabledAt,
          enabledBy: dto.enabled ? userId : existingModule.enabledBy,
          disabledBy: !dto.enabled ? userId : existingModule.disabledBy,
        },
      });
    } else {
      // Cria novo
      return this.prisma.barbershopModule.create({
        data: {
          shopId,
          moduleType,
          enabled: dto.enabled,
          enabledAt: dto.enabled ? now : null,
          disabledAt: !dto.enabled ? now : null,
          enabledBy: dto.enabled ? userId : null,
          disabledBy: !dto.enabled ? userId : null,
        },
      });
    }
  }

  /**
   * Atualiza múltiplos módulos de uma vez
   */
  async bulkUpdate(shopId: string, dto: BulkUpdateModulesDto, userId: string) {
    const results = [];

    for (const moduleData of dto.modules) {
      const result = await this.updateModule(
        shopId,
        moduleData.moduleType,
        { enabled: moduleData.enabled },
        userId,
      );
      results.push(result);
    }

    return {
      updated: results.length,
      modules: results,
    };
  }

  /**
   * Inicializa módulos padrão para uma nova barbearia
   * Todos os módulos habilitados por padrão
   */
  async initializeDefaultModules(shopId: string, userId: string) {
    const allModules = Object.values(ModuleType);
    const now = new Date();

    const modulesToCreate = allModules.map((moduleType) => ({
      shopId,
      moduleType,
      enabled: true,
      enabledAt: now,
      enabledBy: userId,
    }));

    await this.prisma.barbershopModule.createMany({
      data: modulesToCreate,
      skipDuplicates: true,
    });

    return this.findByShop(shopId);
  }

  /**
   * Lista todas as barbearias e seus módulos (overview para SUPER_ADMIN)
   */
  async getAllShopsModules() {
    const shops = await this.prisma.barbershop.findMany({
      include: {
        modules: {
          orderBy: { moduleType: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      modules: shop.modules,
      totalModules: shop.modules.length,
      enabledModules: shop.modules.filter((m) => m.enabled).length,
    }));
  }
}
