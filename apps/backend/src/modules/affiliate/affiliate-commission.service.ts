import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateCommissionService {
  private readonly logger = new Logger(AffiliateCommissionService.name);
  private HOLDING_PERIOD_DAYS: number = 7; // Default 7 days holding period

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(forwardRef(() => EmailService))
    private emailService?: EmailService,
  ) {
    // Allow override via env var
    const envHoldingPeriod = this.config.get<number>('AFFILIATE_COMMISSION_HOLDING_DAYS');
    if (envHoldingPeriod) {
      this.HOLDING_PERIOD_DAYS = envHoldingPeriod;
    }
  }

  /**
   * Calculate holding period end date
   */
  private getAvailableAt(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.HOLDING_PERIOD_DAYS);
    return date;
  }

  /**
   * Create commission with pending status and holding period
   */
  async createCommission(
    affiliateId: string,
    orderId: string,
    orderType: 'order' | 'topup',
    amountCents: number,
  ): Promise<any> {
    try {
      // Calculate 10% commission
      const commissionCents = Math.round(amountCents * 0.1);

      if (commissionCents <= 0) {
        this.logger.warn(`[COMMISSION] Commission amount too small: ${commissionCents} cents`);
        return;
      }

      const availableAt = this.getAvailableAt();

      // Create commission record with pending status
      const commission = await this.prisma.commission.create({
        data: {
          id: crypto.randomUUID(),
          affiliateId,
          orderId,
          orderType,
          amountCents: commissionCents,
          status: 'pending',
          availableAt,
        },
      });

      // Update total commission (always count towards lifetime total)
      await this.prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          totalCommission: {
            increment: commissionCents,
          },
        },
      });

      this.logger.log(
        `[COMMISSION] Created pending commission: ${commissionCents} cents for ${orderType} ${orderId} to affiliate ${affiliateId} (available at: ${availableAt.toISOString()})`,
      );

      // Send email notification to affiliate (fire and forget)
      if (this.emailService) {
        try {
          const affiliate = await this.prisma.affiliate.findUnique({
            where: { id: affiliateId },
            include: { User: true },
          });

          if (affiliate?.User?.email) {
            const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
            await this.emailService.sendAffiliateCommissionEarned(
              affiliate.User.email,
              {
                commission: {
                  id: commission.id,
                  amountCents: commissionCents,
                  orderType,
                  orderId,
                },
                dashboardUrl: `${webUrl}/account/affiliate`,
              },
            );
          }
        } catch (err) {
          this.logger.error(`[COMMISSION] Failed to send commission email:`, err);
        }
      }

      return commission;
    } catch (error) {
      this.logger.error(`[COMMISSION] Failed to create commission:`, error);
      throw error;
    }
  }

  /**
   * Reverse commission when order/topup is refunded
   * Only reverses if status is "pending" or "available"
   */
  async reverseCommission(orderId: string, orderType: 'order' | 'topup'): Promise<void> {
    try {
      // Find commission by orderId and orderType
      const commission = await this.prisma.commission.findFirst({
        where: {
          orderId,
          orderType,
          status: {
            in: ['pending', 'available'], // Only reverse if not already reversed or paid out
          },
        },
        include: {
          Affiliate: true,
        },
      });

      if (!commission) {
        this.logger.log(`[COMMISSION] No reversible commission found for ${orderType} ${orderId}`);
        return;
      }

      // Update commission status to reversed
      await this.prisma.commission.update({
        where: { id: commission.id },
        data: {
          status: 'reversed',
        },
      });

      // Subtract from affiliate's total commission
      await this.prisma.affiliate.update({
        where: { id: commission.affiliateId },
        data: {
          totalCommission: {
            decrement: commission.amountCents,
          },
        },
      });

      this.logger.log(
        `[COMMISSION] Reversed commission ${commission.id}: ${commission.amountCents} cents for ${orderType} ${orderId} from affiliate ${commission.affiliateId}`,
      );
    } catch (error) {
      this.logger.error(`[COMMISSION] Failed to reverse commission:`, error);
      throw error;
    }
  }

  /**
   * Mark commissions as available when holding period expires
   * Called by cron job
   */
  async markCommissionsAsAvailable(): Promise<number> {
    try {
      const now = new Date();

      // Find all pending commissions where availableAt <= now
      const pendingCommissions = await this.prisma.commission.findMany({
        where: {
          status: 'pending',
          availableAt: {
            lte: now,
          },
        },
      });

      if (pendingCommissions.length === 0) {
        return 0;
      }

      // Update all to available status
      const result = await this.prisma.commission.updateMany({
        where: {
          id: {
            in: pendingCommissions.map((c) => c.id),
          },
        },
        data: {
          status: 'available',
        },
      });

      this.logger.log(
        `[COMMISSION] Marked ${result.count} commissions as available (holding period expired)`,
      );

      return result.count;
    } catch (error) {
      this.logger.error(`[COMMISSION] Failed to mark commissions as available:`, error);
      throw error;
    }
  }

  /**
   * Get commission balances for an affiliate
   * Uses aggregation for better performance
   */
  async getCommissionBalances(affiliateId: string): Promise<{
    pendingBalance: number;
    availableBalance: number;
    lifetimeTotal: number;
  }> {
    // Use aggregation queries instead of fetching all records
    const [pendingResult, availableResult, lifetimeResult] = await Promise.all([
      // Pending balance
      this.prisma.commission.aggregate({
        where: {
          affiliateId,
          status: 'pending',
        },
        _sum: {
          amountCents: true,
        },
      }),
      // Available balance
      this.prisma.commission.aggregate({
        where: {
          affiliateId,
          status: 'available',
        },
        _sum: {
          amountCents: true,
        },
      }),
      // Lifetime total (excludes reversed)
      this.prisma.commission.aggregate({
        where: {
          affiliateId,
          status: {
            not: 'reversed',
          },
        },
        _sum: {
          amountCents: true,
        },
      }),
    ]);

    return {
      pendingBalance: pendingResult._sum.amountCents || 0,
      availableBalance: availableResult._sum.amountCents || 0,
      lifetimeTotal: lifetimeResult._sum.amountCents || 0,
    };
  }
}

