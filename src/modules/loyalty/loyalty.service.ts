import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import {
  AdjustPointsDto,
  CreateRewardDto,
  UpdateRewardDto,
  QueryAccountsDto,
} from './dto/index.js';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure loyalty feature is enabled for this org.
   */
  private async ensureLoyaltyEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'loyalty', 'enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Loyalty program is disabled for this store');
    }
  }

  // ─── Accounts ──────────────────────────────────────────────────────────────

  /**
   * Get or create a loyalty account for an end user.
   */
  async getAccount(orgId: string, endUserId: string) {
    await this.ensureLoyaltyEnabled(orgId);

    let account = await this.prisma.loyaltyAccount.findUnique({
      where: { orgId_endUserId: { orgId, endUserId } },
      include: { endUser: { select: { id: true, name: true, email: true, phone: true } } },
    });

    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { orgId, endUserId },
        include: { endUser: { select: { id: true, name: true, email: true, phone: true } } },
      });
      this.logger.log(`Loyalty account created for endUser ${endUserId} in org ${orgId}`);
    }

    return account;
  }

  /**
   * Earn points — adds points and creates a transaction record.
   */
  async earnPoints(
    orgId: string,
    endUserId: string,
    points: number,
    description: string,
    commerceOrderId?: string,
  ) {
    if (points <= 0) {
      throw new BadRequestException('Points to earn must be positive');
    }

    const account = await this.getAccount(orgId, endUserId);

    // Load expiry config to store expiry date on the transaction
    const expiryDays = await this.orgSettings.getTyped<number>(
      orgId, 'loyalty', 'expiry_days', 0,
    );

    const expiresAt = expiryDays > 0
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : null;

    const [updatedAccount, transaction] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: points },
          totalEarned: { increment: points },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          orgId,
          accountId: account.id,
          type: 'earn',
          points,
          description,
          commerceOrderId: commerceOrderId ?? null,
          metadata: expiresAt
            ? ({ expiresAt: expiresAt.toISOString() } as Prisma.InputJsonValue)
            : ({} as Prisma.InputJsonValue),
        },
      }),
    ]);

    this.logger.log(`Earned ${points} points for account ${account.id}`);
    return { account: updatedAccount, transaction };
  }

  /**
   * Calculate how many points to award for a given order amount
   * using the configured points_per_amount and point_value settings.
   *
   * @param hasHealthyItems - if true, applies healthy_boost_multiplier
   * @param isFirstOrder - if true, adds first_order_bonus
   */
  async calculatePointsForOrder(
    orgId: string,
    orderAmount: number,
    hasHealthyItems = false,
    isFirstOrder = false,
  ): Promise<number> {
    const [
      pointsPerAmount,
      pointValue,
      pointsPerAmountThreshold,
      healthyBoostMultiplier,
      firstOrderBonus,
    ] = await Promise.all([
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'points_per_amount', 1),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'point_value', 100),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'points_per_amount_threshold', 0),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'healthy_boost_multiplier', 1),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'first_order_bonus', 0),
    ]);

    if (pointValue <= 0) return 0;

    // Minimum order amount to earn points
    if (pointsPerAmountThreshold > 0 && orderAmount < pointsPerAmountThreshold) {
      return 0;
    }

    // e.g. pointsPerAmount=1, pointValue=100 means 1 point per 100 spent
    let points = Math.floor((orderAmount / pointValue) * pointsPerAmount);

    // Apply healthy boost multiplier for orders with healthy items
    if (hasHealthyItems && healthyBoostMultiplier > 1) {
      points = Math.floor(points * healthyBoostMultiplier);
    }

    // Add first order bonus
    if (isFirstOrder && firstOrderBonus > 0) {
      points += firstOrderBonus;
    }

    return points;
  }

  /**
   * Redeem points — subtracts points (with balance check) and creates a transaction.
   */
  async redeemPoints(
    orgId: string,
    endUserId: string,
    points: number,
    description: string,
    commerceOrderId?: string,
    orderAmount?: number,
  ) {
    if (points <= 0) {
      throw new BadRequestException('Points to redeem must be positive');
    }

    const account = await this.getAccount(orgId, endUserId);

    if (account.balance < points) {
      throw new BadRequestException(
        `Insufficient balance: ${account.balance} points available, ${points} requested`,
      );
    }

    // ── Validate: minimum points for redemption ──────────────────────────────
    const redemptionMinPoints = await this.orgSettings.getTyped<number>(
      orgId, 'loyalty', 'redemption_min_points', 0,
    );
    if (redemptionMinPoints > 0 && points < redemptionMinPoints) {
      throw new BadRequestException(
        `Minimum ${redemptionMinPoints} points required for redemption`,
      );
    }

    // ── Validate: max redemption as percentage of order amount ───────────────
    if (orderAmount !== undefined && orderAmount > 0) {
      const redemptionMaxPercent = await this.orgSettings.getTyped<number>(
        orgId, 'loyalty', 'redemption_max_percent', 100,
      );
      const pointValue = await this.orgSettings.getTyped<number>(
        orgId, 'loyalty', 'point_value', 100,
      );
      const redemptionValue = (points / (pointValue > 0 ? pointValue : 100)) * 100;
      const maxRedemptionValue = (orderAmount * redemptionMaxPercent) / 100;

      if (redemptionValue > maxRedemptionValue) {
        throw new BadRequestException(
          `Points redemption cannot exceed ${redemptionMaxPercent}% of the order amount`,
        );
      }
    }

    const [updatedAccount, transaction] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          balance: { decrement: points },
          totalRedeemed: { increment: points },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          orgId,
          accountId: account.id,
          type: 'redeem',
          points: -points,
          description,
          commerceOrderId: commerceOrderId ?? null,
        },
      }),
    ]);

    this.logger.log(`Redeemed ${points} points for account ${account.id}`);
    return { account: updatedAccount, transaction };
  }

  /**
   * List transactions for an end user with pagination.
   */
  async getTransactions(orgId: string, endUserId: string, page = 1, limit = 20) {
    const account = await this.getAccount(orgId, endUserId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { orgId, accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyTransaction.count({
        where: { orgId, accountId: account.id },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Bonus Points ─────────────────────────────────────────────────────────

  /**
   * Award welcome bonus on account creation.
   * Should be called once when a new end user registers.
   */
  async awardWelcomeBonus(orgId: string, endUserId: string) {
    const welcomeBonus = await this.orgSettings.getTyped<number>(
      orgId, 'loyalty', 'welcome_bonus', 0,
    );
    if (welcomeBonus <= 0) return null;

    return this.earnPoints(orgId, endUserId, welcomeBonus, 'Welcome bonus');
  }

  /**
   * Award birthday bonus. Called by a scheduled job or on user login during birthday.
   */
  async awardBirthdayBonus(orgId: string, endUserId: string) {
    const birthdayBonus = await this.orgSettings.getTyped<number>(
      orgId, 'loyalty', 'birthday_bonus', 0,
    );
    if (birthdayBonus <= 0) return null;

    return this.earnPoints(orgId, endUserId, birthdayBonus, 'Birthday bonus');
  }

  /**
   * Award birthday bonuses to all users with a birthday today in the given org.
   * Birthday is stored in EndUser.attributes JSON as { dateOfBirth: "YYYY-MM-DD" }.
   * Returns the number of users who received the bonus.
   */
  async awardBirthdayBonuses(orgId: string): Promise<number> {
    await this.ensureLoyaltyEnabled(orgId);
    const birthdayBonus = await this.orgSettings.getTyped<number>(orgId, 'loyalty', 'birthday_bonus', 0);
    if (birthdayBonus <= 0) return 0;

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find all users in this org that have attributes set
    const users = await this.prisma.endUser.findMany({
      where: { orgId, attributes: { not: Prisma.DbNull } },
      select: { id: true, attributes: true },
    });

    let awarded = 0;
    for (const user of users) {
      const attrs = user.attributes as Record<string, unknown> | null;
      const dobStr = attrs?.['dateOfBirth'] as string | undefined;
      if (!dobStr) continue;

      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) continue;
      if (dob.getMonth() + 1 !== month || dob.getDate() !== day) continue;

      // Check if already awarded this year via the loyalty account
      const account = await this.prisma.loyaltyAccount.findUnique({
        where: { orgId_endUserId: { orgId, endUserId: user.id } },
      });

      if (account) {
        const existingBonus = await this.prisma.loyaltyTransaction.findFirst({
          where: {
            orgId,
            accountId: account.id,
            description: 'Birthday bonus',
            createdAt: { gte: new Date(today.getFullYear(), 0, 1) },
          },
        });
        if (existingBonus) continue;
      }

      await this.earnPoints(orgId, user.id, birthdayBonus, 'Birthday bonus');
      awarded++;
    }
    return awarded;
  }

  /**
   * Check and award birthday bonus for a single user (e.g. at login time).
   * Birthday is stored in EndUser.attributes JSON as { dateOfBirth: "YYYY-MM-DD" }.
   * Returns true if bonus was awarded.
   */
  async checkAndAwardBirthdayBonus(orgId: string, endUserId: string): Promise<boolean> {
    try {
      const loyaltyEnabled = await this.orgSettings.getTyped<boolean>(orgId, 'loyalty', 'enabled', false);
      const birthdayBonus = await this.orgSettings.getTyped<number>(orgId, 'loyalty', 'birthday_bonus', 0);
      if (!loyaltyEnabled || birthdayBonus <= 0) return false;

      const user = await this.prisma.endUser.findUnique({
        where: { id: endUserId },
        select: { id: true, attributes: true },
      });
      const attrs = user?.attributes as Record<string, unknown> | null;
      const dobStr = attrs?.['dateOfBirth'] as string | undefined;
      if (!dobStr) return false;

      const today = new Date();
      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) return false;
      if (dob.getMonth() !== today.getMonth() || dob.getDate() !== today.getDate()) return false;

      // Check if already awarded this year via the loyalty account
      const account = await this.prisma.loyaltyAccount.findUnique({
        where: { orgId_endUserId: { orgId, endUserId } },
      });

      if (account) {
        const existingBonus = await this.prisma.loyaltyTransaction.findFirst({
          where: {
            orgId,
            accountId: account.id,
            description: 'Birthday bonus',
            createdAt: { gte: new Date(today.getFullYear(), 0, 1) },
          },
        });
        if (existingBonus) return false;
      }

      await this.earnPoints(orgId, endUserId, birthdayBonus, 'Birthday bonus');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Award review bonus when a review is submitted.
   */
  async awardReviewBonus(orgId: string, endUserId: string) {
    const reviewBonus = await this.orgSettings.getTyped<number>(
      orgId, 'loyalty', 'review_bonus', 0,
    );
    if (reviewBonus <= 0) return null;

    return this.earnPoints(orgId, endUserId, reviewBonus, 'Review bonus');
  }

  /**
   * Evaluate and update the user's loyalty tier based on total earned points.
   * Uses tier_* settings: tier_silver_threshold, tier_gold_threshold,
   * tier_platinum_threshold and corresponding multipliers.
   */
  async evaluateTier(orgId: string, endUserId: string) {
    const account = await this.getAccount(orgId, endUserId);

    const [
      silverThreshold,
      goldThreshold,
      platinumThreshold,
      silverMultiplier,
      goldMultiplier,
      platinumMultiplier,
    ] = await Promise.all([
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_silver_threshold', 500),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_gold_threshold', 2000),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_platinum_threshold', 5000),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_silver_multiplier', 1.2),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_gold_multiplier', 1.5),
      this.orgSettings.getTyped<number>(orgId, 'loyalty', 'tier_platinum_multiplier', 2),
    ]);

    let newTier = 'bronze';
    let multiplier = 1;

    if (account.totalEarned >= platinumThreshold) {
      newTier = 'platinum';
      multiplier = platinumMultiplier;
    } else if (account.totalEarned >= goldThreshold) {
      newTier = 'gold';
      multiplier = goldMultiplier;
    } else if (account.totalEarned >= silverThreshold) {
      newTier = 'silver';
      multiplier = silverMultiplier;
    }

    if (account.tier !== newTier) {
      await this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { tier: newTier },
      });
      this.logger.log(
        `Tier updated: ${account.tier} → ${newTier} for account ${account.id} (multiplier: ${multiplier}x)`,
      );
    }

    return { tier: newTier, multiplier };
  }

  // ─── Active Redemptions ────────────────────────────────────────────────────

  /**
   * Get active/pending redemptions for an end user.
   */
  async getActiveRedemptions(orgId: string, endUserId: string) {
    const redemptions = await this.prisma.loyaltyRedemption.findMany({
      where: {
        orgId,
        endUserId,
        status: { in: ['pending', 'active'] },
      },
      include: {
        reward: { select: { name: true, slug: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      redemptions: redemptions.map(r => ({
        id: r.id,
        rewardName: r.reward.name,
        code: r.code,
        status: r.status,
        points: r.points,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  // ─── Rewards ───────────────────────────────────────────────────────────────

  /**
   * List active rewards for an org (storefront).
   */
  async getRewards(orgId: string) {
    await this.ensureLoyaltyEnabled(orgId);

    return this.prisma.loyaltyReward.findMany({
      where: { orgId, isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  /**
   * Redeem a reward — creates a redemption record and subtracts points.
   */
  async redeemReward(orgId: string, endUserId: string, rewardId: string) {
    await this.ensureLoyaltyEnabled(orgId);

    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id: rewardId, orgId, isActive: true },
    });

    if (!reward) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }

    const account = await this.getAccount(orgId, endUserId);

    if (account.balance < reward.pointsCost) {
      throw new BadRequestException(
        `Insufficient balance: ${account.balance} points available, ${reward.pointsCost} required`,
      );
    }

    const code = this.generateRedemptionCode();

    const [updatedAccount, transaction, redemption] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          balance: { decrement: reward.pointsCost },
          totalRedeemed: { increment: reward.pointsCost },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          orgId,
          accountId: account.id,
          type: 'redeem',
          points: -reward.pointsCost,
          description: `Redeemed reward: ${reward.name}`,
        },
      }),
      this.prisma.loyaltyRedemption.create({
        data: {
          orgId,
          endUserId,
          rewardId: reward.id,
          points: reward.pointsCost,
          code,
          status: 'pending',
        },
      }),
    ]);

    this.logger.log(`Reward ${reward.slug} redeemed by endUser ${endUserId}, code: ${code}`);
    return { account: updatedAccount, transaction, redemption };
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /**
   * List all loyalty accounts (admin) with pagination.
   */
  async findAllAccounts(orgId: string, query: QueryAccountsDto) {
    const where: Prisma.LoyaltyAccountWhereInput = { orgId };

    if (query.tier) {
      where.tier = query.tier;
    }

    const [data, total] = await Promise.all([
      this.prisma.loyaltyAccount.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { endUser: { select: { id: true, name: true, email: true, phone: true } } },
      }),
      this.prisma.loyaltyAccount.count({ where }),
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
   * Get a single account by ID (admin).
   */
  async findOneAccount(orgId: string, id: string) {
    const account = await this.prisma.loyaltyAccount.findFirst({
      where: { id, orgId },
      include: {
        endUser: { select: { id: true, name: true, email: true, phone: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!account) {
      throw new NotFoundException(`Loyalty account ${id} not found`);
    }

    return account;
  }

  /**
   * Manual point adjustment (admin).
   */
  async adjustPoints(orgId: string, accountId: string, dto: AdjustPointsDto) {
    const account = await this.prisma.loyaltyAccount.findFirst({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException(`Loyalty account ${accountId} not found`);
    }

    if (dto.points < 0 && account.balance < Math.abs(dto.points)) {
      throw new BadRequestException(
        `Insufficient balance: ${account.balance} points available`,
      );
    }

    const updateData: Prisma.LoyaltyAccountUpdateInput = {
      balance: { increment: dto.points },
    };

    if (dto.points > 0) {
      updateData.totalEarned = { increment: dto.points };
    } else {
      updateData.totalRedeemed = { increment: Math.abs(dto.points) };
    }

    const [updatedAccount, transaction] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: accountId },
        data: updateData,
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          orgId,
          accountId,
          type: 'adjustment',
          points: dto.points,
          description: dto.description,
          commerceOrderId: dto.commerceOrderId ?? null,
        },
      }),
    ]);

    this.logger.log(`Admin adjusted ${dto.points} points for account ${accountId}`);
    return { account: updatedAccount, transaction };
  }

  // ─── Rewards CRUD (Admin) ──────────────────────────────────────────────────

  /**
   * List all rewards (admin, including inactive).
   */
  async findAllRewards(orgId: string) {
    return this.prisma.loyaltyReward.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single reward by ID (admin).
   */
  async findOneReward(orgId: string, id: string) {
    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id, orgId },
    });

    if (!reward) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    return reward;
  }

  /**
   * Create a new reward (admin).
   */
  async createReward(orgId: string, dto: CreateRewardDto) {
    const reward = await this.prisma.loyaltyReward.create({
      data: {
        orgId,
        slug: dto.slug,
        name: dto.name,
        description: dto.description ?? null,
        pointsCost: dto.pointsCost,
        type: dto.type,
        ...(dto.config != null && { config: dto.config as Prisma.InputJsonValue }),
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Reward created: ${reward.id} (${reward.slug}) for org ${orgId}`);
    return reward;
  }

  /**
   * Update a reward (admin).
   */
  async updateReward(orgId: string, id: string, dto: UpdateRewardDto) {
    await this.findOneReward(orgId, id);

    const updated = await this.prisma.loyaltyReward.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.pointsCost !== undefined && { pointsCost: dto.pointsCost }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.config != null && { config: dto.config as Prisma.InputJsonValue }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Reward updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Delete a reward (admin).
   */
  async deleteReward(orgId: string, id: string) {
    await this.findOneReward(orgId, id);

    await this.prisma.loyaltyReward.delete({ where: { id } });

    this.logger.log(`Reward deleted: ${id} for org ${orgId}`);
    return { message: 'Reward deleted successfully' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
