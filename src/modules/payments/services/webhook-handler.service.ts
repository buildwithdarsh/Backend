import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { ConfigResolverService } from '../../../services/config-resolver/config-resolver.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import type { WebhookEvent } from '../providers/payment-provider.interface.js';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configResolver: ConfigResolverService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  // ─── Razorpay Webhook ─────────────────────────────────────────────────────

  async handleRazorpayWebhook(
    payload: unknown,
    signature: string,
    orgId: string,
  ) {
    const provider = await this.providerFactory.getProvider(orgId);

    if (provider.providerName !== 'razorpay') {
      throw new BadRequestException(
        'Org is not configured for Razorpay payments',
      );
    }

    const config = await this.getWebhookSecret(orgId, 'razorpay');

    const event = await provider.constructWebhookEvent(
      payload,
      signature,
      config,
    );

    this.logger.log(
      `Razorpay webhook received: ${event.type} for org ${orgId}`,
    );

    await this.routeEvent(event, orgId);

    return { received: true };
  }

  // ─── Stripe Webhook ───────────────────────────────────────────────────────

  async handleStripeWebhook(
    payload: unknown,
    signature: string,
    orgId: string,
  ) {
    const provider = await this.providerFactory.getProvider(orgId);

    if (provider.providerName !== 'stripe') {
      throw new BadRequestException(
        'Org is not configured for Stripe payments',
      );
    }

    const config = await this.getWebhookSecret(orgId, 'stripe');

    const event = await provider.constructWebhookEvent(
      payload,
      signature,
      config,
    );

    this.logger.log(
      `Stripe webhook received: ${event.type} for org ${orgId}`,
    );

    await this.routeEvent(event, orgId);

    return { received: true };
  }

  // ─── Event Router ─────────────────────────────────────────────────────────

  private async routeEvent(event: WebhookEvent, orgId: string): Promise<void> {
    const eventType = event.type;

    try {
      switch (eventType) {
        // Razorpay events
        case 'payment.captured':
          await this.handlePaymentCaptured(event, orgId);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event, orgId);
          break;
        case 'subscription.activated':
          await this.handleSubscriptionActivated(event, orgId);
          break;
        case 'subscription.halted':
          await this.handleSubscriptionHalted(event, orgId);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(event, orgId);
          break;

        // Stripe events
        case 'payment_intent.succeeded':
          await this.handlePaymentCaptured(event, orgId);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event, orgId);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event, orgId);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event, orgId);
          break;
        case 'charge.refunded':
          await this.handleRefundProcessed(event, orgId);
          break;

        default:
          this.logger.debug(`Unhandled webhook event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook event ${eventType}: ${error}`,
        (error as Error).stack,
      );
      // Do not rethrow: webhook endpoints should return 200 to prevent retries
      // on events we partially processed. The error is already logged.
    }
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  private async handlePaymentCaptured(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const data = event.data as Record<string, any>;
    const providerPaymentId = this.extractPaymentId(event);

    if (!providerPaymentId) {
      this.logger.warn('payment.captured event missing payment ID');
      return;
    }

    // Check if a payment record already exists (e.g. from manual verify flow)
    const existing = await this.prisma.payment.findFirst({
      where: { orgId, providerPaymentId },
    });

    if (existing) {
      this.logger.debug(
        `Payment ${providerPaymentId} already recorded, skipping`,
      );
      return;
    }

    // Find the associated order by provider order ID
    const providerOrderId = this.extractOrderId(event);
    let orderId: string | undefined;
    let endUserId: string | undefined;
    let userId: string | undefined;

    if (providerOrderId) {
      const order = await this.prisma.order.findFirst({
        where: { orgId, providerOrderId },
      });
      if (order) {
        orderId = order.id;
        endUserId = order.endUserId ?? undefined;
        userId = order.userId ?? undefined;
      }
    }

    const amount = this.extractAmount(event);
    const currency = this.extractCurrency(event);
    const method = data['method'] ?? data['payment_method_types']?.[0];

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orgId,
          orderId: orderId ?? null,
          endUserId: endUserId ?? null,
          userId: userId ?? null,
          provider: event.provider,
          providerPaymentId,
          ...(currency === 'INR'
            ? { amountInr: amount, currency: 'INR' }
            : { amountUsd: amount, currency: 'USD' }),
          method: method as any,
          status: 'captured',
          capturedAt: new Date(),
        },
      });

      if (orderId) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'paid', paymentId: payment.id },
        });
      }
    });

    this.logger.log(`Webhook: payment captured ${providerPaymentId}`);
  }

  private async handlePaymentFailed(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const providerOrderId = this.extractOrderId(event);

    if (providerOrderId) {
      await this.prisma.order.updateMany({
        where: { orgId, providerOrderId },
        data: { status: 'failed' },
      });
      this.logger.log(
        `Webhook: payment failed for order ${providerOrderId}`,
      );
    }
  }

  private async handleSubscriptionActivated(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const providerSubId = this.extractSubscriptionId(event);
    if (!providerSubId) return;

    await this.prisma.subscription.updateMany({
      where: { orgId, providerSubscriptionId: providerSubId },
      data: { status: 'active' },
    });

    this.logger.log(`Webhook: subscription activated ${providerSubId}`);
  }

  private async handleSubscriptionHalted(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const providerSubId = this.extractSubscriptionId(event);
    if (!providerSubId) return;

    await this.prisma.subscription.updateMany({
      where: { orgId, providerSubscriptionId: providerSubId },
      data: { status: 'halted' },
    });

    this.logger.log(`Webhook: subscription halted ${providerSubId}`);
  }

  private async handleSubscriptionUpdated(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const data = event.data as Record<string, any>;
    const providerSubId = data['id'] ?? data['subscription']?.id;
    if (!providerSubId) return;

    const status = data['status'] ?? data['subscription']?.status;
    const mappedStatus = this.mapStripeSubscriptionStatus(status);

    await this.prisma.subscription.updateMany({
      where: { orgId, providerSubscriptionId: String(providerSubId) },
      data: {
        status: mappedStatus,
        currentPeriodStart: data['current_period_start']
          ? new Date(data['current_period_start'] * 1000)
          : null,
        currentPeriodEnd: data['current_period_end']
          ? new Date(data['current_period_end'] * 1000)
          : null,
      },
    });

    this.logger.log(
      `Webhook: subscription updated ${providerSubId} -> ${mappedStatus}`,
    );
  }

  private async handleSubscriptionCancelled(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const data = event.data as Record<string, any>;
    const providerSubId = data['id'] ?? data['subscription']?.id;
    if (!providerSubId) return;

    await this.prisma.subscription.updateMany({
      where: { orgId, providerSubscriptionId: String(providerSubId) },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    this.logger.log(`Webhook: subscription cancelled ${providerSubId}`);
  }

  private async handleRefundProcessed(
    event: WebhookEvent,
    orgId: string,
  ): Promise<void> {
    const data = event.data as Record<string, any>;

    let providerRefundId: string | undefined;
    let providerPaymentId: string | undefined;

    if (event.provider === 'razorpay') {
      const refundEntity = data['refund']?.entity ?? data;
      providerRefundId = refundEntity.id;
      providerPaymentId = refundEntity.payment_id;
    } else {
      providerRefundId = data['id'];
      providerPaymentId = data['payment_intent'];
    }

    if (providerRefundId) {
      await this.prisma.refund.updateMany({
        where: { orgId, providerRefundId },
        data: { status: 'processed', processedAt: new Date() },
      });

      this.logger.log(`Webhook: refund processed ${providerRefundId}`);
    }

    // Also update payment status if fully refunded
    if (providerPaymentId) {
      const payment = await this.prisma.payment.findFirst({
        where: { orgId, providerPaymentId },
        include: { refunds: true },
      });

      if (payment) {
        const totalRefunded = payment.refunds.reduce((sum, r) => {
          return (
            sum +
            Number(
              payment.currency === 'INR' ? r.amountInr : r.amountUsd,
            )
          );
        }, 0);

        const paymentAmount = Number(
          payment.currency === 'INR'
            ? payment.amountInr
            : payment.amountUsd,
        );

        const isFullyRefunded = totalRefunded >= paymentAmount;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: isFullyRefunded ? 'refunded' : 'partially_refunded',
            ...(payment.currency === 'INR'
              ? { refundedAmountInr: totalRefunded }
              : { refundedAmountUsd: totalRefunded }),
          },
        });
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getWebhookSecret(
    orgId: string,
    provider: 'razorpay' | 'stripe',
  ): Promise<string> {
    const config = await this.configResolver.getPaymentConfig(orgId);

    if (provider === 'razorpay' && config.razorpay?.webhookSecret) {
      return config.razorpay.webhookSecret;
    }
    if (provider === 'stripe' && config.stripe?.webhookSecret) {
      return config.stripe.webhookSecret;
    }

    throw new BadRequestException(
      `Webhook secret not configured for ${provider}`,
    );
  }

  private extractPaymentId(event: WebhookEvent): string | undefined {
    const data = event.data as Record<string, any>;

    if (event.provider === 'razorpay') {
      return data['payment']?.entity?.id;
    }
    // Stripe payment_intent.succeeded
    return data['id'];
  }

  private extractOrderId(event: WebhookEvent): string | undefined {
    const data = event.data as Record<string, any>;

    if (event.provider === 'razorpay') {
      return data['payment']?.entity?.order_id;
    }
    // Stripe does not use order IDs natively
    return data['metadata']?.orderId;
  }

  private extractSubscriptionId(event: WebhookEvent): string | undefined {
    const data = event.data as Record<string, any>;

    if (event.provider === 'razorpay') {
      return data['subscription']?.entity?.id;
    }
    return data['id'];
  }

  private extractAmount(event: WebhookEvent): number {
    const data = event.data as Record<string, any>;

    if (event.provider === 'razorpay') {
      return (data['payment']?.entity?.amount ?? 0) / 100;
    }
    return (data['amount_received'] ?? data['amount'] ?? 0) / 100;
  }

  private extractCurrency(event: WebhookEvent): string {
    const data = event.data as Record<string, any>;

    if (event.provider === 'razorpay') {
      return (
        data['payment']?.entity?.currency?.toUpperCase() ?? 'INR'
      );
    }
    return data['currency']?.toUpperCase() ?? 'USD';
  }

  private mapStripeSubscriptionStatus(
    stripeStatus: string,
  ): 'created' | 'active' | 'paused' | 'cancelled' | 'expired' | 'halted' {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'past_due':
        return 'halted';
      case 'canceled':
        return 'cancelled';
      case 'unpaid':
        return 'halted';
      case 'incomplete':
      case 'incomplete_expired':
        return 'expired';
      case 'trialing':
        return 'active';
      case 'paused':
        return 'paused';
      default:
        return 'created';
    }
  }
}
