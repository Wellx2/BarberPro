import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // SUPER_ADMIN pode acessar qualquer tenant
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }
    // Injeta shopId no request para uso nos services
    request.shopId = user.shopId;
    // Valida que recursos acessados pertencem ao shop
    if (!user.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia.');
    }

    // Segurança Tenant: Validação estrita de rotas de escrita
    const method = request.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const bodyShopId = request.body?.shopId;
      const paramShopId = request.params?.shopId;
      const queryShopId = request.query?.shopId;

      if (bodyShopId && bodyShopId !== user.shopId) {
        throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado entre barbearias bloqueada.');
      }
      if (paramShopId && paramShopId !== user.shopId) {
        throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado entre barbearias bloqueada.');
      }
      if (queryShopId && queryShopId !== user.shopId) {
        throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado entre barbearias bloqueada.');
      }
    }

    return true;
  }
}
