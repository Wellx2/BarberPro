// 🔧 API Service - BarberPro Frontend
// Exemplos práticos de integração com o backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ============================================
// 🛍️ PRODUTOS - Products Service
// ============================================

export const productsService = {
  /**
   * Listar produtos públicos de uma barbearia
   * Não requer autenticação
   */
  async getPublicProducts(shopId: string, activeOnly: boolean = true) {
    const url = `${API_URL}/products/public/shop/${shopId}${activeOnly ? '?active=true' : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    
    return response.json();
  },

  /**
   * Listar produtos autenticado (com token)
   */
  async getProducts(token: string, activeOnly?: boolean) {
    const url = `${API_URL}/products${activeOnly !== undefined ? `?active=${activeOnly}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar produtos');
    }
    
    return response.json();
  },

  /**
   * Buscar produto por ID
   */
  async getProductById(token: string, id: string) {
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Produto não encontrado');
    }
    
    return response.json();
  },

  /**
   * Criar novo produto
   */
  async createProduct(token: string, data: {
    name: string;
    price: number;
    stock: number;
    costPrice?: number;
    unit?: string;
    category?: string;
    description?: string;
    formulation?: string;
    howToUse?: string;
    recommendedFor?: string;
    image?: string;
    active?: boolean;
  }) {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar produto');
    }
    
    return response.json();
  },

  /**
   * Atualizar produto (PATCH)
   * ⚠️ Envie apenas os campos que deseja alterar
   */
  async updateProduct(token: string, id: string, data: {
    name?: string;
    price?: number;
    stock?: number;
    costPrice?: number;
    unit?: string;
    category?: string;
    description?: string;
    formulation?: string;
    howToUse?: string;
    recommendedFor?: string;
    image?: string;
    active?: boolean;
  }) {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar produto');
    }
    
    return response.json();
  },

  /**
   * Desativar produto
   */
  async disableProduct(token: string, id: string, reason: string) {
    const response = await fetch(`${API_URL}/products/${id}/disable`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao desativar produto');
    }
    
    return response.json();
  },

  /**
   * Remover produto (Soft Delete)
   * ⚠️ IMPORTANTE: O campo 'reason' é OBRIGATÓRIO
   */
  async deleteProduct(token: string, id: string, reason: string) {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason }) // ⚠️ OBRIGATÓRIO
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao remover produto');
    }
    
    return response.json();
  },

  /**
   * Alternar destaque do produto
   */
  async toggleFeatured(token: string, id: string) {
    const response = await fetch(`${API_URL}/products/${id}/toggle-featured`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao alternar destaque');
    }
    
    return response.json();
  },

  /**
   * Listar produtos em destaque (máximo 3)
   */
  async getFeaturedProducts(token: string) {
    const response = await fetch(`${API_URL}/products/featured`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos em destaque');
    }
    
    return response.json();
  }
};

// ============================================
// 💈 SERVIÇOS - Services Service
// ============================================

export const servicesService = {
  /**
   * Listar serviços públicos de uma barbearia
   * Não requer autenticação
   */
  async getPublicServices(shopId: string, activeOnly: boolean = true) {
    const url = `${API_URL}/services/public/shop/${shopId}${activeOnly ? '?active=true' : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar serviços');
    }
    
    return response.json();
  },

  /**
   * Listar serviços autenticado
   */
  async getServices(token: string, activeOnly?: boolean) {
    const url = `${API_URL}/services${activeOnly !== undefined ? `?active=${activeOnly}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar serviços');
    }
    
    return response.json();
  },

  /**
   * Buscar serviço por ID
   */
  async getServiceById(token: string, id: string) {
    const response = await fetch(`${API_URL}/services/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Serviço não encontrado');
    }
    
    return response.json();
  },

  /**
   * Criar novo serviço
   */
  async createService(token: string, data: {
    name: string;
    duration: number;
    price: number;
    category?: string;
    description?: string;
    image?: string;
    active?: boolean;
    featured?: boolean;
  }) {
    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar serviço');
    }
    
    return response.json();
  },

  /**
   * Atualizar serviço (PATCH)
   * ⚠️ Envie apenas os campos que deseja alterar
   */
  async updateService(token: string, id: string, data: {
    name?: string;
    duration?: number;
    price?: number;
    category?: string;
    description?: string;
    image?: string;
    active?: boolean;
    featured?: boolean;
  }) {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar serviço');
    }
    
    return response.json();
  },

  /**
   * Desativar serviço por período
   */
  async disableService(token: string, id: string, data: {
    type: 'DAY' | 'PERIOD' | 'RECURRING_DAY';
    date?: string; // Para DAY ou RECURRING_DAY (formato: YYYY-MM-DD)
    startDate?: string; // Para PERIOD (formato: YYYY-MM-DD)
    endDate?: string; // Para PERIOD (formato: YYYY-MM-DD)
    reason: string; // ⚠️ OBRIGATÓRIO
  }) {
    const response = await fetch(`${API_URL}/services/${id}/disable`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao desativar serviço');
    }
    
    return response.json();
  },

  /**
   * Remover serviço (Soft Delete)
   * ⚠️ IMPORTANTE: O campo 'reason' é OBRIGATÓRIO
   */
  async deleteService(token: string, id: string, reason: string) {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason }) // ⚠️ OBRIGATÓRIO
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao remover serviço');
    }
    
    return response.json();
  },

  /**
   * Listar períodos desabilitados de um serviço
   */
  async getDisabledPeriods(token: string, id: string) {
    const response = await fetch(`${API_URL}/services/${id}/disabled-periods`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar períodos desabilitados');
    }
    
    return response.json();
  },

  /**
   * Alternar destaque do serviço
   */
  async toggleFeatured(token: string, id: string) {
    const response = await fetch(`${API_URL}/services/${id}/toggle-featured`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao alternar destaque');
    }
    
    return response.json();
  },

  /**
   * Listar serviços em destaque (máximo 3)
   */
  async getFeaturedServices(token: string) {
    const response = await fetch(`${API_URL}/services/featured`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar serviços em destaque');
    }
    
    return response.json();
  }
};

// ============================================
// 📝 EXEMPLOS DE USO EM COMPONENTES REACT
// ============================================

/*
// Exemplo 1: Editar produto
async function handleEditProduct(productId: string) {
  try {
    const token = localStorage.getItem('accessToken');
    
    const updated = await productsService.updateProduct(token, productId, {
      name: 'Novo Nome',
      price: 55.00,
      stock: 30
    });
    
    console.log('Produto atualizado:', updated);
    toast.success('Produto atualizado com sucesso!');
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

// Exemplo 2: Remover produto (com modal de confirmação)
async function handleDeleteProduct(productId: string) {
  const reason = prompt('Motivo da remoção:');
  
  if (!reason) {
    toast.error('É necessário informar o motivo da remoção');
    return;
  }
  
  try {
    const token = localStorage.getItem('accessToken');
    
    await productsService.deleteProduct(token, productId, reason);
    
    toast.success('Produto removido com sucesso!');
    // Recarregar lista de produtos
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

// Exemplo 3: Editar serviço
async function handleEditService(serviceId: string, updates: any) {
  try {
    const token = localStorage.getItem('accessToken');
    
    const updated = await servicesService.updateService(token, serviceId, updates);
    
    console.log('Serviço atualizado:', updated);
    toast.success('Serviço atualizado com sucesso!');
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

// Exemplo 4: Remover serviço
async function handleDeleteService(serviceId: string) {
  const confirmed = window.confirm('Tem certeza que deseja remover este serviço?');
  
  if (!confirmed) return;
  
  const reason = prompt('Motivo da remoção:');
  
  if (!reason) {
    toast.error('É necessário informar o motivo da remoção');
    return;
  }
  
  try {
    const token = localStorage.getItem('accessToken');
    
    await servicesService.deleteService(token, serviceId, reason);
    
    toast.success('Serviço removido com sucesso!');
    // Recarregar lista de serviços
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

// Exemplo 5: Desativar serviço por período
async function handleDisableServicePeriod(serviceId: string) {
  try {
    const token = localStorage.getItem('accessToken');
    
    await servicesService.disableService(token, serviceId, {
      type: 'PERIOD',
      startDate: '2026-02-15',
      endDate: '2026-02-20',
      reason: 'Férias do barbeiro'
    });
    
    toast.success('Serviço desativado no período selecionado!');
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

// Exemplo 6: Toggle featured (produto/serviço)
async function handleToggleFeatured(productId: string) {
  try {
    const token = localStorage.getItem('accessToken');
    
    const updated = await productsService.toggleFeatured(token, productId);
    
    if (updated.featured) {
      toast.success('Produto marcado como destaque!');
    } else {
      toast.success('Produto removido dos destaques!');
    }
  } catch (error) {
    console.error(error);
    // Se ultrapassou o limite de 3 destaques
    if (error.message.includes('máximo')) {
      toast.error('Limite de 3 produtos em destaque atingido. Remova um destaque primeiro.');
    } else {
      toast.error(error.message);
    }
  }
}
*/

export default {
  products: productsService,
  services: servicesService
};
