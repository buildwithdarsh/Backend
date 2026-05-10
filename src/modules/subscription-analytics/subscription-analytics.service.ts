import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

const CYCLE_TO_MONTHLY: Record<string, number> = {
  monthly: 1,
  quarterly: 1 / 3,
  half_yearly: 1 / 6,
  yearly: 1 / 12,
  weekly: 4.33,
  lifetime: 0,
};

@Injectable()
export class SubscriptionAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(orgId: string, endUserId: string) {
    const subs = await this.prisma.trackedSubscription.findMany({
      where: { orgId, endUserId, status: 'active', deletedAt: null },
      select: {
        id: true,
        serviceName: true,
        amountPaise: true,
        billingCycle: true,
        category: true,
        nextRenewalAt: true,
        lastActivityAt: true,
      },
    });

    let totalMonthlyPaise = 0;
    const byCategory: Record<string, { count: number; monthlyPaise: number }> = {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    let lowUsageCount = 0;
    let forgottenCount = 0;

    for (const sub of subs) {
      const multiplier = CYCLE_TO_MONTHLY[sub.billingCycle] ?? 1;
      const monthly = Math.round(sub.amountPaise * multiplier);
      totalMonthlyPaise += monthly;

      const cat = byCategory[sub.category];
      if (cat === undefined) {
        byCategory[sub.category] = { count: 1, monthlyPaise: monthly };
      } else {
        cat.count += 1;
        cat.monthlyPaise += monthly;
      }

      if (sub.lastActivityAt) {
        if (sub.lastActivityAt < sixtyDaysAgo) forgottenCount++;
        else if (sub.lastActivityAt < thirtyDaysAgo) lowUsageCount++;
      }
    }

    return {
      totalMonthlyPaise,
      totalAnnualPaise: totalMonthlyPaise * 12,
      activeCount: subs.length,
      lowUsageCount,
      forgottenCount,
      byCategory,
    };
  }

  async getTrends(orgId: string, endUserId: string, months = 6) {
    const subs = await this.prisma.trackedSubscription.findMany({
      where: { orgId, endUserId, status: 'active', deletedAt: null },
      select: { amountPaise: true, billingCycle: true },
    });

    const baseMonthlyPaise = subs.reduce((acc, s) => {
      return acc + Math.round(s.amountPaise * (CYCLE_TO_MONTHLY[s.billingCycle] ?? 1));
    }, 0);

    const now = new Date();
    const trend: { month: string; totalPaise: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trend.push({ month: label, totalPaise: baseMonthlyPaise });
    }

    return { trend };
  }
}
