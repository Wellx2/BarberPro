/**
 * Utilitários para decodificar e debugar JWT
 */

export interface JWTPayload {
  sub?: string;          // userId
  email?: string;
  role?: string;
  shopId?: string;       // CRÍTICO: backend precisa deste campo
  barbershopId?: string; // Possível nome alternativo
  iat?: number;          // Issued at
  exp?: number;          // Expiration
  [key: string]: any;    // Outros campos possíveis
}

/**
 * Decodifica um JWT sem validar assinatura (apenas para debug)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token JWT inválido: não tem 3 partes');
      return null;
    }

    // Decodifica a parte do payload (segunda parte)
    const payload = parts[1];
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);

    return parsed as JWTPayload;
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

/**
 * Verifica se o JWT tem os campos necessários para criar appointments
 */
export function validateJWTForAppointments(token: string): {
  valid: boolean;
  payload: JWTPayload | null;
  errors: string[];
} {
  const payload = decodeJWT(token);
  const errors: string[] = [];

  if (!payload) {
    return {
      valid: false,
      payload: null,
      errors: ['Token inválido ou não decodificável']
    };
  }

  // Verificações críticas
  if (!payload.sub && !payload.userId) {
    errors.push('Token não contém userId (sub)');
  }

  if (!payload.shopId && !payload.barbershopId) {
    errors.push('Token não contém shopId - Backend não conseguirá inferir a barbearia!');
  }

  if (!payload.role) {
    errors.push('Token não contém role');
  }

  return {
    valid: errors.length === 0,
    payload,
    errors
  };
}

/**
 * Debug completo do JWT atual
 */
export function debugCurrentJWT(): void {
  // Desativado para produção
}
