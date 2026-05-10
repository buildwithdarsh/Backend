import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestEndUser, RequestWithOrg } from '../types/index.js';

export const GetEndUser = createParamDecorator(
  (data: keyof RequestEndUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrg>();
    const endUser = request.endUser;

    if (data && endUser) {
      return endUser[data];
    }

    return endUser;
  },
);
