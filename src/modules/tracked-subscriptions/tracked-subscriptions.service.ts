import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AddTrackedSubscriptionDto,
  UpdateTrackedSubscriptionDto,
  QueryTrackedSubscriptionsDto,
} from './dto/index.js';

@Injectable()
export class TrackedSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, endUserId: string, query: QueryTrackedSubscriptionsDto) {
    const { category, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.trackedSubscription.findMany({
        where: {
          orgId,
          endUserId,
          deletedAt: null,
          ...(category ? { category } : {}),
          ...(status ? { status } : {}),
        },
        skip,
        take: limit,
        orderBy: { nextRenewalAt: 'asc' },
        select: {
          id: true,
          serviceName: true,
          domain: true,
          logoUrl: true,
          category: true,
          amountPaise: true,
          currency: true,
          billingCycle: true,
          nextRenewalAt: true,
          lastSeenAt: true,
          lastActivityAt: true,
          source: true,
          status: true,
          isFreeTrialDetected: true,
          freeTrialEndsAt: true,
          notes: true,
          createdAt: true,
        },
      }),
      this.prisma.trackedSubscription.count({
        where: {
          orgId,
          endUserId,
          deletedAt: null,
          ...(category ? { category } : {}),
          ...(status ? { status } : {}),
        },
      }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(orgId: string, endUserId: string, id: string) {
    const sub = await this.prisma.trackedSubscription.findFirst({
      where: { id, orgId, endUserId, deletedAt: null },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async create(orgId: string, endUserId: string, dto: AddTrackedSubscriptionDto) {
    return this.prisma.trackedSubscription.create({
      data: {
        orgId,
        endUserId,
        serviceName: dto.serviceName,
        category: dto.category,
        amountPaise: dto.amountPaise,
        currency: dto.currency ?? 'INR',
        billingCycle: dto.billingCycle,
        source: 'manual',
        isFreeTrialDetected: dto.isFreeTrialDetected ?? false,
        ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.nextRenewalAt !== undefined ? { nextRenewalAt: new Date(dto.nextRenewalAt) } : {}),
        ...(dto.freeTrialEndsAt !== undefined ? { freeTrialEndsAt: new Date(dto.freeTrialEndsAt) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      select: {
        id: true,
        serviceName: true,
        domain: true,
        logoUrl: true,
        category: true,
        amountPaise: true,
        currency: true,
        billingCycle: true,
        nextRenewalAt: true,
        source: true,
        status: true,
        isFreeTrialDetected: true,
        createdAt: true,
      },
    });
  }

  async update(orgId: string, endUserId: string, id: string, dto: UpdateTrackedSubscriptionDto) {
    await this.findOne(orgId, endUserId, id);

    return this.prisma.trackedSubscription.update({
      where: { id },
      data: {
        ...(dto.serviceName !== undefined ? { serviceName: dto.serviceName } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.amountPaise !== undefined ? { amountPaise: dto.amountPaise } : {}),
        ...(dto.billingCycle !== undefined ? { billingCycle: dto.billingCycle } : {}),
        ...(dto.nextRenewalAt !== undefined ? { nextRenewalAt: new Date(dto.nextRenewalAt) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(orgId: string, endUserId: string, id: string) {
    await this.findOne(orgId, endUserId, id);
    await this.prisma.trackedSubscription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Subscription removed' };
  }

  async summary(orgId: string, endUserId: string) {
    const subs = await this.prisma.trackedSubscription.findMany({
      where: { orgId, endUserId, status: 'active', deletedAt: null },
      select: { amountPaise: true, billingCycle: true, category: true },
    });

    const cycleMultiplier: Record<string, number> = {
      monthly: 1,
      quarterly: 1 / 3,
      half_yearly: 1 / 6,
      yearly: 1 / 12,
      weekly: 4.33,
      lifetime: 0,
    };

    let totalMonthlyPaise = 0;
    const byCategory: Record<string, number> = {};

    for (const sub of subs) {
      const monthly = Math.round(sub.amountPaise * (cycleMultiplier[sub.billingCycle] ?? 1));
      totalMonthlyPaise += monthly;
      byCategory[sub.category] = (byCategory[sub.category] ?? 0) + monthly;
    }

    return {
      totalMonthlyPaise,
      totalAnnualPaise: totalMonthlyPaise * 12,
      activeCount: subs.length,
      byCategory,
    };
  }
}
