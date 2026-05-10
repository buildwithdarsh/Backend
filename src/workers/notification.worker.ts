import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigResolverService } from '../services/config-resolver/config-resolver.service.js';
import { MSG91 } from '../common/constants/providers.js';

// ─── Strategy Interfaces ────────────────────────────────────────────────────

export interface NotificationPayload {
  orgId: string;
  notificationId: string;
  type: string;
  to?: string | undefined;
  endUserId?: string | null | undefined;
  userId?: string | null | undefined;
  title?: string | undefined;
  body?: string | undefined;
  imageUrl?: string | undefined;
  data?: Record<string, unknown> | undefined;
  templateId?: string | undefined;
  variables?: Record<string, unknown> | undefined;
}

interface NotificationStrategy {
  send(
    orgId: string,
    payload: NotificationPayload,
    providerConfig: Record<string, unknown>,
  ): Promise<void>;
}

// ─── Strategies ─────────────────────────────────────────────────────────────

class EmailStrategy implements NotificationStrategy {
  private readonly logger = new Logger(EmailStrategy.name);

  async send(
    orgId: string,
    payload: NotificationPayload,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const provider = providerConfig['activeProvider'] as string;
    this.logger.log(
      `[org:${orgId}] Sending email via ${provider} to ${payload.to}`,
    );

    switch (provider) {
      case 'msg91': {
        const authKey = providerConfig['msg91AuthKey'] as string;
        if (!authKey) throw new Error('MSG91 auth key not configured');

        const response = await fetch(MSG91.EMAIL_SEND, {
          method: 'POST',
          headers: {
            'authkey': authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email: payload.to }],
            from: { email: (providerConfig['fromAddress'] as string) || 'noreply@build.withdarsh.com' },
            subject: payload.title || 'Notification',
            body: payload.body || '',
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`MSG91 email failed: ${text}`);
        }

        this.logger.log(`MSG91 email sent to ${payload.to}`);
        break;
      }
      case 'smtp':
        // TODO: integrate nodemailer SMTP transport
        break;
      case 'resend':
        // TODO: integrate Resend API
        break;
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }
}

class SmsStrategy implements NotificationStrategy {
  private readonly logger = new Logger(SmsStrategy.name);

  async send(
    orgId: string,
    payload: NotificationPayload,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const provider = providerConfig['activeProvider'] as string;
    this.logger.log(
      `[org:${orgId}] Sending SMS via ${provider} to ${payload.to}`,
    );

    switch (provider) {
      case 'msg91': {
        const authKey = providerConfig['msg91AuthKey'] as string;
        if (!authKey) throw new Error('MSG91 auth key not configured');

        const response = await fetch(MSG91.OTP_SEND, {
          method: 'POST',
          headers: {
            'authkey': authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: payload.to,
            otp: payload.data?.['otp'] ?? undefined,
            template_id: (providerConfig['msg91TemplateId'] as string) ?? undefined,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`MSG91 OTP failed: ${text}`);
        }

        this.logger.log(`MSG91 OTP sent to ${payload.to}`);
        break;
      }
      case 'twilio':
        // TODO: integrate Twilio SMS API
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${provider}`);
    }
  }
}

class PushStrategy implements NotificationStrategy {
  private readonly logger = new Logger(PushStrategy.name);

  async send(
    orgId: string,
    payload: NotificationPayload,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const provider = providerConfig['activeProvider'] as string;
    this.logger.log(
      `[org:${orgId}] Sending push via ${provider} to ${payload.to}`,
    );

    switch (provider) {
      case 'fcm':
        // TODO: integrate Firebase Cloud Messaging
        break;
      default:
        throw new Error(`Unsupported push provider: ${provider}`);
    }
  }
}

class WhatsappStrategy implements NotificationStrategy {
  private readonly logger = new Logger(WhatsappStrategy.name);

  async send(
    orgId: string,
    payload: NotificationPayload,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const provider = providerConfig['activeProvider'] as string;
    this.logger.log(
      `[org:${orgId}] Sending WhatsApp via ${provider} to ${payload.to}`,
    );

    switch (provider) {
      case 'msg91':
        // TODO: integrate MSG91 WhatsApp API
        break;
      default:
        throw new Error(`Unsupported WhatsApp provider: ${provider}`);
    }
  }
}

class InAppStrategy implements NotificationStrategy {
  private readonly logger = new Logger(InAppStrategy.name);

  async send(
    orgId: string,
    payload: NotificationPayload,
    _providerConfig: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `[org:${orgId}] Storing in-app notification for ${payload.to}`,
    );
    // In-app notifications are already persisted as Notification records.
    // The WebSocket gateway pushes them to the client in real time.
  }
}

// ─── Strategy Registry ──────────────────────────────────────────────────────

const STRATEGIES: Record<string, NotificationStrategy> = {
  email: new EmailStrategy(),
  sms: new SmsStrategy(),
  push: new PushStrategy(),
  whatsapp: new WhatsappStrategy(),
  in_app: new InAppStrategy(),
};

// ─── Config group mapping ───────────────────────────────────────────────────

const TYPE_TO_CONFIG_GROUP: Record<string, string> = {
  email: 'email',
  sms: 'sms',
  push: 'push',
  whatsapp: 'whatsapp',
  in_app: 'email', // fallback; in-app does not need provider config
};

// ─── Worker ─────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configResolver: ConfigResolverService,
  ) {}

  async processJob(payload: NotificationPayload): Promise<void> {
    const { orgId, notificationId, type } = payload;

    this.logger.log(
      `Processing notification ${notificationId} (type=${type}) for org ${orgId}`,
    );

    const strategy = STRATEGIES[type];
    if (!strategy) {
      await this.markFailed(notificationId, `Unknown notification type: ${type}`);
      throw new Error(`Unknown notification type: ${type}`);
    }

    try {
      // Resolve provider config (in-app needs no external provider)
      let providerConfig: Record<string, unknown> = {};
      if (type !== 'in_app') {
        const configGroup = TYPE_TO_CONFIG_GROUP[type]!;
        const getter = this.getConfigGetter(configGroup);
        providerConfig = (await getter(orgId)) as unknown as Record<string, unknown>;
      }

      await strategy.send(orgId, payload, providerConfig);

      // Mark sent
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Notification ${notificationId} sent successfully`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      await this.markFailed(notificationId, message);

      throw error;
    }
  }

  private getConfigGetter(
    group: string,
  ): (orgId: string) => Promise<unknown> {
    switch (group) {
      case 'email':
        return (orgId) => this.configResolver.getEmailConfig(orgId);
      case 'sms':
        return (orgId) => this.configResolver.getSmsConfig(orgId);
      case 'push':
        return (orgId) => this.configResolver.getPushConfig(orgId);
      case 'whatsapp':
        return (orgId) => this.configResolver.getWhatsappConfig(orgId);
      default:
        return () => Promise.resolve({});
    }
  }

  private async markFailed(
    notificationId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'failed',
        failedReason: reason.slice(0, 500),
      },
    });
  }
}
