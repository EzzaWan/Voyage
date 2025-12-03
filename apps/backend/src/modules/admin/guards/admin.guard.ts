import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminEmail = request.headers['x-admin-email'];

    if (!adminEmail) {
      throw new UnauthorizedException('Admin email required');
    }

    const allowedEmails = this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length === 0) {
      throw new ForbiddenException('No admin emails configured');
    }

    if (!allowedEmails.includes(adminEmail.toLowerCase())) {
      throw new ForbiddenException('Access denied: not an admin');
    }

    request.adminEmail = adminEmail;
    return true;
  }
}

