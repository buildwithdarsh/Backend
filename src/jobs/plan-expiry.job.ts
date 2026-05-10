import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';
import { EmailWorker } from '../workers/email.worker.js';

@Injectable()
export class PlanExpiryJob {
  private readonly logger = new Logger(PlanExpiryJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailWorker: EmailWorker,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Plan expiry check already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      await Promise.all([
        this.sendRenewalReminders(now),
        this.suspendExpiredTrials(now),
        this.suspendExpiredPlans(now),
      ]);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Plan expiry job error: ${reason}`);
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Renewal Reminders ────────────────────────────────────────────────

  private async sendRenewalReminders(now: Date): Promise<void> {
    // Send reminders for orgs whose plan expires in 7 days, 3 days, or 1 day
    const reminderThresholds = [7, 3, 1];

    for (const daysBeforeExpiry of reminderThresholds) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

      // Find orgs expiring on that day (within a 24-hour window)
      const windowStart = new Date(targetDate);
      windowStart.setHours(0, 0, 0, 0);
      const windowEnd = new Date(targetDate);
      windowEnd.setHours(23, 59, 59, 999);

      const expiringOrgs = await this.prisma.organization.findMany({
        where: {
          status: 'active',
          planExpiresAt: {
            gte: windowStart,
            lte: windowEnd,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          billingEmail: true,
          planExpiresAt: true,
          plan: { select: { name: true } },
        },
      });

      if (expiringOrgs.length === 0) {
        continue;
      }

      this.logger.log(
        `Found ${expiringOrgs.length} org(s) expiring in ${daysBeforeExpiry} day(s)`,
      );

      for (const org of expiringOrgs) {
        if (!org.billingEmail) {
          this.logger.warn(
            `Org ${org.id} (${org.name}) has no billing email, skipping reminder`,
          );
          continue;
        }

        void this.emailWorker.processJob({
            orgId: org.id,
            type: 'generic',
            to: org.billingEmail,
            subject: `Your ${org.plan?.name ?? 'plan'} expires in ${daysBeforeExpiry} day${daysBeforeExpiry > 1 ? 's' : ''}`,
            html: `
              <h2>Plan Renewal Reminder</h2>
              <p>Hi ${org.name},</p>
              <p>Your <strong>${org.plan?.name ?? 'current plan'}</strong> is set to expire on
              <strong>${org.planExpiresAt?.toLocaleDateString() ?? 'soon'}</strong>.</p>
              <p>Please renew your plan to avoid any service interruption.</p>
              <p>— Darsh Gupta Team</p>
            `.trim(),
          }).catch(err => this.logger.error('Email send failed', err));
      }
    }
  }

  // ─── Suspend Expired Trials ───────────────────────────────────────────

  private async suspendExpiredTrials(now: Date): Promise<void> {
    const expiredTrials = await this.prisma.organization.findMany({
      where: {
        status: 'trial',
        trialEndsAt: { lte: now },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        billingEmail: true,
      },
    });

    if (expiredTrials.length === 0) {
      return;
    }

    this.logger.log(
      `Suspending ${expiredTrials.length} org(s) with expired trials`,
    );

    for (const org of expiredTrials) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { status: 'suspended' },
      });

      // Notify via email
      if (org.billingEmail) {
        void this.emailWorker.processJob({
            orgId: org.id,
            type: 'generic',
            to: org.billingEmail,
            subject: 'Your trial has expired',
            html: `
              <h2>Trial Expired</h2>
              <p>Hi ${org.name},</p>
              <p>Your free trial has ended and your account has been suspended.</p>
              <p>Upgrade to a paid plan to restore access to all features.</p>
              <p>— Darsh Gupta Team</p>
            `.trim(),
          }).catch(err => this.logger.error('Email send failed', err));
      }
    }
  }

  // ─── Suspend Expired Plans ────────────────────────────────────────────

  private async suspendExpiredPlans(now: Date): Promise<void> {
    // Grace period: 3 days after plan_expires_at before suspending
    const gracePeriodDays = 3;
    const graceDate = new Date(now);
    graceDate.setDate(graceDate.getDate() - gracePeriodDays);

    const expiredPlans = await this.prisma.organization.findMany({
      where: {
        status: 'active',
        planExpiresAt: { lte: graceDate },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        billingEmail: true,
      },
    });

    if (expiredPlans.length === 0) {
      return;
    }

    this.logger.log(
      `Suspending ${expiredPlans.length} org(s) with expired plans (past grace period)`,
    );

    for (const org of expiredPlans) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { status: 'suspended' },
      });

      if (org.billingEmail) {
        void this.emailWorker.processJob({
            orgId: org.id,
            type: 'generic',
            to: org.billingEmail,
            subject: 'Your account has been suspended',
            html: `
              <h2>Account Suspended</h2>
              <p>Hi ${org.name},</p>
              <p>Your plan has expired and your account has been suspended after the grace period.</p>
              <p>Please renew your plan to restore access.</p>
              <p>— Darsh Gupta Team</p>
            `.trim(),
          }).catch(err => this.logger.error('Email send failed', err));
      }
    }
  }
}
