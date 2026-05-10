import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import type { RequestWithOrg } from '../types/index.js';

/**
 * Extracts `orgId` from the authenticated JWT payload or API key context
 * and attaches it to `request.orgId` for downstream use.
 *
 * This middleware runs after authentication, so `request.user` or
 * `request.apiKey` may already be populated by Passport or the ApiKeyGuard.
 */
@Injectable()
export class OrgResolverMiddleware implements NestMiddleware {
  use(req: RequestWithOrg, _res: Response, next: NextFunction): void {
    // Priority 1: Already set (e.g., by API key guard)
    if (req.orgId) {
      next();
      return;
    }

    // Priority 2: From authenticated user (JWT payload)
    if (req.user?.orgId) {
      req.orgId = req.user.orgId;
      next();
      return;
    }

    // Priority 3: From API key
    if (req.apiKey?.orgId) {
      req.orgId = req.apiKey.orgId;
      next();
      return;
    }

    // Priority 4: From custom header (for inter-service or super admin calls)
    const headerOrgId = req.headers['x-org-id'];
    if (typeof headerOrgId === 'string' && headerOrgId.length > 0) {
      req.orgId = headerOrgId;
      next();
      return;
    }

    // No org context available, continue without it
    // Guards will reject if required
    next();
  }
}
