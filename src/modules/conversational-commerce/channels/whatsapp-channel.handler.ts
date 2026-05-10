import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service.js';
import { META_WHATSAPP } from '../../../common/constants/providers.js';

interface ParsedIncoming {
  phone: string;
  text: string;
  messageType: string;
  externalMessageId?: string;
}

interface WhatsappCredentials {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
}

@Injectable()
export class WhatsappChannelHandler {
  private readonly logger = new Logger(WhatsappChannelHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Incoming ────────────────────────────────────────────────────────────

  /**
   * Parse an incoming Meta Cloud API webhook payload and extract
   * the sender phone, message text, and message type.
   *
   * Returns `null` if the payload is not a user message (e.g. status update).
   */
  parseIncoming(body: Record<string, unknown>): ParsedIncoming | null {
    try {
      const entry = (body['entry'] as unknown[]) ?? [];
      if (entry.length === 0) return null;

      const firstEntry = entry[0] as Record<string, unknown>;
      const changes = (firstEntry['changes'] as unknown[]) ?? [];
      if (changes.length === 0) return null;

      const change = changes[0] as Record<string, unknown>;
      const value = change['value'] as Record<string, unknown>;
      if (!value) return null;

      const messages = (value['messages'] as unknown[]) ?? [];
      if (messages.length === 0) return null;

      const msg = messages[0] as Record<string, unknown>;
      const phone = (msg['from'] as string) ?? '';
      const messageType = (msg['type'] as string) ?? 'text';
      const externalMessageId = msg['id'] as string | undefined;

      let text = '';
      if (messageType === 'text') {
        const textObj = msg['text'] as Record<string, unknown> | undefined;
        text = (textObj?.['body'] as string) ?? '';
      } else if (messageType === 'interactive') {
        const interactive = msg['interactive'] as Record<string, unknown> | undefined;
        const interactiveType = interactive?.['type'] as string;
        if (interactiveType === 'button_reply') {
          const buttonReply = interactive?.['button_reply'] as Record<string, unknown>;
          text = (buttonReply?.['id'] as string) ?? '';
        } else if (interactiveType === 'list_reply') {
          const listReply = interactive?.['list_reply'] as Record<string, unknown>;
          text = (listReply?.['id'] as string) ?? '';
        }
      }

      if (!phone) return null;

      return { phone, text, messageType, ...(externalMessageId ? { externalMessageId } : {}) };
    } catch (err) {
      this.logger.warn('Failed to parse incoming WhatsApp message', err);
      return null;
    }
  }

  // ─── Outgoing ────────────────────────────────────────────────────────────

  /**
   * Send a text message via the Meta Cloud API.
   *
   * Stub implementation — reads credentials from OrgSettings and
   * makes the API call. In production, integrate with your HTTP client.
   */
  async sendMessage(orgId: string, to: string, message: string): Promise<void> {
    const creds = await this.getCredentials(orgId);
    if (!creds) {
      this.logger.warn(`WhatsApp not configured for org ${orgId}, skipping send`);
      return;
    }

    const url = META_WHATSAPP.MESSAGES(creds.phoneNumberId);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`WhatsApp send failed (${response.status}): ${errorBody}`);
      }
    } catch (err) {
      this.logger.error('Failed to send WhatsApp message', err);
    }
  }

  // ─── Webhook Verification ────────────────────────────────────────────────

  /**
   * Verify the HMAC-SHA256 signature from Meta webhook payloads.
   */
  verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const expectedHash = signature.slice('sha256='.length);
    const computedHash = createHmac('sha256', appSecret).update(payload).digest('hex');

    return computedHash === expectedHash;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Read WhatsApp credentials from OrgSettings.
   * Keys expected under group "whatsapp":
   *   phone_number_id, access_token, app_secret
   */
  private async getCredentials(orgId: string): Promise<WhatsappCredentials | null> {
    const settings = await this.prisma.orgSettings.findMany({
      where: { orgId, group: 'whatsapp' },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    const phoneNumberId = map.get('phone_number_id');
    const accessToken = map.get('access_token');
    const appSecret = map.get('app_secret');

    if (!phoneNumberId || !accessToken || !appSecret) {
      return null;
    }

    return { phoneNumberId, accessToken, appSecret };
  }
}
