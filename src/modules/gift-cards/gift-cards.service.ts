import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import {
  CreateGiftCardDto,
  PurchaseGiftCardDto,
  QueryGiftCardsDto,
} from './dto/index.js';

@Injectable()
export class GiftCardsService {
  private readonly logger = new Logger(GiftCardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure gift cards feature is enabled for this org.
   */
  private async ensureGiftCardsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'gift_cards_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Gift cards are disabled for this store');
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a gift card (admin).
   */
  async create(orgId: string, dto: CreateGiftCardDto) {
    const giftCard = await this.prisma.giftCard.create({
      data: {
        orgId,
        code: dto.code.toUpperCase(),
        initialBalance: dto.initialBalance,
        currentBalance: dto.initialBalance,
        recipientName: dto.recipientName ?? null,
        recipientEmail: dto.recipientEmail ?? null,
        recipientPhone: dto.recipientPhone ?? null,
        message: dto.message ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.logger.log(`Gift card created: ${giftCard.id} (${giftCard.code}) for org ${orgId}`);
    return giftCard;
  }

  /**
   * List gift cards with pagination.
   */
  async findAll(orgId: string, query: QueryGiftCardsDto) {
    const where: Prisma.GiftCardWhereInput = { orgId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { recipientName: { contains: query.search, mode: 'insensitive' } },
        { recipientEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.giftCard.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.giftCard.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single gift card with transactions.
   */
  async findOne(orgId: string, id: string) {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id, orgId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });

    if (!giftCard) {
      throw new NotFoundException(`Gift card ${id} not found`);
    }

    return giftCard;
  }

  // ─── Balance & Redemption ─────────────────────────────────────────────────

  /**
   * Check balance by code.
   */
  async checkBalance(orgId: string, code: string) {
    await this.ensureGiftCardsEnabled(orgId);

    const giftCard = await this.prisma.giftCard.findFirst({
      where: { orgId, code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    return {
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt,
    };
  }

  /**
   * Redeem a gift card.
   */
  async redeem(
    orgId: string,
    code: string,
    amount: number,
    endUserId: string,
    commerceOrderId?: string,
  ) {
    await this.ensureGiftCardsEnabled(orgId);

    const giftCard = await this.prisma.giftCard.findFirst({
      where: { orgId, code: code.toUpperCase(), status: 'active' },
    });

    if (!giftCard) {
      throw new BadRequestException('Gift card not found or not active');
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      throw new BadRequestException('Gift card has expired');
    }

    if (Number(giftCard.currentBalance) < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${giftCard.currentBalance}`,
      );
    }

    const newBalance = Number(giftCard.currentBalance) - amount;
    const newStatus = newBalance <= 0 ? 'exhausted' : 'active';

    const [updatedCard] = await this.prisma.$transaction([
      this.prisma.giftCard.update({
        where: { id: giftCard.id },
        data: {
          currentBalance: newBalance,
          status: newStatus,
        },
      }),
      this.prisma.giftCardTransaction.create({
        data: {
          orgId,
          giftCardId: giftCard.id,
          type: 'redeem',
          amount,
          endUserId,
          commerceOrderId: commerceOrderId ?? null,
        },
      }),
    ]);

    this.logger.log(
      `Gift card ${giftCard.code} redeemed for ${amount} by user ${endUserId}`,
    );

    return {
      currentBalance: updatedCard.currentBalance,
      status: updatedCard.status,
      amountRedeemed: amount,
    };
  }

  /**
   * Purchase a new gift card (storefront).
   */
  async purchase(orgId: string, endUserId: string, dto: PurchaseGiftCardDto) {
    await this.ensureGiftCardsEnabled(orgId);

    const code = this.generateCode();

    const giftCard = await this.prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.create({
        data: {
          orgId,
          code,
          initialBalance: dto.amount,
          currentBalance: dto.amount,
          purchasedById: endUserId,
          recipientName: dto.recipientName ?? null,
          recipientEmail: dto.recipientEmail ?? null,
          recipientPhone: dto.recipientPhone ?? null,
          message: dto.message ?? null,
        },
      });

      await tx.giftCardTransaction.create({
        data: {
          orgId,
          giftCardId: card.id,
          type: 'purchase',
          amount: dto.amount,
          endUserId,
        },
      });

      return card;
    });

    this.logger.log(`Gift card purchased: ${giftCard.id} (${code}) by user ${endUserId}`);
    return giftCard;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private generateCode(): string {
    return randomBytes(8).toString('hex').toUpperCase().slice(0, 12);
  }
}
