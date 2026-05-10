import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginSuperAdminDto } from './dto/login-super-admin.dto.js';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto.js';
import { QueryAdminDto, QueryAdminInvoicesDto } from './dto/query-admin.dto.js';
import type { Prisma } from '@prisma/client';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Authentication ──────────────────────────────────────────────────────

  /**
   * Verify super admin credentials and return a signed JWT.
   */
  async login(dto: LoginSuperAdminDto) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
      select: { id: true, name: true, email: true, passwordHash: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    const payload = {
      sub: admin.id,
      role: admin.role,
      type: 'super_admin' as const,
    };

    const secret = this.configService.getOrThrow<string>('jwt.superAdminSecret');
    const expiresIn = this.configService.get<string>('jwt.superAdminExpiresIn', '8h') as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    this.logger.log(`Super admin logged in: ${admin.email}`);

    return {
      accessToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  /**
   * Get platform-wide statistics for the super admin dashboard.
   */
  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      trialOrgs,
      totalEndUsers,
      notificationsSentToday,
      campaignsRunning,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { status: 'active' } }),
      this.prisma.organization.count({ where: { status: 'suspended' } }),
      this.prisma.organization.count({ where: { status: 'trial' } }),
      this.prisma.endUser.count(),
      this.prisma.notification.count({
        where: {
          status: 'sent',
          sentAt: { gte: todayStart },
        },
      }),
      this.prisma.campaign.count({ where: { status: 'running' } }),
    ]);

    return {
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      trialOrgs,
      totalEndUsers,
      notificationsSentToday,
      campaignsRunning,
    };
  }

  // ─── Super Admin CRUD ────────────────────────────────────────────────────

  /**
   * List super admin accounts with pagination.
   */
  async listSuperAdmins(dto: QueryAdminDto) {
    const where: Prisma.SuperAdminWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SuperAdminOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.superAdmin.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.superAdmin.count({ where }),
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
   * Create a new super admin account.
   */
  async createSuperAdmin(dto: CreateSuperAdminDto) {
    const existing = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Super admin with email "${dto.email}" already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const admin = await this.prisma.superAdmin.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`Super admin created: ${admin.email} (${admin.role})`);
    return admin;
  }

  // ─── Impersonation ───────────────────────────────────────────────────────

  /**
   * Generate an org-scoped JWT for impersonating an organization.
   * The token includes an `impersonated: true` flag for audit trail purposes.
   */
  async impersonateOrg(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    const secret = this.configService.getOrThrow<string>('jwt.superAdminSecret');
    const expiresIn = '1h';

    const payload = {
      sub: orgId,
      orgId,
      type: 'super_admin' as const,
      impersonated: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    this.logger.warn(`Super admin impersonating organization: ${orgId} (${org.name})`);

    return {
      accessToken,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      expiresIn,
    };
  }

  // ─── Usage & Invoices ────────────────────────────────────────────────────

  /**
   * Get per-organization usage breakdown across the platform.
   */
  async getGlobalUsage() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await this.prisma.usageLog.groupBy({
      by: ['orgId', 'resource'],
      where: {
        createdAt: { gte: periodStart },
      },
      _sum: { quantity: true },
    });

    // Group by orgId
    const orgMap = new Map<string, Record<string, number>>();
    for (const entry of usage) {
      if (!orgMap.has(entry.orgId)) {
        orgMap.set(entry.orgId, {});
      }
      const resources = orgMap.get(entry.orgId)!;
      resources[entry.resource] = entry._sum.quantity ?? 0;
    }

    // Fetch org names for display
    const orgIds = [...orgMap.keys()];
    const orgs = orgIds.length > 0
      ? await this.prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];

    const orgNameMap = new Map(orgs.map((o) => [o.id, o]));

    const result = orgIds.map((orgId) => ({
      organization: orgNameMap.get(orgId) ?? { id: orgId, name: 'Unknown', slug: 'unknown' },
      usage: orgMap.get(orgId) ?? {},
    }));

    return {
      periodStart: periodStart.toISOString(),
      data: result,
    };
  }

  /**
   * List all invoices across all organizations (paginated).
   */
  async listAllInvoices(dto: QueryAdminInvoicesDto) {
    const where: Prisma.InvoiceWhereInput = {};

    if (dto.orgId) {
      where.orgId = dto.orgId;
    }

    if (dto.search) {
      where.invoiceNumber = { contains: dto.search, mode: 'insensitive' };
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
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
   * Manually mark an invoice as paid.
   */
  async markInvoicePaid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    if (invoice.status === 'paid') {
      throw new ConflictException('Invoice is already marked as paid');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    this.logger.log(`Invoice ${id} manually marked as paid`);
    return updated;
  }

  // ─── Plan Management ─────────────────────────────────────────────────────

  /**
   * Create, update, or soft-manage plans.
   * This method handles create and update; delete is handled by deactivating the plan.
   */
  async createPlan(data: {
    name: string;
    slug: string;
    priceMonthlyInr?: number;
    priceYearlyInr?: number;
    features?: Record<string, unknown>;
    razorpayPlanIdMonthly?: string;
    razorpayPlanIdYearly?: string;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
  }) {
    const existing = await this.prisma.plan.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(`Plan with slug "${data.slug}" already exists`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: data.name,
        slug: data.slug,
        priceMonthlyInr: data.priceMonthlyInr ?? null,
        priceYearlyInr: data.priceYearlyInr ?? null,
        features: (data.features ?? {}) as Prisma.InputJsonValue,
        razorpayPlanIdMonthly: data.razorpayPlanIdMonthly ?? null,
        razorpayPlanIdYearly: data.razorpayPlanIdYearly ?? null,
        stripePriceIdMonthly: data.stripePriceIdMonthly ?? null,
        stripePriceIdYearly: data.stripePriceIdYearly ?? null,
      },
    });

    this.logger.log(`Plan created: ${plan.name} (${plan.slug})`);
    return plan;
  }

  /**
   * Update an existing plan.
   */
  async updatePlan(
    id: string,
    data: {
      name?: string;
      priceMonthlyInr?: number;
      priceYearlyInr?: number;
      features?: Record<string, unknown>;
      isActive?: boolean;
      razorpayPlanIdMonthly?: string;
      razorpayPlanIdYearly?: string;
      stripePriceIdMonthly?: string;
      stripePriceIdYearly?: string;
    },
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }

    const updateData: Prisma.PlanUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.priceMonthlyInr !== undefined && { priceMonthlyInr: data.priceMonthlyInr ?? null }),
      ...(data.priceYearlyInr !== undefined && { priceYearlyInr: data.priceYearlyInr ?? null }),
      ...(data.features != null && { features: data.features as Prisma.InputJsonValue }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.razorpayPlanIdMonthly !== undefined && { razorpayPlanIdMonthly: data.razorpayPlanIdMonthly ?? null }),
      ...(data.razorpayPlanIdYearly !== undefined && { razorpayPlanIdYearly: data.razorpayPlanIdYearly ?? null }),
      ...(data.stripePriceIdMonthly !== undefined && { stripePriceIdMonthly: data.stripePriceIdMonthly ?? null }),
      ...(data.stripePriceIdYearly !== undefined && { stripePriceIdYearly: data.stripePriceIdYearly ?? null }),
    };

    const updated = await this.prisma.plan.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Plan updated: ${updated.name} (${updated.id})`);
    return updated;
  }
}
