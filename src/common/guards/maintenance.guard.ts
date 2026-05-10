import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgSettingsService } from '../../modules/org-settings/org-settings.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { RequestWithOrg } from '../types/index.js';

/**
 * Global guard that returns 503 when maintenance mode is enabled for the org.
 *
 * Skips public routes and requests without an org context (e.g., super admin routes).
 * Health check endpoints should be marked @Public() so they remain accessible.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  private readonly logger = new Logger(MaintenanceGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly orgSettings: OrgSettingsService,
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
    const orgId = request.orgId;

    // No org context — skip maintenance check (e.g., super admin routes)
    if (!orgId) {
      return true;
    }

    // Skip for admin routes — admins need access during maintenance
    const path = request.url || request.path || '';
    if (path.includes('/api/v1/admin/')) {
      return true;
    }

    const [maintenanceMode, comingSoon, maintenanceMessage] = await Promise.all([
      this.orgSettings.getTyped<boolean>(orgId, 'system', 'maintenance_mode', false),
      this.orgSettings.getTyped<boolean>(orgId, 'system', 'coming_soon', false),
      this.orgSettings.getTyped<string>(orgId, 'system', 'maintenance_message', ''),
    ]);

    if (maintenanceMode) {
      this.logger.warn(`Maintenance mode active for org ${orgId}, rejecting request to ${path}`);
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: maintenanceMessage || 'This store is currently under maintenance. Please try again later.',
        reason: 'maintenance',
      });
    }

    if (comingSoon) {
      this.logger.warn(`Coming soon active for org ${orgId}, rejecting request to ${path}`);
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: maintenanceMessage || 'This store is coming soon. Stay tuned!',
        reason: 'coming_soon',
      });
    }

    return true;
  }
}
