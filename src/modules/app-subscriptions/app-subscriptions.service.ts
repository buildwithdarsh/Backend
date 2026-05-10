import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import type { CreateAppSubscriptionDto, ActivateAppSubscriptionDto } from './dto.js';

@Injectable()
export class AppSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  async getPlans(orgId: string) {
    const monthly = Number(await this.orgSettings.getTyped<number>(orgId, 'subscription', 'subscription_monthly_price', 499));
    const halfYearly = Number(await this.orgSettings.getTyped<number>(orgId, 'subscription', 'subscription_halfyearly_price', 2499));
    const yearly = Number(await this.orgSettings.getTyped<number>(orgId, 'subscription', 'subscription_yearly_price', 4499));
    const gstRate = Number(await this.orgSettings.getTyped<number>(orgId, 'subscription', 'gst_rate', 18));

    const withGst = (amount: number) => {
      const gst = Math.round(amount * gstRate / 100);
      return { amount, gst, total: amount + gst };
    };

    return [
      { id: 'monthly', name: '1 Month', ...withGst(monthly) },
      { id: 'half-yearly', name: '6 Months', ...withGst(halfYearly) },
      { id: 'yearly', name: '12 Months', ...withGst(yearly) },
    ];
  }

  async create(userId: string, orgId: string, dto: CreateAppSubscriptionDto) {
    const priceKey = `subscription_${dto.planId.replace('-', '')}_price`;
    const priceRaw = await this.orgSettings.get(orgId, 'subscription', priceKey);
    if (!priceRaw) throw new BadRequestException(`Invalid plan: ${dto.planId}`);

    const amount = Number(priceRaw);
    const gstRate = await this.orgSettings.getTyped<number>(orgId, 'subscription', 'gst_rate', 18);
    const gst = Math.round(amount * (gstRate / 100));
    const total = amount + gst;

    return this.prisma.appSubscription.create({
      data: {
        userId,
        orgId,
        plan: dto.planId,
        amount,
        gst,
        total,
        status: 'pending',
        promoCode: dto.promoCode ?? null,
      },
    });
  }

  async activate(id: string, dto: ActivateAppSubscriptionDto, userId?: string) {
    const sub = await this.prisma.appSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (userId && sub.userId !== userId) throw new BadRequestException('Subscription does not belong to this user');
    if (sub.status === 'active') throw new BadRequestException('Subscription already active');

    const now = new Date();
    const expiresAt = new Date(now);
    if (sub.plan === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (sub.plan === 'half-yearly') expiresAt.setMonth(expiresAt.getMonth() + 6);
    else if (sub.plan === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return this.prisma.appSubscription.update({
      where: { id },
      data: {
        status: 'active',
        providerOrderId: dto.providerOrderId,
        providerPaymentId: dto.providerPaymentId,
        activatedAt: now,
        expiresAt,
      },
    });
  }

  async cancel(id: string, userId: string) {
    const sub = await this.prisma.appSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.userId !== userId) throw new BadRequestException('Subscription does not belong to this user');
    if (sub.status === 'cancelled') throw new BadRequestException('Subscription already cancelled');

    return this.prisma.appSubscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  }

  async getActive(userId: string, orgId: string) {
    return this.prisma.appSubscription.findFirst({
      where: { userId, orgId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countActive(orgId: string) {
    return this.prisma.appSubscription.count({ where: { orgId, status: 'active' } });
  }
}
