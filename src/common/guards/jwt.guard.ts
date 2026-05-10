import { Injectable, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Global JWT authentication guard.
 *
 * Accepts two token types:
 *   1. Regular org admin tokens (RS256, validated by Passport JwtStrategy)
 *   2. Super admin impersonation tokens (HS256, validated manually here)
 *
 * Skips routes marked with @Public(), storefront routes, and /admin/ routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Skip global JWT guard for routes handled by their own guards
    const request = context.switchToHttp().getRequest();
    const path = request.url || request.path || '';
    // Storefront routes — handled by EndUserJwtGuard
    if (path.includes('/storefront/')) {
      return true;
    }
    // Super admin routes — handled by SuperAdminGuard
    if (path.includes('/api/v1/admin/')) {
      return true;
    }

    // Try the regular Passport RS256 strategy first
    try {
      const result = await (super.canActivate(context) as Promise<boolean>);
      if (result) {
        // Set request.orgId from JWT payload so @GetOrg() decorator works
        const req = context.switchToHttp().getRequest();
        if (req.user?.orgId && !req.orgId) {
          req.orgId = req.user.orgId;
        }
        return true;
      }
    } catch {
      // Passport strategy failed — fall through to super admin check
    }

    // Fall back: check if it's a super admin impersonation token (HS256)
    const authHeader = request.headers?.authorization as string | undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const token = authHeader.substring(7);

    try {
      const secret = this.configService.getOrThrow<string>('jwt.superAdminSecret');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== 'super_admin' || !payload.impersonated || !payload.orgId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach impersonation context to request
      request.user = {
        sub: payload.sub,
        orgId: payload.orgId,
        type: 'access',
        impersonated: true,
      };
      // Also set request.orgId so @GetOrg() decorator works
      request.orgId = payload.orgId;

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
