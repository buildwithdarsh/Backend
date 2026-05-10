import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares the permissions required to access a route.
 *
 * Usage:
 * ```ts
 * @Permissions('users:read', 'users:write')
 * @Get()
 * findAll() { ... }
 * ```
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
