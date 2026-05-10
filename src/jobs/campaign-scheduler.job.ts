import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';
import { CampaignWorker, type CampaignJobPayload } from '../workers/campaign.worker.js';

@Injectable()
export class CampaignSchedulerJob {
  private readonly logger = new Logger(CampaignSchedulerJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignWorker: CampaignWorker,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Campaign scheduler already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      // Find campaigns that are scheduled and due
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: now },
          deletedAt: null,
        },
        include: {
          segment: {
            include: {
              members: {
                select: { endUserId: true },
              },
            },
          },
        },
      });

      if (campaigns.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${campaigns.length} scheduled campaign(s) to launch`,
      );

      for (const campaign of campaigns) {
        try {
          // Mark campaign as running
          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: 'running',
              startedAt: now,
            },
          });

          // Collect end user IDs from segment
          const endUserIds =
            campaign.segment?.members.map((m) => m.endUserId) ?? [];

          if (endUserIds.length === 0) {
            this.logger.warn(
              `Campaign ${campaign.id} has no audience, marking completed`,
            );
            await this.prisma.campaign.update({
              where: { id: campaign.id },
              data: {
                status: 'completed',
                completedAt: new Date(),
                totalAudience: 0,
              },
            });
            continue;
          }

          // Update total audience
          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { totalAudience: endUserIds.length },
          });

          // Determine channel from campaign channel (map 'multi' to email as fallback)
          const channel =
            campaign.channel === 'multi' ? 'email' : campaign.channel;

          // Enqueue a job per end-user
          const jobs = endUserIds.map((endUserId) => ({
            name: `campaign-${campaign.id}-${endUserId}`,
            data: {
              orgId: campaign.orgId,
              campaignId: campaign.id,
              endUserId,
              channel: channel as CampaignJobPayload['channel'],
              templateId: campaign.templateId ?? '',
            },
            opts: {
              attempts: 3,
              backoff: {
                type: 'exponential' as const,
                delay: 5000,
              },
              removeOnComplete: true,
              removeOnFail: 100,
            },
          }));

          void Promise.all(jobs.map(j => this.campaignWorker.processJob(j.data))).catch(err =>
            this.logger.error(`Campaign ${campaign.id}: bulk processing failed`, err),
          );

          this.logger.log(
            `Campaign ${campaign.id}: enqueued ${endUserIds.length} jobs`,
          );
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to launch campaign ${campaign.id}: ${reason}`,
          );

          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: 'failed',
            },
          });
        }
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Campaign scheduler error: ${reason}`);
    } finally {
      this.isRunning = false;
    }
  }
}
