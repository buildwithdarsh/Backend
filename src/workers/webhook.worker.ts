import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../database/prisma.service.js';
import { EncryptionService } from '../services/encryption/encryption.service.js';

// ─── Job Payload ────────────────────────────────────────────────────────────

export interface WebhookJobPayload {
  orgId: string;
  webhookId: string;
  webhookLogId: string;
  url: string;
  event: string;
  payload: Record<string, unknown>;
  secretHash: string; // encrypted secret (decrypted at delivery time)
  attemptNumber: number;
  maxRetries?: number;
  isTest?: boolean;
}

// ─── Retry intervals in milliseconds ────────────────────────────────────────

const RETRY_DELAYS_MS = [
  1 * 60 * 1000,   // 1 minute
  5 * 60 * 1000,   // 5 minutes
  30 * 60 * 1000,  // 30 minutes
];

// ─── Worker ─────────────────────────────────────────────────────────────────

@Injectable()
export class WebhookWorker {
  private readonly logger = new Logger(WebhookWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async processJob(payload: WebhookJobPayload): Promise<void> {
    const {
      webhookId,
      webhookLogId,
      url,
      event,
      payload: webhookPayload,
      secretHash,
      attemptNumber,
    } = payload;

    this.logger.log(
      `Delivering webhook ${webhookId} (event=${event}) to ${url} — attempt ${attemptNumber}`,
    );

    const serializedPayload = JSON.stringify(webhookPayload);

    // Decrypt the secret and generate HMAC-SHA256 signature
    const secret = this.encryptionService.decrypt(secretHash);
    const signature = this.generateSignature(serializedPayload, secret);

    let responseStatus: number | undefined;
    let responseBody: string | undefined;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DarshGupta-Signature': signature,
          'X-DarshGupta-Event': event,
          'X-DarshGupta-Delivery': webhookLogId,
          'User-Agent': 'DarshGupta-Webhook/1.0',
        },
        body: serializedPayload,
        signal: AbortSignal.timeout(30_000), // 30 second timeout
      });

      responseStatus = response.status;
      responseBody = await response.text().catch(() => '');

      // Truncate response body for storage
      if (responseBody.length > 2000) {
        responseBody = responseBody.slice(0, 2000) + '... [truncated]';
      }

      if (response.ok) {
        // Success: update webhook_log
        await this.prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            status: 'success',
            responseStatus,
            responseBody,
            attemptNumber,
          },
        });

        // Update webhook metadata
        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: {
            lastTriggeredAt: new Date(),
            lastStatusCode: responseStatus,
            failureCount: 0,
          },
        });

        this.logger.log(
          `Webhook ${webhookId} delivered successfully (status=${responseStatus})`,
        );
        return;
      }

      // Non-2xx response: treat as failure
      throw new Error(
        `Webhook endpoint returned status ${responseStatus}`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn(
        `Webhook ${webhookId} delivery failed (attempt ${attemptNumber}): ${reason}`,
      );

      // Determine if we should retry
      const maxAttempts = RETRY_DELAYS_MS.length + 1; // first attempt + retries
      if (attemptNumber >= maxAttempts) {
        // Exhausted all retries
        await this.prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            status: 'exhausted',
            responseStatus: responseStatus ?? null,
            responseBody: responseBody ?? reason.slice(0, 2000),
            attemptNumber,
          },
        });

        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: {
            lastTriggeredAt: new Date(),
            lastStatusCode: responseStatus ?? null,
            failureCount: { increment: 1 },
          },
        });

        this.logger.error(
          `Webhook ${webhookId} exhausted all ${maxAttempts} attempts`,
        );
        return; // Don't re-throw: the job is done
      }

      // Schedule next retry
      const retryDelay = RETRY_DELAYS_MS[attemptNumber - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!;
      const nextRetryAt = new Date(Date.now() + retryDelay!);

      await this.prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          status: 'failed',
          responseStatus: responseStatus ?? null,
          responseBody: responseBody ?? reason.slice(0, 2000),
          attemptNumber,
          nextRetryAt,
        },
      });

      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          lastStatusCode: responseStatus ?? null,
          failureCount: { increment: 1 },
        },
      });

      this.logger.warn(
        `Webhook ${webhookId} will retry at ${nextRetryAt.toISOString()}`,
      );
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private generateSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${hmac}`;
  }
}
