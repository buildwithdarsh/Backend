import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { PaginatedMeta } from '../../common/dto/api-response.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CreateSegmentDto } from './dto/create-segment.dto.js';
import { UpdateSegmentDto } from './dto/update-segment.dto.js';
import { AddMembersDto } from './dto/add-members.dto.js';

@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, dto: PaginationDto) {
    const where: Prisma.SegmentWhereInput = { orgId };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SegmentOrderByWithRelationInput = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder }
      : { createdAt: dto.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.segment.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.segment.count({ where }),
    ]);

    return {
      data,
      pagination: new PaginatedMeta(dto.page, dto.limit, total),
    };
  }

  async findOne(orgId: string, id: string) {
    const segment = await this.prisma.segment.findFirst({
      where: { id, orgId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID "${id}" not found`);
    }

    const memberCount = await this.prisma.segmentMember.count({
      where: { segmentId: id, orgId },
    });

    return { ...segment, memberCount };
  }

  async create(orgId: string, dto: CreateSegmentDto, createdBy: string) {
    return this.prisma.segment.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description ?? null,
        type: dto.type,
        conditions: (dto.conditions as Prisma.InputJsonValue) ?? null,
        createdBy,
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateSegmentDto) {
    await this.findOne(orgId, id);

    const data: Prisma.SegmentUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.conditions !== undefined)
      data.conditions = dto.conditions as Prisma.InputJsonValue;

    return this.prisma.segment.update({
      where: { id },
      data,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.segment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  /**
   * Preview a dynamic segment: evaluate its conditions and return a
   * count of matching end users along with a sample of up to 10 records.
   */
  async preview(orgId: string, id: string) {
    const segment = await this.findOne(orgId, id);

    if (segment.type !== 'dynamic') {
      throw new BadRequestException(
        'Preview is only available for dynamic segments',
      );
    }

    const conditions = segment.conditions as Record<string, unknown> | null;
    if (!conditions) {
      return { count: 0, sample: [] };
    }

    const endUserWhere = this.buildDynamicWhere(orgId, conditions);

    const [count, sample] = await Promise.all([
      this.prisma.endUser.count({ where: endUserWhere }),
      this.prisma.endUser.findMany({
        where: endUserWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        omit: { passwordHash: true },
      }),
    ]);

    return { count, sample };
  }

  async getMembers(orgId: string, segmentId: string, dto: PaginationDto) {
    // Verify segment exists
    await this.findOne(orgId, segmentId);

    const where: Prisma.SegmentMemberWhereInput = { orgId, segmentId };

    const [data, total] = await Promise.all([
      this.prisma.segmentMember.findMany({
        where,
        include: { endUser: { omit: { passwordHash: true } } },
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: dto.sortOrder },
      }),
      this.prisma.segmentMember.count({ where }),
    ]);

    return {
      data: data.map((m) => m.endUser),
      pagination: new PaginatedMeta(dto.page, dto.limit, total),
    };
  }

  async addMembers(orgId: string, segmentId: string, dto: AddMembersDto) {
    const segment = await this.findOne(orgId, segmentId);

    if (segment.type !== 'static') {
      throw new BadRequestException(
        'Members can only be manually added to static segments',
      );
    }

    // Filter out already-existing members
    const existing = await this.prisma.segmentMember.findMany({
      where: {
        orgId,
        segmentId,
        endUserId: { in: dto.endUserIds },
      },
      select: { endUserId: true },
    });

    const existingIds = new Set(existing.map((e) => e.endUserId));
    const newIds = dto.endUserIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await this.prisma.segmentMember.createMany({
        data: newIds.map((endUserId) => ({
          orgId,
          segmentId,
          endUserId,
        })),
        skipDuplicates: true,
      });

      await this.refreshCount(orgId, segmentId);
    }

    return { added: newIds.length, duplicatesSkipped: existingIds.size };
  }

  async removeMember(orgId: string, segmentId: string, endUserId: string) {
    const segment = await this.findOne(orgId, segmentId);

    if (segment.type !== 'static') {
      throw new BadRequestException(
        'Members can only be manually removed from static segments',
      );
    }

    const member = await this.prisma.segmentMember.findFirst({
      where: { orgId, segmentId, endUserId },
    });

    if (!member) {
      throw new NotFoundException(
        `End user "${endUserId}" is not a member of this segment`,
      );
    }

    await this.prisma.segmentMember.delete({ where: { id: member.id } });
    await this.refreshCount(orgId, segmentId);

    return { removed: true };
  }

  async refreshCount(orgId: string, segmentId: string) {
    const count = await this.prisma.segmentMember.count({
      where: { orgId, segmentId },
    });

    await this.prisma.segment.update({
      where: { id: segmentId },
      data: { endUserCount: count },
    });

    return { endUserCount: count };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Build a Prisma `where` clause for EndUser from dynamic segment conditions.
   *
   * Expected conditions format:
   * ```json
   * {
   *   "combinator": "and" | "or",
   *   "rules": [
   *     { "field": "status", "operator": "eq", "value": "active" },
   *     { "field": "tags", "operator": "contains", "value": "premium" },
   *     { "field": "email", "operator": "endsWith", "value": "@acme.com" },
   *     { "field": "attributes.plan", "operator": "eq", "value": "enterprise" }
   *   ]
   * }
   * ```
   */
  private buildDynamicWhere(
    orgId: string,
    conditions: Record<string, unknown>,
  ): Prisma.EndUserWhereInput {
    const base: Prisma.EndUserWhereInput = { orgId };
    const rules = conditions['rules'] as Array<{
      field: string;
      operator: string;
      value: unknown;
    }> | undefined;

    if (!rules || rules.length === 0) {
      return base;
    }

    const combinator = (conditions['combinator'] as string) ?? 'and';

    const filters = rules.map((rule) => this.ruleToFilter(rule));

    if (combinator === 'or') {
      return { ...base, OR: filters };
    }

    return { ...base, AND: filters };
  }

  private ruleToFilter(rule: {
    field: string;
    operator: string;
    value: unknown;
  }): Prisma.EndUserWhereInput {
    const { field, operator, value } = rule;

    // Handle JSON path queries (e.g., attributes.plan)
    if (field.startsWith('attributes.')) {
      const path = field.replace('attributes.', '').split('.');
      return {
        attributes: {
          path,
          equals: value as Prisma.InputJsonValue,
        },
      };
    }

    // Handle tags array field
    if (field === 'tags') {
      switch (operator) {
        case 'contains':
        case 'has':
          return { tags: { has: value as string } };
        case 'hasSome':
          return { tags: { hasSome: value as string[] } };
        case 'hasEvery':
          return { tags: { hasEvery: value as string[] } };
        default:
          return { tags: { has: value as string } };
      }
    }

    // Standard string/scalar fields
    switch (operator) {
      case 'eq':
      case 'equals':
        return { [field]: { equals: value } };
      case 'neq':
      case 'not':
        return { [field]: { not: value } };
      case 'contains':
        return { [field]: { contains: value as string, mode: 'insensitive' } };
      case 'startsWith':
        return { [field]: { startsWith: value as string, mode: 'insensitive' } };
      case 'endsWith':
        return { [field]: { endsWith: value as string, mode: 'insensitive' } };
      case 'gt':
        return { [field]: { gt: value } };
      case 'gte':
        return { [field]: { gte: value } };
      case 'lt':
        return { [field]: { lt: value } };
      case 'lte':
        return { [field]: { lte: value } };
      case 'in':
        return { [field]: { in: value as unknown[] } };
      case 'notIn':
        return { [field]: { notIn: value as unknown[] } };
      default:
        this.logger.warn(`Unknown operator "${operator}" for field "${field}"`);
        return { [field]: { equals: value } };
    }
  }
}
