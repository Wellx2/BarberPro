/**
 * Client Service
 * API para gerenciamento de clientes
 */

import { api } from './api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  shopId: string;
  active: boolean;
  createdAt?: string;
}

export const clientService = {
  /**
   * Listar todos os clientes da loja
   * GET /api/clients
   */
  async list(shopId?: string): Promise<Client[]> {
    const endpoint = shopId ? `/clients?shopId=${shopId}` : '/clients';
    const response = await api.get<Client[]>(endpoint);
    return response.data;
  },

  /**
   * Buscar cliente por ID
   * GET /api/clients/:id
   */
  async getById(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  /**
   * Buscar clientes por termo de pesquisa (nome, email, telefone)
   * GET /api/clients/search?q=termo
   */
  async search(query: string): Promise<Client[]> {
    const response = await api.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
