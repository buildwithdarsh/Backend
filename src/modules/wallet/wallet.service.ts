import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get (or create) the wallet balance for an end user. Returns balancePaise.
   */
  async getBalance(orgId: string, endUserId: string): Promise<number> {
    const wallet = await this.prisma.walletBalance.upsert({
      where: { orgId_endUserId: { orgId, endUserId } },
      create: { orgId, endUserId, balancePaise: 0 },
      update: {},
    });
    return wallet.balancePaise;
  }

  /**
   * Atomically credit the wallet and write a transaction record.
   * Returns the new balance in paise.
   */
  async topUp(
    orgId: string,
    endUserId: string,
    amountPaise: number,
    description: string,
    razorpayPaymentId?: string,
  ): Promise<number> {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Ensure row exists
        await tx.walletBalance.upsert({
          where: { orgId_endUserId: { orgId, endUserId } },
          create: { orgId, endUserId, balancePaise: 0 },
          update: {},
        });

        // Increment balance
        const wallet = await tx.walletBalance.update({
          where: { orgId_endUserId: { orgId, endUserId } },
          data: { balancePaise: { increment: amountPaise } },
        });

        // Write ledger entry
        await tx.walletTransaction.create({
          data: {
            orgId,
            endUserId,
            type: 'topup',
            amountPaise,
            balanceAfterPaise: wallet.balancePaise,
            description,
            razorpayPaymentId: razorpayPaymentId ?? null,
          },
        });

        return wallet.balancePaise;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.logger.log(
      `Wallet topped up: org=${orgId} user=${endUserId} amount=${amountPaise} new_balance=${result}`,
    );

    return result;
  }

  /**
   * Atomically debit the wallet. Throws 402 if insufficient funds.
   * Returns the new balance in paise.
   */
  async debit(
    orgId: string,
    endUserId: string,
    amountPaise: number,
    description: string,
    sessionId?: string,
  ): Promise<number> {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Ensure row exists
        const wallet = await tx.walletBalance.upsert({
          where: { orgId_endUserId: { orgId, endUserId } },
          create: { orgId, endUserId, balancePaise: 0 },
          update: {},
        });

        if (wallet.balancePaise < amountPaise) {
          throw new HttpException(
            {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              message: 'Insufficient wallet balance',
              balancePaise: wallet.balancePaise,
              requiredPaise: amountPaise,
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        // Decrement balance
        const updated = await tx.walletBalance.update({
          where: { orgId_endUserId: { orgId, endUserId } },
          data: { balancePaise: { decrement: amountPaise } },
        });

        // Write ledger entry
        await tx.walletTransaction.create({
          data: {
            orgId,
            endUserId,
            type: 'debit',
            amountPaise: -amountPaise,
            balanceAfterPaise: updated.balancePaise,
            description,
            sessionId: sessionId ?? null,
          },
        });

        return updated.balancePaise;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.logger.log(
      `Wallet debited: org=${orgId} user=${endUserId} amount=${amountPaise} new_balance=${result}`,
    );

    return result;
  }

  /**
   * Paginated wallet transaction ledger.
   */
  async getTransactions(
    orgId: string,
    endUserId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { orgId, endUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({
        where: { orgId, endUserId },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
