import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(
    adminEmail: string,
    action: string,
    entityType: string,
    entityId: string,
    data: any,
  ) {
    try {
      await this.prisma.adminLog.create({
        data: {
          action,
          adminEmail,
          entityType,
          entityId,
          data: data as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log admin action: ${error.message}`);
    }
  }
}

