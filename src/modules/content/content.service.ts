import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateContentDto, UpdateContentDto, QueryContentDto } from './dto/index.js';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new content post.
   */
  async create(orgId: string, dto: CreateContentDto) {
    const post = await this.prisma.contentPost.create({
      data: {
        orgId,
        title: dto.title,
        slug: dto.slug,
        body: dto.body,
        excerpt: dto.excerpt ?? null,
        imageUrl: dto.imageUrl ?? null,
        category: dto.category ?? null,
        tags: dto.tags ?? [],
        status: dto.status ?? 'draft',
        publishedAt: dto.status === 'published' ? new Date() : null,
        authorId: dto.authorId ?? null,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? {},
      },
    });

    this.logger.log(`Content post created: ${post.id} (${post.slug}) for org ${orgId}`);
    return post;
  }

  /**
   * List all posts (admin) with pagination and filters.
   */
  async findAll(orgId: string, query: QueryContentDto) {
    const where: Prisma.ContentPostWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contentPost.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contentPost.count({ where }),
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
   * List published posts (storefront).
   */
  async findPublished(orgId: string, query: QueryContentDto) {
    const where: Prisma.ContentPostWhereInput = {
      orgId,
      status: 'published',
      deletedAt: null,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contentPost.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.contentPost.count({ where }),
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
   * Find a single post by slug (storefront).
   */
  async findBySlug(orgId: string, slug: string) {
    const post = await this.prisma.contentPost.findFirst({
      where: { orgId, slug, status: 'published', deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException(`Content post not found`);
    }

    return post;
  }

  /**
   * Get a single post by ID (admin).
   */
  async findOne(orgId: string, id: string) {
    const post = await this.prisma.contentPost.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException(`Content post ${id} not found`);
    }

    return post;
  }

  /**
   * Update a content post.
   */
  async update(orgId: string, id: string, dto: UpdateContentDto) {
    await this.ensurePostExists(orgId, id);

    const data: Prisma.ContentPostUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.body !== undefined && { body: dto.body }),
      ...(dto.excerpt !== undefined && { excerpt: dto.excerpt ?? null }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
      ...(dto.category !== undefined && { category: dto.category ?? null }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.authorId !== undefined && { authorId: dto.authorId ?? null }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
    };

    // Set publishedAt when transitioning to published
    if (dto.status === 'published') {
      const existing = await this.prisma.contentPost.findFirst({
        where: { id, orgId },
      });
      if (existing && existing.status !== 'published') {
        data.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.contentPost.update({
      where: { id },
      data,
    });

    this.logger.log(`Content post updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a content post.
   */
  async remove(orgId: string, id: string) {
    await this.ensurePostExists(orgId, id);

    await this.prisma.contentPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Content post soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Content post deleted successfully' };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private async ensurePostExists(orgId: string, id: string) {
    const post = await this.prisma.contentPost.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException(`Content post ${id} not found`);
    }
    return post;
  }
}
