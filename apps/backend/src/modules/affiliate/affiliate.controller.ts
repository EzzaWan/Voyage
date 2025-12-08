import { Controller, Get, Post, Query, Req, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AffiliateService } from './affiliate.service';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { AffiliatePayoutService } from './affiliate-payout.service';
import { EmailService } from '../email/email.service';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { VCashService } from '../vcash/vcash.service';
import { PrismaService } from '../../prisma.service';
import { sanitizeInput } from '../../common/utils/sanitize';
import { SecurityLoggerService } from '../../common/services/security-logger.service';
import { getClientIp } from '../../common/utils/webhook-ip-whitelist';

@Controller('affiliate')
export class AffiliateController {
  constructor(
    private affiliateService: AffiliateService,
    private commissionService: AffiliateCommissionService,
    private payoutService: AffiliatePayoutService,
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService,
    private adminSettingsService: AdminSettingsService,
    private vcashService: VCashService,
    private securityLogger: SecurityLoggerService,
  ) {}

  /**
   * Get affiliate dashboard data for current user
   */
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist (user signed up in Clerk but hasn't made purchase yet)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: null, // Name will be updated when they make first purchase
      },
      update: {},
    });

    // Get affiliate
    let affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      // Create affiliate if it doesn't exist
      await this.affiliateService.createAffiliateForUser(user.id);
      affiliate = await this.prisma.affiliate.findUnique({
        where: { userId: user.id },
      });
    }

    if (!affiliate) {
      throw new NotFoundException('Failed to create affiliate');
    }

    return this.getAffiliateDashboardData(affiliate.id);
  }

  /**
   * Get referral code for current user
   */
  @Get('referral-code')
  async getReferralCode(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: null, // Name will be updated when they make first purchase
      },
      update: {},
    });

    let affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      await this.affiliateService.createAffiliateForUser(user.id);
      affiliate = await this.prisma.affiliate.findUnique({
        where: { userId: user.id },
      });
    }

    if (!affiliate) {
      throw new NotFoundException('Failed to create affiliate');
    }

    const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
    return {
      referralCode: affiliate.referralCode,
      referralLink: `${webUrl}?ref=${affiliate.referralCode}`,
    };
  }

  /**
   * Verify referral code (for checking validity)
   */
  @Get('verify')
  async verifyReferralCode(@Query('code') code: string) {
    if (!code) {
      return { valid: false };
    }

    const affiliate = await this.affiliateService.findAffiliateByCode(code);
    return {
      valid: !!affiliate,
      referralCode: affiliate?.referralCode || null,
    };
  }



  /**
   * Helper to get full dashboard data
   */
  private async getAffiliateDashboardData(affiliateId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        referrals: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                orders: {
                  where: {
                    status: {
                      in: ['paid', 'active', 'provisioning', 'esim_created'],
                    },
                  },
                  select: {
                    id: true,
                    amountCents: true,
                    displayCurrency: true,
                    displayAmountCents: true,
                    status: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 10, // Limit to 10 orders per user to reduce query size
                },
                topups: {
                  where: {
                    status: 'completed',
                  },
                  select: {
                    id: true,
                    amountCents: true,
                    displayCurrency: true,
                    displayAmountCents: true,
                    status: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 10, // Limit to 10 topups per user to reduce query size
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100, // Limit to 100 most recent referrals to prevent huge responses
        },
        commissions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Latest 50 commissions
        },
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    // Calculate stats
    const totalReferrals = affiliate.referrals.length;
    const totalPurchases =
      affiliate.referrals.reduce((sum, ref) => {
        return sum + ref.user.orders.length + ref.user.topups.length;
      }, 0) || 0;

    // Get recent orders and topups from referred users (limited to prevent huge responses)
    const referredUserIds = affiliate.referrals.map((r) => r.referredUserId);
    
    // Limit to 100 most recent orders/topups combined to prevent performance issues
    const allReferredOrders = referredUserIds.length > 0 ? await this.prisma.order.findMany({
      where: {
        userId: { in: referredUserIds },
        status: {
          in: ['paid', 'active', 'provisioning', 'esim_created'],
        },
      },
      select: {
        id: true,
        amountCents: true,
        displayCurrency: true,
        displayAmountCents: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent orders
    }) : [];

    const allReferredTopups = referredUserIds.length > 0 ? await this.prisma.topUp.findMany({
      where: {
        userId: { in: referredUserIds },
        status: 'completed',
      },
      select: {
        id: true,
        amountCents: true,
        displayCurrency: true,
        displayAmountCents: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent topups
    }) : [];

    const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';

    // Get commission balances
    const balances = await this.commissionService.getCommissionBalances(affiliate.id);

    // Get payout method
    const payoutMethod = await this.payoutService.getPayoutMethod(affiliate.id);

    // Get payout history (limited)
    const payoutHistory = await this.payoutService.getPayoutHistory(affiliate.id, 10);

    // Calculate remaining commission (total - paid out)
    const paidOutResult = await this.prisma.affiliateCommissionPayout.aggregate({
      where: { affiliateId: affiliate.id },
      _sum: { amountCents: true },
    });
    const totalPaidOut = paidOutResult._sum.amountCents || 0;
    const remainingCommission = affiliate.totalCommission - totalPaidOut;

    return {
      affiliate: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        referralLink: `${webUrl}?ref=${affiliate.referralCode}`,
        totalCommission: affiliate.totalCommission,
        isFrozen: affiliate.isFrozen,
        createdAt: affiliate.createdAt,
      },
      stats: {
        totalCommission: affiliate.totalCommission,
        totalReferrals,
        totalPurchases,
        totalCommissions: affiliate.commissions.length,
      },
      balances: {
        pendingBalance: balances.pendingBalance,
        availableBalance: balances.availableBalance,
        lifetimeTotal: balances.lifetimeTotal,
      },
      payoutMethod,
      payoutHistory,
      remainingCommission,
      referrals: affiliate.referrals.map((ref) => ({
        id: ref.id,
        user: {
          id: ref.user.id,
          email: ref.user.email,
          name: ref.user.name,
          joinedAt: ref.user.createdAt,
        },
        createdAt: ref.createdAt,
        orders: ref.user.orders.map((order) => ({
          id: order.id,
          amountCents: order.amountCents,
          displayCurrency: order.displayCurrency,
          displayAmountCents: order.displayAmountCents,
          status: order.status,
          createdAt: order.createdAt,
        })),
        topups: ref.user.topups.map((topup) => ({
          id: topup.id,
          amountCents: topup.amountCents,
          displayCurrency: topup.displayCurrency,
          displayAmountCents: topup.displayAmountCents,
          status: topup.status,
          createdAt: topup.createdAt,
        })),
      })),
      commissions: affiliate.commissions.map((comm) => ({
        id: comm.id,
        orderId: comm.orderId,
        orderType: comm.orderType,
        amountCents: comm.amountCents,
        createdAt: comm.createdAt,
      })),
      recentPurchases: [
        ...allReferredOrders.map((order) => ({
          type: 'order' as const,
          id: order.id,
          userEmail: order.user.email,
          userName: order.user.name,
          amountCents: order.amountCents,
          displayCurrency: order.displayCurrency,
          displayAmountCents: order.displayAmountCents,
          status: order.status,
          createdAt: order.createdAt,
        })),
        ...allReferredTopups.map((topup) => ({
          type: 'topup' as const,
          id: topup.id,
          userEmail: topup.user.email,
          userName: topup.user.name,
          amountCents: topup.amountCents,
          displayCurrency: topup.displayCurrency,
          displayAmountCents: topup.displayAmountCents,
          status: topup.status,
          createdAt: topup.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50),
    };
  }

  /**
   * Simple cash-out request (simplified version)
   */
  @Post('cash-out-request')
  async submitCashOutRequest(
    @Req() req: any,
    @Body() body: {
      paymentMethod: string;
      affiliateCode: string;
      amount: string;
    },
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Validate input
    if (!body.paymentMethod || !body.affiliateCode || !body.amount) {
      throw new BadRequestException('All fields are required');
    }

    // Sanitize inputs
    const paymentMethod = sanitizeInput(body.paymentMethod.trim());
    const affiliateCode = sanitizeInput(body.affiliateCode.trim().toUpperCase());
    const amount = sanitizeInput(body.amount.trim());

    // Validate amount is a number (user enters in dollars, we store as-is)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Invalid amount. Please enter a valid number.');
    }

    // Get user and affiliate
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    // Verify affiliate code matches
    if (affiliate.referralCode !== affiliateCode) {
      throw new BadRequestException('Affiliate code does not match');
    }

    // Get admin emails
    const adminEmails = await this.adminSettingsService.getAdminEmails();

    // Send email to admin
    if (adminEmails.length > 0 && this.emailService) {
      const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
      
      try {
        await this.emailService.sendAdminCashOutRequest({
          adminEmails,
          affiliateEmail: email,
          affiliateName: user.name || email,
          affiliateCode,
          paymentMethod,
          amount: amountNum,
          dashboardUrl: `${webUrl}/admin/affiliates`,
        });
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to send cash-out request email:', error);
      }
    }

    // Log to admin log
    try {
      await this.prisma.adminLog.create({
        data: {
          action: 'CASH_OUT_REQUEST',
          adminEmail: 'system',
          entityType: 'affiliate',
          entityId: affiliate.id,
          data: {
            userEmail: email,
            affiliateCode,
            paymentMethod,
            amount: amountNum,
            requestedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log cash-out request:', error);
    }

    return {
      success: true,
      message: 'Cash-out request submitted successfully. Admin will review and process it.',
    };
  }

  /**
   * Convert affiliate commission to V-Cash
   */
  @Post('vcash/convert')
  async convertCommissionToVCash(
    @Req() req: any,
    @Body() body: { amountCents: number },
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (affiliate.isFrozen) {
      throw new BadRequestException('Affiliate account is frozen. Cannot convert commission.');
    }

    if (!body.amountCents || body.amountCents <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    // Calculate remaining commission (total - already paid out)
    const paidOutResult = await this.prisma.affiliateCommissionPayout.aggregate({
      where: { affiliateId: affiliate.id },
      _sum: { amountCents: true },
    });

    const totalPaidOut = paidOutResult._sum.amountCents || 0;
    const remainingCommission = affiliate.totalCommission - totalPaidOut;

    if (body.amountCents > remainingCommission) {
      throw new BadRequestException(
        `Insufficient commission. Available: ${remainingCommission} cents, requested: ${body.amountCents} cents`,
      );
    }

    // Create payout record
    await this.prisma.affiliateCommissionPayout.create({
      data: {
        affiliateId: affiliate.id,
        type: 'vcash',
        amountCents: body.amountCents,
      },
    });

    // Credit V-Cash
    const ip = getClientIp(req);
    await this.vcashService.credit(
      user.id,
      body.amountCents,
      'affiliate_conversion',
      { affiliateId: affiliate.id, affiliateCode: affiliate.referralCode },
      ip,
    );

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_COMMISSION_TO_VCASH' as any,
      userId: user.id,
      ip,
      details: {
        affiliateId: affiliate.id,
        amountCents: body.amountCents,
        remainingCommission: remainingCommission - body.amountCents,
      },
    });

    // Send email notification (optional)
    if (this.emailService) {
      try {
        const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
        await this.emailService.sendAffiliateCommissionConvertedToVCash(
          email,
          {
            amountCents: body.amountCents,
            amountFormatted: `$${(body.amountCents / 100).toFixed(2)}`,
            vcashBalanceCents: await this.vcashService.getBalance(user.id),
            vcashBalanceFormatted: `$${((await this.vcashService.getBalance(user.id)) / 100).toFixed(2)}`,
            dashboardUrl: `${webUrl}/account/vcash`,
          },
        );
      } catch (error) {
        console.error('Failed to send affiliate conversion email:', error);
      }
    }

    const newVcashBalance = await this.vcashService.getBalance(user.id);

    return {
      success: true,
      convertedAmountCents: body.amountCents,
      remainingCommissionCents: remainingCommission - body.amountCents,
      vcashBalanceCents: newVcashBalance,
    };
  }
}

