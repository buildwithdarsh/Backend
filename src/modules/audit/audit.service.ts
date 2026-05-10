import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { QueryAuditDto, QueryAdminAuditDto } from './dto/query-audit.dto.js';
import type { Prisma } from '@prisma/client';

export interface AuditLogData {
  orgId: string;
  actorId?: string | null;
  actorType: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all audit logs for a specific organization, with pagination and filters.
   */
  async findAll(orgId: string, dto: QueryAuditDto) {
    const where = this.buildWhere(dto, orgId);

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.auditLog.count({ where }),
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
   * Find all audit logs across all organizations (super admin only).
   * Supports optional orgId filter.
   */
  async findAllAdmin(dto: QueryAdminAuditDto) {
    const where = this.buildWhere(dto, dto.orgId);

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
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
   * Create an audit log entry.
   * Fire-and-forget friendly -- callers can catch and log errors.
   */
  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          orgId: data.orgId,
          actorId: data.actorId ?? null,
          actorType: data.actorType,
          action: data.action,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          changes: (data.changes as Prisma.InputJsonValue) ?? undefined,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to write audit log: ${message}`);
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private buildWhere(
    dto: QueryAuditDto | QueryAdminAuditDto,
    orgId?: string,
  ): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (dto.actorType) {
      where.actorType = dto.actorType;
    }

    if (dto.action) {
      where.action = { contains: dto.action, mode: 'insensitive' };
    }

    if (dto.resourceType) {
      where.resourceType = dto.resourceType;
    }

    if (dto.search) {
      where.OR = [
        { action: { contains: dto.search, mode: 'insensitive' } },
        { resourceType: { contains: dto.search, mode: 'insensitive' } },
      ];
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

    return where;
  }
}
