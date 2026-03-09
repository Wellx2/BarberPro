import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ModuleType, UserRole } from '@prisma/client';

export const REQUIRE_MODULE = 'requireModule';
export const RequireModule = (moduleType: ModuleType) => SetMetadata(REQUIRE_MODULE, moduleType);

/**
 * Guard para validar se a barbearia tem acesso ao módulo solicitado
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, TenantGuard, ModuleAccessGuard)
 * @RequireModule(ModuleType.PRODUTOS)
 *
 * SUPER_ADMIN tem acesso a todos os módulos (bypass)
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<ModuleType>(REQUIRE_MODULE, context.getHandler());

    // Se não há módulo requerido, permite acesso
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN tem acesso a tudo (bypass)
    if (user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Valida se usuário tem shopId
    if (!user?.shopId) {
      throw new ForbiddenException('Usuário não está vinculado a uma barbearia');
    }

    // Busca configuração do módulo para esta barbearia
    const moduleConfig = await this.prisma.barbershopModule.findUnique({
      where: {
        shopId_moduleType: {
          shopId: user.shopId,
          moduleType: requiredModule,
        },
      },
    });

    // Se módulo não existe ou está desabilitado
    if (!moduleConfig || !moduleConfig.enabled) {
      throw new ForbiddenException(`Sua barbearia não tem acesso ao módulo: ${requiredModule}`);
    }

    return true;
  }
}
