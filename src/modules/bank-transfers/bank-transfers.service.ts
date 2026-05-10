import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type TransferMode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BankTransfersService {
  private readonly logger = new Logger(BankTransfersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Fund Transfers ─────────────────────────────────────────────────

  async initiateTransfer(
    orgId: string,
    endUserId: string,
    data: {
      senderAccountId: string;
      beneficiaryAccount: string;
      beneficiaryIfsc: string;
      beneficiaryName: string;
      amount: number;
      mode: TransferMode;
      description?: string;
      upiId?: string;
    },
  ) {
    const senderAccount = await this.prisma.bankAccount.findFirst({
      where: { id: data.senderAccountId, orgId, endUserId, deletedAt: null },
    });

    if (!senderAccount) throw new NotFoundException('Sender account not found');

    if (Number(senderAccount.balance) < data.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    this.validateTransferLimits(data.mode, data.amount);

    const referenceNumber = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return this.prisma.$transaction(
      async (tx) => {
        const updatedSender = await tx.bankAccount.update({
          where: { id: senderAccount.id },
          data: { balance: { decrement: data.amount } },
        });

        const transaction = await tx.bankTransaction.create({
          data: {
            orgId,
            accountId: senderAccount.id,
            endUserId,
            type: 'debit',
            mode: data.mode,
            amount: data.amount,
            balanceAfter: updatedSender.balance,
            description: data.description ?? `Transfer to ${data.beneficiaryName}`,
            referenceNumber,
            counterpartyName: data.beneficiaryName,
            counterpartyAccount: data.beneficiaryAccount,
            counterpartyIfsc: data.beneficiaryIfsc,
            status: 'completed',
            category: 'transfer',
          },
        });

        this.logger.log(
          `Transfer completed: org=${orgId} user=${endUserId} amount=${data.amount} mode=${data.mode} ref=${referenceNumber}`,
        );

        return transaction;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // ─── Beneficiaries ──────────────────────────────────────────────────

  async addBeneficiary(
    orgId: string,
    endUserId: string,
    data: {
      name: string;
      accountNumber: string;
      ifscCode: string;
      bankName?: string;
      upiId?: string;
      nickname?: string;
      transferLimit?: number;
    },
  ) {
    return this.prisma.beneficiary.create({
      data: {
        orgId,
        endUserId,
        name: data.name,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName ?? null,
        upiId: data.upiId ?? null,
        nickname: data.nickname ?? null,
        transferLimit: data.transferLimit
          ? new Prisma.Decimal(data.transferLimit)
          : null,
      },
    });
  }

  async listBeneficiaries(orgId: string, endUserId: string) {
    return this.prisma.beneficiary.findMany({
      where: { orgId, endUserId, deletedAt: null },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });
  }

  async deleteBeneficiary(orgId: string, endUserId: string, id: string) {
    const bene = await this.prisma.beneficiary.findFirst({
      where: { id, orgId, endUserId, deletedAt: null },
    });
    if (!bene) throw new NotFoundException('Beneficiary not found');

    return this.prisma.beneficiary.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleFavorite(orgId: string, endUserId: string, id: string) {
    const bene = await this.prisma.beneficiary.findFirst({
      where: { id, orgId, endUserId, deletedAt: null },
    });
    if (!bene) throw new NotFoundException('Beneficiary not found');

    return this.prisma.beneficiary.update({
      where: { id },
      data: { isFavorite: !bene.isFavorite },
    });
  }

  // ─── Scheduled Transfers ────────────────────────────────────────────

  async createScheduledTransfer(
    orgId: string,
    endUserId: string,
    data: {
      senderAccountId: string;
      beneficiaryName: string;
      beneficiaryAccount: string;
      beneficiaryIfsc: string;
      amount: number;
      mode: TransferMode;
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      description?: string;
      nextExecutionAt: string;
      endsAt?: string;
    },
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: data.senderAccountId, orgId, endUserId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Sender account not found');

    return this.prisma.scheduledTransfer.create({
      data: {
        orgId,
        endUserId,
        senderAccountId: data.senderAccountId,
        beneficiaryName: data.beneficiaryName,
        beneficiaryAccount: data.beneficiaryAccount,
        beneficiaryIfsc: data.beneficiaryIfsc,
        amount: data.amount,
        mode: data.mode,
        frequency: data.frequency,
        description: data.description ?? null,
        nextExecutionAt: new Date(data.nextExecutionAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
  }

  async listScheduledTransfers(orgId: string, endUserId: string) {
    return this.prisma.scheduledTransfer.findMany({
      where: { orgId, endUserId, status: { in: ['active', 'paused'] } },
      orderBy: { nextExecutionAt: 'asc' },
    });
  }

  async cancelScheduledTransfer(orgId: string, endUserId: string, id: string) {
    const st = await this.prisma.scheduledTransfer.findFirst({
      where: { id, orgId, endUserId, status: { in: ['active', 'paused'] } },
    });
    if (!st) throw new NotFoundException('Scheduled transfer not found');

    return this.prisma.scheduledTransfer.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  // ─── Bill Payments ──────────────────────────────────────────────────

  async payBill(
    orgId: string,
    endUserId: string,
    data: {
      accountId: string;
      billerCategory: string;
      billerName: string;
      billerId?: string;
      consumerNumber: string;
      amount: number;
    },
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: data.accountId, orgId, endUserId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Account not found');

    if (Number(account.balance) < data.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const referenceNumber = `BILL${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.$transaction(
      async (tx) => {
        const updatedAccount = await tx.bankAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: data.amount } },
        });

        await tx.bankTransaction.create({
          data: {
            orgId,
            accountId: account.id,
            endUserId,
            type: 'debit',
            amount: data.amount,
            balanceAfter: updatedAccount.balance,
            description: `Bill payment: ${data.billerName} - ${data.consumerNumber}`,
            referenceNumber,
            counterpartyName: data.billerName,
            status: 'completed',
            category: data.billerCategory,
          },
        });

        return tx.billPayment.create({
          data: {
            orgId,
            endUserId,
            accountId: account.id,
            billerCategory: data.billerCategory,
            billerName: data.billerName,
            billerId: data.billerId ?? null,
            consumerNumber: data.consumerNumber,
            amount: data.amount,
            status: 'paid',
            referenceNumber,
            paidAt: new Date(),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listBillPayments(
    orgId: string,
    endUserId: string,
    page: number,
    limit: number,
    category?: string,
  ) {
    const where = {
      orgId,
      endUserId,
      ...(category ? { billerCategory: category } : {}),
    };
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.billPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.billPayment.count({ where }),
    ]);

    return {
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private validateTransferLimits(mode: TransferMode, amount: number) {
    const limits: Record<string, number> = {
      neft: 10_00_000,
      rtgs: 50_00_000,
      imps: 5_00_000,
      upi: 1_00_000,
      swift: 25_00_000,
      internal: 50_00_000,
    };

    const maxAmount = limits[mode];
    if (maxAmount && amount > maxAmount) {
      throw new BadRequestException(
        `Maximum transfer limit for ${mode.toUpperCase()} is ₹${(maxAmount / 100).toLocaleString()}`,
      );
    }
  }
}
