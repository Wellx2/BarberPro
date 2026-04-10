import { api } from './api';
import { ShopSubscriptionTier } from '../types';

export interface OnboardingRequestData {
  name: string;
  phone: string;
  address: string;
  cnpj?: string;
  subscriptionTier: ShopSubscriptionTier;
}

export const onboardingService = {
  /**
   * Envia uma solicitação de abertura de barbearia
   */
  async requestOnboarding(data: OnboardingRequestData) {
    const response = await api.post('/onboarding/request', data);
    return response.data;
  },

  /**
   * Lista todas as solicitações (Super Admin)
   */
  async listPendingRequests() {
    const response = await api.get('/onboarding/requests');
    return response.data;
  },

  /**
   * Aprova uma solicitação (Super Admin)
   */
  async approveRequest(id: string) {
    const response = await api.patch(`/onboarding/approve/${id}`);
    return response.data;
  },

  /**
   * Rejeita uma solicitação (Super Admin)
   */
  async rejectRequest(id: string) {
    const response = await api.patch(`/onboarding/reject/${id}`);
    return response.data;
  }
};
