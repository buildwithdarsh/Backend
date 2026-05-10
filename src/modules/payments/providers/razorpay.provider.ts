import { createHmac } from 'node:crypto';
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

export class RazorpayProvider implements IPaymentProvider {
  readonly providerName = 'razorpay' as const;
  private readonly logger = new Logger(RazorpayProvider.name);
  private instance: any;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(config: PaymentProviderConfig) {
    if (!config.razorpay) {
      throw new Error('Razorpay configuration is missing');
    }
    this.keyId = config.razorpay.keyId;
    this.keySecret = config.razorpay.keySecret;
  }

  getKeyId(): string {
    return this.keyId;
  }

  verifySubscriptionSignature(paymentId: string, subscriptionId: string, signature: string): boolean {
    const body = `${paymentId}|${subscriptionId}`;
    const expected = createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  private async getClient(): Promise<any> {
    if (this.instance) {
      return this.instance;
    }

    try {
      const Razorpay = (await import('razorpay')).default;
      this.instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      return this.instance;
    } catch (error) {
      this.logger.error('Failed to initialize Razorpay SDK', error);
      throw new Error(
        'Razorpay SDK is not installed. Run: npm install razorpay',
      );
    }
  }

  async createPlan(data: CreatePlanData): Promise<ProviderPlan> {
    try {
      const client = await this.getClient();
      const plan = await client.plans.create({
        period: data.period,
        interval: data.interval,
        item: {
          name: data.name,
          amount: Math.round(data.amount * 100), // Convert to paise
          currency: data.currency,
          description: data.description ?? data.name,
        },
        notes: data.notes ?? {},
      });

      return {
        id: plan.id,
        period: plan.period,
        interval: plan.interval,
        name: plan.item?.name ?? data.name,
        amount: plan.item?.amount ? plan.item.amount / 100 : data.amount,
        currency: plan.item?.currency ?? data.currency,
      };
    } catch (error) {
      this.logger.error('Razorpay createPlan failed', error);
      throw error;
    }
  }

  async createCustomer(data: CreateCustomerData): Promise<ProviderCustomer> {
    try {
      const client = await this.getClient();
      const customer = await client.customers.create({
        name: data.name ?? '',
        email: data.email ?? '',
        contact: data.phone ?? '',
        notes: data.metadata ?? {},
      });

      return {
        id: customer.id,
        email: customer.email ?? undefined,
        phone: customer.contact ?? undefined,
        name: customer.name ?? undefined,
      };
    } catch (error) {
      this.logger.error('Razorpay createCustomer failed', error);
      throw error;
    }
  }

  async createOrder(data: CreateOrderData): Promise<ProviderOrder> {
    try {
      const client = await this.getClient();
      const order = await client.orders.create({
        amount: Math.round(data.amount * 100), // Razorpay expects paise/cents
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes ?? {},
      });

      return {
        id: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt ?? undefined,
      };
    } catch (error) {
      this.logger.error('Razorpay createOrder failed', error);
      throw error;
    }
  }

  async verifyPayment(data: VerifyPaymentData): Promise<boolean> {
    try {
      const body = `${data.orderId}|${data.paymentId}`;
      const expectedSignature = createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      return expectedSignature === data.signature;
    } catch (error) {
      this.logger.error('Razorpay verifyPayment failed', error);
      return false;
    }
  }

  async capturePayment(data: CapturePaymentData): Promise<ProviderPayment> {
    try {
      const client = await this.getClient();
      const payment = await client.payments.capture(
        data.paymentId,
        Math.round(data.amount * 100),
        data.currency,
      );

      return {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        ...(payment.method && { method: payment.method }),
        ...(payment.captured && { capturedAt: new Date() }),
      };
    } catch (error: any) {
      // Handle "already captured" — not an error, just fetch the payment
      if (error?.error?.description?.includes('already been captured') || error?.statusCode === 400) {
        this.logger.warn(`Payment ${data.paymentId} already captured — fetching current state`);
        try {
          const client = await this.getClient();
          const payment = await client.payments.fetch(data.paymentId);
          return {
            id: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            ...(payment.method && { method: payment.method }),
            ...(payment.captured && { capturedAt: new Date() }),
          };
        } catch (fetchErr) {
          this.logger.error('Razorpay fetch after capture-fail also failed', fetchErr);
          throw fetchErr;
        }
      }
      this.logger.error('Razorpay capturePayment failed', error);
      throw error;
    }
  }

  async createSubscription(
    data: CreateSubscriptionData,
  ): Promise<ProviderSubscription> {
    try {
      const client = await this.getClient();
      const payload: Record<string, unknown> = {
        plan_id: data.planId,
        quantity: data.quantity ?? 1,
        total_count: data.totalCount ?? 0,
        notes: data.notes ?? {},
      };
      if (data.customerId) {
        payload['customer_id'] = data.customerId;
      }

      const subscription = await client.subscriptions.create(payload);

      return {
        id: subscription.id,
        planId: subscription.plan_id,
        customerId: subscription.customer_id ?? data.customerId,
        status: subscription.status,
        shortUrl: subscription.short_url,
        ...(subscription.current_start && { currentPeriodStart: new Date(subscription.current_start * 1000) }),
        ...(subscription.current_end && { currentPeriodEnd: new Date(subscription.current_end * 1000) }),
        quantity: subscription.quantity,
      };
    } catch (error) {
      this.logger.error('Razorpay createSubscription failed', error);
      throw error;
    }
  }

  async pauseSubscription(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.subscriptions.pause(id);
    } catch (error) {
      this.logger.error(`Razorpay pauseSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async resumeSubscription(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.subscriptions.resume(id);
    } catch (error) {
      this.logger.error(`Razorpay resumeSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async cancelSubscription(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.subscriptions.cancel(id);
    } catch (error) {
      this.logger.error(`Razorpay cancelSubscription failed for ${id}`, error);
      throw error;
    }
  }

  async createRefund(data: CreateRefundData): Promise<ProviderRefund> {
    try {
      const client = await this.getClient();
      const refundPayload: Record<string, unknown> = {
        notes: data.notes ?? {},
      };

      if (data.amount != null) {
        refundPayload['amount'] = Math.round(data.amount * 100);
      }
      if (data.reason) {
        refundPayload['receipt'] = data.reason;
      }

      const refund = await client.payments.refund(
        data.paymentId,
        refundPayload,
      );

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      };
    } catch (error) {
      this.logger.error('Razorpay createRefund failed', error);
      throw error;
    }
  }

  async createPaymentLink(
    data: CreatePaymentLinkData,
  ): Promise<ProviderPaymentLink> {
    try {
      const client = await this.getClient();
      const linkPayload: Record<string, unknown> = {
        amount: Math.round(data.amount * 100),
        currency: data.currency,
        description: data.description ?? data.name,
        notes: data.notes ?? {},
      };

      if (data.successUrl) {
        linkPayload['callback_url'] = data.successUrl;
        linkPayload['callback_method'] = 'get';
      }
      if (data.expiresAt) {
        linkPayload['expire_by'] = Math.floor(data.expiresAt.getTime() / 1000);
      }

      const link = await client.paymentLink.create(linkPayload);

      return {
        id: link.id,
        url: link.short_url,
        amount: link.amount / 100,
        currency: link.currency,
        status: link.status,
      };
    } catch (error) {
      this.logger.error('Razorpay createPaymentLink failed', error);
      throw error;
    }
  }

  async constructWebhookEvent(
    payload: unknown,
    signature: string,
    secret: string,
  ): Promise<WebhookEvent> {
    const body =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid Razorpay webhook signature');
    }

    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const event = parsed as Record<string, unknown>;

    return {
      type: String(event['event'] ?? ''),
      provider: 'razorpay',
      data: (event['payload'] as Record<string, unknown>) ?? {},
    };
  }
}
