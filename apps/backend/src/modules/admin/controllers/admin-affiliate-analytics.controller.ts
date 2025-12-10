import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../../prisma.service';
import { AffiliateAnalyticsService } from '../../affiliate/affiliate-analytics.service';
import { AffiliateCommissionService } from '../../affiliate/affiliate-commission.service';

@Controller('admin/affiliate')
@UseGuards(AdminGuard)
export class AdminAffiliateAnalyticsController {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AffiliateAnalyticsService,
    private commissionService: AffiliateCommissionService,
  ) {}

  /**
   * Get leaderboard by total referred revenue
   */
  @Get('leaderboard/revenue')
  async getLeaderboardByRevenue(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;

    const affiliates = await this.prisma.affiliate.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        Referral: {
          select: {
            referredUserId: true,
          },
        },
      },
    });

    // Calculate revenue for each affiliate
    const affiliateStats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const referredUserIds = affiliate.Referral.map((r) => r.referredUserId);
        if (referredUserIds.length === 0) {
          return {
            affiliate,
            revenue: 0,
            commissions: 0,
            clicks: 0,
            signups: 0,
            buyers: 0,
          };
        }

        const [orders, topups, revenue] = await Promise.all([
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
          this.analyticsService.getReferredRevenue(affiliate.id),
        ]);

        const commissions = affiliate.totalCommission;
        const clicks = await this.analyticsService.getClicks(affiliate.id);
        const signups = await this.analyticsService.getSignups(affiliate.id);
        const buyers = await this.analyticsService.getReferredPurchases(affiliate.id);

        return {
          affiliate,
          revenue,
          commissions,
          clicks,
          signups,
          buyers,
        };
      }),
    );

    // Sort by revenue descending
    affiliateStats.sort((a, b) => b.revenue - a.revenue);

    return {
      leaderboard: affiliateStats.slice(0, validLimit).map((stat) => ({
        affiliateId: stat.affiliate.id,
        referralCode: stat.affiliate.referralCode,
        userEmail: stat.affiliate.User.email,
        userName: stat.affiliate.User.name,
        revenueCents: stat.revenue,
        commissionCents: stat.commissions,
        clicks: stat.clicks,
        signups: stat.signups,
        buyers: stat.buyers,
        conversionRate: stat.clicks > 0 ? stat.buyers / stat.clicks : 0,
      })),
    };
  }

  /**
   * Get leaderboard by total commissions
   */
  @Get('leaderboard/commissions')
  async getLeaderboardByCommissions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;

    const affiliates = await this.prisma.affiliate.findMany({
      orderBy: {
        totalCommission: 'desc',
      },
      take: validLimit,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const stats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const clicks = await this.analyticsService.getClicks(affiliate.id);
        const signups = await this.analyticsService.getSignups(affiliate.id);
        const buyers = await this.analyticsService.getReferredPurchases(affiliate.id);
        const revenue = await this.analyticsService.getReferredRevenue(affiliate.id);

        return {
          affiliateId: affiliate.id,
          referralCode: affiliate.referralCode,
          userEmail: affiliate.User.email,
          userName: affiliate.User.name,
          commissionCents: affiliate.totalCommission,
          revenueCents: revenue,
          clicks,
          signups,
          buyers,
          conversionRate: clicks > 0 ? buyers / clicks : 0,
        };
      }),
    );

    return { leaderboard: stats };
  }

  /**
   * Get leaderboard by signups
   */
  @Get('leaderboard/signups')
  async getLeaderboardBySignups(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;

    const affiliates = await this.prisma.affiliate.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const stats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const clicks = await this.analyticsService.getClicks(affiliate.id);
        const signups = await this.analyticsService.getSignups(affiliate.id);
        const buyers = await this.analyticsService.getReferredPurchases(affiliate.id);
        const revenue = await this.analyticsService.getReferredRevenue(affiliate.id);

        return {
          affiliateId: affiliate.id,
          referralCode: affiliate.referralCode,
          userEmail: affiliate.User.email,
          userName: affiliate.User.name,
          clicks,
          signups,
          buyers,
          revenueCents: revenue,
          commissionCents: affiliate.totalCommission,
          conversionRate: clicks > 0 ? buyers / clicks : 0,
        };
      }),
    );

    stats.sort((a, b) => b.signups - a.signups);

    return { leaderboard: stats.slice(0, validLimit) };
  }

  /**
   * Get leaderboard by conversion rate
   */
  @Get('leaderboard/conversion')
  async getLeaderboardByConversion(@Query('limit') limit?: string, @Query('minClicks') minClicks?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;
    const minClicksNum = minClicks ? parseInt(minClicks, 10) : 10;
    const validMinClicks = isNaN(minClicksNum) || minClicksNum < 1 ? 10 : minClicksNum;

    const affiliates = await this.prisma.affiliate.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const stats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const clicks = await this.analyticsService.getClicks(affiliate.id);
        const signups = await this.analyticsService.getSignups(affiliate.id);
        const buyers = await this.analyticsService.getReferredPurchases(affiliate.id);
        const revenue = await this.analyticsService.getReferredRevenue(affiliate.id);

        const conversionRate = clicks >= validMinClicks ? buyers / clicks : 0;

        return {
          affiliateId: affiliate.id,
          referralCode: affiliate.referralCode,
          userEmail: affiliate.User.email,
          userName: affiliate.User.name,
          clicks,
          signups,
          buyers,
          revenueCents: revenue,
          commissionCents: affiliate.totalCommission,
          conversionRate,
        };
      }),
    );

    // Filter by min clicks and sort by conversion rate
    const filtered = stats.filter((s) => s.clicks >= validMinClicks);
    filtered.sort((a, b) => b.conversionRate - a.conversionRate);

    return { leaderboard: filtered.slice(0, validLimit) };
  }

  /**
   * Get leaderboard for last 30 days activity
   */
  @Get('leaderboard/activity')
  async getLeaderboardByActivity(@Query('days') days?: string, @Query('limit') limit?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const validDays = isNaN(daysNum) || daysNum < 1 || daysNum > 365 ? 30 : daysNum;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);

    const affiliates = await this.prisma.affiliate.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const stats = await Promise.all(
      affiliates.map(async (affiliate) => {
        // Get activity in the time period
        const [recentClicks, recentSignups, recentCommissions] = await Promise.all([
          this.prisma.affiliateClick.count({
            where: {
              affiliateId: affiliate.id,
              createdAt: { gte: startDate },
            },
          }),
          this.prisma.affiliateSignup.count({
            where: {
              affiliateId: affiliate.id,
              createdAt: { gte: startDate },
            },
          }),
          this.prisma.commission.aggregate({
            where: {
              affiliateId: affiliate.id,
              createdAt: { gte: startDate },
              status: { in: ['pending', 'available'] },
            },
            _sum: { amountCents: true },
          }),
        ]);

        const totalActivity = recentClicks + recentSignups;

        return {
          affiliateId: affiliate.id,
          referralCode: affiliate.referralCode,
          userEmail: affiliate.User.email,
          userName: affiliate.User.name,
          clicks: recentClicks,
          signups: recentSignups,
          commissionCents: recentCommissions._sum.amountCents || 0,
          totalActivity,
        };
      }),
    );

    stats.sort((a, b) => b.totalActivity - a.totalActivity);

    return { leaderboard: stats.slice(0, validLimit), period: validDays };
  }
}

