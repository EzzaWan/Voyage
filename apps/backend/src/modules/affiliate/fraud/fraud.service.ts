import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { SecurityLoggerService } from '../../../common/services/security-logger.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { AdminSettingsService } from '../../admin/admin-settings.service';
import * as crypto from 'crypto';

export type RiskLevel = 'low' | 'medium' | 'high' | 'frozen';
export type FraudEventType =
  | 'VPN_IP'
  | 'DATACENTER_IP'
  | 'TOR_IP'
  | 'MULTI_ACCOUNT'
  | 'SELF_REFERRAL'
  | 'DISPOSABLE_EMAIL'
  | 'SUSPICIOUS_EMAIL'
  | 'CARD_REUSED'
  | 'CARD_MULTI_AFFILIATE'
  | 'REFUND_PATTERN'
  | 'CHARGEBACK'
  | 'SAME_DEVICE_MULTIPLE'
  | 'DEVICE_MATCH_AFFILIATE'
  | 'COUNTRY_MISMATCH'
  | 'HIGH_VOLUME_SUSPICIOUS';

const FRAUD_THRESHOLDS = {
  MEDIUM: 20,
  HIGH: 40,
  FROZEN: 60,
};

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    private prisma: PrismaService,
    private securityLogger: SecurityLoggerService,
    private emailService: EmailService,
    private config: ConfigService,
    private adminSettingsService: AdminSettingsService,
  ) {}

  /**
   * Add a fraud event and recalculate score
   */
  async addEvent(
    affiliateId: string,
    type: FraudEventType,
    score: number,
    metadata?: any,
    userId?: string,
    relatedId?: string,
  ): Promise<void> {
    try {
      // Create fraud event
      await this.prisma.affiliateFraudEvent.create({
        data: {
          id: crypto.randomUUID(),
          affiliateId,
          userId: userId || null,
          relatedId: relatedId || null,
          type,
          score,
          metadata: metadata || {},
        },
      });

      // Log to security event log
      await this.securityLogger.logSecurityEvent({
        type: 'AFFILIATE_FRAUD_EVENT',
        userId: userId || undefined,
        details: {
          affiliateId,
          type,
          score,
          metadata,
          relatedId,
          severity: score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low',
        },
      });

      // Recalculate and check thresholds
      await this.recalculateScore(affiliateId);
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to add event for affiliate ${affiliateId}:`, error);
      throw error;
    }
  }

  /**
   * Get current fraud score for affiliate
   */
  async getScore(affiliateId: string) {
    const fraudScore = await this.prisma.affiliateFraudScore.findUnique({
      where: { affiliateId },
      include: {
        Affiliate: {
          select: {
            isFrozen: true,
          },
        },
      },
    });

    if (!fraudScore) {
      // Create initial score if doesn't exist
      return await this.prisma.affiliateFraudScore.create({
        data: {
          affiliateId,
          totalScore: 0,
          riskLevel: 'low',
          updatedAt: new Date(),
        },
      });
    }

    return fraudScore;
  }

  /**
   * Recalculate fraud score from all events
   */
  async recalculateScore(affiliateId: string): Promise<void> {
    try {
      // Sum all fraud event scores
      const events = await this.prisma.affiliateFraudEvent.findMany({
        where: { affiliateId },
        select: { score: true },
      });

      const totalScore = events.reduce((sum, event) => sum + event.score, 0);

      // Determine risk level
      let riskLevel: RiskLevel = 'low';
      if (totalScore >= FRAUD_THRESHOLDS.FROZEN) {
        riskLevel = 'frozen';
      } else if (totalScore >= FRAUD_THRESHOLDS.HIGH) {
        riskLevel = 'high';
      } else if (totalScore >= FRAUD_THRESHOLDS.MEDIUM) {
        riskLevel = 'medium';
      }

      // Update or create fraud score
      await this.prisma.affiliateFraudScore.upsert({
        where: { affiliateId },
        create: {
          affiliateId,
          totalScore,
          riskLevel,
          updatedAt: new Date(),
        },
        update: {
          totalScore,
          riskLevel,
        },
      });

      // Check if we need to freeze/unfreeze
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
        select: { isFrozen: true },
      });

      if (totalScore >= FRAUD_THRESHOLDS.FROZEN && !affiliate?.isFrozen) {
        // Auto-freeze
        await this.freezeAffiliate(affiliateId, true);
      } else if (totalScore < FRAUD_THRESHOLDS.FROZEN && affiliate?.isFrozen) {
        // Auto-unfreeze if score drops below threshold (manual unfreeze still required)
        // Don't auto-unfreeze - require admin action
      }

      // Send alerts at thresholds
      if (totalScore >= FRAUD_THRESHOLDS.HIGH && totalScore < FRAUD_THRESHOLDS.HIGH + 10) {
        // Send high priority alert (only once when crossing threshold)
        await this.sendFraudAlert(affiliateId, 'high', totalScore);
      }
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to recalculate score for affiliate ${affiliateId}:`, error);
      throw error;
    }
  }

  /**
   * Freeze affiliate account
   */
  async freezeAffiliate(affiliateId: string, autoFreeze: boolean = false): Promise<void> {
    try {
      await this.prisma.affiliate.update({
        where: { id: affiliateId },
        data: { isFrozen: true },
      });

      await this.prisma.affiliateFraudScore.update({
        where: { affiliateId },
        data: { riskLevel: 'frozen' },
      });

      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
          include: {
          User: {
            select: {
              email: true,
            },
          },
        },
      });

      // Log security event
      await this.securityLogger.logSecurityEvent({
        type: 'AFFILIATE_FROZEN',
        userId: affiliate?.userId,
        details: {
          affiliateId,
          autoFreeze,
          reason: autoFreeze ? 'Fraud score exceeded threshold' : 'Manual freeze',
        },
      });

      // Send high priority alert if auto-frozen
      if (autoFreeze) {
        await this.sendFraudAlert(affiliateId, 'frozen', await this.getScore(affiliateId).then((s) => s.totalScore));
      }

      this.logger.warn(`[FRAUD] Affiliate ${affiliateId} frozen${autoFreeze ? ' (auto)' : ' (manual)'}`);
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to freeze affiliate ${affiliateId}:`, error);
      throw error;
    }
  }

  /**
   * Unfreeze affiliate account
   */
  async unfreezeAffiliate(affiliateId: string, adminEmail: string): Promise<void> {
    try {
      await this.prisma.affiliate.update({
        where: { id: affiliateId },
        data: { isFrozen: false },
      });

      const score = await this.getScore(affiliateId);
      let riskLevel: RiskLevel = 'low';
      if (score.totalScore >= FRAUD_THRESHOLDS.HIGH) {
        riskLevel = 'high';
      } else if (score.totalScore >= FRAUD_THRESHOLDS.MEDIUM) {
        riskLevel = 'medium';
      }

      await this.prisma.affiliateFraudScore.update({
        where: { affiliateId },
        data: { riskLevel },
      });

      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
          include: {
          User: {
            select: {
              email: true,
            },
          },
        },
      });

      // Log security event
      await this.securityLogger.logSecurityEvent({
        type: 'AFFILIATE_UNFROZEN',
        userId: affiliate?.userId,
        details: {
          affiliateId,
          adminEmail,
        },
      });

      this.logger.log(`[FRAUD] Affiliate ${affiliateId} unfrozen by ${adminEmail}`);
    } catch (error) {
      this.logger.error(`[FRAUD] Failed to unfreeze affiliate ${affiliateId}:`, error);
      throw error;
    }
  }

  /**
   * Send fraud alert to admins
   */
  private async sendFraudAlert(affiliateId: string, severity: 'high' | 'frozen', score: number): Promise<void> {
    try {
      const adminEmails = await this.adminSettingsService.getAdminEmails();
      if (adminEmails.length === 0) return;

      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
          include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
          AffiliateFraudScore: true,
        },
      });

      if (!affiliate) return;

      const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';

      // Send email notification (if email service has fraud alert method)
      // For now, just log it - can be extended later
      this.logger.warn(
        `[FRAUD ALERT] Affiliate ${affiliate.referralCode} (${affiliate.User.email}) - Score: ${score}, Severity: ${severity}`,
      );
    } catch (error) {
      this.logger.error('[FRAUD] Failed to send fraud alert:', error);
    }
  }

  /**
   * Get all fraud events for affiliate
   */
  async getFraudEvents(affiliateId: string, limit: number = 100) {
    return this.prisma.affiliateFraudEvent.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Affiliate: {
          select: {
            referralCode: true,
            User: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get fraud summary with all relevant data
   */
  async getFraudSummary(affiliateId: string) {
    const [affiliate, fraudScore, events, allClicks, allSignups, clicksForDisplay, signupsForDisplay] = await Promise.all([
      this.prisma.affiliate.findUnique({
        where: { id: affiliateId },
          include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.getScore(affiliateId),
      this.getFraudEvents(affiliateId, 50),
      // Get ALL clicks for statistics
      this.prisma.affiliateClick.findMany({
        where: { affiliateId },
        select: {
          ipAddress: true,
          deviceFingerprint: true,
          country: true,
          createdAt: true,
        },
      }),
      // Get ALL signups for statistics
      this.prisma.affiliateSignup.findMany({
        where: { affiliateId },
        select: {
          ipAddress: true,
          deviceFingerprint: true,
          country: true,
        },
      }),
      // Get limited clicks for display
      this.prisma.affiliateClick.findMany({
        where: { affiliateId },
        select: {
          ipAddress: true,
          deviceFingerprint: true,
          country: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      // Get limited signups for display
      this.prisma.affiliateSignup.findMany({
        where: { affiliateId },
          include: {
          User: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Get unique IPs from both clicks AND signups
    const uniqueIPs = new Set([
      ...allClicks.map((c) => c.ipAddress).filter(Boolean),
      ...allSignups.map((s) => s.ipAddress).filter(Boolean),
    ]);
    
    // Get unique devices from both clicks AND signups
    const uniqueDevices = new Set([
      ...allClicks.map((c) => c.deviceFingerprint).filter(Boolean),
      ...allSignups.map((s) => s.deviceFingerprint).filter(Boolean),
    ]);
    
    // Get unique countries from both clicks AND signups
    const uniqueCountries = new Set([
      ...allClicks.map((c) => c.country).filter(Boolean),
      ...allSignups.map((s) => s.country).filter(Boolean),
    ]);

    // Device fingerprint counts from all clicks and signups
    const deviceCounts = new Map<string, number>();
    [...allClicks, ...allSignups].forEach((item) => {
      const fp = item.deviceFingerprint;
      if (fp) {
        deviceCounts.set(fp, (deviceCounts.get(fp) || 0) + 1);
      }
    });

    return {
      affiliate,
      fraudScore,
      events,
      stats: {
        totalClicks: allClicks.length, // Actual total, not limited
        totalSignups: allSignups.length, // Actual total, not limited
        uniqueIPs: uniqueIPs.size,
        uniqueDevices: uniqueDevices.size,
        uniqueCountries: uniqueCountries.size,
        deviceCounts: Array.from(deviceCounts.entries()).map(([fingerprint, count]) => ({
          fingerprint,
          count,
        })),
        ips: Array.from(uniqueIPs),
        countries: Array.from(uniqueCountries),
      },
      signups: signupsForDisplay.map((s) => ({
        userId: s.userId,
        userEmail: s.User.email,
        ipAddress: s.ipAddress,
        deviceFingerprint: s.deviceFingerprint,
        country: s.country,
        createdAt: s.createdAt,
      })),
    };
  }
}

