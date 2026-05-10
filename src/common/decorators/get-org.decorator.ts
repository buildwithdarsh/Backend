import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithOrg } from '../types/index.js';

/**
 * Extracts `orgId` from the current request.
 *
 * Usage:
 * ```ts
 * @Get()
 * findAll(@GetOrg() orgId: string) { ... }
 * ```
 */
export const GetOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrg>();
    return request.orgId;
  },
);
