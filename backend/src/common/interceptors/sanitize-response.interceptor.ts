import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Campos sensíveis que devem ser removidos de objetos user/client/barber
const SENSITIVE_FIELDS = [
  'passwordHash',
  'resetToken',
  'passwordResetToken',
  'passwordResetExpires',
  'verificationToken',
];

// Campos de PII que podem ser removidos em contextos públicos
const PII_FIELDS = ['email', 'phone', 'document', 'address', 'zipCode', 'costPrice'];

// Campos de token que devem ser preservados apenas em respostas de auth
const AUTH_TOKEN_FIELDS = ['accessToken', 'refreshToken', 'token', 'jwt'];

// Rotas de autenticação onde tokens DEVEM ser retornados
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register-shop',
  '/auth/google/callback',
];

@Injectable()
export class SanitizeResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const isAuthRoute = AUTH_ROUTES.some((route) => request.url.includes(route));

    return next.handle().pipe(
      map((data) => this.removeSensitiveFields(data, isAuthRoute, user)),
    );
  }

  private removeSensitiveFields(data: any, isAuthRoute = false, requester?: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.removeSensitiveFields(item, false, requester));
    }

    if (data instanceof Date || !data || typeof data !== 'object') {
      return data;
    }

    const cleaned = { ...data };

    // 1. Remover campos sensíveis de sistema (SENHA, TOKENS INTERNOS) - SEMPRE
    for (const field of SENSITIVE_FIELDS) {
      if (field in cleaned) delete cleaned[field];
    }

    // 2. Remover tokens (ACCESS/REFRESH) se não for rota de auth
    if (!isAuthRoute) {
      for (const field of AUTH_TOKEN_FIELDS) {
        if (field in cleaned) delete cleaned[field];
      }
    }

    // 3. Lógica de PII (Proteção de Dados Pessoais) e Sigilo Comercial
    // Se for um objeto de "User", "Client", "Barber" ou "Product"
    const isUserObject = 'email' in cleaned || 'phone' in cleaned || 'document' in cleaned;
    const isProductObject = 'costPrice' in cleaned;

    // EXCEÇÃO: Se for uma barbearia (Shop), o e-mail, telefone e endereço são públicos
    // Diferenciamos de 'User' pela ausência do campo 'role'
    const isShopObject = isUserObject && !('role' in cleaned);

    if ((isUserObject || isProductObject) && !isShopObject) {
      // Regra: Somente o DONO do dado ou um ADMIN/SUPER_ADMIN podem ver PII/Custos
      const isOwner = requester && (requester.id === cleaned.userId || requester.id === cleaned.id);
      const isAdmin = requester && (requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN');

      if (!isOwner && !isAdmin) {
        for (const field of PII_FIELDS) {
          if (field in cleaned) {
            // Ofuscar em vez de deletar para manter compatibilidade com UI
            if (field === 'email' && typeof cleaned[field] === 'string') {
              const [user, domain] = cleaned[field].split('@');
              cleaned[field] = `${user[0]}***@${domain}`;
            } else if (field === 'phone' && typeof cleaned[field] === 'string') {
              const last4 = cleaned[field].slice(-4);
              cleaned[field] = `(**) ****-${last4}`;
            } else {
              delete cleaned[field];
            }
          }
        }
      }
    }

    // 4. Processar objetos aninhados recursively
    for (const key in cleaned) {
      if (cleaned[key] && typeof cleaned[key] === 'object' && !(cleaned[key] instanceof Date)) {
        // Se for objeto 'user', nunca preservar tokens dele na recursão
        const preserveTokens = isAuthRoute && key !== 'user';
        cleaned[key] = this.removeSensitiveFields(cleaned[key], preserveTokens, requester);
      }
    }

    return cleaned;
  }
}
