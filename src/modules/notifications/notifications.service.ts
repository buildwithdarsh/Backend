import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationWorker } from '../../workers/notification.worker.js';
import { SendNotificationDto } from './dto/send-notification.dto.js';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationWorker: NotificationWorker,
  ) {}

  /**
   * List all notifications for an organization with pagination and filters.
   */
  async findAll(orgId: string, dto: QueryNotificationsDto) {
    const where: Prisma.NotificationWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { body: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.notification.count({ where }),
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
   * Get a single notification by ID.
   */
  async findOne(orgId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return notification;
  }

  /**
   * Create a notification record with status=pending and queue it for delivery.
   */
  async send(orgId: string, dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        orgId,
        endUserId: dto.endUserId ?? null,
        userId: dto.userId ?? null,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl ?? null,
        data: (dto.data as Prisma.InputJsonValue) ?? null,
        status: 'pending',
      },
    });

    void this.notificationWorker.processJob({
      orgId,
      notificationId: notification.id,
      type: dto.type,
      endUserId: dto.endUserId,
      userId: dto.userId,
      templateId: dto.templateId,
      variables: dto.variables,
    }).catch(err => this.logger.error('Notification delivery failed', err));

    this.logger.log(
      `Notification queued: ${notification.id} (${dto.type}) for org ${orgId}`,
    );
    return notification;
  }

  /**
   * Create multiple notification records and queue them all for delivery.
   */
  async sendBulk(orgId: string, dto: SendBulkNotificationDto) {
    const notifications = await this.prisma.$transaction(
      dto.endUserIds.map((endUserId) =>
        this.prisma.notification.create({
          data: {
            orgId,
            endUserId,
            type: dto.type,
            title: dto.title,
            body: dto.body,
            imageUrl: dto.imageUrl ?? null,
            data: (dto.data as Prisma.InputJsonValue) ?? null,
            status: 'pending',
          },
        }),
      ),
    );

    const jobs = notifications.map((notification) => ({
      name: 'send-notification',
      data: {
        orgId,
        notificationId: notification.id,
        type: dto.type,
        endUserId: notification.endUserId,
        templateId: dto.templateId,
        variables: dto.variables,
      },
    }));

    void Promise.all(jobs.map(j => this.notificationWorker.processJob(j.data))).catch(err => this.logger.error('Notification bulk delivery failed', err));

    this.logger.log(
      `Bulk notifications queued: ${notifications.length} notifications for org ${orgId}`,
    );
    return {
      queued: notifications.length,
      notificationIds: notifications.map((n) => n.id),
    };
  }

  /**
   * Retry a failed notification by re-queuing it.
   */
  async resend(orgId: string, id: string) {
    const notification = await this.findOne(orgId, id);

    await this.prisma.notification.updateMany({
      where: { id, orgId },
      data: { status: 'pending', failedReason: null },
    });

    void this.notificationWorker.processJob({
      orgId,
      notificationId: notification.id,
      type: notification.type,
      endUserId: notification.endUserId,
      userId: notification.userId,
    }).catch(err => this.logger.error('Notification delivery failed', err));

    this.logger.log(`Notification re-queued: ${id} for org ${orgId}`);
    return { message: 'Notification re-queued for delivery' };
  }

  /**
   * List in-app notifications for an end user.
   */
  async getInApp(orgId: string, endUserId: string, dto: QueryNotificationsDto) {
    const where: Prisma.NotificationWhereInput = {
      orgId,
      endUserId,
      type: 'in_app',
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.notification.count({ where }),
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
   * Mark a single notification as read.
   */
  async markAsRead(orgId: string, id: string, endUserId?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, orgId, deletedAt: null, ...(endUserId ? { endUserId } : {}) },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    await this.prisma.notification.updateMany({
      where: { id, orgId },
      data: { readAt: new Date() },
    });

    return this.prisma.notification.findFirst({ where: { id, orgId } });
  }

  /**
   * Mark all in-app notifications as read for an end user.
   */
  async markAllAsRead(orgId: string, endUserId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        orgId,
        endUserId,
        type: 'in_app',
        readAt: null,
        deletedAt: null,
      },
      data: { readAt: new Date() },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for end user ${endUserId} in org ${orgId}`,
    );
    return { markedAsRead: result.count };
  }

  /**
   * Get the count of unread in-app notifications for an end user.
   */
  async getUnreadCount(orgId: string, endUserId: string) {
    const count = await this.prisma.notification.count({
      where: {
        orgId,
        endUserId,
        type: 'in_app',
        readAt: null,
        deletedAt: null,
      },
    });

    return { unreadCount: count };
  }
}
