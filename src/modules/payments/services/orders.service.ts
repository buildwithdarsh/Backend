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
import { CreateOrderDto } from '../dto/create-order.dto.js';
import { VerifyPaymentDto } from '../dto/verify-payment.dto.js';
import { QueryOrdersDto } from '../dto/query-payments.dto.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly productsService: ProductsService,
  ) {}

  async create(orgId: string, dto: CreateOrderDto, userId?: string) {
    const provider = await this.providerFactory.getProvider(orgId);

    // Determine amount: use provided amount or fall back to product price
    let amount = dto.amount;
    let product: any = null;

    if (amount == null) {
      // Need product lookup to determine price
      product = await this.productsService.findOne(orgId, dto.productId);
      if (dto.currency === 'INR' && product.priceInr) {
        amount = Number(product.priceInr);
      } else if (dto.currency === 'USD' && product.priceUsd) {
        amount = Number(product.priceUsd);
      } else {
        throw new BadRequestException(
          `No price configured for product in ${dto.currency}. Provide an explicit amount.`,
        );
      }
    }

    // Create order with the payment provider
    const providerOrder = await provider.createOrder({
      amount,
      currency: dto.currency,
      receipt: `order_${Date.now()}`,
    });

    // Persist in DB — productId is optional (subscriptions use metadata instead)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.productId);
    const order = await this.prisma.order.create({
      data: {
        orgId,
        ...(isUuid ? { productId: dto.productId } : {}),
        endUserId: dto.endUserId ?? null,
        userId: userId ?? null,
        provider: provider.providerName,
        providerOrderId: providerOrder.id,
        ...(dto.currency === 'INR'
          ? { amountInr: amount, currency: 'INR' }
          : { amountUsd: amount, currency: 'USD' }),
        status: 'created',
        metadata: { ...(dto.metadata ?? {}), productId: dto.productId } as any,
      },
      ...(isUuid ? { include: { product: true } } : {}),
    });

    this.logger.log(
      `Order created: ${order.id} (provider: ${providerOrder.id})`,
    );

    return {
      ...order,
      providerOrderId: providerOrder.id,
      providerData: providerOrder,
    };
  }

  async verify(orgId: string, orderId: string, dto: VerifyPaymentDto) {
    const order = await this.findOne(orgId, orderId);
    const provider = await this.providerFactory.getProvider(orgId);

    if (!order.providerOrderId) {
      throw new BadRequestException('Order has no associated provider order');
    }

    // Determine verification inputs based on provider
    let paymentId: string;
    let signature: string;

    if (provider.providerName === 'razorpay') {
      if (!dto.razorpayPaymentId || !dto.razorpaySignature) {
        throw new BadRequestException(
          'razorpayPaymentId and razorpaySignature are required for Razorpay verification',
        );
      }
      paymentId = dto.razorpayPaymentId;
      signature = dto.razorpaySignature;
    } else {
      if (!dto.stripePaymentIntentId) {
        throw new BadRequestException(
          'stripePaymentIntentId is required for Stripe verification',
        );
      }
      paymentId = dto.stripePaymentIntentId;
      signature = ''; // Stripe verifies via API call
    }

    const verified = await provider.verifyPayment({
      orderId: order.providerOrderId,
      paymentId,
      signature,
    });

    if (!verified) {
      // Mark order as failed
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed' },
      });

      throw new BadRequestException('Payment verification failed');
    }

    // Capture the payment
    const amount =
      order.currency === 'INR'
        ? Number(order.amountInr)
        : Number(order.amountUsd);

    const captured = await provider.capturePayment({
      paymentId,
      amount,
      currency: order.currency,
    });

    // Create payment record and update order in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orgId,
          orderId,
          endUserId: order.endUserId,
          userId: order.userId,
          provider: provider.providerName,
          providerPaymentId: captured.id,
          providerSignature:
            provider.providerName === 'razorpay' ? signature : null,
          ...(order.currency === 'INR'
            ? { amountInr: captured.amount, currency: 'INR' }
            : { amountUsd: captured.amount, currency: 'USD' }),
          method: captured.method as any,
          status: 'captured',
          capturedAt: captured.capturedAt ?? new Date(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paymentId: payment.id,
        },
        include: { product: true },
      });

      return { order: updatedOrder, payment };
    });

    this.logger.log(
      `Order ${orderId} verified and payment ${result.payment.id} captured`,
    );

    return result;
  }

  async findAll(orgId: string, dto: QueryOrdersDto) {
    const where: Prisma.OrderWhereInput = {
      orgId,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { providerOrderId: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { product: true, payment: true },
      }),
      this.prisma.order.count({ where }),
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
    const order = await this.prisma.order.findFirst({
      where: { id, orgId },
      include: {
        product: true,
        payment: true,
        endUser: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }
}
