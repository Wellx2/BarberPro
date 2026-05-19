import { api } from './api';
import { User, UserRole } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  shopId?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  active?: boolean;
  barberId?: string;
}

export const userService = {
  /**
   * Lista todos os usuários (requer autenticação SUPER_ADMIN ou ADMIN)
   * SUPER_ADMIN vê todos, ADMIN vê apenas os da sua loja
   */
  async list(role?: UserRole): Promise<User[]> {
    const params = role ? { role } : {};
    const response = await api.get<User[]>('/users', { params });
    return response.data;
  },

  /**
   * Busca usuário por ID
   */
  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Cria novo usuário (requer autenticação SUPER_ADMIN ou ADMIN)
   */
  async create(data: CreateUserData): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  /**
   * Atualiza usuário (requer autenticação SUPER_ADMIN ou ADMIN)
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Soft delete de usuário
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  /**
   * Hard delete de usuário (apenas SUPER_ADMIN)
   */
  async hardDelete(id: string): Promise<void> {
    await api.delete(`/users/${id}/permanently`);
  }
};
