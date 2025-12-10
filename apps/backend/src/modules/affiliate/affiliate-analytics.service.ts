import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateAnalyticsService {
  private readonly logger = new Logger(AffiliateAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Parse device and browser info from user agent
   */
  parseUserAgent(userAgent?: string): { device?: string; browser?: string } {
    if (!userAgent) return {};

    try {
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const browser = parser.getBrowser();

      let deviceType: string | undefined;
      if (device.type) {
        deviceType = device.type; // mobile, tablet, desktop
      } else {
        // Fallback: check user agent for common patterns
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceType = 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceType = 'tablet';
        } else {
          deviceType = 'desktop';
        }
      }

      return {
        device: deviceType,
        browser: browser.name || undefined,
      };
    } catch (error) {
      this.logger.warn('Failed to parse user agent:', error);
      return {};
    }
  }

  /**
   * Get country from IP address using geoip-lite
   */
  getCountryFromIp(ip: string): string | undefined {
    try {
      // Skip local/private IPs
      if (
        ip === 'unknown' ||
        ip === '127.0.0.1' ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') ||
        ip.startsWith('172.20.') ||
        ip.startsWith('172.21.') ||
        ip.startsWith('172.22.') ||
        ip.startsWith('172.23.') ||
        ip.startsWith('172.24.') ||
        ip.startsWith('172.25.') ||
        ip.startsWith('172.26.') ||
        ip.startsWith('172.27.') ||
        ip.startsWith('172.28.') ||
        ip.startsWith('172.29.') ||
        ip.startsWith('172.30.') ||
        ip.startsWith('172.31.')
      ) {
        return undefined;
      }

      const geo = geoip.lookup(ip);
      return geo?.country || undefined;
    } catch (error) {
      this.logger.warn('Failed to lookup geo IP:', error);
      return undefined;
    }
  }

  /**
   * Track affiliate click
   */
  async trackClick(
    affiliateId: string,
    referralCode: string,
    ipAddress?: string,
    userAgent?: string,
    deviceFingerprint?: string,
  ): Promise<string> {
    try {
      const { device, browser } = this.parseUserAgent(userAgent);
      const country = ipAddress ? this.getCountryFromIp(ipAddress) : undefined;

      const click = await this.prisma.affiliateClick.create({
        data: {
          id: crypto.randomUUID(),
          affiliateId,
          referralCode: referralCode.toUpperCase(),
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          device: device || null,
          browser: browser || null,
          country: country || null,
          deviceFingerprint: deviceFingerprint || null,
        },
      });

      this.logger.log(`[ANALYTICS] Tracked click for affiliate ${affiliateId}`);
      return click.id;
    } catch (error) {
      this.logger.error(`[ANALYTICS] Failed to track click:`, error);
      throw error;
    }
  }

  /**
   * Track affiliate signup
   */
  async trackSignup(
    affiliateId: string,
    referralCode: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceFingerprint?: string,
  ): Promise<string> {
    try {
      // Check if signup already exists for this user
      const existing = await this.prisma.affiliateSignup.findUnique({
        where: { userId },
      });

      if (existing) {
        this.logger.log(`[ANALYTICS] Signup already tracked for user ${userId}`);
        return existing.id;
      }

      const { device, browser } = this.parseUserAgent(userAgent);
      const country = ipAddress ? this.getCountryFromIp(ipAddress) : undefined;

      const signup = await this.prisma.affiliateSignup.create({
        data: {
          id: crypto.randomUUID(),
          affiliateId,
          referralCode: referralCode.toUpperCase(),
          userId,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          device: device || null,
          browser: browser || null,
          country: country || null,
          deviceFingerprint: deviceFingerprint || null,
        },
      });

      this.logger.log(`[ANALYTICS] Tracked signup for affiliate ${affiliateId}, user ${userId}`);
      return signup.id;
    } catch (error) {
      this.logger.error(`[ANALYTICS] Failed to track signup:`, error);
      throw error;
    }
  }

  /**
   * Get click count for affiliate
   */
  async getClicks(affiliateId: string): Promise<number> {
    return this.prisma.affiliateClick.count({
      where: { affiliateId },
    });
  }

  /**
   * Get signup count for affiliate
   */
  async getSignups(affiliateId: string): Promise<number> {
    return this.prisma.affiliateSignup.count({
      where: { affiliateId },
    });
  }

  /**
   * Get referred purchases count (users who made at least one purchase)
   */
  async getReferredPurchases(affiliateId: string): Promise<number> {
    const referrals = await this.prisma.referral.findMany({
      where: { affiliateId },
      select: { referredUserId: true },
    });

    if (referrals.length === 0) return 0;

    const referredUserIds = referrals.map((r) => r.referredUserId);

    // Count unique users who have at least one order or topup
    const [orderUsers, topupUsers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          userId: { in: referredUserIds },
          status: { in: ['paid', 'provisioning', 'active'] },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.topUp.findMany({
        where: {
          userId: { in: referredUserIds },
          status: 'paid',
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);
    
    const ordersCount = orderUsers.length;
    const topupsCount = topupUsers.length;

    // Get unique user IDs from both orders and topups
    const uniqueOrderUserIds = new Set(orderUsers.map((o) => o.userId));
    const uniqueTopupUserIds = new Set(topupUsers.map((t) => t.userId));
    const uniqueBuyers = new Set([
      ...orderUsers.map((o) => o.userId),
      ...topupUsers.map((t) => t.userId),
    ]);

    return uniqueBuyers.size;
  }

  /**
   * Get funnel metrics for affiliate
   */
  async getFunnel(affiliateId: string) {
    const [clicks, signups, buyers] = await Promise.all([
      this.getClicks(affiliateId),
      this.getSignups(affiliateId),
      this.getReferredPurchases(affiliateId),
    ]);

    const clickToSignup = clicks > 0 ? signups / clicks : 0;
    const signupToBuyer = signups > 0 ? buyers / signups : 0;
    const clickToBuyer = clicks > 0 ? buyers / clicks : 0;

    return {
      clicks,
      signups,
      buyers,
      clickToSignup,
      signupToBuyer,
      clickToBuyer,
    };
  }

  /**
   * Get time series data for clicks (last 30 days)
   */
  async getClickTimeSeries(affiliateId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clicks = await this.prisma.affiliateClick.findMany({
      where: {
        affiliateId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = new Map<string, number>();
    clicks.forEach((click) => {
      const date = click.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    // Fill in missing dates with 0
    const result: Array<{ date: string; clicks: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        clicks: grouped.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get time series data for signups (last 30 days)
   */
  async getSignupTimeSeries(affiliateId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const signups = await this.prisma.affiliateSignup.findMany({
      where: {
        affiliateId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, number>();
    signups.forEach((signup) => {
      const date = signup.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    const result: Array<{ date: string; signups: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        signups: grouped.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get time series data for commissions (last 30 days)
   */
  async getCommissionTimeSeries(affiliateId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const commissions = await this.prisma.commission.findMany({
      where: {
        affiliateId,
        createdAt: { gte: startDate },
        status: { in: ['pending', 'available'] },
      },
      select: { amountCents: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, number>();
    commissions.forEach((commission) => {
      const date = commission.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + commission.amountCents);
    });

    const result: Array<{ date: string; commissionCents: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        commissionCents: grouped.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(affiliateId: string) {
    const [clicks, signups] = await Promise.all([
      this.prisma.affiliateClick.findMany({
        where: { affiliateId },
        select: { device: true, browser: true },
      }),
      this.prisma.affiliateSignup.findMany({
        where: { affiliateId },
        select: { device: true, browser: true },
      }),
    ]);

    const deviceCounts = new Map<string, number>();
    const browserCounts = new Map<string, number>();

    [...clicks, ...signups].forEach((item) => {
      if (item.device) {
        deviceCounts.set(item.device, (deviceCounts.get(item.device) || 0) + 1);
      }
      if (item.browser) {
        browserCounts.set(item.browser, (browserCounts.get(item.browser) || 0) + 1);
      }
    });

    return {
      devices: Array.from(deviceCounts.entries()).map(([device, count]) => ({ device, count })),
      browsers: Array.from(browserCounts.entries()).map(([browser, count]) => ({ browser, count })),
    };
  }

  /**
   * Get geography statistics
   */
  async getGeoStats(affiliateId: string) {
    const [clicks, signups, referrals] = await Promise.all([
      this.prisma.affiliateClick.findMany({
        where: { affiliateId },
        select: { country: true },
      }),
      this.prisma.affiliateSignup.findMany({
        where: { affiliateId },
        select: { country: true, userId: true },
      }),
      this.prisma.referral.findMany({
        where: { affiliateId },
        select: { referredUserId: true },
      }),
    ]);

    const referredUserIds = referrals.map((r) => r.referredUserId);

    // Get purchases by country (from signups)
    const signupCountries = new Map<string, Set<string>>();
    signups.forEach((signup) => {
      if (signup.country) {
        if (!signupCountries.has(signup.country)) {
          signupCountries.set(signup.country, new Set());
        }
        // We need to check if this user made purchases
        // For now, we'll count signups as potential purchases
      }
    });

    // Get actual purchases by checking orders/topups of referred users
    const purchases = await Promise.all(
      Array.from(new Set(signups.map((s) => s.userId))).map(async (userId) => {
        const [hasOrder, hasTopup] = await Promise.all([
          this.prisma.order.count({
            where: {
              userId,
              status: { in: ['paid', 'provisioning', 'active'] },
            },
            take: 1,
          }),
          this.prisma.topUp.count({
            where: {
              userId,
              status: 'paid',
            },
            take: 1,
          }),
        ]);

        if (hasOrder > 0 || hasTopup > 0) {
          const signup = signups.find((s) => s.userId === userId);
          return signup?.country;
        }
        return null;
      }),
    );

    const purchaseCountries = new Map<string, number>();
    purchases.forEach((country) => {
      if (country) {
        purchaseCountries.set(country, (purchaseCountries.get(country) || 0) + 1);
      }
    });

    const clickCountries = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.country) {
        clickCountries.set(click.country, (clickCountries.get(click.country) || 0) + 1);
      }
    });

    const signupCountryCounts = new Map<string, number>();
    signups.forEach((signup) => {
      if (signup.country) {
        signupCountryCounts.set(signup.country, (signupCountryCounts.get(signup.country) || 0) + 1);
      }
    });

    return {
      clicks: Array.from(clickCountries.entries()).map(([country, count]) => ({ country, count })),
      signups: Array.from(signupCountryCounts.entries()).map(([country, count]) => ({ country, count })),
      purchases: Array.from(purchaseCountries.entries()).map(([country, count]) => ({ country, count })),
    };
  }

  /**
   * Get total referred revenue
   */
  async getReferredRevenue(affiliateId: string): Promise<number> {
    const referrals = await this.prisma.referral.findMany({
      where: { affiliateId },
      select: { referredUserId: true },
    });

    if (referrals.length === 0) return 0;

    const referredUserIds = referrals.map((r) => r.referredUserId);

    const [orders, topups] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          userId: { in: referredUserIds },
          status: { in: ['paid', 'provisioning', 'active'] },
        },
        select: { amountCents: true },
      }),
      this.prisma.topUp.findMany({
        where: {
          userId: { in: referredUserIds },
          status: 'paid',
        },
        select: { amountCents: true },
      }),
    ]);

    const totalRevenue =
      orders.reduce((sum, o) => sum + o.amountCents, 0) +
      topups.reduce((sum, t) => sum + t.amountCents, 0);

    return totalRevenue;
  }
}

