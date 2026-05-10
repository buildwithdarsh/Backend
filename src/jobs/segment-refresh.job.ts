import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SegmentRefreshJob {
  private readonly logger = new Logger(SegmentRefreshJob.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('1 */5 * * * *') // offset :01s to avoid pool contention
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Segment refresh already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      // Fetch all dynamic segments
      const dynamicSegments = await this.prisma.segment.findMany({
        where: {
          type: 'dynamic',
          deletedAt: null,
        },
        select: {
          id: true,
          orgId: true,
          name: true,
          conditions: true,
        },
      });

      if (dynamicSegments.length === 0) {
        return;
      }

      this.logger.log(
        `Refreshing ${dynamicSegments.length} dynamic segment(s)`,
      );

      for (const segment of dynamicSegments) {
        try {
          const conditions = segment.conditions as Record<string, unknown> | null;

          if (!conditions) {
            continue;
          }

          // Build a Prisma where clause from segment conditions
          const endUserWhere = this.buildEndUserFilter(
            segment.orgId,
            conditions,
          );

          // Count matching end users
          const matchCount = await this.prisma.endUser.count({
            where: endUserWhere,
          });

          // Update segment count
          await this.prisma.segment.update({
            where: { id: segment.id },
            data: { endUserCount: matchCount },
          });

          // Refresh segment members:
          // 1. Remove existing members
          await this.prisma.segmentMember.deleteMany({
            where: { segmentId: segment.id },
          });

          // 2. Get matching end user IDs
          const matchingEndUsers = await this.prisma.endUser.findMany({
            where: endUserWhere,
            select: { id: true },
          });

          // 3. Bulk create new segment members
          if (matchingEndUsers.length > 0) {
            await this.prisma.segmentMember.createMany({
              data: matchingEndUsers.map((eu) => ({
                orgId: segment.orgId,
                segmentId: segment.id,
                endUserId: eu.id,
              })),
              skipDuplicates: true,
            });
          }

          this.logger.debug(
            `Segment "${segment.name}" (${segment.id}): ${matchCount} end users`,
          );
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to refresh segment ${segment.id}: ${reason}`,
          );
        }
      }

      this.logger.log('Dynamic segment refresh completed');
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Segment refresh job error: ${reason}`);
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Build a Prisma EndUser filter from dynamic segment conditions.
   *
   * Supported condition shapes:
   * - { tags: { hasEvery: ['vip'] } }
   * - { status: 'active' }
   * - { attributes: { path: ['plan'], equals: 'pro' } }
   * - { createdAt: { gte: '2024-01-01' } }
   */
  private buildEndUserFilter(
    orgId: string,
    conditions: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      orgId,
      deletedAt: null,
      ...conditions,
    };
  }
}
