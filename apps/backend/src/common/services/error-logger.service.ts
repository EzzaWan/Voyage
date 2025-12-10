import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

interface LogErrorParams {
  message: string;
  stack?: string;
  route: string;
  userId?: string;
  status?: number;
  metadata?: any;
}

@Injectable()
export class ErrorLoggerService {
  private readonly logger = new Logger(ErrorLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logError(params: LogErrorParams): Promise<void> {
    try {
      await this.prisma.errorLog.create({
        data: {
          id: crypto.randomUUID(),
          message: params.message,
          stack: params.stack || null,
          route: params.route,
          userId: params.userId || null,
          status: params.status || null,
          metadata: params.metadata || {},
        },
      });
    } catch (error) {
      // Don't throw - we don't want error logging to break the app
      this.logger.error('Failed to save error log to database:', error);
    }
  }

  async logClientError(params: {
    message: string;
    stack?: string;
    url: string;
    userAgent?: string;
    userId?: string;
  }): Promise<void> {
    try {
      await this.prisma.errorLog.create({
        data: {
          id: crypto.randomUUID(),
          message: params.message,
          stack: params.stack || null,
          route: params.url,
          userId: params.userId || null,
          metadata: {
            source: 'client',
            userAgent: params.userAgent,
            url: params.url,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to save client error log to database:', error);
    }
  }
}


