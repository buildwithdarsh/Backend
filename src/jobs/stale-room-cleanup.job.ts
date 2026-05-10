import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class StaleRoomCleanupJob {
  private readonly logger = new Logger(StaleRoomCleanupJob.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('45 */5 * * * *') // offset :45s to avoid pool contention
  async cleanupStaleRooms(): Promise<void> {
    // Rooms are permanent — no cleanup needed
    return;

    if (this.isRunning) {
      this.logger.debug('Stale room cleanup already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      await this.cleanupStaleLifeRooms();
      await this.cleanupAbandonedWaitingRooms();
    } catch (error) { /*Silent*/  } finally {
      this.isRunning = false;
    }
  }

  /**
   * End 'live' rooms where all viewers have left and startedAt > 30 min ago.
   */
  private async cleanupStaleLifeRooms(): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find live rooms started more than 30 min ago with no active viewers
    const staleRooms = await this.prisma.playFlixRoom.findMany({
      where: {
        status: 'live',
        startedAt: { lt: thirtyMinutesAgo },
        viewers: {
          every: {
            leftAt: { not: null },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (staleRooms.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${staleRooms.length} stale live room(s), auto-ending`,
    );

    const now = new Date();

    for (const room of staleRooms) {
      try {
        await this.prisma.$transaction([
          // End any remaining active viewers (safety net)
          this.prisma.playFlixRoomViewer.updateMany({
            where: { roomId: room.id, leftAt: null },
            data: { leftAt: now },
          }),
          // End the room
          this.prisma.playFlixRoom.update({
            where: { id: room.id },
            data: { status: 'ended', endedAt: now },
          }),
        ]);

        this.logger.log(`Auto-ended stale live room ${room.id} ("${room.name}")`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to auto-end stale room ${room.id}: ${message}`,
        );
      }
    }
  }

  /**
   * End 'waiting' rooms that were created more than 60 min ago and never went live.
   */
  private async cleanupAbandonedWaitingRooms(): Promise<void> {
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await this.prisma.playFlixRoom.updateMany({
      where: {
        status: 'waiting',
        createdAt: { lt: sixtyMinutesAgo },
      },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Auto-ended ${result.count} abandoned waiting room(s)`,
      );
    }
  }
}
