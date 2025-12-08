import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Headers,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from '../admin.service';
import { AdminSettingsService } from '../admin-settings.service';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('admin/settings')
@UseGuards(AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly adminSettingsService: AdminSettingsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getSettings(@Req() req: any) {
    let settings = await this.prisma.adminSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      // Create default settings
      settings = await this.prisma.adminSettings.create({
        data: {
          id: 'settings',
          mockMode: false,
          defaultMarkupPercent: 0,
          defaultCurrency: 'USD',
          adminEmails: [],
        },
      });
    }

    return settings;
  }

  @Post()
  async updateSettings(
    @Body()
    body: {
      mockMode?: boolean;
      defaultMarkupPercent?: number;
      defaultCurrency?: string;
      adminEmails?: string[];
      emailFrom?: string;
      emailProvider?: string;
      emailEnabled?: boolean;
    },
    @Req() req: any,
  ) {
    const updated = await this.prisma.adminSettings.upsert({
      where: { id: 'settings' },
      update: {
        mockMode: body.mockMode,
        defaultMarkupPercent: body.defaultMarkupPercent,
        defaultCurrency: body.defaultCurrency,
        adminEmails: body.adminEmails || [],
        emailFrom: body.emailFrom,
        emailProvider: body.emailProvider,
        emailEnabled: body.emailEnabled,
      },
      create: {
        id: 'settings',
        mockMode: body.mockMode ?? false,
        defaultMarkupPercent: body.defaultMarkupPercent ?? 0,
        defaultCurrency: body.defaultCurrency ?? 'USD',
        adminEmails: body.adminEmails || [],
        emailFrom: body.emailFrom,
        emailProvider: body.emailProvider,
        emailEnabled: body.emailEnabled ?? true,
      },
    });

    // Log action
    await this.adminService.logAction(
      req.adminEmail,
      'update_settings',
      'settings',
      'settings',
      body,
    );

    // Clear cache after update
    this.adminSettingsService.clearCache();

    return updated;
  }
}

// Separate controller for admin check (no guard required)
@Controller('admin')
export class AdminCheckController {
  constructor(
    private readonly adminSettingsService: AdminSettingsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('check')
  async checkAdmin(@Query('email') email: string) {
    if (!email) {
      return { isAdmin: false, message: 'Email parameter required' };
    }

    const normalizedEmail = email.toLowerCase();

    // First, try to get admin emails from database
    let allowedEmails: string[] = [];
    try {
      allowedEmails = await this.adminSettingsService.getAdminEmails();
    } catch (error) {
      // If database check fails, fall back to env vars
    }

    // Fallback to environment variables if database has no admin emails
    if (allowedEmails.length === 0) {
      allowedEmails = this.configService
        .get<string>('ADMIN_EMAILS', '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    }

    const isAdmin = allowedEmails.includes(normalizedEmail);

    return {
      isAdmin,
      email: normalizedEmail,
    };
  }
}

