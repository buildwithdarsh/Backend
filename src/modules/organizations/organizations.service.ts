import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { QueryOrganizationDto } from './dto/query-organization.dto.js';
import type { Prisma } from '@prisma/client';

const STOREFRONT_KEY_PREFIX = 'tz_';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization along with default roles (org_admin, member)
   * and an empty org_configs row.
   */
  async create(dto: CreateOrganizationDto) {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Organization with slug "${slug}" already exists`);
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          storefrontKey: OrganizationsService.generateStorefrontKey(),
          billingEmail: dto.billingEmail,
          billingName: dto.billingName,
          gstNumber: dto.gstNumber ?? null,
          planId: dto.planId ?? null,
        },
      });

      // Create default roles
      await tx.role.createMany({
        data: [
          {
            orgId: created.id,
            name: 'org_admin',
            isDefault: true,
            permissions: ['*:manage'],
          },
          {
            orgId: created.id,
            name: 'member',
            isDefault: true,
            permissions: [
              'users:read',
              'roles:read',
              'end-users:read',
              'templates:read',
              'notifications:read',
              'analytics:read',
            ],
          },
        ],
      });

      // Create empty org_configs row
      await tx.orgConfig.create({
        data: { orgId: created.id },
      });

      return created;
    });

    this.logger.log(`Organization created: ${org.id} (${org.slug})`);
    return org;
  }

  /**
   * List organizations with pagination, search, and status filtering.
   */
  async findAll(dto: QueryOrganizationDto) {
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { slug: { contains: dto.search, mode: 'insensitive' } },
        { billingEmail: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { plan: true },
      }),
      this.prisma.organization.count({ where }),
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
   * Find a single organization by ID.
   */
  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { plan: true, orgConfig: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return org;
  }

  /**
   * Find a single organization by slug.
   */
  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { plan: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }

    return org;
  }

  /**
   * Update an organization.
   */
  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Organization with slug "${dto.slug}" already exists`,
        );
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.billingEmail !== undefined && { billingEmail: dto.billingEmail }),
        ...(dto.billingName !== undefined && { billingName: dto.billingName }),
        ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber ?? null }),
        ...(dto.planId !== undefined && { planId: dto.planId ?? null }),
      },
    });

    this.logger.log(`Organization updated: ${id}`);
    return updated;
  }

  /**
   * Soft-delete an organization.
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Organization soft-deleted: ${id}`);
    return { message: 'Organization deleted successfully' };
  }

  /**
   * Suspend an organization.
   */
  async suspend(id: string) {
    const org = await this.findOne(id);

    if (org.status === 'suspended') {
      throw new ConflictException('Organization is already suspended');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status: 'suspended' },
    });

    this.logger.log(`Organization suspended: ${id}`);
    return updated;
  }

  /**
   * Reinstate a suspended organization.
   */
  async reinstate(id: string) {
    const org = await this.findOne(id);

    if (org.status !== 'suspended') {
      throw new ConflictException('Organization is not suspended');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status: 'active' },
    });

    this.logger.log(`Organization reinstated: ${id}`);
    return updated;
  }

  /**
   * Get the calling org admin's own organization details.
   */
  async getMyOrg(orgId: string) {
    return this.findOne(orgId);
  }

  /**
   * Regenerate the storefront key for an organization.
   * The old key is immediately invalidated.
   */
  async regenerateStorefrontKey(id: string) {
    await this.findOne(id);

    const newKey = OrganizationsService.generateStorefrontKey();

    await this.prisma.organization.update({
      where: { id },
      data: { storefrontKey: newKey },
    });

    this.logger.log(`Storefront key regenerated for org: ${id}`);
    return { storefrontKey: newKey };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Generate a publishable storefront key: `tzp_` + 32 hex chars.
   */
  static generateStorefrontKey(): string {
    return `${STOREFRONT_KEY_PREFIX}${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate a URL-friendly slug from an organization name.
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
