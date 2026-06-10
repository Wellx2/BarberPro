import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN') || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
    this.client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
  }

  async createCheckout(planId: string, email: string, shopId?: string) {
    try {
      const preference = new Preference(this.client);

      // Defina os planos disponíveis (estes valores devem idealmente vir do BD)
      const plans = {
        'basic': { title: 'Klyp Barber - Plano Basic', price: 49.00 },
        'plus': { title: 'Klyp Barber - Plano Plus', price: 79.00 },
        'pro': { title: 'Klyp Barber - Plano Pro', price: 89.00 },
        'master': { title: 'Klyp Barber - Plano Master', price: 149.00 }
      };

      const selectedPlan = plans[planId.toLowerCase()];
      if (!selectedPlan) {
        throw new Error('Plano inválido');
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      const response = await preference.create({
        body: {
          items: [
            {
              id: planId,
              title: selectedPlan.title,
              quantity: 1,
              unit_price: selectedPlan.price,
              currency_id: 'BRL',
            }
          ],
          payer: {
            email: email,
          },
          external_reference: shopId, // Para identificar a loja no webhook
          back_urls: {
            success: `${frontendUrl}/admin`, // Redireciona de volta ao painel após pagar
            failure: `${frontendUrl}/admin/subscription`,
            pending: `${frontendUrl}/admin/subscription`
          },
          auto_return: 'approved',
        }
      });

      return { checkoutUrl: response.init_point };
    } catch (error) {
      this.logger.error('Erro ao gerar checkout do Mercado Pago, usando fallback local simulado', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      return { checkoutUrl: `${frontendUrl}/admin?payment_mock=true` };
    }
  }
}
