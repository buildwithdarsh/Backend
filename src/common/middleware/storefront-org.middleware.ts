import { Injectable, type NestMiddleware, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import type { RequestWithOrg } from '../types/index.js';

/** Cache TTL in seconds (5 minutes). */
const ORG_LOOKUP_CACHE_TTL = 300;

@Injectable()
export class StorefrontOrgMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async use(req: RequestWithOrg, _res: Response, next: NextFunction) {
    // Skip if orgId already resolved (e.g., from JWT)
    if (req.orgId) {
      return next();
    }

    const orgSlug = req.headers['x-org-slug'] as string | undefined;
    const orgKey = req.headers['x-org-key'] as string | undefined;

    if (!orgSlug || !orgKey) {
      throw new UnauthorizedException('X-Org-Slug and X-Org-Key headers are required');
    }

    // Check cache first
    const cacheKey = `storefront_org:${orgSlug}`;
    const cached = await this.cache.get<{ id: string; status: string; storefrontKey: string }>(cacheKey);

    if (cached) {
      if (cached.storefrontKey !== orgKey) {
        throw new UnauthorizedException('Invalid organization key');
      }
      if (cached.status === 'suspended') {
        throw new UnauthorizedException('Organization is suspended');
      }
      req.orgId = cached.id;
      return next();
    }

    // DB lookup
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, status: true, storefrontKey: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Cache the result (even if suspended — cache is short-lived)
    await this.cache.set(cacheKey, { id: org.id, status: org.status, storefrontKey: org.storefrontKey }, ORG_LOOKUP_CACHE_TTL);

    if (org.storefrontKey !== orgKey) {
      throw new UnauthorizedException('Invalid organization key');
    }

    if (org.status === 'suspended') {
      throw new UnauthorizedException('Organization is suspended');
    }

    req.orgId = org.id;
    return next();
  }
}
