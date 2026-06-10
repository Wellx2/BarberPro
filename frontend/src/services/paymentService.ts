import { api } from './api';

export const paymentService = {
  async generateCheckoutLink(planId: string): Promise<{ checkoutUrl: string }> {
    const response = await api.post('/payments/checkout', { planId });
    return response.data;
  }
};
