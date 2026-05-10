import {
  Injectable,
  NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { RequestWithOrg } from '../types/index.js';

/** HTTP methods that constitute write operations. */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Logs write operations (POST, PUT, PATCH, DELETE) to the `audit_logs` table.
 *
 * Captures:
 * - Actor info (user ID and type)
 * - Resource type and ID (parsed from the route path)
 * - Request body as `changes`
 * - Client IP and user agent
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const method = request.method;

    if (!WRITE_METHODS.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        this.logAudit(request, method).catch((err: Error) => {
          this.logger.error(`Failed to write audit log: ${err.message}`);
        });
      }),
    );
  }

  private async logAudit(
    request: RequestWithOrg,
    method: string,
  ): Promise<void> {
    const orgId = request.orgId;
    if (!orgId) {
      return;
    }

    const { resourceType, resourceId } = this.parseRoute(request.path);
    const actorId = request.user?.id ?? request.apiKey?.id ?? null;
    const actorType = request.user ? 'user' : request.apiKey ? 'api_key' : 'system';

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        actorType,
        action: `${method} ${request.path}`,
        resourceType,
        resourceId: resourceId ?? null,
        changes: request.body
          ? (request.body as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] ?? null,
      },
    });
  }

  /**
   * Extracts a resource type and optional resource ID from the request path.
   * E.g., `/api/v1/users/abc-123` -> { resourceType: 'users', resourceId: 'abc-123' }
   */
  private parseRoute(path: string): {
    resourceType: string | null;
    resourceId: string | null;
  } {
    const segments = path.split('/').filter(Boolean);

    // Remove common prefixes like 'api', 'v1', 'v2'
    const meaningful = segments.filter(
      (s) => !['api', 'v1', 'v2'].includes(s),
    );

    if (meaningful.length === 0) {
      return { resourceType: null, resourceId: null };
    }

    // UUID-like pattern
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (meaningful.length >= 2 && uuidPattern.test(meaningful[meaningful.length - 1]!)) {
      return {
        resourceType: meaningful[meaningful.length - 2] ?? null,
        resourceId: meaningful[meaningful.length - 1] ?? null,
      };
    }

    return {
      resourceType: meaningful[meaningful.length - 1] ?? null,
      resourceId: null,
    };
  }

  private getClientIp(request: RequestWithOrg): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() ?? null;
    }
    return request.ip ?? null;
  }
}
