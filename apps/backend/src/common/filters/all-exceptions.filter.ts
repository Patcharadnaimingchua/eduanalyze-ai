import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

// Registered globally via APP_FILTER (app.module.ts), per CONVENTIONS.md §4
// — normalizes anything a service didn't already translate into an
// HttpException (chiefly Prisma errors) into the same
// { statusCode, message, error } shape every endpoint already returns.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // Already a proper HttpException (NotFoundException, ConflictException,
    // ValidationPipe's BadRequestException, ...) — every call site that
    // already handles its own errors keeps its exact existing response.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body, error: exception.name }
            : body,
        );
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          response.status(404).json({
            statusCode: 404,
            message: 'Resource not found',
            error: 'Not Found',
          });
          return;
        case 'P2002':
          response.status(409).json({
            statusCode: 409,
            message: 'Duplicate value violates a unique constraint',
            error: 'Conflict',
          });
          return;
        case 'P2003':
          response.status(409).json({
            statusCode: 409,
            message: 'Related record constraint violation',
            error: 'Conflict',
          });
          return;
        default:
          break;
      }
    }

    // Genuinely unexpected — log full detail server-side, never leak
    // exception.message/stack to the client.
    this.logger.error(exception);
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
