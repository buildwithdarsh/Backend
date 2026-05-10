import {
  Catch,
  ExceptionFilter,
  type ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

interface ValidationErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Catches BadRequestException thrown by class-validator's ValidationPipe
 * and formats them into the standard error envelope.
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request?.headers?.['x-request-id'] as string) ?? randomUUID();

    const exceptionResponse = exception.getResponse() as
      | string
      | ValidationErrorResponse;

    let messages: string[];

    if (typeof exceptionResponse === 'string') {
      messages = [exceptionResponse];
    } else if (Array.isArray(exceptionResponse.message)) {
      messages = exceptionResponse.message;
    } else {
      messages = [exceptionResponse.message];
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: messages,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}
