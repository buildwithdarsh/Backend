import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateCampaignDto } from './dto/create-campaign.dto.js';
import type { UpdateCampaignDto } from './dto/update-campaign.dto.js';
import type { UpdateSliceDto, ReorderSlicesDto } from './dto/update-slice.dto.js';
import type { QueryCampaignsDto, QueryLeadsDto, QueryAnalyticsDto } from './dto/query-campaigns.dto.js';
import type { StorefrontSpinDto, StorefrontImpressionDto } from './dto/storefront-spin.dto.js';

@Injectable()
export class SpinWheelsService {
  private readonly logger = new Logger(SpinWheelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Campaign CRUD ──────────────────────────────────────────────────────────

  async createCampaign(orgId: string, dto: CreateCampaignDto) {
    if (!dto.slices || dto.slices.length < 2) {
      throw new BadRequestException('At least 2 slices are required');
    }
    if (dto.slices.length > 12) {
      throw new BadRequestException('Maximum 12 slices allowed');
    }

    const totalProbability = dto.slices.reduce((sum, s) => sum + s.probability, 0);
    if (Math.abs(totalProbability - 100) > 0.01) {
      throw new BadRequestException(`Probabilities must total 100% (got ${totalProbability}%)`);
    }

    const campaign = await this.prisma.spinWheelCampaign.create({
      data: {
        orgId,
        shopDomain: dto.shopDomain,
        name: dto.name,
        triggerType: dto.triggerType ?? 'PAGE_LOAD',
        triggerValue: dto.triggerValue ?? null,
        frequencyCap: dto.frequencyCap ?? 'ONCE_SESSION',
        deviceTarget: dto.deviceTarget ?? 'ALL',
        collectEmail: dto.collectEmail ?? true,
        collectPhone: dto.collectPhone ?? false,
        collectName: dto.collectName ?? false,
        formPosition: dto.formPosition ?? 'BEFORE_SPIN',
        theme: (dto.theme ?? {}) as Prisma.InputJsonValue,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        slices: {
          create: dto.slices.map((s, i) => ({
            organization: { connect: { id: orgId } },
            label: s.label,
            color: s.color,
            textColor: s.textColor ?? '#FFFFFF',
            prizeType: s.prizeType,
            prizeValue: s.prizeValue != null ? new Prisma.Decimal(s.prizeValue) : null,
            probability: new Prisma.Decimal(s.probability),
            maxRedemptions: s.maxRedemptions ?? null,
            sortOrder: s.sortOrder ?? i,
          })),
        },
      },
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
    });

    this.logger.log(`Campaign created: ${campaign.id} for shop ${dto.shopDomain}`);
    return campaign;
  }

  async findAllCampaigns(orgId: string, query: QueryCampaignsDto) {
    const where: Prisma.SpinWheelCampaignWhereInput = { orgId, deletedAt: null };
    if (query.shopDomain) where.shopDomain = query.shopDomain;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.spinWheelCampaign.findMany({
        where,
        include: { slices: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.spinWheelCampaign.count({ where }),
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

  async findCampaignById(orgId: string, id: string) {
    const campaign = await this.prisma.spinWheelCampaign.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(orgId: string, id: string, dto: UpdateCampaignDto) {
    await this.findCampaignById(orgId, id);

    const data: Prisma.SpinWheelCampaignUpdateInput = {};
    if (dto.name != null) data.name = dto.name;
    if (dto.triggerType != null) data.triggerType = dto.triggerType;
    if (dto.triggerValue !== undefined) data.triggerValue = dto.triggerValue ?? null;
    if (dto.frequencyCap != null) data.frequencyCap = dto.frequencyCap;
    if (dto.deviceTarget != null) data.deviceTarget = dto.deviceTarget;
    if (dto.collectEmail != null) data.collectEmail = dto.collectEmail;
    if (dto.collectPhone != null) data.collectPhone = dto.collectPhone;
    if (dto.collectName != null) data.collectName = dto.collectName;
    if (dto.formPosition != null) data.formPosition = dto.formPosition;
    if (dto.theme != null) data.theme = dto.theme as Prisma.InputJsonValue;
    if (dto.scheduledStart !== undefined) data.scheduledStart = dto.scheduledStart ? new Date(dto.scheduledStart) : null;
    if (dto.scheduledEnd !== undefined) data.scheduledEnd = dto.scheduledEnd ? new Date(dto.scheduledEnd) : null;

    return this.prisma.spinWheelCampaign.update({
      where: { id },
      data,
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async updateCampaignStatus(orgId: string, id: string, status: string) {
    const campaign = await this.findCampaignById(orgId, id);

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE'],
      ACTIVE: ['PAUSED', 'ENDED'],
      PAUSED: ['ACTIVE', 'ENDED'],
      ENDED: [],
    };

    if (!validTransitions[campaign.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${campaign.status} to ${status}`,
      );
    }

    if (status === 'ACTIVE' && campaign.slices.length < 2) {
      throw new BadRequestException('Campaign needs at least 2 slices to activate');
    }

    return this.prisma.spinWheelCampaign.update({
      where: { id },
      data: { status },
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async deleteCampaign(orgId: string, id: string) {
    await this.findCampaignById(orgId, id);
    await this.prisma.spinWheelCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Slice CRUD ─────────────────────────────────────────────────────────────

  async addSlice(orgId: string, campaignId: string, dto: UpdateSliceDto & { label: string; color: string; prizeType: string; probability: number }) {
    const campaign = await this.findCampaignById(orgId, campaignId);
    if (campaign.slices.length >= 12) {
      throw new BadRequestException('Maximum 12 slices per campaign');
    }

    return this.prisma.spinWheelSlice.create({
      data: {
        orgId,
        campaignId,
        label: dto.label,
        color: dto.color,
        textColor: dto.textColor ?? '#FFFFFF',
        prizeType: dto.prizeType,
        prizeValue: dto.prizeValue != null ? new Prisma.Decimal(dto.prizeValue) : null,
        probability: new Prisma.Decimal(dto.probability),
        maxRedemptions: dto.maxRedemptions ?? null,
        sortOrder: dto.sortOrder ?? campaign.slices.length,
      },
    });
  }

  async updateSlice(orgId: string, campaignId: string, sliceId: string, dto: UpdateSliceDto) {
    const slice = await this.prisma.spinWheelSlice.findFirst({
      where: { id: sliceId, campaignId, orgId },
    });
    if (!slice) throw new NotFoundException('Slice not found');

    const data: Prisma.SpinWheelSliceUpdateInput = {};
    if (dto.label != null) data.label = dto.label;
    if (dto.color != null) data.color = dto.color;
    if (dto.textColor != null) data.textColor = dto.textColor;
    if (dto.prizeType != null) data.prizeType = dto.prizeType;
    if (dto.prizeValue !== undefined) data.prizeValue = dto.prizeValue != null ? new Prisma.Decimal(dto.prizeValue) : null;
    if (dto.probability != null) data.probability = new Prisma.Decimal(dto.probability);
    if (dto.maxRedemptions !== undefined) data.maxRedemptions = dto.maxRedemptions ?? null;
    if (dto.sortOrder != null) data.sortOrder = dto.sortOrder;

    return this.prisma.spinWheelSlice.update({
      where: { id: sliceId },
      data,
    });
  }

  async deleteSlice(orgId: string, campaignId: string, sliceId: string) {
    const campaign = await this.findCampaignById(orgId, campaignId);
    if (campaign.slices.length <= 2) {
      throw new BadRequestException('Campaign must have at least 2 slices');
    }

    const slice = campaign.slices.find(s => s.id === sliceId);
    if (!slice) throw new NotFoundException('Slice not found');

    await this.prisma.spinWheelSlice.delete({ where: { id: sliceId } });
  }

  async reorderSlices(orgId: string, campaignId: string, dto: ReorderSlicesDto) {
    await this.findCampaignById(orgId, campaignId);

    await this.prisma.$transaction(
      dto.sliceIds.map((id, index) =>
        this.prisma.spinWheelSlice.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findCampaignById(orgId, campaignId);
  }

  // ─── Storefront (Public) ────────────────────────────────────────────────────

  async getActiveCampaign(shopDomain: string) {
    const now = new Date();

    const campaign = await this.prisma.spinWheelCampaign.findFirst({
      where: {
        shopDomain,
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { scheduledStart: null },
          { scheduledStart: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { scheduledEnd: null },
              { scheduledEnd: { gte: now } },
            ],
          },
        ],
      },
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return campaign;
  }

  async recordSpin(dto: StorefrontSpinDto, ipAddress?: string, userAgent?: string) {
    const campaign = await this.prisma.spinWheelCampaign.findFirst({
      where: { id: dto.campaignId, shopDomain: dto.shopDomain, status: 'ACTIVE', deletedAt: null },
      include: { slices: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!campaign) throw new NotFoundException('Campaign not found or inactive');

    // ─── Weighted random prize selection ──────────────────────────────────
    const eligibleSlices = campaign.slices.filter(
      s => !s.maxRedemptions || s.currentRedemptions < s.maxRedemptions,
    );

    if (eligibleSlices.length === 0) {
      throw new BadRequestException('No prizes available');
    }

    const totalWeight = eligibleSlices.reduce(
      (sum, s) => sum + Number(s.probability), 0,
    );
    let random = Math.random() * totalWeight;
    let selectedSlice = eligibleSlices[0]!;

    for (const slice of eligibleSlices) {
      random -= Number(slice.probability);
      if (random <= 0) {
        selectedSlice = slice;
        break;
      }
    }

    // Generate discount code for winning slices
    let discountCode: string | null = null;
    if (selectedSlice.prizeType !== 'NO_PRIZE') {
      discountCode = `SW-${campaign.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Record the spin
    const spin = await this.prisma.$transaction(async (tx) => {
      // Increment slice redemption count
      if (selectedSlice.prizeType !== 'NO_PRIZE') {
        await tx.spinWheelSlice.update({
          where: { id: selectedSlice.id },
          data: { currentRedemptions: { increment: 1 } },
        });
      }

      // Create spin record
      const spinRecord = await tx.spinWheelSpin.create({
        data: {
          orgId: campaign.orgId,
          campaignId: campaign.id,
          sliceId: selectedSlice.id,
          customerEmail: dto.email ?? null,
          customerPhone: dto.phone ?? null,
          customerName: dto.name ?? null,
          discountCode,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });

      // Update daily analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updateData: Prisma.SpinWheelAnalyticsUpdateInput = {
        spins: { increment: 1 },
      };
      if (dto.email) updateData.emailsCaptured = { increment: 1 };
      if (dto.phone) updateData.phonesCaptured = { increment: 1 };
      if (discountCode) updateData.codesGenerated = { increment: 1 };

      await tx.spinWheelAnalytics.upsert({
        where: {
          campaignId_date: {
            campaignId: campaign.id,
            date: today,
          },
        },
        create: {
          orgId: campaign.orgId,
          campaignId: campaign.id,
          date: today,
          spins: 1,
          uniqueSpins: 1,
          emailsCaptured: dto.email ? 1 : 0,
          phonesCaptured: dto.phone ? 1 : 0,
          codesGenerated: discountCode ? 1 : 0,
        },
        update: updateData,
      });

      return spinRecord;
    });

    this.logger.log(`Spin recorded: ${spin.id} → ${selectedSlice.label} (${selectedSlice.prizeType})`);

    return {
      sliceId: selectedSlice.id,
      label: selectedSlice.label,
      prizeType: selectedSlice.prizeType,
      prizeValue: selectedSlice.prizeValue ? Number(selectedSlice.prizeValue) : null,
      discountCode,
    };
  }

  async recordImpression(dto: StorefrontImpressionDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaign = await this.prisma.spinWheelCampaign.findFirst({
      where: { id: dto.campaignId, shopDomain: dto.shopDomain, status: 'ACTIVE' },
      select: { orgId: true, id: true },
    });

    if (!campaign) return;

    await this.prisma.spinWheelAnalytics.upsert({
      where: {
        campaignId_date: {
          campaignId: campaign.id,
          date: today,
        },
      },
      create: {
        orgId: campaign.orgId,
        campaignId: campaign.id,
        date: today,
        impressions: 1,
      },
      update: {
        impressions: { increment: 1 },
      },
    });
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getCampaignAnalytics(orgId: string, campaignId: string, query: QueryAnalyticsDto) {
    await this.findCampaignById(orgId, campaignId);

    const where: Prisma.SpinWheelAnalyticsWhereInput = { orgId, campaignId };
    if (query.startDate || query.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      where.date = dateFilter;
    }

    const daily = await this.prisma.spinWheelAnalytics.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const totals = daily.reduce(
      (acc, d) => ({
        impressions: acc.impressions + d.impressions,
        spins: acc.spins + d.spins,
        uniqueSpins: acc.uniqueSpins + d.uniqueSpins,
        emailsCaptured: acc.emailsCaptured + d.emailsCaptured,
        phonesCaptured: acc.phonesCaptured + d.phonesCaptured,
        codesGenerated: acc.codesGenerated + d.codesGenerated,
        codesRedeemed: acc.codesRedeemed + d.codesRedeemed,
      }),
      { impressions: 0, spins: 0, uniqueSpins: 0, emailsCaptured: 0, phonesCaptured: 0, codesGenerated: 0, codesRedeemed: 0 },
    );

    return {
      totals,
      conversionRate: totals.impressions > 0
        ? Number(((totals.spins / totals.impressions) * 100).toFixed(1))
        : 0,
      daily,
    };
  }

  async getAnalyticsOverview(orgId: string, shopDomain?: string) {
    const where: Prisma.SpinWheelAnalyticsWhereInput = { orgId };
    if (shopDomain) {
      const campaignIds = await this.prisma.spinWheelCampaign.findMany({
        where: { orgId, shopDomain, deletedAt: null },
        select: { id: true },
      });
      where.campaignId = { in: campaignIds.map(c => c.id) };
    }

    const analytics = await this.prisma.spinWheelAnalytics.findMany({ where });

    const totals = analytics.reduce(
      (acc, d) => ({
        totalImpressions: acc.totalImpressions + d.impressions,
        totalSpins: acc.totalSpins + d.spins,
        totalEmailsCaptured: acc.totalEmailsCaptured + d.emailsCaptured,
      }),
      { totalImpressions: 0, totalSpins: 0, totalEmailsCaptured: 0 },
    );

    const activeCampaigns = await this.prisma.spinWheelCampaign.count({
      where: { orgId, status: 'ACTIVE', deletedAt: null, ...(shopDomain ? { shopDomain } : {}) },
    });

    return {
      ...totals,
      activeCampaigns,
      conversionRate: totals.totalImpressions > 0
        ? Number(((totals.totalSpins / totals.totalImpressions) * 100).toFixed(1))
        : 0,
    };
  }

  // ─── Leads ──────────────────────────────────────────────────────────────────

  async getLeads(orgId: string, campaignId: string, query: QueryLeadsDto) {
    await this.findCampaignById(orgId, campaignId);

    const where: Prisma.SpinWheelSpinWhereInput = {
      orgId,
      campaignId,
      customerEmail: { not: null },
    };
    if (query.email) {
      where.customerEmail = { contains: query.email, mode: 'insensitive' };
    }
    if (query.redeemed != null) {
      where.redeemed = query.redeemed === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.spinWheelSpin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        select: {
          id: true,
          customerEmail: true,
          customerPhone: true,
          customerName: true,
          discountCode: true,
          redeemed: true,
          createdAt: true,
          slice: { select: { label: true, prizeType: true, prizeValue: true } },
        },
      }),
      this.prisma.spinWheelSpin.count({ where }),
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

  async exportLeads(orgId: string, campaignId: string) {
    await this.findCampaignById(orgId, campaignId);

    const leads = await this.prisma.spinWheelSpin.findMany({
      where: { orgId, campaignId, customerEmail: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        customerEmail: true,
        customerPhone: true,
        customerName: true,
        discountCode: true,
        redeemed: true,
        createdAt: true,
        slice: { select: { label: true, prizeType: true } },
      },
    });

    const header = 'Email,Phone,Name,Prize,Discount Code,Redeemed,Date\n';
    const rows = leads.map(l =>
      `"${l.customerEmail ?? ''}","${l.customerPhone ?? ''}","${l.customerName ?? ''}","${l.slice.label}","${l.discountCode ?? ''}","${l.redeemed}","${l.createdAt.toISOString()}"`,
    );

    return header + rows.join('\n');
  }
}
