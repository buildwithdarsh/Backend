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
  CreateCouponDto,
  UpdateCouponDto,
  QueryCouponsDto,
} from './dto/index.js';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure coupons feature is enabled for this org.
   */
  private async ensureCouponsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'coupons_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Coupons are disabled for this store');
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new coupon.
   */
  async create(orgId: string, dto: CreateCouponDto) {
    await this.ensureCouponsEnabled(orgId);

    const coupon = await this.prisma.discountCoupon.create({
      data: {
        orgId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
        discountType: dto.discountType,
        discountValue: dto.discountValue ?? 0,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        maxUsageTotal: dto.maxUsageTotal ?? null,
        maxUsagePerUser: dto.maxUsagePerUser ?? 1,
        applicableVariantTypes: dto.applicableVariantTypes ?? [],
        applicableOrderTypes: dto.applicableOrderTypes ?? [],
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Coupon created: ${coupon.id} (${coupon.code}) for org ${orgId}`);
    return coupon;
  }

  /**
   * List coupons with pagination.
   */
  async findAll(orgId: string, query: QueryCouponsDto) {
    const where: Prisma.DiscountCouponWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.discountType) {
      where.discountType = query.discountType;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.discountCoupon.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.discountCoupon.count({ where }),
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
   * Get a single coupon.
   */
  async findOne(orgId: string, id: string) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { usages: { take: 20, orderBy: { createdAt: 'desc' } } },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon ${id} not found`);
    }

    return coupon;
  }

  /**
   * Update a coupon.
   */
  async update(orgId: string, id: string, dto: UpdateCouponDto) {
    await this.ensureCouponExists(orgId, id);

    const updated = await this.prisma.discountCoupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.toUpperCase() }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount ?? null }),
        ...(dto.maxDiscountAmount !== undefined && { maxDiscountAmount: dto.maxDiscountAmount ?? null }),
        ...(dto.maxUsageTotal !== undefined && { maxUsageTotal: dto.maxUsageTotal ?? null }),
        ...(dto.maxUsagePerUser !== undefined && { maxUsagePerUser: dto.maxUsagePerUser }),
        ...(dto.applicableVariantTypes !== undefined && { applicableVariantTypes: dto.applicableVariantTypes }),
        ...(dto.applicableOrderTypes !== undefined && { applicableOrderTypes: dto.applicableOrderTypes }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Coupon updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a coupon.
   */
  async remove(orgId: string, id: string) {
    await this.ensureCouponExists(orgId, id);

    await this.prisma.discountCoupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Coupon soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Coupon deleted successfully' };
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  /**
   * Validate a coupon code against usage limits, date range, min order, etc.
   */
  async validate(
    orgId: string,
    code: string,
    endUserId: string,
    orderAmount: number,
    variantType?: string,
    orderType?: string,
  ) {
    await this.ensureCouponsEnabled(orgId);

    const coupon = await this.prisma.discountCoupon.findFirst({
      where: {
        orgId,
        code: code.toUpperCase(),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    const now = new Date();

    // Check date range
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not yet active');
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check total usage limit
    if (coupon.maxUsageTotal !== null && coupon.usageCount >= coupon.maxUsageTotal) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check per-user usage limit
    const userUsageCount = await this.prisma.discountCouponUsage.count({
      where: { orgId, couponId: coupon.id, endUserId },
    });

    if (userUsageCount >= coupon.maxUsagePerUser) {
      throw new BadRequestException('You have already used this coupon the maximum number of times');
    }

    // Check minimum order amount
    if (coupon.minOrderAmount !== null && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of ${coupon.minOrderAmount} required`,
      );
    }

    // Check applicable variant types
    if (
      variantType &&
      coupon.applicableVariantTypes.length > 0 &&
      !coupon.applicableVariantTypes.includes(variantType)
    ) {
      throw new BadRequestException('Coupon is not applicable for this variant type');
    }

    // Check applicable order types
    if (
      orderType &&
      coupon.applicableOrderTypes.length > 0 &&
      !coupon.applicableOrderTypes.includes(orderType)
    ) {
      throw new BadRequestException('Coupon is not applicable for this order type');
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Number(coupon.discountValue);
    }
    // freeDelivery is handled at checkout level

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }

  /**
   * Record a coupon usage after successful order.
   */
  async recordUsage(
    orgId: string,
    couponId: string,
    endUserId: string,
    commerceOrderId: string | null,
    discountAmount: number,
  ) {
    const [usage] = await this.prisma.$transaction([
      this.prisma.discountCouponUsage.create({
        data: {
          orgId,
          couponId,
          endUserId,
          commerceOrderId,
          discountAmount,
        },
      }),
      this.prisma.discountCoupon.update({
        where: { id: couponId },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    this.logger.log(`Coupon usage recorded: coupon ${couponId}, user ${endUserId}`);
    return usage;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async ensureCouponExists(orgId: string, id: string) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${id} not found`);
    }
    return coupon;
  }
}
