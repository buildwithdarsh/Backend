import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
} from './dto/index.js';

/** Priority order for pricing rule types (higher = overrides lower). */
const TYPE_PRIORITY: Record<string, number> = {
  base: 0,
  weekend: 10,
  seasonal: 20,
  festival: 30,
  discount: 40,
};

@Injectable()
export class PropertyPricingService {
  private readonly logger = new Logger(PropertyPricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a pricing rule.
   */
  async createRule(orgId: string, dto: CreatePricingRuleDto) {
    const rule = await this.prisma.propertyPricingRule.create({
      data: {
        orgId,
        propertyTypeId: dto.propertyTypeId ?? null,
        name: dto.name,
        type: dto.type,
        price: dto.price ?? null,
        multiplier: dto.multiplier ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        daysOfWeek: dto.daysOfWeek ?? [],
        minStay: dto.minStay ?? null,
        maxStay: dto.maxStay ?? null,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Pricing rule created: ${rule.id} (${rule.name}) for org ${orgId}`);
    return rule;
  }

  /**
   * List all pricing rules.
   */
  async findAll(orgId: string, propertyTypeId?: string) {
    const where: Prisma.PropertyPricingRuleWhereInput = { orgId };
    if (propertyTypeId) {
      where.propertyTypeId = propertyTypeId;
    }

    return this.prisma.propertyPricingRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { type: 'asc' }],
      include: {
        propertyType: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Update a pricing rule.
   */
  async updateRule(orgId: string, id: string, dto: UpdatePricingRuleDto) {
    const existing = await this.prisma.propertyPricingRule.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Pricing rule ${id} not found`);
    }

    const updated = await this.prisma.propertyPricingRule.update({
      where: { id },
      data: {
        ...(dto.propertyTypeId !== undefined && { propertyTypeId: dto.propertyTypeId ?? null }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.price !== undefined && { price: dto.price ?? null }),
        ...(dto.multiplier !== undefined && { multiplier: dto.multiplier ?? null }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.daysOfWeek !== undefined && { daysOfWeek: dto.daysOfWeek }),
        ...(dto.minStay !== undefined && { minStay: dto.minStay ?? null }),
        ...(dto.maxStay !== undefined && { maxStay: dto.maxStay ?? null }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Pricing rule updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Delete a pricing rule.
   */
  async removeRule(orgId: string, id: string) {
    const existing = await this.prisma.propertyPricingRule.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Pricing rule ${id} not found`);
    }

    await this.prisma.propertyPricingRule.delete({ where: { id } });

    this.logger.log(`Pricing rule deleted: ${id} for org ${orgId}`);
    return { message: 'Pricing rule deleted successfully' };
  }

  // ─── Price Resolution ─────────────────────────────────────────────────────

  /**
   * Resolve effective price for a property type over a stay.
   *
   * For each night, finds the highest-priority applicable rule and uses its
   * price (override) or multiplier against the property type's base price.
   *
   * Rule applicability:
   *   - Must be active
   *   - Must target this property type (or be org-wide: propertyTypeId = null)
   *   - Date range (startDate..endDate) must cover the night, if specified
   *   - Day of week must match, if specified
   *   - Stay length must be within minStay..maxStay, if specified
   *
   * Priority is resolved first by explicit `priority` field, then by
   * type priority (festival > seasonal > weekend > base > discount).
   */
  async resolvePrice(
    orgId: string,
    propertyTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    guestCount = 1,
  ) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Fetch property type for base price and max guests
    const propertyType = await this.prisma.propertyType.findFirst({
      where: { id: propertyTypeId, orgId, deletedAt: null },
    });

    if (!propertyType) {
      throw new NotFoundException('Property type not found');
    }

    // Fetch all active rules for this property type (and org-wide)
    const rules = await this.prisma.propertyPricingRule.findMany({
      where: {
        orgId,
        isActive: true,
        OR: [
          { propertyTypeId },
          { propertyTypeId: null },
        ],
      },
    });

    // Calculate nightly breakdown
    const nightlyBreakdown: Array<{
      date: string;
      basePrice: number;
      effectivePrice: number;
      ruleName: string | null;
      ruleType: string | null;
    }> = [];

    let totalBaseAmount = 0;

    for (let i = 0; i < nights; i++) {
      const nightDate = new Date(checkIn);
      nightDate.setDate(nightDate.getDate() + i);
      const dayOfWeek = nightDate.getDay();
      const dateStr = nightDate.toISOString().slice(0, 10);

      // Find best applicable rule
      let bestRule: (typeof rules)[0] | null = null;
      let bestPriority = -1;

      for (const rule of rules) {
        // Check date range
        if (rule.startDate && nightDate < rule.startDate) continue;
        if (rule.endDate && nightDate > rule.endDate) continue;

        // Check day of week
        if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }

        // Check stay length
        if (rule.minStay && nights < rule.minStay) continue;
        if (rule.maxStay && nights > rule.maxStay) continue;

        // Calculate effective priority
        const effectivePriority =
          rule.priority * 100 + (TYPE_PRIORITY[rule.type] ?? 0);

        if (effectivePriority > bestPriority) {
          bestPriority = effectivePriority;
          bestRule = rule;
        }
      }

      // Calculate price for this night
      let nightPrice = propertyType.basePrice;

      if (bestRule) {
        if (bestRule.price != null) {
          nightPrice = bestRule.price;
        } else if (bestRule.multiplier != null) {
          nightPrice = Math.round(
            propertyType.basePrice * Number(bestRule.multiplier),
          );
        }
      }

      totalBaseAmount += nightPrice;

      nightlyBreakdown.push({
        date: dateStr,
        basePrice: propertyType.basePrice,
        effectivePrice: nightPrice,
        ruleName: bestRule?.name ?? null,
        ruleType: bestRule?.type ?? null,
      });
    }

    // Extra guest charges
    const extraGuestCharge =
      guestCount > propertyType.maxGuests
        ? (guestCount - propertyType.maxGuests) *
          Math.round(propertyType.basePrice * 0.3) *
          nights
        : 0;

    // Tax (18% GST default)
    const taxRate = 0.18;
    const taxAmount = Math.round((totalBaseAmount + extraGuestCharge) * taxRate);
    const totalAmount = totalBaseAmount + extraGuestCharge + taxAmount;

    return {
      propertyTypeId,
      checkInDate,
      checkOutDate,
      nights,
      guestCount,
      baseAmount: totalBaseAmount,
      extraGuestCharge,
      taxAmount,
      taxRate,
      totalAmount,
      nightlyBreakdown,
    };
  }
}
