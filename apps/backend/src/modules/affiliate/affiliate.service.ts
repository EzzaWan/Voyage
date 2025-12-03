import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create affiliate record for a user (called when user is created)
   */
  async createAffiliateForUser(userId: string): Promise<void> {
    try {
      // Check if affiliate already exists
      const existing = await this.prisma.affiliate.findUnique({
        where: { userId },
      });

      if (existing) {
        this.logger.log(`[AFFILIATE] Affiliate already exists for user ${userId}`);
        return;
      }

      // Generate unique referral code
      let referralCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        referralCode = nanoid(8).toUpperCase(); // 8 characters, uppercase for readability
        const existingCode = await this.prisma.affiliate.findUnique({
          where: { referralCode },
        });
        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique referral code after multiple attempts');
      }

      // Create affiliate record
      await this.prisma.affiliate.create({
        data: {
          userId,
          referralCode: referralCode!,
          totalCommission: 0,
        },
      });

      this.logger.log(`[AFFILIATE] Created affiliate for user ${userId} with code ${referralCode}`);
    } catch (error) {
      this.logger.error(`[AFFILIATE] Failed to create affiliate for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find affiliate by referral code
   */
  async findAffiliateByCode(referralCode: string) {
    return this.prisma.affiliate.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create referral link between affiliate and new user
   */
  async createReferral(affiliateId: string, referredUserId: string): Promise<void> {
    try {
      // Check if referral already exists
      const existing = await this.prisma.referral.findUnique({
        where: { referredUserId },
      });

      if (existing) {
        this.logger.log(`[AFFILIATE] Referral already exists for user ${referredUserId}`);
        return;
      }

      await this.prisma.referral.create({
        data: {
          affiliateId,
          referredUserId,
        },
      });

      this.logger.log(`[AFFILIATE] Created referral: affiliate ${affiliateId} -> user ${referredUserId}`);
    } catch (error) {
      this.logger.error(`[AFFILIATE] Failed to create referral:`, error);
      throw error;
    }
  }

  /**
   * Get affiliate by user ID
   */
  async getAffiliateByUserId(userId: string) {
    return this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        referrals: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        commissions: {
          include: {
            affiliate: {
              select: {
                referralCode: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Add commission for an order or top-up
   */
  async addCommission(
    affiliateId: string,
    orderId: string,
    orderType: 'order' | 'topup',
    amountCents: number,
  ): Promise<void> {
    try {
      // Calculate 10% commission
      const commissionCents = Math.round(amountCents * 0.1);

      if (commissionCents <= 0) {
        this.logger.warn(`[AFFILIATE] Commission amount too small: ${commissionCents} cents`);
        return;
      }

      // Create commission record
      await this.prisma.commission.create({
        data: {
          affiliateId,
          orderId,
          orderType,
          amountCents: commissionCents,
        },
      });

      // Update total commission
      await this.prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          totalCommission: {
            increment: commissionCents,
          },
        },
      });

      this.logger.log(
        `[AFFILIATE] Added commission: ${commissionCents} cents for ${orderType} ${orderId} to affiliate ${affiliateId}`,
      );
    } catch (error) {
      this.logger.error(`[AFFILIATE] Failed to add commission:`, error);
      throw error;
    }
  }

  /**
   * Get referral stats for an affiliate
   */
  async getAffiliateStats(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        referrals: {
          include: {
            user: {
              include: {
                orders: {
                  where: {
                    status: {
                      in: ['paid', 'active', 'provisioning'],
                    },
                  },
                },
                topups: {
                  where: {
                    status: 'completed',
                  },
                },
              },
            },
          },
        },
        commissions: true,
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    // Calculate stats
    const totalReferrals = affiliate.referrals.length;
    const totalCommissions = affiliate.totalCommission;
    const totalCommissionRecords = affiliate.commissions.length;

    // Get all referred users' purchases
    const referredUserIds = affiliate.referrals.map((r) => r.referredUserId);
    const referredUsersOrders = await this.prisma.order.findMany({
      where: {
        userId: { in: referredUserIds },
        status: {
          in: ['paid', 'active', 'provisioning'],
        },
      },
    });

    const referredUsersTopups = await this.prisma.topUp.findMany({
      where: {
        userId: { in: referredUserIds },
        status: 'completed',
      },
    });

    const totalPurchases = referredUsersOrders.length + referredUsersTopups.length;

    return {
      affiliate,
      stats: {
        totalCommission: totalCommissions,
        totalReferrals,
        totalPurchases,
        totalCommissions: totalCommissionRecords,
      },
    };
  }

  /**
   * Get all affiliates (for admin)
   */
  async getAllAffiliates(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [affiliates, total] = await Promise.all([
      this.prisma.affiliate.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              referrals: true,
              commissions: true,
            },
          },
        },
        orderBy: {
          totalCommission: 'desc',
        },
      }),
      this.prisma.affiliate.count(),
    ]);

    return {
      affiliates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all commissions (for admin)
   */
  async getAllCommissions(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        skip,
        take: limit,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.commission.count(),
    ]);

    return {
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

