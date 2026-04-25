/**
 * Configuração base da API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

if (!API_BASE_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL não está definida em ambiente de produção!');
}

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<{ data: T }> {
    const token = this.getAuthToken();
    const tenantId = localStorage.getItem('selected_shop_id');
    const fullURL = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenantId && { 'x-tenant-id': tenantId }),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(fullURL, config);

      if (!response.ok) {
        // Tentar refresh token se receber 401 e retry estiver habilitado
        const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh');
        if (response.status === 401 && retry && !isAuthRoute) {
          const refreshToken = localStorage.getItem('refreshToken');

          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });

              if (refreshResponse.ok) {
                const data = await refreshResponse.json();

                // Backend retorna accessToken (camelCase)
                const newToken = data.accessToken;

                if (newToken) {
                  localStorage.setItem('accessToken', newToken);

                  // Tentar novamente com novo token
                  return this.request<T>(endpoint, options, false);
                } else {
                  console.error('Resposta do refresh não contém token:', data);
                }
              } else {
                const errorData = await refreshResponse.json().catch(() => ({}));
                console.error('Falha ao renovar token:', refreshResponse.status, errorData);
              }
            } catch (refreshError) {
              console.error('Erro ao renovar token:', refreshError);
            }
          }

          // Se chegou aqui, o refresh falhou - limpar sessão
          localStorage.clear();
          window.location.href = '/login';
        }

        const error: ApiError = await response.json().catch(() => ({
          message: 'Erro ao processar resposta',
          statusCode: response.status,
        }));

        // Console log removed automatically
        throw error;
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof Error && error.message === 'Failed to fetch') {
        console.error('❌ Backend não acessível:', fullURL);
        throw {
          message: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
          statusCode: 0,
          error: 'NETWORK_ERROR'
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
