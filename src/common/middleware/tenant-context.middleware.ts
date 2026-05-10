import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestWithOrg } from '../types/index.js';

export interface TenantContext {
  orgId: string;
  userId?: string;
}

/**
 * AsyncLocalStorage instance that holds the tenant context for the
 * current request. Accessible anywhere in the call chain without
 * needing to pass `orgId` explicitly through every function.
 *
 * Usage:
 * ```ts
 * const ctx = tenantStorage.getStore();
 * if (ctx) console.log(ctx.orgId);
 * ```
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Sets the tenant context (orgId, userId) in AsyncLocalStorage
 * so it can be accessed anywhere in the request lifecycle without
 * explicit parameter passing.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: RequestWithOrg, _res: Response, next: NextFunction): void {
    const orgId = req.orgId;

    if (!orgId) {
      next();
      return;
    }

    const userId = req.user?.id ?? req.userId;
    const context: TenantContext = {
      orgId,
      ...(userId !== undefined && { userId }),
    };

    tenantStorage.run(context, () => {
      next();
    });
  }
}
