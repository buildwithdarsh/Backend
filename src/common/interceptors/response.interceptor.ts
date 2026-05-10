import {
  Injectable,
  NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable, map } from 'rxjs';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

interface PaginationPayload {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedResponsePayload {
  data: unknown[];
  pagination: PaginationPayload;
  message?: string;
}

interface DataResponsePayload {
  data: unknown;
  message?: string;
}

function isPaginated(body: unknown): body is PaginatedResponsePayload {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in (body as Record<string, unknown>) &&
    'pagination' in (body as Record<string, unknown>)
  );
}

function hasDataKey(body: unknown): body is DataResponsePayload {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in (body as Record<string, unknown>)
  );
}

function isAlreadyWrapped(body: unknown): boolean {
  return (
    body !== null &&
    typeof body === 'object' &&
    'success' in (body as Record<string, unknown>)
  );
}

/**
 * Wraps all successful controller responses in the global envelope.
 *
 * Controllers return one of:
 * - Plain data → `{ success, data, message, meta }`
 * - `{ data, pagination, message? }` → `{ success, data, pagination, message, meta }`
 * - `{ data, message? }` → data extracted and wrapped
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) ?? randomUUID();

    const meta = {
      timestamp: new Date().toISOString(),
      requestId,
    };

    return next.handle().pipe(
      map((responseBody: unknown) => {
        // Already wrapped — pass through
        if (isAlreadyWrapped(responseBody)) {
          return responseBody;
        }

        // Paginated: service/controller returned { data, pagination }
        if (isPaginated(responseBody)) {
          const p = responseBody.pagination;
          return {
            success: true,
            data: responseBody.data,
            pagination: {
              page: p.page,
              limit: p.limit,
              total: p.total,
              totalPages: p.totalPages,
              hasNextPage: p.hasNextPage ?? p.page < p.totalPages,
              hasPrevPage: p.hasPrevPage ?? p.page > 1,
            },
            message: responseBody.message ?? null,
            meta,
          };
        }

        // Controller returned { data, message? }
        if (hasDataKey(responseBody)) {
          return {
            success: true,
            data: (responseBody as DataResponsePayload).data,
            message: (responseBody as DataResponsePayload).message ?? null,
            meta,
          };
        }

        // Raw return value → becomes data
        return {
          success: true,
          data: responseBody,
          message: null,
          meta,
        };
      }),
    );
  }
}
