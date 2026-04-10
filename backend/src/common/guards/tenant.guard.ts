import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Header x-tenant-id permite navegação dinâmica por clientes ou sysadmins
    const headerTenantId = request.headers['x-tenant-id'];

    // SUPER_ADMIN pode acessar qualquer tenant
    if (user.role === 'SUPER_ADMIN') {
      request.shopId = headerTenantId || user.shopId;
      return true;
    }

    // CLIENT pode agendar e visualizar dados livremente nas barbearias
    if (user.role === 'CLIENT') {
      // Define a barbearia requisitada no request para forçar escopo de dados
      request.shopId = headerTenantId || user.shopId;
      if (!request.shopId) {
        throw new ForbiddenException('Usuário não vinculado e nenhum identificador de barbearia fornecido.');
      }
      
      const method = request.method;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const bodyShopId = request.body?.shopId;
        const paramShopId = request.params?.shopId;
        const queryShopId = request.query?.shopId;
        
        if (bodyShopId && bodyShopId !== request.shopId) {
          throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado bloqueada.');
        }
        if (paramShopId && paramShopId !== request.shopId) {
          throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado bloqueada.');
        }
        if (queryShopId && queryShopId !== request.shopId) {
          throw new ForbiddenException('Violação de segurança: Tentativa de acesso cruzado bloqueada.');
        }
      }
      return true;
    }

    // Os outros papeis (ADMIN, BARBER) são estritamente trancados ao shopId do token JWT
    request.shopId = user.shopId;
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
