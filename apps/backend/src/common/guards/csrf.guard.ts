import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityLoggerService } from '../services/security-logger.service';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly CSRF_TOKEN_HEADER = 'x-csrf-token';

  constructor(
    private readonly securityLogger: SecurityLoggerService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Check if CSRF is skipped for this route
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Only check CSRF for state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    // Skip CSRF check for webhooks (they have their own security)
    const path = request.path || request.url;
    if (path.includes('/webhooks/')) {
      return true;
    }

    // Get CSRF token from header
    const csrfToken = request.headers[this.CSRF_TOKEN_HEADER] as string;

    if (!csrfToken) {
      const ip = this.getClientIp(request);
      await this.securityLogger.logSecurityEvent({
        type: 'INVALID_CSRF',
        ip,
        details: {
          route: path,
          method,
          reason: 'Missing CSRF token header',
        },
      });

      throw new ForbiddenException({
        message: 'CSRF token required',
        errorCode: 'INVALID_CSRF',
      });
    }

    // Validate token format (should be a hex string, 64 chars for 32 bytes)
    if (!/^[a-f0-9]{64}$/i.test(csrfToken)) {
      const ip = this.getClientIp(request);
      await this.securityLogger.logSecurityEvent({
        type: 'INVALID_CSRF',
        ip,
        details: {
          route: path,
          method,
          reason: 'Invalid CSRF token format',
        },
      });

      throw new ForbiddenException({
        message: 'Invalid CSRF token format',
        errorCode: 'INVALID_CSRF',
      });
    }

    // Note: Full token validation would require checking against a stored token
    // For now, we validate format. Full validation can be added if tokens are stored server-side
    // For cross-origin API calls, this provides basic protection against simple CSRF attacks

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return ips[0]?.trim() || request.ip || 'unknown';
    }
    return request.ip || 'unknown';
  }
}

