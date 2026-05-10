import {
  Injectable,
  NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service.js';
import type { RequestWithOrg } from '../types/index.js';
import type { Response } from 'express';

/**
 * Tracks API call usage for billing and analytics purposes.
 *
 * After every successful request, increments a usage log entry for the
 * `api_call` resource with the request endpoint and optional API key ID.
 */
@Injectable()
export class UsageInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        this.recordUsage(request, response.statusCode).catch((err: Error) => {
          this.logger.error(`Failed to record usage: ${err.message}`);
        });
      }),
    );
  }

  private async recordUsage(
    request: RequestWithOrg,
    statusCode: number,
  ): Promise<void> {
    const orgId = request.orgId;
    if (!orgId) {
      return;
    }

    await this.prisma.usageLog.create({
      data: {
        orgId,
        resource: 'api_call',
        quantity: 1,
        endpoint: `${request.method} ${request.path}`,
        apiKeyId: request.apiKey?.id ?? null,
        metadata: {
          method: request.method,
          path: request.path,
          statusCode,
        },
      },
    });
  }
}
