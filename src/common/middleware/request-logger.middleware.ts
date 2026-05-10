import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import type { RequestWithOrg } from '../types/index.js';

/**
 * Logs incoming requests with method, path, org context, response status,
 * and duration in milliseconds.
 *
 * Output format:
 * `GET /api/v1/users [org:abc-123] 200 45ms`
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithOrg, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const orgId = req.orgId;
      const orgTag = orgId ? ` [org:${orgId}]` : '';

      const logMessage = `${method} ${originalUrl}${orgTag} ${statusCode} ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
