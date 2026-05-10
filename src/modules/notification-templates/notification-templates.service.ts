import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Handlebars from 'handlebars';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { PreviewTemplateDto } from './dto/preview-template.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class NotificationTemplatesService {
  private readonly logger = new Logger(NotificationTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all notification templates for an organization with pagination.
   */
  async findAll(orgId: string, dto: PaginationDto) {
    const where: Prisma.NotificationTemplateWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { slug: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.NotificationTemplateOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.notificationTemplate.count({ where }),
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
   * Get a single notification template by ID.
   */
  async findOne(orgId: string, id: string) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  /**
   * Create a new notification template.
   */
  async create(orgId: string, dto: CreateTemplateDto, createdBy: string) {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { orgId, slug, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Template with slug "${slug}" already exists`);
    }

    const template = await this.prisma.notificationTemplate.create({
      data: {
        orgId,
        name: dto.name,
        slug,
        channel: dto.channel,
        subject: dto.subject ?? null,
        body: dto.body,
        variables: dto.variables ?? [],
        msg91TemplateId: dto.msg91TemplateId ?? null,
        createdBy,
      },
    });

    this.logger.log(`Template created: ${template.id} (${slug}) for org ${orgId}`);
    return template;
  }

  /**
   * Update an existing notification template.
   */
  async update(orgId: string, id: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(orgId, id);

    if (dto.slug && dto.slug !== template.slug) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: { orgId, slug: dto.slug, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(
          `Template with slug "${dto.slug}" already exists`,
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData['name'] = dto.name;
    if (dto.slug !== undefined) updateData['slug'] = dto.slug;
    if (dto.channel !== undefined) updateData['channel'] = dto.channel;
    if (dto.subject !== undefined) updateData['subject'] = dto.subject ?? null;
    if (dto.body !== undefined) updateData['body'] = dto.body;
    if (dto.variables !== undefined) updateData['variables'] = dto.variables;
    if (dto.msg91TemplateId !== undefined) updateData['msg91TemplateId'] = dto.msg91TemplateId ?? null;

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: updateData as Prisma.NotificationTemplateUpdateInput,
    });

    this.logger.log(`Template updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a notification template.
   */
  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.notificationTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Template soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Template deleted successfully' };
  }

  /**
   * Render a template with sample variables using Handlebars and return the output.
   */
  async preview(orgId: string, id: string, dto: PreviewTemplateDto) {
    const template = await this.findOne(orgId, id);

    const bodyCompiled = Handlebars.compile(template.body);
    const renderedBody = bodyCompiled(dto.variables);

    let renderedSubject: string | null = null;
    if (template.subject) {
      const subjectCompiled = Handlebars.compile(template.subject);
      renderedSubject = subjectCompiled(dto.variables);
    }

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Generate a URL-friendly slug from a template name.
   * Appends a short random suffix to reduce collision risk.
   */
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
  }
}
