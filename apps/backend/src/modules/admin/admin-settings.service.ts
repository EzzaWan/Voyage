import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);
  private settingsCache: any = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const now = Date.now();
    
    // Return cached settings if valid
    if (this.settingsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.settingsCache;
    }

    // Fetch from database
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
          emailEnabled: true,
        },
      });
      this.logger.log('Created default AdminSettings');
    }

    // Update cache
    this.settingsCache = settings;
    this.cacheTimestamp = now;

    return settings;
  }

  async getMockMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.mockMode;
  }

  async getDefaultMarkupPercent(): Promise<number> {
    const settings = await this.getSettings();
    return settings.defaultMarkupPercent || 0;
  }

  async getDefaultCurrency(): Promise<string> {
    const settings = await this.getSettings();
    return settings.defaultCurrency || 'USD';
  }

  // Clear cache (call this after updating settings)
  clearCache() {
    this.settingsCache = null;
    this.cacheTimestamp = 0;
  }
}

