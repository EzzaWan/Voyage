import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AppError } from '../errors/app-error';
import { RateLimitOptions, RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { redis, rateLimitKey } from '../utils/redis';
import { ErrorLoggerService } from '../services/error-logger.service';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly errorLogger: ErrorLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if we should skip rate limiting
    if (rateLimitOptions.skipIf && rateLimitOptions.skipIf(request)) {
      return true;
    }

    const ip = this.getClientIp(request);
    const userId = (request as any).user?.id;
    const route = request.route?.path || request.path;
    const method = request.method;

    // Create rate limit key
    const keyParts = [
      'api',
      method,
      route,
      userId || ip,
    ];
    const key = rateLimitKey(keyParts.join(':'));

    try {
      // Check current count
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, rateLimitOptions.window);
      }

      // Check if limit exceeded
      if (current > rateLimitOptions.limit) {
        // Log the rate limit violation
        await this.logRateLimitViolation({
          ip,
          userId,
          route,
          method,
          limit: rateLimitOptions.limit,
          window: rateLimitOptions.window,
        });

        throw new AppError(
          'Too many requests',
          429,
          'RATE_LIMIT',
          {
            limit: rateLimitOptions.limit,
            window: rateLimitOptions.window,
            retryAfter: rateLimitOptions.window,
          },
        );
      }

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // If Redis fails, log but don't block the request (fail open)
      this.logger.error('Rate limit Redis error:', error);
      return true;
    }
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return ips[0]?.trim() || request.ip || 'unknown';
    }
    return request.ip || 'unknown';
  }

  private async logRateLimitViolation(params: {
    ip: string;
    userId?: string;
    route: string;
    method: string;
    limit: number;
    window: number;
  }): Promise<void> {
    try {
      await this.prisma.rateLimitLog.create({
        data: {
          id: crypto.randomUUID(),
          ip: params.ip,
          userId: params.userId || null,
          route: `${params.method} ${params.route}`,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log rate limit violation:', error);
    }
  }
}

