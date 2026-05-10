import { Injectable, Logger } from '@nestjs/common';
import Handlebars from 'handlebars';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigResolverService } from '../services/config-resolver/config-resolver.service.js';

// ─── Job Payload ────────────────────────────────────────────────────────────

export interface CampaignJobPayload {
  orgId: string;
  campaignId: string;
  endUserId: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  templateId: string;
}

// ─── Worker ─────────────────────────────────────────────────────────────────

@Injectable()
export class CampaignWorker {
  private readonly logger = new Logger(CampaignWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configResolver: ConfigResolverService,
  ) {}

  async processJob(payload: CampaignJobPayload): Promise<void> {
    const { orgId, campaignId, endUserId, channel, templateId } = payload;

    this.logger.log(
      `Processing campaign ${campaignId} for end-user ${endUserId} (channel=${channel})`,
    );

    try {
      // 1. Fetch end user and template
      const [endUser, template] = await Promise.all([
        this.prisma.endUser.findUniqueOrThrow({
          where: { id: endUserId },
        }),
        this.prisma.notificationTemplate.findUniqueOrThrow({
          where: { id: templateId },
        }),
      ]);

      // 2. Render template with Handlebars using end_user attributes
      const templateData: Record<string, unknown> = {
        name: endUser.name,
        email: endUser.email,
        phone: endUser.phone,
        ...(endUser.attributes as Record<string, unknown> | null),
      };

      const compiledBody = Handlebars.compile(template.body);
      const renderedBody = compiledBody(templateData);

      let renderedSubject: string | undefined;
      if (template.subject) {
        const compiledSubject = Handlebars.compile(template.subject);
        renderedSubject = compiledSubject(templateData);
      }

      // 3. Get provider config and send via strategy
      const providerConfig = await this.resolveProviderConfig(orgId, channel);
      await this.dispatchToProvider(
        orgId,
        channel,
        endUser,
        renderedSubject,
        renderedBody,
        providerConfig,
      );

      // 4. Create campaign_log entry
      await this.prisma.campaignLog.create({
        data: {
          orgId,
          campaignId,
          endUserId,
          channel,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // 5. Update campaign sent_count atomically
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: { increment: 1 },
        },
      });

      this.logger.log(
        `Campaign ${campaignId}: sent to end-user ${endUserId} via ${channel}`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';

      // Create failed campaign_log entry
      await this.prisma.campaignLog.create({
        data: {
          orgId,
          campaignId,
          endUserId,
          channel,
          status: 'failed',
          failedReason: reason.slice(0, 500),
        },
      });

      // Increment failed_count
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          failedCount: { increment: 1 },
        },
      });

      this.logger.error(
        `Campaign ${campaignId}: failed for end-user ${endUserId} — ${reason}`,
      );

      throw error;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async resolveProviderConfig(
    orgId: string,
    channel: string,
  ): Promise<Record<string, unknown>> {
    switch (channel) {
      case 'email':
        return (await this.configResolver.getEmailConfig(orgId)) as unknown as Record<string, unknown>;
      case 'sms':
        return (await this.configResolver.getSmsConfig(orgId)) as unknown as Record<string, unknown>;
      case 'push':
        return (await this.configResolver.getPushConfig(orgId)) as unknown as Record<string, unknown>;
      case 'whatsapp':
        return (await this.configResolver.getWhatsappConfig(orgId)) as unknown as Record<string, unknown>;
      default:
        throw new Error(`Unsupported campaign channel: ${channel}`);
    }
  }

  private async dispatchToProvider(
    orgId: string,
    channel: string,
    endUser: { email?: string | null; phone?: string | null; fcmToken?: string | null; whatsappNumber?: string | null },
    subject: string | undefined,
    _body: string,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const provider = providerConfig['activeProvider'] as string;

    switch (channel) {
      case 'email': {
        if (!endUser.email) {
          throw new Error('End user has no email address');
        }
        this.logger.debug(
          `[org:${orgId}] Sending campaign email via ${provider} to ${endUser.email} — subject: ${subject}`,
        );
        // TODO: integrate email provider SDK (MSG91 / SMTP / Resend)
        break;
      }
      case 'sms': {
        if (!endUser.phone) {
          throw new Error('End user has no phone number');
        }
        this.logger.debug(
          `[org:${orgId}] Sending campaign SMS via ${provider} to ${endUser.phone}`,
        );
        // TODO: integrate SMS provider SDK (MSG91 / Twilio)
        break;
      }
      case 'push': {
        if (!endUser.fcmToken) {
          throw new Error('End user has no FCM token');
        }
        this.logger.debug(
          `[org:${orgId}] Sending campaign push via ${provider} to ${endUser.fcmToken}`,
        );
        // TODO: integrate push provider SDK (FCM)
        break;
      }
      case 'whatsapp': {
        if (!endUser.whatsappNumber) {
          throw new Error('End user has no WhatsApp number');
        }
        this.logger.debug(
          `[org:${orgId}] Sending campaign WhatsApp via ${provider} to ${endUser.whatsappNumber}`,
        );
        // TODO: integrate WhatsApp provider SDK (MSG91)
        break;
      }
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }
}
