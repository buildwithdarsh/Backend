import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  ConfigResolverService,
  type EmailProviderConfig,
} from '../services/config-resolver/config-resolver.service.js';

// ─── Job Payload ────────────────────────────────────────────────────────────

export interface EmailJobPayload {
  orgId: string;
  type: 'invite' | 'invoice' | 'magic_link' | 'password_reset' | 'welcome' | 'generic';
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  metadata?: Record<string, unknown>;
}

// ─── Provider Interfaces ────────────────────────────────────────────────────

interface EmailSendResult {
  messageId: string;
  provider: string;
}

// ─── Worker ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

@Injectable()
export class EmailWorker {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    private readonly configResolver: ConfigResolverService,
  ) {}

  async processJob(payload: EmailJobPayload): Promise<void> {
    const { orgId, type, to } = payload;

    this.logger.log(
      `Processing transactional email (type=${type}) to ${to} for org ${orgId}`,
    );

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Resolve email provider config
        const emailConfig = await this.configResolver.getEmailConfig(orgId);

        // Determine sender
        const from =
          payload.from ??
          (emailConfig.fromName && emailConfig.fromAddress
            ? `${emailConfig.fromName} <${emailConfig.fromAddress}>`
            : emailConfig.fromAddress ?? undefined);

        // Dispatch to provider
        const result = await this.sendViaProvider(emailConfig, {
          ...payload,
          ...(from != null ? { from } : {}),
        });

        this.logger.log(
          `Email sent via ${result.provider} (messageId=${result.messageId}) — type=${type}, to=${to}`,
        );
        return;
      } catch (error) {
        lastError = error;
        const reason =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.error(
          `Failed to send email (type=${type}) to ${to} (attempt ${attempt}/${MAX_RETRIES}): ${reason}`,
        );

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  // ─── Provider Dispatch ──────────────────────────────────────────────────

  private async sendViaProvider(
    config: EmailProviderConfig,
    payload: EmailJobPayload & { from?: string },
  ): Promise<EmailSendResult> {
    switch (config.activeProvider) {
      case 'msg91':
        return this.sendViaMSG91(config, payload);
      case 'smtp':
        return this.sendViaSMTP(config, payload);
      case 'resend':
        return this.sendViaResend(config, payload);
      default:
        throw new Error(
          `Unsupported email provider: ${config.activeProvider}`,
        );
    }
  }

  private async sendViaMSG91(
    config: EmailProviderConfig,
    payload: EmailJobPayload & { from?: string },
  ): Promise<EmailSendResult> {
    const authKey = config.msg91?.authKey;
    if (!authKey) {
      throw new Error('MSG91 auth key not configured');
    }

    this.logger.debug(
      `Sending via MSG91 to ${payload.to} — subject: ${payload.subject}`,
    );

    // TODO: implement actual MSG91 API call
    // POST https://api.msg91.com/api/v5/email/send
    // Headers: { authkey: authKey, 'Content-Type': 'application/json' }
    // Body: { to: [{ email: payload.to }], from: { email: payload.from }, subject: payload.subject, ... }

    return {
      messageId: `msg91_${Date.now()}`,
      provider: 'msg91',
    };
  }

  private async sendViaSMTP(
    config: EmailProviderConfig,
    payload: EmailJobPayload & { from?: string },
  ): Promise<EmailSendResult> {
    const smtp = config.smtp;
    if (!smtp) {
      throw new Error('SMTP configuration not found');
    }

    this.logger.debug(
      `Sending via SMTP (${smtp.host}:${smtp.port}) to ${payload.to}`,
    );

    // TODO: implement actual SMTP sending with nodemailer
    // const transporter = nodemailer.createTransport({
    //   host: smtp.host,
    //   port: smtp.port,
    //   secure: smtp.secure,
    //   auth: { user: smtp.user, pass: smtp.pass },
    // });
    // const info = await transporter.sendMail({
    //   from: payload.from,
    //   to: payload.to,
    //   subject: payload.subject,
    //   html: payload.html,
    //   text: payload.text,
    // });

    return {
      messageId: `smtp_${Date.now()}`,
      provider: 'smtp',
    };
  }

  private async sendViaResend(
    config: EmailProviderConfig,
    payload: EmailJobPayload & { from?: string },
  ): Promise<EmailSendResult> {
    const apiKey = config.resend?.apiKey;
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }

    this.logger.debug(`Sending via Resend to ${payload.to}`);

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: payload.from ?? 'noreply@example.com',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
      ...(payload.replyTo ? { replyTo: [payload.replyTo] } : {}),
      ...(payload.attachments?.length
        ? {
            attachments: payload.attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, 'base64'),
              contentType: a.contentType,
            })),
          }
        : {}),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return {
      messageId: data?.id ?? `resend_${Date.now()}`,
      provider: 'resend',
    };
  }
}
