import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure referrals feature is enabled for this org.
   */
  private async ensureReferralsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'referral_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Referrals are disabled for this store');
    }
  }

  /**
   * Get or generate a referral code for the end user.
   * Uses the referralCode field on EndUser.
   */
  async getReferralCode(orgId: string, endUserId: string) {
    await this.ensureReferralsEnabled(orgId);

    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: { id: true, name: true, referralCode: true },
    });

    if (!endUser) {
      throw new NotFoundException(`End user ${endUserId} not found`);
    }

    if (endUser.referralCode) {
      return { code: endUser.referralCode };
    }

    // Generate a unique referral code
    const code = await this.generateUniqueCode(orgId);

    await this.prisma.endUser.update({
      where: { id: endUserId },
      data: { referralCode: code },
    });

    this.logger.log(`Referral code generated for endUser ${endUserId}: ${code}`);
    return { code };
  }

  /**
   * Validate a referral code — check that it belongs to a real user and is not self-referral.
   */
  async validateCode(orgId: string, code: string, currentEndUserId?: string) {
    await this.ensureReferralsEnabled(orgId);

    const referrer = await this.prisma.endUser.findFirst({
      where: { orgId, referralCode: code },
      select: { id: true, name: true },
    });

    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    if (currentEndUserId && referrer.id === currentEndUserId) {
      throw new BadRequestException('You cannot use your own referral code');
    }

    // Check if the current user has already been referred
    if (currentEndUserId) {
      const existingReferral = await this.prisma.referral.findUnique({
        where: { orgId_refereeId: { orgId, refereeId: currentEndUserId } },
      });

      if (existingReferral) {
        throw new BadRequestException('You have already used a referral code');
      }
    }

    return {
      valid: true,
      referrer: { id: referrer.id, name: referrer.name },
    };
  }

  /**
   * Create a referral record linking referrer and referee.
   */
  async createReferral(orgId: string, referrerId: string, refereeId: string, code: string) {
    await this.ensureReferralsEnabled(orgId);

    if (referrerId === refereeId) {
      throw new BadRequestException('Cannot refer yourself');
    }

    // Check if referee already has a referral
    const existing = await this.prisma.referral.findUnique({
      where: { orgId_refereeId: { orgId, refereeId } },
    });

    if (existing) {
      throw new BadRequestException('Referee already has a referral record');
    }

    const referral = await this.prisma.referral.create({
      data: {
        orgId,
        referrerId,
        refereeId,
        code,
        status: 'pending',
      },
    });

    this.logger.log(
      `Referral created: ${referral.id} (referrer: ${referrerId}, referee: ${refereeId})`,
    );
    return referral;
  }

  /**
   * Complete a referral — mark as completed and award points.
   * Called after the referee's first qualifying action (e.g., first order).
   */
  async completeReferral(orgId: string, refereeId: string, pointsToAward = 100) {
    const referral = await this.prisma.referral.findUnique({
      where: { orgId_refereeId: { orgId, refereeId } },
    });

    if (!referral) {
      this.logger.debug(`No referral found for referee ${refereeId} in org ${orgId}`);
      return null;
    }

    if (referral.status === 'completed') {
      this.logger.debug(`Referral ${referral.id} already completed`);
      return referral;
    }

    const updated = await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        pointsAwarded: pointsToAward,
      },
    });

    this.logger.log(
      `Referral ${referral.id} completed, awarded ${pointsToAward} points to referrer ${referral.referrerId}`,
    );
    return updated;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async generateUniqueCode(orgId: string): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;

    while (attempts < 10) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.prisma.endUser.findFirst({
        where: { orgId, referralCode: code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    // Fallback: use timestamp-based code
    return `REF${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
}
