import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SENSITIVE_FIELDS = ['passwordHash', 'refreshToken', 'token', 'accessToken', 'jwt'];

@Injectable()
export class SanitizeResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.removeSensitiveFields(data)));
  }

  private removeSensitiveFields(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.removeSensitiveFields(item));
    }
    if (data && typeof data === 'object') {
      const cleaned = { ...data };
      for (const field of SENSITIVE_FIELDS) {
        if (field in cleaned) {
          delete cleaned[field];
        }
      }
      for (const key in cleaned) {
        if (typeof cleaned[key] === 'object') {
          cleaned[key] = this.removeSensitiveFields(cleaned[key]);
        }
      }
      return cleaned;
    }
    return data;
  }
}
