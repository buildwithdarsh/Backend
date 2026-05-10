import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { ProductsService } from './products.service.js';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto.js';
import { QuerySubscriptionsDto } from '../dto/query-payments.dto.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly productsService: ProductsService,
  ) {}

  async create(orgId: string, dto: CreateSubscriptionDto, userId?: string) {
    const product = await this.productsService.findOne(orgId, dto.productId);

    if (product.type !== 'subscription') {
      throw new BadRequestException(
        'Product must be of type "subscription" to create a subscription',
      );
    }

    const provider = await this.providerFactory.getProvider(orgId);

    // Resolve the provider-specific plan ID
    let planId: string | null = null;
    if (provider.providerName === 'razorpay') {
      planId = product.razorpayPlanId;
    } else if (provider.providerName === 'stripe') {
      planId = product.stripePriceId;
    }

    if (!planId) {
      throw new BadRequestException(
        `Product does not have a ${provider.providerName} plan/price ID configured`,
      );
    }

    // Ensure a payment customer exists
    let paymentCustomer: { id: string; providerCustomerId: string };

    if (dto.paymentCustomerId) {
      const existing = await this.prisma.paymentCustomer.findFirst({
        where: {
          id: dto.paymentCustomerId,
          orgId,
          provider: provider.providerName,
          deletedAt: null,
        },
      });
      if (!existing) {
        throw new NotFoundException(
          `PaymentCustomer ${dto.paymentCustomerId} not found`,
        );
      }
      paymentCustomer = {
        id: existing.id,
        providerCustomerId: existing.providerCustomerId,
      };
    } else {
      // Auto-create a payment customer
      const providerCustomer = await provider.createCustomer({
        metadata: {
          orgId,
          endUserId: dto.endUserId,
          userId,
        },
      });

      const created = await this.prisma.paymentCustomer.create({
        data: {
          orgId,
          endUserId: dto.endUserId ?? null,
          userId: userId ?? null,
          provider: provider.providerName,
          providerCustomerId: providerCustomer.id,
          email: providerCustomer.email ?? null,
          phone: providerCustomer.phone ?? null,
          name: providerCustomer.name ?? null,
        },
      });

      paymentCustomer = {
        id: created.id,
        providerCustomerId: created.providerCustomerId,
      };
    }

    // Create subscription with the provider
    const providerSub = await provider.createSubscription({
      planId,
      customerId: paymentCustomer.providerCustomerId,
      quantity: dto.quantity ?? 1,
    });

    // Persist in DB
    const subscription = await this.prisma.subscription.create({
      data: {
        orgId,
        endUserId: dto.endUserId ?? null,
        userId: userId ?? null,
        productId: dto.productId,
        paymentCustomerId: paymentCustomer.id,
        provider: provider.providerName,
        providerSubscriptionId: providerSub.id,
        status: 'created',
        currentPeriodStart: providerSub.currentPeriodStart ?? null,
        currentPeriodEnd: providerSub.currentPeriodEnd ?? null,
        quantity: dto.quantity ?? 1,
      },
      include: { product: true, paymentCustomer: true },
    });

    this.logger.log(
      `Subscription created: ${subscription.id} (provider: ${providerSub.id})`,
    );

    return subscription;
  }

  async findAll(orgId: string, dto: QuerySubscriptionsDto) {
    const where: Prisma.SubscriptionWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        {
          providerSubscriptionId: {
            contains: dto.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const orderBy: Prisma.SubscriptionOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { product: true, paymentCustomer: true },
      }),
      this.prisma.subscription.count({ where }),
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

  async findOne(orgId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        product: true,
        paymentCustomer: true,
        payments: true,
        endUser: true,
        user: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    return subscription;
  }

  async pause(orgId: string, id: string) {
    const subscription = await this.findOne(orgId, id);

    if (subscription.status !== 'active') {
      throw new BadRequestException(
        'Only active subscriptions can be paused',
      );
    }

    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException(
        'Subscription has no associated provider subscription',
      );
    }

    const provider = await this.providerFactory.getProvider(orgId);
    await provider.pauseSubscription(subscription.providerSubscriptionId);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'paused' },
      include: { product: true },
    });

    this.logger.log(`Subscription paused: ${id}`);
    return updated;
  }

  async resume(orgId: string, id: string) {
    const subscription = await this.findOne(orgId, id);

    if (subscription.status !== 'paused') {
      throw new BadRequestException(
        'Only paused subscriptions can be resumed',
      );
    }

    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException(
        'Subscription has no associated provider subscription',
      );
    }

    const provider = await this.providerFactory.getProvider(orgId);
    await provider.resumeSubscription(subscription.providerSubscriptionId);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'active' },
      include: { product: true },
    });

    this.logger.log(`Subscription resumed: ${id}`);
    return updated;
  }

  async cancel(orgId: string, id: string) {
    const subscription = await this.findOne(orgId, id);

    if (
      subscription.status === 'cancelled' ||
      subscription.status === 'expired'
    ) {
      throw new BadRequestException(
        'Subscription is already cancelled or expired',
      );
    }

    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException(
        'Subscription has no associated provider subscription',
      );
    }

    const provider = await this.providerFactory.getProvider(orgId);
    await provider.cancelSubscription(subscription.providerSubscriptionId);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      include: { product: true },
    });

    this.logger.log(`Subscription cancelled: ${id}`);
    return updated;
  }
}
