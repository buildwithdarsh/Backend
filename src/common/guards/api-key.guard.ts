import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import type { RequestWithOrg } from '../types/index.js';

const API_KEY_PREFIX = 'tzk_';

/**
 * Guard that authenticates requests via API key.
 *
 * Accepts keys from:
 * - `Authorization: Bearer tzk_...` header
 * - `X-API-Key: tzk_...` header
 *
 * Verification flow:
 * 1. Extract prefix from the key (first 8 chars after `tzk_`)
 * 2. Look up API key record by prefix
 * 3. Verify the full key against the stored bcrypt hash
 * 4. Check active status, expiry, and required scopes
 * 5. Attach orgId, apiKey info to the request
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const rawKey = this.extractApiKey(request);

    if (!rawKey) {
      // No API key present; let other guards handle auth
      return true;
    }

    if (!rawKey.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyPrefix = rawKey.substring(
      API_KEY_PREFIX.length,
      API_KEY_PREFIX.length + 8,
    );

    const apiKeyRecord = await this.prisma.apiKey.findFirst({
      where: {
        keyPrefix,
        deletedAt: null,
      },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Verify the full key against the stored hash
    const isValid = await bcrypt.compare(rawKey, apiKeyRecord.keyHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if the key is active
    if (!apiKeyRecord.isActive) {
      throw new UnauthorizedException('API key is inactive');
    }

    // Check expiry
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check required scopes
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length > 0) {
      const hasAllScopes = requiredPermissions.every(
        (scope) =>
          apiKeyRecord.scopes.includes('*') ||
          apiKeyRecord.scopes.includes(scope),
      );

      if (!hasAllScopes) {
        throw new ForbiddenException('API key lacks required scopes');
      }
    }

    // Update last used timestamp (fire-and-forget)
    this.prisma.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err: Error) => {
        this.logger.warn(
          `Failed to update lastUsedAt for API key ${apiKeyRecord.id}: ${err.message}`,
        );
      });

    // Attach to request
    request.orgId = apiKeyRecord.orgId;
    request.apiKey = {
      id: apiKeyRecord.id,
      orgId: apiKeyRecord.orgId,
      scopes: apiKeyRecord.scopes,
    };

    return true;
  }

  private extractApiKey(request: RequestWithOrg): string | undefined {
    // Check Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && authHeader.includes(API_KEY_PREFIX)) {
      return authHeader.substring(7);
    }

    // Fall back to X-API-Key header
    const xApiKey = request.headers['x-api-key'];
    if (typeof xApiKey === 'string') {
      return xApiKey;
    }

    return undefined;
  }
}
