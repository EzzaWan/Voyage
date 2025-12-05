import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorLoggerService } from '../services/error-logger.service';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly errorLogger: ErrorLoggerService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'ERR_INTERNAL';
    let details: any = undefined;

    // Handle AppError
    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode || `ERR_${statusCode}`;
      details = exception.details;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.errorCode || `ERR_${statusCode}`;
        details = responseObj;
      } else {
        message = exception.message;
      }
      errorCode = `ERR_${statusCode}`;
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'ERR_DATABASE';
      
      switch (exception.code) {
        case 'P2002':
          message = 'A record with this value already exists';
          errorCode = 'ERR_DUPLICATE';
          break;
        case 'P2025':
          message = 'Record not found';
          errorCode = 'ERR_NOT_FOUND';
          statusCode = HttpStatus.NOT_FOUND;
          break;
        default:
          message = 'Database operation failed';
      }
      
      details = {
        code: exception.code,
        meta: exception.meta,
      };
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      errorCode = 'ERR_VALIDATION';
    }
    // Handle Axios errors (external API calls)
    else if ((exception as any)?.isAxiosError) {
      const axiosError = exception as AxiosError;
      statusCode = axiosError.response?.status || HttpStatus.BAD_GATEWAY;
      message = axiosError.response?.data
        ? (typeof axiosError.response.data === 'string'
            ? axiosError.response.data
            : (axiosError.response.data as any)?.message || 'External API error')
        : axiosError.message || 'External API request failed';
      errorCode = 'ERR_EXTERNAL_API';
      
      details = {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        status: axiosError.response?.status,
      };
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'ERR_UNKNOWN';
    }

    // Log error
    const errorResponse = {
      success: false,
      message,
      statusCode,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details && { details }),
    };

    // Log to database
    try {
      await this.errorLogger.logError({
        message: message,
        stack: exception instanceof Error ? exception.stack : undefined,
        route: `${request.method} ${request.url}`,
        userId: (request as any).user?.id || (request as any).userId,
        status: statusCode,
        metadata: {
          errorCode,
          path: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          details,
        },
      });
    } catch (logError) {
      this.logger.error('Failed to log error to database:', logError);
    }

    // Log to console
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode} - ${message}`
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}

