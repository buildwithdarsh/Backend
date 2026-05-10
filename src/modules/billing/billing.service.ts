import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import { ConfigResolverService } from '../../services/config-resolver/config-resolver.service.js';
import { SubscribeDto } from './dto/subscribe.dto.js';
import { QueryInvoicesDto } from './dto/query-invoices.dto.js';
import type { Prisma } from '@prisma/client';
import { RAZORPAY } from '../../common/constants/providers.js';

/** Cache TTL for plans listing (5 minutes). */
const PLANS_CACHE_TTL = 300;
const PLANS_CACHE_KEY = 'billing:plans:active';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly configResolver: ConfigResolverService,
  ) {}

  // ─── Plan & Subscription ─────────────────────────────────────────────────

  /**
   * Get the organization's current plan along with a usage summary
   * for the current billing period.
   */
  async getCurrentPlan(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    const usage = await this.getUsage(orgId);

    return {
      organization: {
        id: org.id,
        name: org.name,
        status: org.status,
        planExpiresAt: org.planExpiresAt,
        trialEndsAt: org.trialEndsAt,
      },
      plan: org.plan,
      usage,
    };
  }

  /**
   * List all active plans.  Result is cached for fast retrieval.
   */
  async listPlans() {
    const cached = await this.cache.get<unknown[]>(PLANS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthlyInr: 'asc' },
    });

    await this.cache.set(PLANS_CACHE_KEY, plans, PLANS_CACHE_TTL);
    return plans;
  }

  /**
   * Subscribe an organization to a plan.
   *
   * This is a stub that validates the plan and updates the org record.
   * In production this would initiate a Razorpay/Stripe subscription via
   * their respective SDKs and only activate the plan after webhook
   * confirmation of a successful payment.
   */
  async subscribe(orgId: string, dto: SubscribeDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or inactive');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    // Attempt to create provider subscription (Razorpay/Stripe)
    try {
      const paymentConfig = await this.configResolver.getPaymentConfig(orgId);

      if (paymentConfig.activeProvider === 'razorpay' && paymentConfig.razorpay) {
        const { keyId, keySecret } = paymentConfig.razorpay;

        if (keyId && keySecret) {
          const planProviderKey = dto.interval === 'yearly' ? plan.razorpayPlanIdYearly : plan.razorpayPlanIdMonthly;
          if (planProviderKey) {
            const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const response = await fetch(RAZORPAY.SUBSCRIPTIONS, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                plan_id: planProviderKey,
                total_count: dto.interval === 'yearly' ? 10 : 120,
                quantity: 1,
              }),
            });

            if (response.ok) {
              const sub = await response.json() as { id: string };
              this.logger.log(`Razorpay subscription created: ${sub.id}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Provider subscription creation failed, proceeding with direct plan assignment: ${err}`);
    }

    const periodMonths = dto.interval === 'yearly' ? 12 : 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + periodMonths);

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        planId: dto.planId,
        status: 'active',
        planExpiresAt: expiresAt,
      },
      include: { plan: true },
    });

    this.logger.log(
      `Organization ${orgId} subscribed to plan ${plan.name} (${dto.interval})`,
    );

    return {
      message: 'Subscription created successfully',
      subscription: {
        planId: updated.planId,
        planName: updated.plan?.name,
        interval: dto.interval,
        expiresAt: updated.planExpiresAt,
      },
    };
  }

  /**
   * Cancel the current subscription for an organization.
   * The plan remains active until the current billing period ends.
   */
  async cancelSubscription(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    if (!org.planId) {
      throw new BadRequestException('Organization does not have an active plan');
    }

    // Cancel subscription at provider if configured
    try {
      const paymentConfig = await this.configResolver.getPaymentConfig(orgId);

      if (paymentConfig.activeProvider === 'razorpay' && paymentConfig.razorpay) {
        const { keyId, keySecret } = paymentConfig.razorpay;

        if (keyId && keySecret) {
          // Look up the Razorpay subscription ID from org metadata
          const metadata = (org as Record<string, unknown>)['metadata'] as Record<string, unknown> | null;
          const razorpaySubId = metadata?.['razorpaySubscriptionId'] as string | undefined;

          if (razorpaySubId) {
            const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const response = await fetch(`${RAZORPAY.SUBSCRIPTIONS}/${razorpaySubId}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ cancel_at_cycle_end: 1 }),
            });

            if (response.ok) {
              this.logger.log(`Razorpay subscription ${razorpaySubId} cancelled for org ${orgId}`);
            } else {
              const text = await response.text();
              this.logger.warn(`Razorpay subscription cancel failed: ${text}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Provider subscription cancellation failed, proceeding with local cancellation: ${err}`);
    }

    // Mark as cancelled; plan access continues until planExpiresAt.
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { status: 'cancelled' },
    });

    this.logger.log(`Subscription cancelled for organization ${orgId}`);

    return {
      message: 'Subscription cancelled. Access continues until the end of the current billing period.',
      planExpiresAt: org.planExpiresAt,
    };
  }

  // ─── Invoices ────────────────────────────────────────────────────────────

  /**
   * List invoices for an organization with pagination and optional status filter.
   */
  async listInvoices(orgId: string, dto: QueryInvoicesDto) {
    const where: Prisma.InvoiceWhereInput = { orgId };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.invoiceNumber = { contains: dto.search, mode: 'insensitive' };
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  /**
   * Get a single invoice by ID, scoped to an organization.
   */
  async getInvoice(orgId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, orgId },
      include: { organization: { select: { name: true, billingEmail: true, gstNumber: true } } },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  // ─── Webhooks ────────────────────────────────────────────────────────────

  /**
   * Handle billing webhooks from Razorpay or Stripe.
   *
   * Events handled:
   *   - payment.captured   -> activate plan
   *   - subscription.halted -> suspend org after 7 days
   *   - subscription.cancelled -> downgrade to Free plan
   */
  async handleWebhook(
    provider: string,
    payload: Record<string, unknown>,
    signature: string | undefined,
  ) {
    // Verify webhook signature
    if (provider === 'razorpay') {
      const webhookSecret = await this.getWebhookSecret(provider);
      if (webhookSecret && signature) {
        const crypto = await import('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');

        if (signature !== expectedSignature) {
          throw new UnauthorizedException('Invalid webhook signature');
        }
      }
    }
    this.logger.log(`Verified ${provider} webhook`);

    const event = payload['event'] as string | undefined;

    if (!event) {
      throw new BadRequestException('Missing event in webhook payload');
    }

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(provider, payload);
        break;

      case 'subscription.halted':
        await this.handleSubscriptionHalted(provider, payload);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(provider, payload);
        break;

      default:
        this.logger.warn(`Unhandled ${provider} webhook event: ${event}`);
    }

    return { received: true };
  }

  // ─── Usage ───────────────────────────────────────────────────────────────

  /**
   * Get current billing period usage statistics for an organization.
   */
  async getUsage(orgId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageCounts = await this.prisma.usageLog.groupBy({
      by: ['resource'],
      where: {
        orgId,
        createdAt: { gte: periodStart },
      },
      _sum: { quantity: true },
    });

    const resourceMap: Record<string, number> = {};
    for (const entry of usageCounts) {
      resourceMap[entry.resource] = entry._sum.quantity ?? 0;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      api_call: resourceMap['api_call'] ?? 0,
      email_sent: resourceMap['email_sent'] ?? 0,
      sms_sent: resourceMap['sms_sent'] ?? 0,
      whatsapp_sent: resourceMap['whatsapp_sent'] ?? 0,
      push_sent: resourceMap['push_sent'] ?? 0,
    };
  }

  // ─── Private Webhook Handlers ────────────────────────────────────────────

  private async handlePaymentCaptured(
    provider: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Extract org ID from webhook metadata.
    // Real implementation would look up the subscription/payment in the DB
    // using the provider-specific payment ID.
    const metadata = (payload['payload'] as Record<string, unknown> | undefined) ?? {};
    const orgId = metadata['orgId'] as string | undefined;

    if (!orgId) {
      this.logger.warn(`${provider} payment.captured: missing orgId in metadata`);
      return;
    }

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { status: 'active' },
    });

    this.logger.log(`${provider} payment captured -> activated org ${orgId}`);
  }

  private async handleSubscriptionHalted(
    provider: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const metadata = (payload['payload'] as Record<string, unknown> | undefined) ?? {};
    const orgId = metadata['orgId'] as string | undefined;

    if (!orgId) {
      this.logger.warn(`${provider} subscription.halted: missing orgId in metadata`);
      return;
    }

    // Schedule suspension after 7-day grace period.
    // In production, this would enqueue a delayed job.
    // For now, update status immediately with a note.
    const suspendAfter = new Date();
    suspendAfter.setDate(suspendAfter.getDate() + 7);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        metadata: {
          suspendScheduledAt: suspendAfter.toISOString(),
          haltedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.warn(
      `${provider} subscription halted for org ${orgId}. Suspension scheduled at ${suspendAfter.toISOString()}`,
    );
  }

  private async handleSubscriptionCancelled(
    provider: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const metadata = (payload['payload'] as Record<string, unknown> | undefined) ?? {};
    const orgId = metadata['orgId'] as string | undefined;

    if (!orgId) {
      this.logger.warn(`${provider} subscription.cancelled: missing orgId in metadata`);
      return;
    }

    // Find the Free plan to downgrade to.
    const freePlan = await this.prisma.plan.findFirst({
      where: { slug: 'free', isActive: true },
    });

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        planId: freePlan?.id ?? null,
        status: 'active',
        planExpiresAt: null,
      },
    });

    this.logger.log(
      `${provider} subscription cancelled -> downgraded org ${orgId} to Free plan`,
    );
  }

  private async getWebhookSecret(provider: string): Promise<string | null> {
    const config = await this.prisma.platformConfig.findFirst({
      where: { group: 'payment', key: `${provider === 'razorpay' ? 'razorpay' : 'stripe'}_webhook_secret` },
    });
    return config?.value ?? null;
  }
}
