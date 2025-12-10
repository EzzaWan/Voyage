import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';

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
          id: crypto.randomUUID(),
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
        User: {
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
          id: crypto.randomUUID(),
          affiliateId,
          referredUserId,
        },
      });

      this.logger.log(`[AFFILIATE] Created referral: affiliate ${affiliateId} -> user ${referredUserId}`);
      
      // Send email notification (fire and forget - email service injected if available)
      // Note: This is done in a fire-and-forget manner to not block the referral creation
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
        Referral: {
          include: {
            User: {
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
        Commission: {
          include: {
            Affiliate: {
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
   * @deprecated Use AffiliateCommissionService.createCommission instead
   */
  async addCommission(
    affiliateId: string,
    orderId: string,
    orderType: 'order' | 'topup',
    amountCents: number,
  ): Promise<void> {
    // This method is kept for backward compatibility
    // It now delegates to the commission service
    // But we'll update all callers to use the new service directly
    this.logger.warn('[AFFILIATE] Using deprecated addCommission method - consider using AffiliateCommissionService');
    
    // For now, create with old logic but we'll update callers
    try {
      const commissionCents = Math.round(amountCents * 0.1);
      if (commissionCents <= 0) {
        return;
      }

      const availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 7); // 7 days holding period

      await this.prisma.commission.create({
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

      await this.prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          totalCommission: {
            increment: commissionCents,
          },
        },
      });
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
        Referral: {
          include: {
            User: {
              include: {
                Order: {
                  where: {
                    status: {
                      in: ['paid', 'active', 'provisioning'],
                    },
                  },
                },
                TopUp: {
                  where: {
                    status: 'completed',
                  },
                },
              },
            },
          },
        },
        Commission: true,
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    // Calculate stats
    const totalReferrals = affiliate.Referral.length;
    const totalCommissions = affiliate.totalCommission;
    const totalCommissionRecords = affiliate.Commission.length;

    // Get all referred users' purchases
    const referredUserIds = affiliate.Referral.map((r) => r.referredUserId);
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
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              Referral: true,
              Commission: true,
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
          Affiliate: {
        include: {
          User: {
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

