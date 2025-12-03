import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/logs')
@UseGuards(AdminGuard)
export class AdminLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLogs(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 100;

    // Get admin logs
    const adminLogs = await this.prisma.adminLog.findMany({
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get webhook events (for provider logs)
    const webhookEvents = await this.prisma.webhookEvent.findMany({
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      adminLogs: adminLogs.map((log) => ({
        ...log,
        data: log.data,
      })),
      webhookEvents: webhookEvents.map((event) => ({
        id: event.id,
        source: event.source,
        payload: event.payload,
        processed: event.processed,
        createdAt: event.createdAt,
      })),
    };
  }
}

