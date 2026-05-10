import { Logger } from '@nestjs/common';
import type { PaymentProviderConfig } from '../../../services/config-resolver/config-resolver.service.js';
import type {
  IPaymentProvider,
  CreatePlanData,
  CreateCustomerData,
  CreateOrderData,
  VerifyPaymentData,
  CapturePaymentData,
  CreateSubscriptionData,
  CreateRefundData,
  CreatePaymentLinkData,
  ProviderPlan,
  ProviderCustomer,
  ProviderOrder,
  ProviderPayment,
  ProviderSubscription,
  ProviderRefund,
  ProviderPaymentLink,
  WebhookEvent,
} from './payment-provider.interface.js';

export class StripeProvider implements IPaymentProvider {
  readonly providerName = 'stripe' as const;
  private readonly logger = new Logger(StripeProvider.name);
  private instance: any;
  private readonly secretKey: string;

  constructor(config: PaymentProviderConfig) {
    if (!config.stripe) {
      throw new Error('Stripe configuration is missing');
    }
    this.secretKey = config.stripe.secretKey;
  }

  private async getClient(): Promise<any> {
    if (this.instance) {
      return this.instance;
    }

    try {
      const Stripe = (await import('stripe')).default;
      this.instance = new Stripe(this.secretKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
      return this.instance;
    } catch (error) {
      this.logger.error('Failed to initialize Stripe SDK', error);
      throw new Error('Stripe SDK is not installed. Run: npm install stripe');
    }
  }

  async createPlan(_data: CreatePlanData): Promise<ProviderPlan> {
    throw new Error('Stripe uses Prices instead of Plans. Not implemented for app subscriptions.');
  }

  async createCustomer(data: CreateCustomerData): Promise<ProviderCustomer> {
    try {
      const stripe = await this.getClient();
      const customer = await stripe.customers.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        metadata: data.metadata ?? {},
      });

      return {
        id: customer.id,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
        name: customer.name ?? undefined,
      };
    } catch (error) {
      this.logger.error('Stripe createCustomer failed', error);
      throw error;
    }
  }

  async createOrder(data: CreateOrderData): Promise<ProviderOrder> {
    try {
      const stripe = await this.getClient();
      // Stripe uses PaymentIntents instead of orders
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Stripe expects smallest currency unit
        currency: data.currency.toLowerCase(),
        metadata: data.notes ?? {},
        description: data.receipt,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        ...(data.receipt && { receipt: data.receipt }),
      };
    } catch (error) {
      this.logger.error('Stripe createOrder failed', error);
      throw error;
    }
  }

  async verifyPayment(data: VerifyPaymentData): Promise<boolean> {
    try {
      const stripe = await this.getClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(
        data.paymentId,
      );
      return (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'requires_capture'
      );
    } catch (error) {
      this.logger.error('Stripe verifyPayment failed', error);
      return false;
    }
  }

  async capturePayment(data: CapturePaymentData): Promise<ProviderPayment> {
    try {
      const stripe = await this.getClient();
      const paymentIntent = await stripe.paymentIntents.capture(
        data.paymentId,
        {
          amount_to_capture: Math.round(data.amount * 100),
        },
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount_received / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        ...(paymentIntent.payment_method_types?.[0] && { method: paymentIntent.payment_method_types[0] }),
        ...(paymentIntent.status === 'succeeded' && { capturedAt: new Date() }),
      };
    } catch (error) {
      this.logger.error('Stripe capturePayment failed', error);
      throw error;
    }
  }

  async createSubscription(
    data: CreateSubscriptionData,
  ): Promise<ProviderSubscription> {
    try {
      const stripe = await this.getClient();
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [
          {
            price: data.planId, // Stripe uses price IDs
            quantity: data.quantity ?? 1,
          },
        ],
        metadata: data.metadata ?? {},
      });

      return {
        id: subscription.id,
        planId: data.planId,
        customerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        quantity: data.quantity ?? 1,
      };
    } catch (error) {
      this.logger.error('Stripe createSubscription failed', error);
      throw error;
    }
  }

  async pauseSubscription(id: string): Promise<void> {
    try {
      const stripe = await this.getClient();
      await stripe.subscriptions.update(id, {
        pause_collection: { behavior: 'void' },
      });
    } catch (error) {
      this.logger.error(`Stripe pauseSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async resumeSubscription(id: string): Promise<void> {
    try {
      const stripe = await this.getClient();
      await stripe.subscriptions.update(id, {
        pause_collection: '',
      });
    } catch (error) {
      this.logger.error(`Stripe resumeSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async cancelSubscription(id: string): Promise<void> {
    try {
      const stripe = await this.getClient();
      await stripe.subscriptions.cancel(id);
    } catch (error) {
      this.logger.error(`Stripe cancelSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async createRefund(data: CreateRefundData): Promise<ProviderRefund> {
    try {
      const stripe = await this.getClient();
      const refundPayload: Record<string, unknown> = {
        payment_intent: data.paymentId,
        metadata: data.notes ?? {},
      };

      if (data.amount != null) {
        refundPayload['amount'] = Math.round(data.amount * 100);
      }
      if (data.reason) {
        refundPayload['reason'] = 'requested_by_customer';
      }

      const refund = await stripe.refunds.create(refundPayload);

      return {
        id: refund.id,
        paymentId: refund.payment_intent as string,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
      };
    } catch (error) {
      this.logger.error('Stripe createRefund failed', error);
      throw error;
    }
  }

  async createPaymentLink(
    data: CreatePaymentLinkData,
  ): Promise<ProviderPaymentLink> {
    try {
      const stripe = await this.getClient();

      // Create a price for the payment link
      const price = await stripe.prices.create({
        unit_amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        product_data: {
          name: data.name,
        },
        ...(data.type === 'subscription' ? { recurring: { interval: 'month' } } : {}),
      });

      const linkPayload: Record<string, unknown> = {
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: data.notes ?? {},
      };

      if (data.successUrl) {
        linkPayload['after_completion'] = {
          type: 'redirect',
          redirect: { url: data.successUrl },
        };
      }

      const link = await stripe.paymentLinks.create(linkPayload);

      return {
        id: link.id,
        url: link.url,
        amount: data.amount,
        currency: data.currency,
        status: link.active ? 'active' : 'inactive',
      };
    } catch (error) {
      this.logger.error('Stripe createPaymentLink failed', error);
      throw error;
    }
  }

  async constructWebhookEvent(
    payload: unknown,
    signature: string,
    secret: string,
  ): Promise<WebhookEvent> {
    try {
      const stripe = await this.getClient();
      const body =
        typeof payload === 'string' ? payload : JSON.stringify(payload);

      const event = stripe.webhooks.constructEvent(body, signature, secret);

      return {
        type: event.type,
        provider: 'stripe',
        data: event.data.object as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
      throw new Error('Invalid Stripe webhook signature');
    }
  }
}
