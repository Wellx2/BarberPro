import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest();

        // O shopId pode vir do usuário autenticado (User) configurado pelo JwtAuthGuard
        // ou do Header/Auth para outras situações
        const shopId = request.user?.shopId || request.shopId;

        if (shopId) {
            return tenantContext.run({ shopId }, () => next.handle());
        }

        return next.handle();
    }
}
