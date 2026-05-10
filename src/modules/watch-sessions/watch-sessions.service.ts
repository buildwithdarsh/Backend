import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { WalletService } from '../wallet/wallet.service.js';
import type { StartSessionDto } from './dto/start-session.dto.js';

@Injectable()
export class WatchSessionsService {
  private readonly logger = new Logger(WatchSessionsService.name);
  private readonly billingIntervals = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Start a new watch session. Ends any existing active session first.
   */
  async startSession(orgId: string, endUserId: string, dto: StartSessionDto) {
    // 1. Check balance >= ratePerMinPaise (at least 1 min must be affordable)
    const balance = await this.walletService.getBalance(orgId, endUserId);
    if (balance < dto.ratePerMinPaise) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: 'Insufficient wallet balance to start session',
          balancePaise: balance,
          requiredPaise: dto.ratePerMinPaise,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 2. End any existing active session for this user
    const activeSessions = await this.prisma.watchSession.findMany({
      where: { orgId, endUserId, status: 'active' },
    });

    for (const session of activeSessions) {
      await this.endSession(orgId, endUserId, session.id);
    }

    // 3. Create new session
    const now = new Date();
    const session = await this.prisma.watchSession.create({
      data: {
        orgId,
        endUserId,
        tmdbId: dto.tmdbId,
        movieTitle: dto.movieTitle,
        ratePerMinPaise: dto.ratePerMinPaise,
        meterCapPaise: dto.meterCapPaise,
        status: 'active',
        lastBilledAt: now,
      },
    });

    // 4. Start repeatable billing interval — fires every 60 seconds
    const interval = setInterval(() => {
      void this.billSession(session.id).catch(err =>
        this.logger.error(`Billing failed for session ${session.id}: ${err}`),
      );
    }, 60_000);
    this.billingIntervals.set(session.id, interval);

    this.logger.log(`Session started: ${session.id} for user ${endUserId}`);

    return {
      session,
      balancePaise: balance,
    };
  }

  /**
   * Get session status + current wallet balance.
   */
  async getSessionStatus(orgId: string, endUserId: string, sessionId: string) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Update lastPollAt as heartbeat (separate from lastBilledAt)
    // Stale cleanup uses this to detect killed apps
    if (session.status === 'active') {
      await this.prisma.watchSession.update({
        where: { id: sessionId },
        data: { lastPollAt: new Date() },
      });
    }

    const balancePaise = await this.walletService.getBalance(orgId, endUserId);

    return { session, balancePaise };
  }

  /**
   * Pause a session — bill elapsed time, remove repeatable job.
   */
  async pauseSession(orgId: string, endUserId: string, sessionId: string) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId, status: 'active' },
    });

    if (!session) {
      throw new NotFoundException('Active session not found');
    }

    // Bill elapsed time since lastBilledAt
    await this.billElapsedTime(session);

    // Set status to paused
    const updated = await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { status: 'paused' },
    });

    // Remove repeatable job
    this.removeRepeatableJob(sessionId);

    this.logger.log(`Session paused: ${sessionId}`);

    const balancePaise = await this.walletService.getBalance(orgId, endUserId);
    return { session: updated, balancePaise };
  }

  /**
   * Resume a paused session — check balance, restart billing.
   */
  async resumeSession(orgId: string, endUserId: string, sessionId: string) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId, status: 'paused' },
    });

    if (!session) {
      throw new NotFoundException('Paused session not found');
    }

    // Check balance
    const balance = await this.walletService.getBalance(orgId, endUserId);
    if (balance < session.ratePerMinPaise) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: 'Insufficient wallet balance to resume session',
          balancePaise: balance,
          requiredPaise: session.ratePerMinPaise,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Set status to active, reset lastBilledAt
    const now = new Date();
    const updated = await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { status: 'active', lastBilledAt: now },
    });

    // Re-add repeatable billing interval
    const interval = setInterval(() => {
      void this.billSession(sessionId).catch(err =>
        this.logger.error(`Billing failed for session ${sessionId}: ${err}`),
      );
    }, 60_000);
    this.billingIntervals.set(sessionId, interval);

    this.logger.log(`Session resumed: ${sessionId}`);

    return { session: updated, balancePaise: balance };
  }

  /**
   * End a session — final pro-rated billing, cleanup.
   */
  async endSession(orgId: string, endUserId: string, sessionId: string) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId, status: { in: ['active', 'paused'] } },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already ended');
    }

    // Bill remaining time pro-rated (only if active)
    if (session.status === 'active') {
      await this.billElapsedTime(session);
    }

    // Reload session to get updated totals
    const finalSession = await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { status: 'ended', endedAt: new Date() },
    });

    // Remove repeatable job
    this.removeRepeatableJob(sessionId);

    this.logger.log(
      `Session ended: ${sessionId} | billed=${finalSession.totalBilledPaise} paise | mins=${finalSession.minutesBilled}`,
    );

    const balancePaise = await this.walletService.getBalance(orgId, endUserId);

    return {
      session: finalSession,
      balancePaise,
      summary: {
        totalBilledPaise: finalSession.totalBilledPaise,
        minutesBilled: finalSession.minutesBilled,
        movieTitle: finalSession.movieTitle,
      },
    };
  }

  /**
   * Update the meter cap for an active/capped session (e.g. preview → unlimited).
   * If the session was 'capped', re-activates it with the new cap.
   */
  async updateCap(orgId: string, endUserId: string, sessionId: string, newCapPaise: number) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId, status: { in: ['active', 'capped', 'paused'] } },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already ended');
    }

    const wasCapped = session.status === 'capped';
    const now = new Date();

    const updated = await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        meterCapPaise: newCapPaise,
        ...(wasCapped ? { status: 'active', lastBilledAt: now } : {}),
      },
    });

    // If was capped, restart billing interval
    if (wasCapped) {
      const interval = setInterval(() => {
        void this.billSession(sessionId).catch(err =>
          this.logger.error(`Billing failed for session ${sessionId}: ${err}`),
        );
      }, 60_000);
      this.billingIntervals.set(sessionId, interval);
      this.logger.log(`Session ${sessionId} uncapped — new cap ${newCapPaise} paise`);
    }

    const balancePaise = await this.walletService.getBalance(orgId, endUserId);
    return { session: updated, balancePaise };
  }

  /**
   * Rate an ended session (1-5 stars).
   */
  async rateSession(orgId: string, endUserId: string, sessionId: string, rating: number) {
    const session = await this.prisma.watchSession.findFirst({
      where: { id: sessionId, orgId, endUserId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const updated = await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { rating },
    });
    return { session: updated };
  }

  /**
   * Get watch history for a user — ended/capped sessions, newest first.
   */
  async getHistory(orgId: string, endUserId: string, limit = 50, offset = 0) {
    const [sessions, total] = await Promise.all([
      this.prisma.watchSession.findMany({
        where: { orgId, endUserId, status: { in: ['ended', 'capped'] } },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.watchSession.count({
        where: { orgId, endUserId, status: { in: ['ended', 'capped'] } },
      }),
    ]);
    return { sessions, total };
  }

  /**
   * Called by BillingWorker every 60s for active sessions.
   */
  async billSession(sessionId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== 'active') {
      this.logger.debug(`Skipping billing for session ${sessionId} (status: ${session?.status ?? 'not found'})`);
      return;
    }

    await this.billElapsedTime(session);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Bill elapsed time since lastBilledAt for a given session.
   */
  private async billElapsedTime(session: {
    id: string;
    orgId: string;
    endUserId: string;
    ratePerMinPaise: number;
    meterCapPaise: number;
    totalBilledPaise: number;
    minutesBilled: number;
    lastBilledAt: Date | null;
  }) {
    const now = new Date();
    const lastBilled = session.lastBilledAt ?? now;
    const elapsedMs = now.getTime() - lastBilled.getTime();
    const elapsedMinutes = elapsedMs / 60_000;

    if (elapsedMinutes < 0.01) {
      return; // Nothing meaningful to bill
    }

    // Calculate charge based on full elapsed minutes
    let charge = Math.floor(elapsedMinutes) * session.ratePerMinPaise;

    // Pro-rate fractional minutes for end-session billing
    const fractional = elapsedMinutes - Math.floor(elapsedMinutes);
    if (fractional > 0) {
      charge += Math.round(fractional * session.ratePerMinPaise);
    }

    if (charge <= 0) {
      return;
    }

    // Apply meter cap
    const remainingCap = session.meterCapPaise - session.totalBilledPaise;
    let newStatus: string | null = null;

    if (charge >= remainingCap) {
      charge = Math.max(remainingCap, 0);
      newStatus = 'capped';
    }

    if (charge <= 0) {
      // Already at cap
      if (newStatus === 'capped') {
        await this.prisma.watchSession.update({
          where: { id: session.id },
          data: { status: 'capped' },
        });
        this.removeRepeatableJob(session.id);
      }
      return;
    }

    // Attempt debit
    try {
      await this.walletService.debit(
        session.orgId,
        session.endUserId,
        charge,
        `Watch: ${session.id} — ${elapsedMinutes.toFixed(1)} min`,
        session.id,
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.PAYMENT_REQUIRED) {
        // Insufficient funds — stop the session
        await this.prisma.watchSession.update({
          where: { id: session.id },
          data: { status: 'insufficient_funds', lastBilledAt: now },
        });
        this.removeRepeatableJob(session.id);
        this.logger.warn(`Session ${session.id} stopped: insufficient funds`);
        return;
      }
      throw error;
    }

    // Update session counters
    const updateData: Record<string, unknown> = {
      totalBilledPaise: { increment: charge },
      minutesBilled: { increment: elapsedMinutes },
      lastBilledAt: now,
    };

    if (newStatus) {
      updateData['status'] = newStatus;
    }

    await this.prisma.watchSession.update({
      where: { id: session.id },
      data: updateData,
    });

    // If this session is linked to a room viewer, track minutes by mode
    await this.syncRoomViewerMinutes(session.id, elapsedMinutes);

    if (newStatus === 'capped') {
      this.removeRepeatableJob(session.id);
      this.logger.log(`Session ${session.id} capped at ${session.meterCapPaise} paise`);
    }
  }

  /**
   * If the session is linked to a PlayFlixRoomViewer, increment minutesSync or minutesSolo.
   */
  private async syncRoomViewerMinutes(sessionId: string, minutes: number) {
    try {
      const viewer = await this.prisma.playFlixRoomViewer.findUnique({
        where: { sessionId },
        select: { id: true, mode: true },
      });

      if (!viewer) return;

      const field = viewer.mode === 'solo' ? 'minutesSolo' : 'minutesSync';
      await this.prisma.playFlixRoomViewer.update({
        where: { id: viewer.id },
        data: { [field]: { increment: minutes } },
      });
    } catch (err) {
      this.logger.warn(`Failed to sync room viewer minutes for session ${sessionId}: ${err}`);
    }
  }

  /**
   * Remove the repeatable billing interval for a session.
   */
  private removeRepeatableJob(sessionId: string) {
    const interval = this.billingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.billingIntervals.delete(sessionId);
    }
  }
}
