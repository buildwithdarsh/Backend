import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService } from '../services/cache/cache.service.js';

interface UsageSummary {
  orgId: string;
  resource: string;
  count: number;
}

@Injectable()
export class UsageAggregatorJob {
  private readonly logger = new Logger(UsageAggregatorJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Usage aggregator already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      this.logger.log(
        `Aggregating usage stats from ${oneHourAgo.toISOString()} to ${now.toISOString()}`,
      );

      // Aggregate usage logs by org and resource for the last hour
      const usageGroups = await this.prisma.usageLog.groupBy({
        by: ['orgId', 'resource'],
        _sum: { quantity: true },
        where: {
          createdAt: {
            gte: oneHourAgo,
            lt: now,
          },
        },
      });

      const summaries: UsageSummary[] = usageGroups.map((g) => ({
        orgId: g.orgId,
        resource: g.resource,
        count: g._sum.quantity ?? 0,
      }));

      // Cache aggregated stats per org for the current month
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      for (const summary of summaries) {
        const cacheKey = `usage:${summary.orgId}:${monthKey}:${summary.resource}`;

        // Get existing monthly total
        const existing = await this.cache.get<number>(cacheKey);
        const newTotal = (existing ?? 0) + summary.count;

        // Cache with TTL of 35 days (covers full billing period)
        await this.cache.set(cacheKey, newTotal, 35 * 24 * 60 * 60);
      }

      // Also cache a summary of total API calls per org this month
      const orgTotals = new Map<string, number>();
      for (const summary of summaries) {
        if (summary.resource === 'api_call') {
          const current = orgTotals.get(summary.orgId) ?? 0;
          orgTotals.set(summary.orgId, current + summary.count);
        }
      }

      for (const [orgId, total] of orgTotals) {
        const totalCacheKey = `usage:${orgId}:${monthKey}:total_api_calls`;
        const existing = await this.cache.get<number>(totalCacheKey);
        const newTotal = (existing ?? 0) + total;
        await this.cache.set(totalCacheKey, newTotal, 35 * 24 * 60 * 60);
      }

      this.logger.log(
        `Usage aggregation complete: processed ${summaries.length} resource group(s) across ${new Set(summaries.map((s) => s.orgId)).size} org(s)`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Usage aggregator error: ${reason}`);
    } finally {
      this.isRunning = false;
    }
  }
}
