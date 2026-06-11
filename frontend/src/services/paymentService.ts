import { api } from './api';

export const paymentService = {
  async generateCheckoutLink(planId: string): Promise<{ checkoutUrl: string }> {
    const response = await api.post<{ checkoutUrl: string }>('/payments/checkout', { planId });
    return response.data;
  }
};
