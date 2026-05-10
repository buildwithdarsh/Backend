import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BankCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, endUserId: string) {
    return this.prisma.bankCard.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(orgId: string, endUserId: string, id: string) {
    const card = await this.prisma.bankCard.findFirst({
      where: { id, orgId, endUserId },
    });
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async generateVirtualCard(
    orgId: string,
    endUserId: string,
    data: {
      cardType: 'debit' | 'credit';
      accountId?: string;
      nameOnCard: string;
      cardNetwork?: string;
    },
  ) {
    const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();

    return this.prisma.bankCard.create({
      data: {
        orgId,
        endUserId,
        accountId: data.accountId ?? null,
        cardType: data.cardType,
        variant: 'virtual',
        lastFourDigits: lastFour,
        cardNetwork: data.cardNetwork ?? 'rupay',
        expiryMonth: now.getMonth() + 1,
        expiryYear: now.getFullYear() + 5,
        nameOnCard: data.nameOnCard,
      },
    });
  }

  async blockCard(orgId: string, endUserId: string, id: string) {
    const card = await this.getById(orgId, endUserId, id);
    if (card.status === 'blocked') {
      throw new BadRequestException('Card is already blocked');
    }
    return this.prisma.bankCard.update({
      where: { id },
      data: { status: 'blocked' },
    });
  }

  async unblockCard(orgId: string, endUserId: string, id: string) {
    const card = await this.getById(orgId, endUserId, id);
    if (card.status !== 'blocked') {
      throw new BadRequestException('Card is not blocked');
    }
    return this.prisma.bankCard.update({
      where: { id },
      data: { status: 'active' },
    });
  }

  async updateLimits(
    orgId: string,
    endUserId: string,
    id: string,
    data: {
      dailyLimit?: number;
      atmWithdrawalLimit?: number;
    },
  ) {
    await this.getById(orgId, endUserId, id);
    return this.prisma.bankCard.update({
      where: { id },
      data: {
        ...(data.dailyLimit !== undefined ? { dailyLimit: data.dailyLimit } : {}),
        ...(data.atmWithdrawalLimit !== undefined ? { atmWithdrawalLimit: data.atmWithdrawalLimit } : {}),
      },
    });
  }

  async toggleInternational(
    orgId: string,
    endUserId: string,
    id: string,
    enabled: boolean,
    from?: string,
    until?: string,
  ) {
    await this.getById(orgId, endUserId, id);
    return this.prisma.bankCard.update({
      where: { id },
      data: {
        internationalEnabled: enabled,
        internationalFrom: enabled && from ? new Date(from) : null,
        internationalUntil: enabled && until ? new Date(until) : null,
      },
    });
  }

  async toggleContactless(
    orgId: string,
    endUserId: string,
    id: string,
    enabled: boolean,
  ) {
    await this.getById(orgId, endUserId, id);
    return this.prisma.bankCard.update({
      where: { id },
      data: { contactlessEnabled: enabled },
    });
  }

  async toggleOnline(
    orgId: string,
    endUserId: string,
    id: string,
    enabled: boolean,
  ) {
    await this.getById(orgId, endUserId, id);
    return this.prisma.bankCard.update({
      where: { id },
      data: { onlineEnabled: enabled },
    });
  }
}
