import { Injectable, Logger } from '@nestjs/common';
import {
  ConfigResolverService,
  ProviderNotConfiguredException,
} from '../../../services/config-resolver/config-resolver.service.js';
import type { IPaymentProvider } from './payment-provider.interface.js';
import { RazorpayProvider } from './razorpay.provider.js';
import { StripeProvider } from './stripe.provider.js';

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);

  constructor(private readonly configResolver: ConfigResolverService) {}

  /**
   * Resolve the payment provider for a given organization.
   * Reads the org's active payment provider and credentials from config,
   * then returns the appropriate IPaymentProvider implementation.
   */
  async getProvider(orgId: string): Promise<IPaymentProvider> {
    const config = await this.configResolver.getPaymentConfig(orgId);

    if (config.activeProvider === 'razorpay') {
      this.logger.debug(`Resolved Razorpay provider for org ${orgId}`);
      return new RazorpayProvider(config);
    }

    if (config.activeProvider === 'stripe') {
      this.logger.debug(`Resolved Stripe provider for org ${orgId}`);
      return new StripeProvider(config);
    }

    throw new ProviderNotConfiguredException(orgId, 'payment');
  }
}
