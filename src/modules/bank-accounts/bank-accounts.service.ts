import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, endUserId: string) {
    return this.prisma.bankAccount.findMany({
      where: { orgId, endUserId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getById(orgId: string, endUserId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id, orgId, endUserId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateNickname(
    orgId: string,
    endUserId: string,
    id: string,
    nickname: string,
  ) {
    const account = await this.getById(orgId, endUserId, id);
    return this.prisma.bankAccount.update({
      where: { id: account.id },
      data: { nickname },
    });
  }

  async setAutoSweep(
    orgId: string,
    endUserId: string,
    id: string,
    enabled: boolean,
    threshold?: number,
  ) {
    const account = await this.getById(orgId, endUserId, id);

    if (account.accountType !== 'current') {
      throw new BadRequestException('Auto-sweep is only available for current accounts');
    }

    return this.prisma.bankAccount.update({
      where: { id: account.id },
      data: {
        autoSweepEnabled: enabled,
        autoSweepThreshold: enabled && threshold ? new Prisma.Decimal(threshold) : null,
      },
    });
  }

  async getStatement(
    orgId: string,
    endUserId: string,
    accountId: string,
    page: number,
    limit: number,
    startDate?: string,
    endDate?: string,
  ) {
    await this.getById(orgId, endUserId, accountId);

    const where: Prisma.BankTransactionWhereInput = {
      orgId,
      accountId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.bankTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bankTransaction.count({ where }),
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

  async getBalance(orgId: string, endUserId: string, accountId: string) {
    const account = await this.getById(orgId, endUserId, accountId);
    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
      accountType: account.accountType,
    };
  }

  // ─── Fixed Deposits ─────────────────────────────────────────────────

  async createFixedDeposit(
    orgId: string,
    endUserId: string,
    data: {
      accountId: string;
      principalAmount: number;
      tenureDays: number;
      autoRenew?: boolean;
    },
  ) {
    const account = await this.getById(orgId, endUserId, data.accountId);

    if (Number(account.balance) < data.principalAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    const interestRate = this.calculateFdRate(data.tenureDays);
    const maturityAmount =
      data.principalAmount *
      (1 + (interestRate / 100) * (data.tenureDays / 365));
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + data.tenureDays);

    const fdNumber = `FD${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.$transaction(
      async (tx) => {
        await tx.bankAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: data.principalAmount } },
        });

        const updatedAccount = await tx.bankAccount.findUniqueOrThrow({
          where: { id: account.id },
        });

        await tx.bankTransaction.create({
          data: {
            orgId,
            accountId: account.id,
            endUserId,
            type: 'debit',
            amount: data.principalAmount,
            balanceAfter: updatedAccount.balance,
            description: `Fixed Deposit created: ${fdNumber}`,
            referenceNumber: fdNumber,
            category: 'fixed_deposit',
          },
        });

        return tx.fixedDeposit.create({
          data: {
            orgId,
            endUserId,
            accountId: account.id,
            fdNumber,
            principalAmount: data.principalAmount,
            interestRate,
            tenureDays: data.tenureDays,
            maturityAmount,
            maturityDate,
            autoRenew: data.autoRenew ?? false,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listFixedDeposits(orgId: string, endUserId: string) {
    return this.prisma.fixedDeposit.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async closeFixedDeposit(orgId: string, endUserId: string, fdId: string) {
    const fd = await this.prisma.fixedDeposit.findFirst({
      where: { id: fdId, orgId, endUserId, status: 'active' },
    });

    if (!fd) throw new NotFoundException('Fixed deposit not found or not active');

    const now = new Date();
    const daysHeld = Math.floor(
      (now.getTime() - fd.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prematureRate = Math.max(Number(fd.interestRate) - 1, 0);
    const payoutAmount =
      Number(fd.principalAmount) *
      (1 + (prematureRate / 100) * (daysHeld / 365));

    return this.prisma.$transaction(
      async (tx) => {
        await tx.fixedDeposit.update({
          where: { id: fdId },
          data: { status: 'closed_premature', closedAt: now },
        });

        await tx.bankAccount.update({
          where: { id: fd.accountId },
          data: { balance: { increment: payoutAmount } },
        });

        const updatedAccount = await tx.bankAccount.findUniqueOrThrow({
          where: { id: fd.accountId },
        });

        await tx.bankTransaction.create({
          data: {
            orgId,
            accountId: fd.accountId,
            endUserId,
            type: 'credit',
            amount: payoutAmount,
            balanceAfter: updatedAccount.balance,
            description: `FD premature closure: ${fd.fdNumber}`,
            referenceNumber: fd.fdNumber,
            category: 'fixed_deposit',
          },
        });

        return { payoutAmount, daysHeld, prematureRate };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private calculateFdRate(tenureDays: number): number {
    if (tenureDays <= 90) return 4.5;
    if (tenureDays <= 180) return 5.5;
    if (tenureDays <= 365) return 6.5;
    if (tenureDays <= 730) return 7.0;
    return 7.25;
  }
}
