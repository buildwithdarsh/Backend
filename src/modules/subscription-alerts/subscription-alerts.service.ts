import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { QuerySubscriptionAlertsDto } from './dto/index.js';

@Injectable()
export class SubscriptionAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, endUserId: string, query: QuerySubscriptionAlertsDto) {
    const { undismissed, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.subscriptionAlert.findMany({
        where: {
          orgId,
          endUserId,
          ...(undismissed === true ? { isDismissed: false } : {}),
        },
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          alertType: true,
          daysUntilRenewal: true,
          amountPaise: true,
          previousAmountPaise: true,
          scheduledAt: true,
          sentAt: true,
          isDismissed: true,
          createdAt: true,
          trackedSubscription: {
            select: {
              id: true,
              serviceName: true,
              logoUrl: true,
              category: true,
              billingCycle: true,
            },
          },
        },
      }),
      this.prisma.subscriptionAlert.count({
        where: {
          orgId,
          endUserId,
          ...(undismissed === true ? { isDismissed: false } : {}),
        },
      }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async dismiss(orgId: string, endUserId: string, alertId: string) {
    const alert = await this.prisma.subscriptionAlert.findFirst({
      where: { id: alertId, orgId, endUserId },
    });

    if (!alert) throw new NotFoundException('Alert not found');

    await this.prisma.subscriptionAlert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });

    return { message: 'Alert dismissed' };
  }

  async dismissAll(orgId: string, endUserId: string) {
    await this.prisma.subscriptionAlert.updateMany({
      where: { orgId, endUserId, isDismissed: false },
      data: { isDismissed: true },
    });

    return { message: 'All alerts dismissed' };
  }
}
