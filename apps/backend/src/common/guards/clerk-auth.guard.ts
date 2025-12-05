import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma.service';

/**
 * Guard to extract and validate user from request headers
 * Sets req.userId and req.userEmail for use in controllers
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { userId?: string; userEmail?: string }>();
    
    const userEmail = request.headers['x-user-email'] as string | undefined;

    if (!userEmail) {
      throw new UnauthorizedException('User email required in x-user-email header');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach user info to request
    request.userId = user.id;
    request.userEmail = user.email;

    return true;
  }
}

