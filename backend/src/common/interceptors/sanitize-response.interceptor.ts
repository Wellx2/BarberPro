import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Campos sensíveis que devem ser removidos de objetos user
const SENSITIVE_USER_FIELDS = ['passwordHash'];

// Campos de token que devem ser preservados em respostas de auth
const TOKEN_FIELDS = ['accessToken', 'refreshToken', 'token', 'jwt'];

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
    const path = request.url;

    // Se for rota de autenticação, não remover tokens da resposta raiz
    const isAuthRoute = AUTH_ROUTES.some((route) => path.includes(route));

    return next.handle().pipe(map((data) => this.removeSensitiveFields(data, isAuthRoute)));
  }

  private removeSensitiveFields(data: any, isAuthRoute = false): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.removeSensitiveFields(item, false));
    }

    if (data instanceof Date) {
      return data;
    }

    if (data && typeof data === 'object') {
      const cleaned = { ...data };

      // Remove passwordHash SEMPRE
      for (const field of SENSITIVE_USER_FIELDS) {
        if (field in cleaned) {
          delete cleaned[field];
        }
      }

      // Remove tokens apenas se NÃO for rota de auth OU se estiver dentro de objeto 'user'
      if (!isAuthRoute) {
        for (const field of TOKEN_FIELDS) {
          if (field in cleaned) {
            delete cleaned[field];
          }
        }
      }

      // Processa objetos aninhados
      for (const key in cleaned) {
        if (typeof cleaned[key] === 'object') {
          // Se for objeto 'user', nunca preservar tokens dele
          const preserveTokens = isAuthRoute && key !== 'user';
          cleaned[key] = this.removeSensitiveFields(cleaned[key], preserveTokens);
        }
      }

      return cleaned;
    }

    return data;
  }
}
