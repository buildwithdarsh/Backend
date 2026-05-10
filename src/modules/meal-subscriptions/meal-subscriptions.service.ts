import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateMealSubscriptionDto,
  QueryMealSubscriptionsDto,
} from './dto/index.js';

@Injectable()
export class MealSubscriptionsService {
  private readonly logger = new Logger(MealSubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Admin ──────────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryMealSubscriptionsDto) {
    const where: Prisma.MealSubscriptionWhereInput = { orgId };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.mealSubscription.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          mealPlan: { select: { name: true } },
          endUser: { select: { name: true, phone: true } },
        },
      }),
      this.prisma.mealSubscription.count({ where }),
    ]);

    return {
      data: data.map(({ mealPlan, endUser, ...rest }) => ({
        ...rest,
        userName: endUser.name,
        userPhone: endUser.phone,
        mealPlanName: mealPlan.name,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const sub = await this.prisma.mealSubscription.findFirst({
      where: { id, orgId },
      include: {
        mealPlan: true,
        endUser: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!sub) {
      throw new NotFoundException(`Meal subscription ${id} not found`);
    }

    return sub;
  }

  // ─── Storefront ─────────────────────────────────────────────────────────

  async subscribe(orgId: string, endUserId: string, dto: CreateMealSubscriptionDto) {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: dto.mealPlanId, orgId, isActive: true, deletedAt: null },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found or inactive');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + mealPlan.durationDays);

    const subscription = await this.prisma.mealSubscription.create({
      data: {
        orgId,
        mealPlanId: dto.mealPlanId,
        endUserId,
        status: 'active',
        startDate,
        endDate,
        deliveryTime: dto.deliveryTime ?? null,
      },
      include: { mealPlan: { select: { name: true } } },
    });

    this.logger.log(
      `Meal subscription created: ${subscription.id} for user ${endUserId} on plan ${mealPlan.name}`,
    );

    return subscription;
  }

  async mySubscriptions(orgId: string, endUserId: string) {
    return this.prisma.mealSubscription.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
      include: { mealPlan: { select: { name: true, price: true, durationDays: true } } },
    });
  }

  async cancel(orgId: string, id: string, endUserId: string) {
    const sub = await this.prisma.mealSubscription.findFirst({
      where: { id, orgId, endUserId },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    if (sub.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.mealSubscription.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    this.logger.log(`Meal subscription ${id} cancelled by user ${endUserId}`);
    return updated;
  }
}
