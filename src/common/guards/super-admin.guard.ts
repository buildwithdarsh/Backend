import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SuperAdminJwtPayload } from '../types/index.js';

/**
 * Guard that validates super admin JWT tokens.
 *
 * Expects the token in the `Authorization: Bearer <token>` header.
 * Verifies the token has `type: 'super_admin'` in its payload.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync<SuperAdminJwtPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>(
            'jwt.superAdminSecret',
          ),
        },
      );

      if (payload.type !== 'super_admin') {
        throw new UnauthorizedException('Invalid token type');
      }

      request.user = {
        id: payload.sub,
        role: payload.role,
        type: payload.type,
      };

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
