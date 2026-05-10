import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

/** System-managed role names that cannot be deleted. */
const SYSTEM_ROLES = new Set<string>(['org_admin']);

/** All available resources for the RBAC permission model. */
const RESOURCES = [
  'users',
  'roles',
  'end-users',
  'segments',
  'campaigns',
  'templates',
  'notifications',
  'api-keys',
  'webhooks',
  'config',
  'billing',
  'audit',
  'analytics',
  'payments',
  'products',
] as const;

/** All available actions for the RBAC permission model. */
const ACTIONS = ['read', 'write', 'delete', 'manage'] as const;

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * List all roles for an organization.
   */
  async findAll(orgId: string) {
    const roles = await this.prisma.role.findMany({
      where: { orgId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { userRoles: true } },
      },
    });

    return roles;
  }

  /**
   * Get a single role by ID with its permissions.
   */
  async findOne(orgId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        _count: { select: { userRoles: true } },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  /**
   * Create a custom role within an organization.
   */
  async create(orgId: string, dto: CreateRoleDto, createdBy: string) {
    const existing = await this.prisma.role.findFirst({
      where: { orgId, name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(
        `A role named "${dto.name}" already exists in this organization`,
      );
    }

    const role = await this.prisma.role.create({
      data: {
        orgId,
        name: dto.name,
        permissions: dto.permissions,
        isDefault: dto.isDefault ?? false,
        createdBy,
      },
    });

    this.logger.log(`Role created: ${role.id} (${role.name}) in org ${orgId}`);
    return role;
  }

  /**
   * Update a role. After updating, invalidate the RBAC cache for
   * all users who currently hold this role.
   */
  async update(orgId: string, id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(orgId, id);

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          orgId,
          name: dto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(
          `A role named "${dto.name}" already exists in this organization`,
        );
      }
    }

    await this.prisma.role.updateMany({
      where: { id, orgId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.permissions !== undefined && { permissions: dto.permissions }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    const updated = await this.findOne(orgId, id);

    // Invalidate RBAC cache for all users assigned to this role
    const userRoles = await this.prisma.userRole.findMany({
      where: { orgId, roleId: id },
      select: { userId: true },
    });

    const cacheKeys = userRoles.map((ur) => `rbac:${orgId}:${ur.userId}`);
    await Promise.all(cacheKeys.map((key) => this.cache.del(key)));

    this.logger.log(
      `Role updated: ${id} in org ${orgId}. Invalidated ${cacheKeys.length} RBAC cache entries.`,
    );
    return updated;
  }

  /**
   * Soft-delete a role. System-managed roles (e.g. org_admin) cannot be deleted.
   */
  async remove(orgId: string, id: string) {
    const role = await this.findOne(orgId, id);

    if (SYSTEM_ROLES.has(role.name)) {
      throw new BadRequestException(
        `Cannot delete system role "${role.name}"`,
      );
    }

    await this.prisma.role.updateMany({
      where: { id, orgId },
      data: { deletedAt: new Date() },
    });

    // Invalidate RBAC cache for all users who had this role
    const userRoles = await this.prisma.userRole.findMany({
      where: { orgId, roleId: id },
      select: { userId: true },
    });

    const cacheKeys = userRoles.map((ur) => `rbac:${orgId}:${ur.userId}`);
    await Promise.all(cacheKeys.map((key) => this.cache.del(key)));

    this.logger.log(`Role soft-deleted: ${id} in org ${orgId}`);
    return { message: 'Role deleted successfully' };
  }

  /**
   * Return the full list of available permissions (resources x actions).
   */
  getAllPermissions() {
    const resources = [...RESOURCES];
    const actions = [...ACTIONS];

    const permissions = resources.flatMap((resource) =>
      actions.map((action) => `${resource}:${action}`),
    );

    return {
      resources,
      actions,
      permissions,
    };
  }
}
