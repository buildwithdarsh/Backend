import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { RequestWithOrg } from '../types/index.js';

/** RBAC permissions cache TTL in seconds (5 minutes). */
const RBAC_CACHE_TTL = 300;

/**
 * Role-Based Access Control guard.
 *
 * Reads required permissions from @Permissions() metadata, loads the user's
 * permissions from cache (`rbac:{orgId}:{userId}`) or the database
 * (user_roles -> roles -> permissions), and checks for matches.
 *
 * Wildcard (`*`) in user permissions grants access to everything.
 * Denies access by default if no permissions match.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithOrg>();

    // API key requests have scope-based auth handled by ApiKeyGuard
    if (request.apiKey) {
      return true;
    }

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userPermissions = await this.getUserPermissions(
      user.orgId,
      user.id,
    );

    // Wildcard grants all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((required) =>
      this.matchPermission(required, userPermissions),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  /**
   * Loads user permissions from cache or database.
   * Caches the result for 5 minutes.
   */
  private async getUserPermissions(
    orgId: string,
    userId: string,
  ): Promise<string[]> {
    const cacheKey = `rbac:${orgId}:${userId}`;

    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: {
          orgId,
          userId,
          role: { deletedAt: null },
        },
        include: {
          role: {
            select: { permissions: true },
          },
        },
      });

      const permissions = [
        ...new Set(
          userRoles.flatMap((ur) => ur.role.permissions),
        ),
      ];

      await this.cache.set(cacheKey, permissions, RBAC_CACHE_TTL);
      return permissions;
    } catch (err) {
      this.logger.error(
        `Failed to load permissions for user ${userId} in org ${orgId}`,
        err instanceof Error ? err.stack : undefined,
      );
      return [];
    }
  }

  /**
   * Checks whether a required permission matches any of the user's permissions.
   * Supports hierarchical wildcards: `users:*` matches `users:read`, `users:write`, etc.
   */
  private matchPermission(
    required: string,
    userPermissions: string[],
  ): boolean {
    for (const perm of userPermissions) {
      if (perm === required) {
        return true;
      }

      // Support hierarchical wildcards (e.g., 'users:*' matches 'users:read')
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, -1); // 'users:'
        if (required.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  }
}
