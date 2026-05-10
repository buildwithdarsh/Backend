import {
  Catch,
  ExceptionFilter,
  type ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Catches Prisma client errors and maps them to the standard error envelope.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request?.headers?.['x-request-id'] as string) ?? randomUUID();

    const { status, code, message, details } = this.mapPrismaError(exception);

    this.logger.warn(
      `Prisma error ${exception.code}: ${exception.message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
    details: unknown;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.['target'] as string[]) ?? [];
        const fields = target.join(', ');
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: fields
            ? `A record with this ${fields} already exists`
            : 'A record with these values already exists',
          details: { fields: target },
        };
      }

      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          message:
            (exception.meta?.['cause'] as string) ??
            'The requested record was not found',
          details: null,
        };

      case 'P2003': {
        const field = (exception.meta?.['field_name'] as string) ?? 'unknown';
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: `Related record not found for field: ${field}`,
          details: { field },
        };
      }

      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'RELATION_VIOLATION',
          message:
            'The change would violate a required relation between records',
          details: null,
        };

      case 'P2000': {
        const column = (exception.meta?.['column_name'] as string) ?? 'unknown';
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'VALUE_TOO_LONG',
          message: `The provided value is too long for the field: ${column}`,
          details: { column },
        };
      }

      case 'P2016':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'QUERY_INTERPRETATION_ERROR',
          message: 'The query could not be interpreted',
          details: null,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: `PRISMA_ERROR_${exception.code}`,
          message: 'A database error occurred',
          details: null,
        };
    }
  }
}
