import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestUser, RequestWithOrg } from '../types/index.js';

/**
 * Extracts the authenticated user from the current request.
 *
 * Optionally pass a property name to extract a single field:
 * ```ts
 * @Get()
 * findAll(@GetUser() user: RequestUser) { ... }
 * @Get()
 * findAll(@GetUser('id') userId: string) { ... }
 * ```
 */
export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrg>();
    const user = request.user;

    if (data && user) {
      return user[data];
    }

    return user;
  },
);
