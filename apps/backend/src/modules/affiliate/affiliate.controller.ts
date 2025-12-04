import { Controller, Get, Query, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { PrismaService } from '../../prisma.service';

@Controller('affiliate')
export class AffiliateController {
  constructor(
    private affiliateService: AffiliateService,
    private prisma: PrismaService,
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

    return {
      referralCode: affiliate.referralCode,
      referralLink: `${process.env.WEB_URL || 'http://localhost:3000'}?ref=${affiliate.referralCode}`,
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
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
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

    // Get all orders and topups from referred users for commission breakdown
    const referredUserIds = affiliate.referrals.map((r) => r.referredUserId);
    const allReferredOrders = await this.prisma.order.findMany({
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
    });

    const allReferredTopups = await this.prisma.topUp.findMany({
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
    });

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';

    return {
      affiliate: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        referralLink: `${webUrl}?ref=${affiliate.referralCode}`,
        totalCommission: affiliate.totalCommission,
        createdAt: affiliate.createdAt,
      },
      stats: {
        totalCommission: affiliate.totalCommission,
        totalReferrals,
        totalPurchases,
        totalCommissions: affiliate.commissions.length,
      },
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
}

