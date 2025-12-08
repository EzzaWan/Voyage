import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ADMIN_ONLY_KEY } from '../../../common/decorators/admin-only.decorator';
import { SecurityLoggerService } from '../../../common/services/security-logger.service';
import { getClientIp } from '../../../common/utils/webhook-ip-whitelist';
import { AdminSettingsService } from '../admin-settings.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
    private securityLogger: SecurityLoggerService,
    private adminSettingsService: AdminSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminEmail = request.headers['x-admin-email'] as string | undefined;
    const ip = getClientIp(request);

    if (!adminEmail) {
      await this.securityLogger.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        ip,
        details: {
          route: request.url,
          reason: 'Missing admin email header',
        },
      });
      throw new UnauthorizedException('Admin email required');
    }

    const normalizedEmail = adminEmail.toLowerCase();

    // First, try to get admin emails from database (via AdminSettingsService)
    let allowedEmails: string[] = [];
    try {
      allowedEmails = await this.adminSettingsService.getAdminEmails();
    } catch (error) {
      // If database check fails, log but continue to env var fallback
      this.securityLogger.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        ip,
        details: {
          route: request.url,
          reason: 'Failed to fetch admin emails from database, falling back to env vars',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    // Fallback to environment variables if database has no admin emails
    if (allowedEmails.length === 0) {
      allowedEmails = this.configService
        .get<string>('ADMIN_EMAILS', '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    }

    if (allowedEmails.length === 0) {
      throw new ForbiddenException('No admin emails configured');
    }

    if (!allowedEmails.includes(normalizedEmail)) {
      await this.securityLogger.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        ip,
        details: {
          route: request.url,
          attemptedEmail: adminEmail,
          reason: 'Email not in admin list',
        },
      });
      throw new ForbiddenException('Access denied: not an admin');
    }

    request.adminEmail = adminEmail;

    // Log admin action if @AdminOnly() decorator is present
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdminOnly) {
      await this.securityLogger.logSecurityEvent({
        type: 'ADMIN_ACTION',
        ip,
        details: {
          route: request.url,
          method: request.method,
          adminEmail,
        },
      });
    }

    return true;
  }
}

