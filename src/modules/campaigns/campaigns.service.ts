import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CampaignWorker } from '../../workers/campaign.worker.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';
import { QueryCampaignsDto } from './dto/query-campaigns.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignWorker: CampaignWorker,
  ) {}

  /**
   * List all campaigns for an organization with pagination and filters.
   */
  async findAll(orgId: string, dto: QueryCampaignsDto) {
    const where: Prisma.CampaignWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.channel) {
      where.channel = dto.channel;
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CampaignOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { template: true, segment: true },
      }),
      this.prisma.campaign.count({ where }),
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
   * Get a single campaign by ID with analytics summary.
   */
  async findOne(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { template: true, segment: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    const analytics = this.computeAnalytics(campaign);

    return { ...campaign, analytics };
  }

  /**
   * Create a new campaign with status=draft.
   */
  async create(orgId: string, dto: CreateCampaignDto, createdBy: string) {
    // Validate template exists
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id: dto.templateId, orgId, deletedAt: null },
    });
    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Validate segment if provided
    if (dto.segmentId) {
      const segment = await this.prisma.segment.findFirst({
        where: { id: dto.segmentId, orgId, deletedAt: null },
      });
      if (!segment) {
        throw new NotFoundException(`Segment ${dto.segmentId} not found`);
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description ?? null,
        channel: dto.channel,
        status: 'draft',
        templateId: dto.templateId,
        segmentId: dto.segmentId ?? null,
        audienceFilter: (dto.audienceFilter as Prisma.InputJsonValue) ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        timezone: dto.timezone ?? null,
        createdBy,
      },
    });

    this.logger.log(`Campaign created: ${campaign.id} for org ${orgId}`);
    return campaign;
  }

  /**
   * Update a campaign. Only allowed when status is draft.
   */
  async update(orgId: string, id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'draft') {
      throw new ConflictException(
        `Cannot update campaign with status "${campaign.status}". Only draft campaigns can be updated.`,
      );
    }

    if (dto.templateId) {
      const template = await this.prisma.notificationTemplate.findFirst({
        where: { id: dto.templateId, orgId, deletedAt: null },
      });
      if (!template) {
        throw new NotFoundException(`Template ${dto.templateId} not found`);
      }
    }

    if (dto.segmentId) {
      const segment = await this.prisma.segment.findFirst({
        where: { id: dto.segmentId, orgId, deletedAt: null },
      });
      if (!segment) {
        throw new NotFoundException(`Segment ${dto.segmentId} not found`);
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.channel !== undefined && { channel: dto.channel }),
        ...(dto.templateId !== undefined && { templateId: dto.templateId }),
        ...(dto.segmentId !== undefined && { segmentId: dto.segmentId ?? null }),
        ...(dto.audienceFilter !== undefined && { audienceFilter: (dto.audienceFilter as Prisma.InputJsonValue) ?? null }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone ?? null }),
      },
    });

    this.logger.log(`Campaign updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a campaign. Only allowed when status is draft.
   */
  async remove(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'draft') {
      throw new ConflictException(
        `Cannot delete campaign with status "${campaign.status}". Only draft campaigns can be deleted.`,
      );
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Campaign soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Launch a campaign: validate, resolve audience, set status=running, queue jobs.
   */
  async launch(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { template: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new ConflictException(
        `Cannot launch campaign with status "${campaign.status}". Only draft or scheduled campaigns can be launched.`,
      );
    }

    if (!campaign.templateId) {
      throw new BadRequestException(
        'Campaign must have a template assigned before launching.',
      );
    }

    // Resolve audience: get end users from segment or audienceFilter
    const audienceWhere: Prisma.EndUserWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (campaign.segmentId) {
      audienceWhere.segmentMembers = {
        some: { segmentId: campaign.segmentId },
      };
    }

    const endUsers = await this.prisma.endUser.findMany({
      where: audienceWhere,
      select: { id: true },
    });

    if (endUsers.length === 0) {
      throw new BadRequestException(
        'No audience found for this campaign. Add end users to the segment or adjust the audience filter.',
      );
    }

    // Update campaign status and audience count
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'running',
        totalAudience: endUsers.length,
        startedAt: new Date(),
      },
    });

    // Fire-and-forget campaign processing — one job per end user
    const channel = campaign.channel === 'multi' ? 'email' : campaign.channel;
    void Promise.all(
      endUsers.map((u) =>
        this.campaignWorker.processJob({
          orgId,
          campaignId: id,
          endUserId: u.id,
          channel: channel as 'email' | 'sms' | 'push' | 'whatsapp',
          templateId: campaign.templateId ?? '',
        }),
      ),
    ).catch(err => this.logger.error('Campaign processing failed', err));

    this.logger.log(
      `Campaign launched: ${id} with ${endUsers.length} recipients for org ${orgId}`,
    );
    return {
      message: 'Campaign launched successfully',
      totalAudience: endUsers.length,
    };
  }

  /**
   * Schedule a campaign to send at a specific time.
   */
  async schedule(orgId: string, id: string, scheduledAt: string, timezone?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'draft') {
      throw new ConflictException(
        `Cannot schedule campaign with status "${campaign.status}". Only draft campaigns can be scheduled.`,
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future.');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledAt: scheduledDate,
        timezone: timezone ?? campaign.timezone,
      },
    });

    this.logger.log(`Campaign scheduled: ${id} for ${scheduledAt} in org ${orgId}`);
    return updated;
  }

  /**
   * Pause a running campaign.
   */
  async pause(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'running') {
      throw new ConflictException(
        `Cannot pause campaign with status "${campaign.status}". Only running campaigns can be paused.`,
      );
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'paused' },
    });

    this.logger.log(`Campaign paused: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Resume a paused campaign.
   */
  async resume(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'paused') {
      throw new ConflictException(
        `Cannot resume campaign with status "${campaign.status}". Only paused campaigns can be resumed.`,
      );
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'running' },
    });

    this.logger.log(`Campaign resumed: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Cancel a scheduled campaign.
   */
  async cancel(orgId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    if (campaign.status !== 'scheduled') {
      throw new ConflictException(
        `Cannot cancel campaign with status "${campaign.status}". Only scheduled campaigns can be cancelled.`,
      );
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'failed' },
    });

    this.logger.log(`Campaign cancelled: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Get paginated delivery logs for a campaign.
   */
  async getLogs(orgId: string, campaignId: string, dto: PaginationDto) {
    // Verify campaign exists
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const where: Prisma.CampaignLogWhereInput = {
      orgId,
      campaignId,
    };

    const orderBy: Prisma.CampaignLogOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.campaignLog.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { endUser: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.campaignLog.count({ where }),
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
   * Get analytics for a campaign: delivery, open, click, and bounce rates.
   */
  async getAnalytics(orgId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, orgId, deletedAt: null },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    return this.computeAnalytics(campaign);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Compute analytics rates from campaign counters.
   */
  private computeAnalytics(campaign: {
    totalAudience: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    failedCount: number;
  }) {
    const total = campaign.totalAudience || 1; // avoid division by zero
    const delivered = campaign.deliveredCount;
    const bounced = campaign.failedCount;

    return {
      totalAudience: campaign.totalAudience,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      failedCount: campaign.failedCount,
      deliveryRate: parseFloat(((delivered / total) * 100).toFixed(2)),
      openRate: parseFloat(
        ((campaign.openedCount / (delivered || 1)) * 100).toFixed(2),
      ),
      clickRate: parseFloat(
        ((campaign.clickedCount / (delivered || 1)) * 100).toFixed(2),
      ),
      bounceRate: parseFloat(((bounced / total) * 100).toFixed(2)),
    };
  }
}
