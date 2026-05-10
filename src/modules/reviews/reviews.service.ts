import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { CreateReviewDto, QueryReviewsDto } from './dto/index.js';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
    @Optional() private readonly loyaltyService?: LoyaltyService,
  ) {}

  /**
   * Ensure reviews feature is enabled for this org.
   */
  private async ensureReviewsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'reviews_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Reviews are disabled for this store');
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new review.
   */
  async create(orgId: string, endUserId: string, dto: CreateReviewDto) {
    await this.ensureReviewsEnabled(orgId);

    // ── OrgSettings: enforce mandatory rating ─────────────────────────────
    const ratingMandatory = await this.orgSettings.getTyped<boolean>(
      orgId, 'orders', 'rating_mandatory', false,
    );
    if (ratingMandatory && (!dto.rating || dto.rating < 1)) {
      throw new BadRequestException('Rating is required');
    }

    const review = await this.prisma.review.create({
      data: {
        orgId,
        endUserId,
        catalogItemId: dto.catalogItemId ?? null,
        commerceOrderId: dto.commerceOrderId ?? null,
        rating: dto.rating,
        title: dto.title ?? null,
        body: dto.body ?? null,
      },
    });

    // Award review bonus points
    try {
      const loyaltyEnabled = await this.orgSettings.getTyped<boolean>(orgId, 'loyalty', 'enabled', false);
      const reviewBonus = await this.orgSettings.getTyped<number>(orgId, 'loyalty', 'review_bonus', 0);
      if (loyaltyEnabled && reviewBonus > 0) {
        await this.loyaltyService?.earnPoints(orgId, endUserId, reviewBonus, 'Review bonus');
      }
    } catch (e) {
      // Don't fail review creation if bonus fails
    }

    this.logger.log(`Review created: ${review.id} by user ${endUserId} for org ${orgId}`);
    return review;
  }

  /**
   * Find reviews by catalog item.
   */
  async findByItem(orgId: string, itemId: string, query: QueryReviewsDto) {
    const where: Prisma.ReviewWhereInput = {
      orgId,
      catalogItemId: itemId,
      status: 'approved',
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { endUser: { select: { id: true, name: true } } },
      }),
      this.prisma.review.count({ where }),
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
   * List all reviews (admin) with pagination and filters.
   */
  async findAll(orgId: string, query: QueryReviewsDto) {
    const where: Prisma.ReviewWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.catalogItemId) {
      where.catalogItemId = query.catalogItemId;
    }

    if (query.minRating) {
      where.rating = { gte: query.minRating };
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { endUser: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.review.count({ where }),
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

  // ─── My Reviews ──────────────────────────────────────────────────────────

  /**
   * Get all reviews submitted by a specific end user.
   */
  async getMyReviews(orgId: string, endUserId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { orgId, endUserId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return { data: reviews };
  }

  // ─── Status Management ───────────────────────────────────────────────────

  /**
   * Approve or reject a review.
   */
  async updateStatus(orgId: string, id: string, status: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Review ${id} status updated to ${status} for org ${orgId}`);
    return updated;
  }

  // ─── Helpful Votes ──────────────────────────────────────────────────────

  /**
   * Vote a review as helpful (toggle).
   */
  async voteHelpful(orgId: string, reviewId: string, endUserId: string) {
    await this.ensureReviewsEnabled(orgId);

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, orgId, status: 'approved', deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    // Check if user already voted
    const existingVote = await this.prisma.reviewVote.findUnique({
      where: {
        orgId_reviewId_endUserId: {
          orgId,
          reviewId,
          endUserId,
        },
      },
    });

    if (existingVote) {
      // Remove vote
      await this.prisma.$transaction([
        this.prisma.reviewVote.delete({ where: { id: existingVote.id } }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);

      return { voted: false, helpfulCount: review.helpfulCount - 1 };
    }

    // Add vote
    await this.prisma.$transaction([
      this.prisma.reviewVote.create({
        data: { orgId, reviewId, endUserId },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);

    return { voted: true, helpfulCount: review.helpfulCount + 1 };
  }
}
