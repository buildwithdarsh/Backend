import { Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';

@Injectable()
export class EndUserJwtGuard extends AuthGuard('enduser-jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (err || !user) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) {
        return null;
      }
      throw err || new UnauthorizedException();
    }

    // Attach endUser to request
    const request = context.switchToHttp().getRequest();
    request.endUser = {
      id: user.sub,
      orgId: user.orgId,
    };
    request.orgId = request.orgId || user.orgId;

    return user;
  }
}
