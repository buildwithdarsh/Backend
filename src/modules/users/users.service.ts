import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * List users within an organization, with pagination and filtering.
   */
  async findAll(orgId: string, dto: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        omit: { passwordHash: true },
        include: {
          userRoles: {
            include: { role: { select: { id: true, name: true, permissions: true } } },
          },
        },
      }),
      this.prisma.user.count({ where }),
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
   * Get a single user by ID within an organization.
   */
  async findOne(orgId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, orgId, deletedAt: null },
      omit: { passwordHash: true },
      include: {
        userRoles: {
          include: { role: { select: { id: true, name: true, permissions: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  /**
   * Invite a new user to the organization with status=invited.
   * Optionally assign roles.
   */
  async invite(orgId: string, dto: InviteUserDto, invitedBy: string) {
    // Check for existing user with same email in this org
    const existing = await this.prisma.user.findFirst({
      where: { orgId, email: dto.email, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists in this organization`,
      );
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          orgId,
          name: dto.name,
          email: dto.email,
          status: 'invited',
        },
      });

      // Assign roles if provided
      if (dto.roleIds?.length) {
        // Validate that roles belong to this org
        const roles = await tx.role.findMany({
          where: {
            id: { in: dto.roleIds },
            orgId,
            deletedAt: null,
          },
        });

        if (roles.length !== dto.roleIds.length) {
          throw new NotFoundException(
            'One or more role IDs are invalid or do not belong to this organization',
          );
        }

        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            orgId,
            userId: created.id,
            roleId,
            assignedBy: invitedBy,
          })),
        });
      }

      return tx.user.findFirst({
        where: { id: created.id, orgId },
        omit: { passwordHash: true },
        include: {
          userRoles: {
            include: { role: { select: { id: true, name: true, permissions: true } } },
          },
        },
      });
    });

    this.logger.log(`User invited: ${user!.id} to org ${orgId}`);
    return user;
  }

  /**
   * Update a user's profile within an organization.
   */
  async update(orgId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(orgId, id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          orgId,
          email: dto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(
          `A user with email "${dto.email}" already exists in this organization`,
        );
      }
    }

    const result = await this.prisma.user.updateMany({
      where: { id, orgId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone ?? null }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl ?? null }),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }

    this.logger.log(`User updated: ${id} in org ${orgId}`);
    return this.findOne(orgId, id);
  }

  /**
   * Soft-delete a user.
   */
  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.user.updateMany({
      where: { id, orgId },
      data: { deletedAt: new Date() },
    });

    // Invalidate user's RBAC cache
    await this.cache.del(`rbac:${orgId}:${id}`);

    this.logger.log(`User soft-deleted: ${id} in org ${orgId}`);
    return { message: 'User deleted successfully' };
  }

  /**
   * Suspend a user.
   */
  async suspend(orgId: string, id: string) {
    const user = await this.findOne(orgId, id);

    if (user.status === 'suspended') {
      throw new ConflictException('User is already suspended');
    }

    await this.prisma.user.updateMany({
      where: { id, orgId },
      data: { status: 'suspended' },
    });

    await this.cache.del(`rbac:${orgId}:${id}`);

    this.logger.log(`User suspended: ${id} in org ${orgId}`);
    return this.findOne(orgId, id);
  }

  /**
   * Reinstate a suspended user.
   */
  async reinstate(orgId: string, id: string) {
    const user = await this.findOne(orgId, id);

    if (user.status !== 'suspended') {
      throw new ConflictException('User is not suspended');
    }

    await this.prisma.user.updateMany({
      where: { id, orgId },
      data: { status: 'active' },
    });

    this.logger.log(`User reinstated: ${id} in org ${orgId}`);
    return this.findOne(orgId, id);
  }

  /**
   * Replace all roles for a user. Deletes existing role assignments
   * and creates new ones.
   */
  async assignRoles(
    orgId: string,
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ) {
    await this.findOne(orgId, userId);

    // Validate that all roles belong to this org
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        orgId,
        deletedAt: null,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException(
        'One or more role IDs are invalid or do not belong to this organization',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove all existing role assignments for this user in this org
      await tx.userRole.deleteMany({
        where: { orgId, userId },
      });

      // Create new assignments
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            orgId,
            userId,
            roleId,
            assignedBy,
          })),
        });
      }
    });

    // Invalidate user's RBAC cache
    await this.cache.del(`rbac:${orgId}:${userId}`);

    this.logger.log(`Roles reassigned for user ${userId} in org ${orgId}`);

    return this.findOne(orgId, userId);
  }

  /**
   * Get the authenticated user's own profile including roles.
   */
  async getProfile(orgId: string, userId: string) {
    return this.findOne(orgId, userId);
  }
}
