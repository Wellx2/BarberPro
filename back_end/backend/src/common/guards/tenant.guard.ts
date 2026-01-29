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
    // (implementar lógica específica por rota nos services/controllers)
    if (!user.shopId) {
      throw new ForbiddenException('Usuário não vinculado a uma barbearia.');
    }
    return true;
  }
}
