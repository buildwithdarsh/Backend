import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';
import { WatchSessionsService } from '../modules/watch-sessions/watch-sessions.service.js';

@Injectable()
export class StaleSessionCleanupJob {
  private readonly logger = new Logger(StaleSessionCleanupJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly watchSessionsService: WatchSessionsService,
  ) {}

  @Cron('30 */5 * * * *') // offset :30s to avoid pool contention
  async cleanupStaleSessions(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Stale session cleanup already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      // Find sessions where status = 'active' and no frontend poll for 2+ minutes
      // (frontend polls every 5s, so 2 min of no polls = app killed)
      const staleSessions = await this.prisma.watchSession.findMany({
        where: {
          status: 'active',
          OR: [
            { lastPollAt: { lt: twoMinutesAgo } },
            { lastPollAt: null, lastBilledAt: { lt: twoMinutesAgo } },
          ],
        },
        select: {
          id: true,
          orgId: true,
          endUserId: true,
        },
      });

      if (staleSessions.length === 0) {
        return;
      }

      this.logger.log(`Found ${staleSessions.length} stale session(s), auto-ending`);

      for (const session of staleSessions) {
        try {
          await this.watchSessionsService.endSession(
            session.orgId,
            session.endUserId,
            session.id,
          );
          this.logger.log(`Auto-ended stale session ${session.id}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to auto-end stale session ${session.id}: ${message}`,
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Stale session cleanup error: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
