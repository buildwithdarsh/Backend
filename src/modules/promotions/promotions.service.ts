import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  QueryPromotionsDto,
} from './dto/index.js';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure promotions feature is enabled for this org.
   */
  private async ensurePromotionsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'promotions_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Promotions are disabled for this store');
    }
  }

  // ─── Storefront ────────────────────────────────────────────────────────────

  /**
   * List active promotions within their date range (storefront).
   */
  async findActive(orgId: string) {
    await this.ensurePromotionsEnabled(orgId);
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: {
        orgId,
        isActive: true,
        deletedAt: null,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { priority: 'desc' },
    });
  }

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  /**
   * List all promotions with pagination (admin).
   */
  async findAll(orgId: string, query: QueryPromotionsDto) {
    await this.ensurePromotionsEnabled(orgId);
    const where: Prisma.PromotionWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single promotion (admin).
   */
  async findOne(orgId: string, id: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} not found`);
    }

    return promotion;
  }

  /**
   * Create a new promotion.
   */
  async create(orgId: string, dto: CreatePromotionDto) {
    await this.ensurePromotionsEnabled(orgId);
    const promotion = await this.prisma.promotion.create({
      data: {
        orgId,
        title: dto.title,
        type: dto.type,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
        imageUrl: dto.imageUrl ?? null,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.logger.log(`Promotion created: ${promotion.id} for org ${orgId}`);
    return promotion;
  }

  /**
   * Update a promotion.
   */
  async update(orgId: string, id: string, dto: UpdatePromotionDto) {
    await this.findOne(orgId, id);

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.config != null && { config: dto.config as Prisma.InputJsonValue }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
      },
    });

    this.logger.log(`Promotion updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a promotion.
   */
  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.promotion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Promotion soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Promotion deleted successfully' };
  }
}
