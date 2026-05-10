import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { QueryUsageDto } from './dto/query-usage.dto.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a summary of usage for the current billing period.
   * Returns aggregate counts per resource type (api_call, email_sent, etc.).
   */
  async getSummary(orgId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const aggregations = await this.prisma.usageLog.groupBy({
      by: ['resource'],
      where: {
        orgId,
        createdAt: { gte: periodStart },
      },
      _sum: { quantity: true },
    });

    const resourceMap: Record<string, number> = {};
    for (const entry of aggregations) {
      resourceMap[entry.resource] = entry._sum.quantity ?? 0;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      api_call: resourceMap['api_call'] ?? 0,
      email_sent: resourceMap['email_sent'] ?? 0,
      sms_sent: resourceMap['sms_sent'] ?? 0,
      whatsapp_sent: resourceMap['whatsapp_sent'] ?? 0,
      push_sent: resourceMap['push_sent'] ?? 0,
    };
  }

  /**
   * Get paginated usage history with optional resource and date filters.
   */
  async getHistory(orgId: string, dto: QueryUsageDto) {
    const where: Prisma.UsageLogWhereInput = { orgId };

    if (dto.resource) {
      where.resource = dto.resource;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    const orderBy: Prisma.UsageLogOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.usageLog.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.usageLog.count({ where }),
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
   * Get a per-resource breakdown of usage, optionally filtered by date range.
   * Returns each resource's total quantity and individual log count.
   */
  async getBreakdown(orgId: string, dto: QueryUsageDto) {
    const where: Prisma.UsageLogWhereInput = { orgId };

    if (dto.resource) {
      where.resource = dto.resource;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    const breakdown = await this.prisma.usageLog.groupBy({
      by: ['resource'],
      where,
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
    });

    const resources = breakdown.map((entry) => ({
      resource: entry.resource,
      totalQuantity: entry._sum.quantity ?? 0,
      logCount: entry._count.id,
    }));

    const grandTotal = resources.reduce(
      (sum, r) => sum + r.totalQuantity,
      0,
    );

    return {
      resources,
      grandTotal,
    };
  }

  /**
   * Create a usage log entry.
   * Called internally by interceptors and services to track resource consumption.
   */
  async logUsage(
    orgId: string,
    resource: string,
    quantity: number,
    endpoint?: string,
    apiKeyId?: string,
  ) {
    const entry = await this.prisma.usageLog.create({
      data: {
        orgId,
        resource,
        quantity,
        endpoint: endpoint ?? null,
        apiKeyId: apiKeyId ?? null,
      },
    });

    this.logger.debug(
      `Usage logged: org=${orgId} resource=${resource} qty=${quantity}`,
    );

    return entry;
  }
}
