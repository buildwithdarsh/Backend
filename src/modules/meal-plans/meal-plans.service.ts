import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateMealPlanDto,
  UpdateMealPlanDto,
  QueryMealPlansDto,
} from './dto/index.js';

@Injectable()
export class MealPlansService {
  private readonly logger = new Logger(MealPlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated list of meal plans for an org.
   */
  async findAll(orgId: string, query: QueryMealPlansDto) {
    const where: Prisma.MealPlanWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.mealPlan.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { subscriptions: true } } },
      }),
      this.prisma.mealPlan.count({ where }),
    ]);

    return {
      data: data.map(({ _count, ...rest }) => ({
        ...rest,
        subscriptionsCount: _count.subscriptions,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single meal plan by id.
   */
  async findOne(orgId: string, id: string) {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (!mealPlan) {
      throw new NotFoundException(`Meal plan ${id} not found`);
    }

    const { _count, ...rest } = mealPlan;
    return { ...rest, subscriptionsCount: _count.subscriptions };
  }

  /**
   * Create a new meal plan.
   */
  async create(orgId: string, dto: CreateMealPlanDto) {
    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        durationDays: dto.durationDays,
        items: (dto.items as Prisma.InputJsonValue) ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Meal plan created: ${mealPlan.id} for org ${orgId}`);
    return mealPlan;
  }

  /**
   * Update a meal plan.
   */
  async update(orgId: string, id: string, dto: UpdateMealPlanDto) {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Meal plan ${id} not found`);
    }

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.items != null && { items: dto.items as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Meal plan updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a meal plan.
   */
  async remove(orgId: string, id: string) {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Meal plan ${id} not found`);
    }

    await this.prisma.mealPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Meal plan soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Meal plan deleted successfully' };
  }
}
