import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PrismaService } from '../../prisma.service';
import { AdminService } from '../admin/admin.service';

@Controller('admin/email')
@UseGuards(AdminGuard)
export class AdminEmailController {
  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  @Post('test')
  async sendTest(@Body() body: { to: string; template?: string }, @Req() req: any) {
    const { to, template = 'test-email' } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to)) {
      throw new HttpException(
        'Valid email address required (format: user@example.com)',
        HttpStatus.BAD_REQUEST
      );
    }

    const variables = {
      now: new Date().toISOString(),
      appUrl: process.env.WEB_URL || 'http://localhost:3000',
    };

    const result = await this.emailService.sendEmail({
      to,
      subject: `Test Email — Voyage`,
      template,
      variables,
      idempotencyKey: `test-${Date.now()}-${to}`,
    });

    // Log admin action
    await this.adminService.logAction(
      req.adminEmail,
      'send_test_email',
      'email',
      result.emailLogId || 'unknown',
      { to, template },
    );

    return result;
  }

  @Get('logs')
  async getLogs(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('template') template?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 50;
    if (take > 200) {
      throw new HttpException('Limit cannot exceed 200', HttpStatus.BAD_REQUEST);
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (template) {
      where.template = template;
    }

    const logs = await this.prisma.emailLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      ...log,
      variables: log.variables || {},
      createdAt: log.createdAt.toISOString(),
    }));
  }

  @Get('logs/:id')
  async getLog(@Param('id') id: string) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new HttpException('Email log not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...log,
      variables: log.variables || {},
      createdAt: log.createdAt.toISOString(),
    };
  }

  @Post('resend/:id')
  async resendEmail(@Param('id') id: string, @Req() req: any) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new HttpException('Email log not found', HttpStatus.NOT_FOUND);
    }

    // Resend using the same template and variables
    const result = await this.emailService.sendEmail({
      to: log.to,
      subject: log.subject,
      template: log.template,
      variables: (log.variables as Record<string, any>) || {},
      idempotencyKey: `resend-${id}-${Date.now()}`,
    });

    // Log admin action
    await this.adminService.logAction(
      req.adminEmail,
      'resend_email',
      'email_log',
      id,
      { originalLogId: id, newLogId: result.emailLogId },
    );

    return result;
  }
}

