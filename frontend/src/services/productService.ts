/**
 * Serviço de Produtos
 * 
 * Gerencia produtos de barbearias através da API backend.
 * Cada barbearia possui seus próprios produtos (isolamento multi-tenant).
 * 
 * Funcionalidades:
 * - Listagem pública de produtos por barbearia
 * - Filtro de produtos ativos/inativos
 * - CRUD completo (requer autenticação)
 * - Fallback para localStorage em caso de indisponibilidade da API
 */

import { api } from './api';
import { Product } from '../types';

export const productService = {
  /**
   * Lista produtos por barbearia (endpoint público)
   * @param barbershopId - UUID da barbearia (obtido do JWT ou ShopContext)
   * @param showAll - Se true, retorna todos (ativos e inativos). Se false, apenas ativos.
   * @returns Lista de produtos da barbearia
   */
  async list(barbershopId?: string, showAll: boolean = false): Promise<Product[]> {
    try {
      if (barbershopId) {
        // Admin usa rota autenticada para ver todos (NÃO deletados)
        // Clientes usam rota pública para ver apenas produtos ativos
        if (showAll) {
          // Rota autenticada - Backend filtra deletedAt automaticamente
          const response = await api.get<Product[]>('/products');
          return response.data.filter((p: any) => !p.deletedAt);
        }
        // Rota pública - Apenas produtos não-deletados
        const response = await api.get<Product[]>(`/products/public/shop/${barbershopId}`);
        return response.data.filter((p: any) => !p.deletedAt);
      }
      const response = await api.get<Product[]>('/products');
      return response.data.filter((p: any) => !p.deletedAt);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error.message);
      // Fallback para localStorage se API não estiver disponível
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const products = JSON.parse(storedProducts);
        const filtered = products.filter((p: any) => !p.deletedAt);
        return barbershopId
          ? filtered.filter((p: Product) => p.shopId === barbershopId && (showAll || p.active !== false))
          : filtered;
      }
      // Se não houver produtos no localStorage, retornar array vazio
      return [];
    }
  },

  /**
   * Busca produto por ID
   */
  async getById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Cria novo produto (requer autenticação)
   */
  async create(data: Omit<Product, 'id'>): Promise<Product> {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  /**
   * Atualiza produto existente (requer autenticação)
   */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Remove produto (requer autenticação)
   * @param id - UUID do produto
   * @param reason - Motivo da remoção (obrigatório pelo backend)
   */
  async remove(id: string, reason: string): Promise<void> {
    await api.delete(`/products/${id}`, { reason });
  }
};
