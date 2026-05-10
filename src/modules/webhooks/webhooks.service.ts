import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { WebhookWorker } from '../../workers/webhook.worker.js';
import { PrismaService } from '../../database/prisma.service.js';
import { EncryptionService } from '../../services/encryption/encryption.service.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';
import { UpdateWebhookDto } from './dto/update-webhook.dto.js';
import { QueryWebhookLogsDto } from './dto/query-webhook-logs.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly webhookWorker: WebhookWorker,
  ) {}

  /**
   * List all webhooks for an organization.
   */
  async findAll(orgId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      omit: { secretHash: true },
    });

    return { data: webhooks };
  }

  /**
   * Get a single webhook by ID (safe — no secretHash).
   */
  async findOne(orgId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId, deletedAt: null },
      omit: { secretHash: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }

    return webhook;
  }

  /**
   * Internal: get webhook with secretHash (for queue workers / test delivery).
   */
  private async findOneInternal(orgId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }

    return webhook;
  }

  /**
   * Create a new webhook with an auto-generated HMAC signing secret.
   */
  async create(orgId: string, dto: CreateWebhookDto, createdBy: string) {
    // Generate a random secret for HMAC signing
    const secret = randomBytes(32).toString('hex');
    // Store encrypted secret so the worker can decrypt and sign payloads
    const secretHash = this.encryptionService.encrypt(secret);

    const webhook = await this.prisma.webhook.create({
      data: {
        orgId,
        name: dto.name,
        url: dto.url,
        events: dto.events,
        secretHash,
        maxRetries: dto.maxRetries ?? 3,
        createdBy,
      },
    });

    this.logger.log(`Webhook created: ${webhook.id} for org ${orgId}`);

    // Return the raw secret only on creation so the user can store it
    const { secretHash: _omitted, ...safeWebhook } = webhook;
    return {
      ...safeWebhook,
      secret,
    };
  }

  /**
   * Update an existing webhook.
   */
  async update(orgId: string, id: string, dto: UpdateWebhookDto) {
    await this.findOne(orgId, id);

    const updated = await this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.maxRetries !== undefined && { maxRetries: dto.maxRetries }),
      },
      omit: { secretHash: true },
    });

    this.logger.log(`Webhook updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a webhook.
   */
  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.webhook.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Webhook soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Webhook deleted successfully' };
  }

  /**
   * Send a test event payload to a webhook URL and log the result.
   */
  async test(orgId: string, id: string) {
    const webhook = await this.findOneInternal(orgId, id);

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test event from Darsh Gupta',
        webhookId: webhook.id,
      },
    };

    // Fire-and-forget test delivery
    void this.webhookWorker.processJob({
      orgId,
      webhookId: webhook.id,
      webhookLogId: '',
      url: webhook.url,
      event: 'webhook.test',
      payload: testPayload,
      secretHash: webhook.secretHash ?? '',
      attemptNumber: 1,
      maxRetries: 0,
      isTest: true,
    }).catch(err => this.logger.error('Webhook delivery failed', err));

    this.logger.log(`Test event queued for webhook: ${id} in org ${orgId}`);
    return { message: 'Test event queued for delivery', payload: testPayload };
  }

  /**
   * Get paginated delivery logs for a webhook.
   */
  async getLogs(orgId: string, webhookId: string, dto: QueryWebhookLogsDto) {
    await this.findOne(orgId, webhookId);

    const where: Prisma.WebhookLogWhereInput = {
      orgId,
      webhookId,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    const orderBy: Prisma.WebhookLogOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  /**
   * Retry a failed webhook delivery log by re-queuing it.
   */
  async retryLog(orgId: string, webhookId: string, logId: string) {
    const webhook = await this.findOneInternal(orgId, webhookId);

    const log = await this.prisma.webhookLog.findFirst({
      where: { id: logId, orgId, webhookId },
    });

    if (!log) {
      throw new NotFoundException(`Webhook log ${logId} not found`);
    }

    void this.webhookWorker.processJob({
      orgId,
      webhookId,
      webhookLogId: logId,
      url: webhook.url,
      event: log.event,
      payload: (log.payload ?? {}) as Record<string, unknown>,
      secretHash: webhook.secretHash ?? '',
      maxRetries: webhook.maxRetries,
      attemptNumber: (log.attemptNumber ?? 0) + 1,
    }).catch(err => this.logger.error('Webhook delivery failed', err));

    this.logger.log(
      `Webhook log ${logId} retry queued for webhook ${webhookId} in org ${orgId}`,
    );
    return { message: 'Webhook delivery retry queued' };
  }

  /**
   * Trigger an event across all active webhooks registered for that event in an org.
   * Creates webhook log records and queues deliveries.
   */
  async triggerEvent(orgId: string, event: string, payload: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        orgId,
        isActive: true,
        deletedAt: null,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(
        `No active webhooks for event "${event}" in org ${orgId}`,
      );
      return { triggered: 0 };
    }

    const now = new Date();
    const eventPayload = {
      event,
      timestamp: now.toISOString(),
      data: payload as Prisma.InputJsonValue,
    };

    // Create log entries and queue deliveries
    const jobs = await Promise.all(
      webhooks.map(async (webhook) => {
        const log = await this.prisma.webhookLog.create({
          data: {
            orgId,
            webhookId: webhook.id,
            event,
            payload: eventPayload as Prisma.InputJsonValue,
            status: 'pending',
            triggeredAt: now,
          },
        });

        return {
          name: 'deliver-webhook',
          data: {
            orgId,
            webhookId: webhook.id,
            webhookLogId: log.id,
            url: webhook.url,
            event,
            payload: eventPayload,
            secretHash: webhook.secretHash ?? '',
            maxRetries: webhook.maxRetries,
            attemptNumber: 1,
          },
        };
      }),
    );

    void Promise.all(jobs.map(j => this.webhookWorker.processJob(j.data))).catch(err => this.logger.error('Webhook bulk delivery failed', err));

    this.logger.log(
      `Event "${event}" triggered for ${webhooks.length} webhook(s) in org ${orgId}`,
    );
    return { triggered: webhooks.length };
  }
}
