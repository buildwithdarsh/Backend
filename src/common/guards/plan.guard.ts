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
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { RequestWithOrg } from '../types/index.js';

export const PLAN_FEATURE_KEY = 'plan_feature';

/** Cache TTL in seconds (10 minutes). */
const PLAN_FEATURES_CACHE_TTL = 600;

/**
 * Decorator to declare the plan feature required for a route.
 */
export const RequireFeature = (feature: string) =>
  Reflect.metadata(PLAN_FEATURE_KEY, feature);

/**
 * Guard that checks whether the organization's plan includes the required feature.
 *
 * Loads plan features from cache (`plan_features:{orgId}`) or the database
 * (organizations -> plans -> features JSON). The plan's `features` column is
 * expected to be a JSON object with boolean or numeric values keyed by feature name.
 */
@Injectable()
export class PlanGuard implements CanActivate {
  private readonly logger = new Logger(PlanGuard.name);

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

    const requiredFeature = this.reflector.getAllAndOverride<string>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature requirement declared
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const orgId = request.orgId;

    if (!orgId) {
      throw new ForbiddenException('Organization context required');
    }

    const features = await this.getOrgFeatures(orgId);

    if (!features) {
      throw new ForbiddenException(
        'No plan associated with this organization',
      );
    }

    const featureValue = features[requiredFeature];

    if (featureValue === undefined || featureValue === false) {
      throw new ForbiddenException(
        `Your plan does not include the "${requiredFeature}" feature. Please upgrade your plan.`,
      );
    }

    return true;
  }

  /**
   * Loads plan features for an org from cache or database.
   * Merges plan-level features with org-level feature overrides.
   */
  private async getOrgFeatures(
    orgId: string,
  ): Promise<Record<string, unknown> | null> {
    const cacheKey = `plan_features:${orgId}`;

    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          plan: { select: { features: true } },
          orgConfig: { select: { featureOverrides: true } },
        },
      });

      if (!org?.plan) {
        return null;
      }

      const planFeatures =
        (org.plan.features as Record<string, unknown>) ?? {};
      const overrides =
        (org.orgConfig?.featureOverrides as Record<string, unknown>) ?? {};

      // Org-level overrides take precedence over plan defaults
      const merged = { ...planFeatures, ...overrides };

      await this.cache.set(cacheKey, merged, PLAN_FEATURES_CACHE_TTL);
      return merged;
    } catch (err) {
      this.logger.error(
        `Failed to load plan features for org ${orgId}`,
        err instanceof Error ? err.stack : undefined,
      );
      return null;
    }
  }
}
