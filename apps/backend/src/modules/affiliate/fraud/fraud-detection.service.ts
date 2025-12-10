import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { FraudService } from './fraud.service';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

// Disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'inboxkitten.com',
  '10minutemail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'throwaway.email',
  'temp-mail.org',
  'mohmal.com',
  'sharklasers.com',
  'grr.la',
  'getnada.com',
  'mailnesia.com',
  'mytrashmail.com',
  'trashmail.com',
  'meltmail.com',
  '33mail.com',
  'mailcatch.com',
  'mintemail.com',
];

// Known VPN/Proxy ASNs and datacenter IP ranges (simplified - in production use a service)
const VPN_ASNS = [
  // AWS
  'AS16509',
  'AS14618',
  // Azure
  'AS8075',
  // Google Cloud
  'AS15169',
  // Digital Ocean
  'AS14061',
  // Known VPN providers (simplified)
  'AS13335', // Cloudflare
  'AS32934', // Facebook
];

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    private prisma: PrismaService,
    private fraudService: FraudService,
  ) {}

  /**
   * Generate device fingerprint from user agent and other data
   */
  generateDeviceFingerprint(
    userAgent?: string,
    timezone?: string,
    language?: string,
    screenResolution?: string,
  ): string {
    const parser = new UAParser(userAgent || '');
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    const fingerprintData = [
      device.type || 'unknown',
      os.name || 'unknown',
      os.version || 'unknown',
      browser.name || 'unknown',
      browser.version || 'unknown',
      timezone || 'unknown',
      language || 'unknown',
      screenResolution || 'unknown',
    ].join('|');

    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * Check IP reputation (VPN, datacenter, Tor)
   */
  async checkIPReputation(ip: string, affiliateId: string, relatedId?: string): Promise<boolean> {
    if (!ip || ip === 'unknown' || this.isLocalIP(ip)) {
      return false;
    }

    try {
      const geo = geoip.lookup(ip);
      if (!geo) {
        return false;
      }

      let suspicious = false;
      let fraudType: 'VPN_IP' | 'DATACENTER_IP' | 'TOR_IP' = 'VPN_IP';
      let score = 15;

      // Check for datacenter/VPN IPs (simplified check - use IP2Location or similar in production)
      const isDatacenter = this.isDatacenterIP(ip, geo);
      if (isDatacenter) {
        suspicious = true;
        fraudType = 'DATACENTER_IP';
        score = 20;
      }

      // Check for Tor exit nodes (simplified - use Tor exit node list in production)
      const isTor = await this.isTorExitNode(ip);
      if (isTor) {
        suspicious = true;
        fraudType = 'TOR_IP';
        score = 25;
      }

      // Check country mismatch with affiliate
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
        include: {
          AffiliateClick: {
            where: {
              country: { not: null },
            },
            select: {
              country: true,
            },
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (affiliate && affiliate.AffiliateClick.length > 0) {
        const commonCountries = new Map<string, number>();
        affiliate.AffiliateClick.forEach((click) => {
          if (click.country) {
            commonCountries.set(click.country, (commonCountries.get(click.country) || 0) + 1);
          }
        });

        const mostCommonCountry = Array.from(commonCountries.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        if (mostCommonCountry && geo.country !== mostCommonCountry) {
          // Country mismatch - less suspicious than VPN but still noteworthy
          // Don't trigger fraud event for country mismatch alone, but log it
          this.logger.debug(`[FRAUD] Country mismatch for affiliate ${affiliateId}: ${geo.country} vs ${mostCommonCountry}`);
        }
      }

      if (suspicious) {
        await this.fraudService.addEvent(
          affiliateId,
          fraudType,
          score,
          {
            ip,
            country: geo.country,
            city: geo.city,
          },
          undefined,
          relatedId,
        );
        return true;
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to check IP reputation for ${ip}:`, error);
    }

    return false;
  }

  /**
   * Check if IP is local/private
   */
  private isLocalIP(ip: string): boolean {
    return (
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
    );
  }

  /**
   * Check if IP is from datacenter (simplified)
   */
  private isDatacenterIP(ip: string, geo: any): boolean {
    // In production, use IP2Location or MaxMind database
    // For now, check if organization contains common datacenter keywords
    const org = geo?.org?.toLowerCase() || '';
    const datacenterKeywords = ['amazon', 'aws', 'azure', 'google', 'cloud', 'digitalocean', 'linode', 'vultr', 'ovh'];

    return datacenterKeywords.some((keyword) => org.includes(keyword));
  }

  /**
   * Check if IP is Tor exit node (simplified - use Tor exit node list in production)
   */
  private async isTorExitNode(ip: string): Promise<boolean> {
    // In production, fetch from Tor exit node list or use a service
    // For now, return false
    return false;
  }

  /**
   * Check device fingerprint for duplicates
   */
  async checkDeviceFingerprint(
    affiliateId: string,
    deviceFingerprint: string,
    userId?: string,
    relatedId?: string,
  ): Promise<void> {
    if (!deviceFingerprint) return;

    try {
      // Count signups from this device
      const signupsFromDevice = await this.prisma.affiliateSignup.count({
        where: {
          affiliateId,
          deviceFingerprint,
        },
      });

      if (signupsFromDevice > 1) {
        // Multiple signups from same device
        await this.fraudService.addEvent(
          affiliateId,
          'SAME_DEVICE_MULTIPLE',
          20,
          {
            deviceFingerprint,
            signupCount: signupsFromDevice,
          },
          userId,
          relatedId,
        );
      }

      if (signupsFromDevice >= 10) {
        // 10+ signups from same device - auto-freeze threshold
        await this.fraudService.addEvent(
          affiliateId,
          'SAME_DEVICE_MULTIPLE',
          40, // High score to trigger freeze
          {
            deviceFingerprint,
            signupCount: signupsFromDevice,
            autoFreeze: true,
          },
          userId,
          relatedId,
        );
      }

      // Check if device matches affiliate's own device
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
        include: {
          User: {
            select: {
              id: true,
            },
          },
        },
      });

      if (affiliate && userId && userId === affiliate.userId) {
        // Self-referral attempt
        await this.fraudService.addEvent(
          affiliateId,
          'SELF_REFERRAL',
          25,
          {
            deviceFingerprint,
            userId,
          },
          userId,
          relatedId,
        );
      }

      // Check if same device used across multiple affiliate codes
      const otherSignups = await this.prisma.affiliateSignup.findMany({
        where: {
          deviceFingerprint,
          affiliateId: { not: affiliateId },
        },
        select: {
          affiliateId: true,
        },
        distinct: ['affiliateId'],
      });

      if (otherSignups.length > 0) {
        // Same device used for multiple affiliate codes
        await this.fraudService.addEvent(
          affiliateId,
          'MULTI_ACCOUNT',
          30,
          {
            deviceFingerprint,
            otherAffiliateIds: otherSignups.map((s) => s.affiliateId),
          },
          userId,
          relatedId,
        );
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to check device fingerprint:`, error);
    }
  }

  /**
   * Check email risk (disposable, suspicious patterns)
   */
  async checkEmailRisk(email: string, affiliateId: string, userId: string, relatedId?: string): Promise<void> {
    if (!email) return;

    try {
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) return;

      // Check disposable email
      if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
        await this.fraudService.addEvent(
          affiliateId,
          'DISPOSABLE_EMAIL',
          30,
          {
            email,
            domain,
          },
          userId,
          relatedId,
        );
      }

      // Check suspicious email patterns
      const localPart = email.split('@')[0]?.toLowerCase() || '';

      // Check for aliasing (john+1, john+2, etc.)
      if (localPart.includes('+')) {
        const baseEmail = localPart.split('+')[0];
        const aliasNumber = localPart.split('+')[1]?.split('@')[0];

        // Check if this base email has multiple aliases
        const existingSignups = await this.prisma.affiliateSignup.findMany({
          where: {
            affiliateId,
            User: {
              email: {
                startsWith: `${baseEmail}+`,
              },
            },
          },
          select: {
            userId: true,
          },
        });

        if (existingSignups.length > 0) {
          await this.fraudService.addEvent(
            affiliateId,
            'SUSPICIOUS_EMAIL',
            10,
            {
              email,
              baseEmail,
              existingAliasCount: existingSignups.length,
            },
            userId,
            relatedId,
          );
        }
      }

      // Check for clearly bot-generated emails (simple patterns)
      const botPatterns = [
        /^[a-z]+\d{6,}@/, // name123456@
        /^\d+@/, // 123456@
        /^test\d*@/i, // test@, test1@
        /^user\d+@/i, // user123@
      ];

      for (const pattern of botPatterns) {
        if (pattern.test(email)) {
          await this.fraudService.addEvent(
            affiliateId,
            'SUSPICIOUS_EMAIL',
            25,
            {
              email,
              pattern: pattern.toString(),
            },
            userId,
            relatedId,
          );
          break;
        }
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to check email risk:`, error);
    }
  }

  /**
   * Check payment method for reuse across accounts
   */
  async checkPaymentMethod(
    paymentMethodId: string,
    cardLast4: string,
    cardFingerprint: string | null,
    affiliateId: string,
    orderId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Check if same payment method used across multiple accounts
      const ordersWithSameCard = await this.prisma.order.findMany({
        where: {
          paymentRef: paymentMethodId,
          userId: { not: userId },
          status: { in: ['paid', 'active', 'provisioning'] },
        },
        select: {
          userId: true,
          id: true,
        },
      });

      if (ordersWithSameCard.length > 0) {
        // Same card used across multiple accounts
        await this.fraudService.addEvent(
          affiliateId,
          'CARD_REUSED',
          40,
          {
            paymentMethodId,
            cardLast4,
            cardFingerprint,
            otherUserIds: ordersWithSameCard.map((o) => o.userId),
            orderId,
          },
          userId,
          orderId,
        );
      }

      // Check if same card used for multiple affiliate codes
      const referredOrders = await this.prisma.order.findMany({
        where: {
          paymentRef: paymentMethodId,
          status: { in: ['paid', 'active', 'provisioning'] },
          User: {
            Referral: {
              affiliateId: { not: affiliateId },
            },
          },
        },
        include: {
          User: {
            include: {
              Referral: {
                select: {
                  affiliateId: true,
                },
              },
            },
          },
        },
      });

      const uniqueAffiliateIds = new Set(
        referredOrders
          .map((o) => o.User.Referral?.affiliateId)
          .filter((id): id is string => id !== null && id !== affiliateId),
      );

      if (uniqueAffiliateIds.size > 0) {
        await this.fraudService.addEvent(
          affiliateId,
          'CARD_MULTI_AFFILIATE',
          50,
          {
            paymentMethodId,
            cardLast4,
            cardFingerprint,
            otherAffiliateIds: Array.from(uniqueAffiliateIds),
            orderId,
          },
          userId,
          orderId,
        );
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to check payment method:`, error);
    }
  }

  /**
   * Check for refund pattern abuse
   */
  async checkRefundPattern(affiliateId: string, orderId: string, userId: string): Promise<void> {
    try {
      // Count refunds from this affiliate's referrals
      const referrals = await this.prisma.referral.findMany({
        where: { affiliateId },
        select: { referredUserId: true },
      });

      if (referrals.length === 0) return;

      const referredUserIds = referrals.map((r) => r.referredUserId);

      const refundedOrders = await this.prisma.order.count({
        where: {
          userId: { in: referredUserIds },
          refundedAt: { not: null },
        },
      });

      const totalOrders = await this.prisma.order.count({
        where: {
          userId: { in: referredUserIds },
          status: { in: ['paid', 'active', 'provisioning'] },
        },
      });

      if (totalOrders > 0) {
        const refundRate = refundedOrders / totalOrders;
        if (refundRate > 0.5) {
          // More than 50% refund rate
          await this.fraudService.addEvent(
            affiliateId,
            'REFUND_PATTERN',
            30,
            {
              refundRate,
              refundedOrders,
              totalOrders,
              orderId,
            },
            userId,
            orderId,
          );
        }
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to check refund pattern:`, error);
    }
  }
}

