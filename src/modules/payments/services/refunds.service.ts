import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { CreateRefundDto } from '../dto/create-refund.dto.js';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  async create(
    orgId: string,
    paymentId: string,
    dto: CreateRefundDto,
    userId?: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, orgId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'refunded') {
      throw new BadRequestException('Payment has already been fully refunded');
    }

    if (!payment.providerPaymentId) {
      throw new BadRequestException(
        'Payment has no associated provider payment ID',
      );
    }

    // Determine the refund amount
    const paymentAmount =
      payment.currency === 'INR'
        ? Number(payment.amountInr)
        : Number(payment.amountUsd);

    const alreadyRefunded =
      payment.currency === 'INR'
        ? Number(payment.refundedAmountInr ?? 0)
        : Number(payment.refundedAmountUsd ?? 0);

    const refundAmount = dto.amount ?? paymentAmount - alreadyRefunded;

    if (refundAmount <= 0) {
      throw new BadRequestException(
        'Refund amount must be greater than zero',
      );
    }

    if (refundAmount > paymentAmount - alreadyRefunded) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) exceeds remaining refundable amount (${paymentAmount - alreadyRefunded})`,
      );
    }

    const provider = await this.providerFactory.getProvider(orgId);

    const providerRefund = await provider.createRefund({
      paymentId: payment.providerPaymentId,
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.reason !== undefined && { reason: dto.reason }),
    });

    // Persist refund and update payment in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          orgId,
          paymentId,
          provider: payment.provider,
          providerRefundId: providerRefund.id,
          ...(payment.currency === 'INR'
            ? { amountInr: refundAmount, currency: 'INR' }
            : { amountUsd: refundAmount, currency: 'USD' }),
          reason: dto.reason ?? null,
          status: 'processed',
          initiatedBy: userId ?? null,
          processedAt: new Date(),
        },
      });

      const newRefundedTotal = alreadyRefunded + refundAmount;
      const isFullyRefunded = newRefundedTotal >= paymentAmount;

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(payment.currency === 'INR'
            ? { refundedAmountInr: newRefundedTotal }
            : { refundedAmountUsd: newRefundedTotal }),
          status: isFullyRefunded ? 'refunded' : 'partially_refunded',
        },
      });

      return refund;
    });

    this.logger.log(
      `Refund created: ${result.id} for payment ${paymentId} (amount: ${refundAmount})`,
    );

    return result;
  }

  async findByPayment(orgId: string, paymentId: string) {
    // Verify the payment exists and belongs to the org
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, orgId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    const refunds = await this.prisma.refund.findMany({
      where: { paymentId, orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return refunds;
  }
}
