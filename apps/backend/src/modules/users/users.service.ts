import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../prisma.service';
import { EsimService } from '../esim/esim.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
    private config: ConfigService,
  ) {}

  async getUserEsimsByEmail(email: string) {
    // Normalize email (lowercase, trim) for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email (exact match - emails should be normalized when stored)
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`[UsersService] No user found for email: ${normalizedEmail}`);
      // Return empty array if user doesn't exist yet (no orders)
      return [];
    }

    console.log(`[UsersService] Found user ${user.id} for email: ${normalizedEmail}`);

    // Query profiles in two ways:
    // 1. Profiles directly linked to user via userId
    // 2. Profiles linked via orders where the order's user email matches (for guest orders)
    const profiles = await this.prisma.esimProfile.findMany({
      where: {
        OR: [
          { userId: user.id }, // Direct user link
          { 
            Order: {
              User: {
                email: normalizedEmail // Via order's user email (guest orders)
              }
            }
          }
        ]
      },
      include: {
        Order: {
          include: {
            User: true // Include user details for verification
          }
        }
      }
    });

    console.log(`[UsersService] Found ${profiles.length} eSIM profile(s) for email: ${normalizedEmail}`);

    // Convert BigInt fields to strings for JSON serialization and fetch plan details
    // Use Promise.allSettled to ensure all profiles are returned even if some plan fetches fail
    const profilesWithPlans = await Promise.allSettled(
      profiles.map(async (profile) => {
        const serialized: any = {
          id: profile.id,
          orderId: profile.orderId,
          esimTranNo: profile.esimTranNo,
          iccid: profile.iccid,
          qrCodeUrl: profile.qrCodeUrl,
          ac: profile.ac,
          smdpStatus: profile.smdpStatus,
          esimStatus: profile.esimStatus,
          totalVolume: profile.totalVolume ? profile.totalVolume.toString() : null,
          orderUsage: profile.orderUsage ? profile.orderUsage.toString() : null,
          expiredTime: profile.expiredTime ? profile.expiredTime.toISOString() : null,
          userId: profile.userId,
          order: profile.Order,
        };

        // Fetch plan details if planId exists
        if (profile.Order?.planId) {
          try {
            const planDetails = await this.esimService.getPlan(profile.Order.planId);
            serialized.planDetails = {
              name: planDetails.name,
              packageCode: planDetails.packageCode,
              locationCode: planDetails.location, // API returns 'location' not 'locationCode'
              volume: planDetails.volume,
              duration: planDetails.duration,
              durationUnit: planDetails.durationUnit,
            };
          } catch (error: any) {
            // If plan fetch fails, just log and continue without plan details
            // This can happen if the plan was removed from the eSIM provider or is a mock/test plan
            console.warn(`[UsersService] Failed to fetch plan details for ${profile.Order.planId}:`, error?.message || error);
            // Set planDetails to null or use planId as fallback
            serialized.planDetails = {
              name: profile.Order.planId, // Use planId as fallback name
              packageCode: profile.Order.planId,
              locationCode: null,
              volume: null,
              duration: null,
              durationUnit: null,
            };
          }
        }

        return serialized;
      })
    );

    // Extract successful results, filter out any that failed (shouldn't happen, but just in case)
    return profilesWithPlans
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Delete user account and all associated data. Called when user initiates account deletion (App Store requirement).
   * 1. Deletes the user in Clerk so they cannot sign in again.
   * 2. Deletes/anonymizes all backend user data in a transaction.
   */
  async deleteAccount(userId: string, clerkUserId: string): Promise<void> {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('[deleteAccount] CLERK_SECRET_KEY not set');
      throw new BadRequestException('Account deletion is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const clerk = createClerkClient({ secretKey });
    try {
      await clerk.users.deleteUser(clerkUserId);
    } catch (err: any) {
      this.logger.warn('[deleteAccount] Clerk deleteUser failed (user may already be deleted):', err?.message);
      // Proceed with DB deletion so we still remove local data
    }

    await this.prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate.findUnique({ where: { userId }, select: { id: true } });
      const affiliateId = affiliate?.id;

      if (affiliateId) {
        await tx.commission.deleteMany({ where: { affiliateId } });
        await tx.referral.deleteMany({ where: { affiliateId } });
        await tx.affiliatePayoutRequest.deleteMany({ where: { affiliateId } });
        await tx.affiliatePayoutMethod.deleteMany({ where: { affiliateId } });
        await tx.affiliateFraudEvent.deleteMany({ where: { affiliateId } });
        const score = await tx.affiliateFraudScore.findUnique({ where: { affiliateId } });
        if (score) await tx.affiliateFraudScore.delete({ where: { affiliateId } });
        await tx.affiliateClick.deleteMany({ where: { affiliateId } });
        await tx.affiliateSignup.deleteMany({ where: { affiliateId } });
        await tx.affiliate.delete({ where: { id: affiliateId } });
      }

      await tx.referral.deleteMany({ where: { referredUserId: userId } });
      await tx.affiliateSignup.deleteMany({ where: { userId } });

      const userOrderIds = (await tx.order.findMany({ where: { userId }, select: { id: true } })).map((o) => o.id);
      for (const orderId of userOrderIds) {
        const profiles = await tx.esimProfile.findMany({ where: { orderId }, select: { id: true } });
        for (const p of profiles) {
          await tx.esimUsageHistory.deleteMany({ where: { profileId: p.id } });
          await tx.topUp.deleteMany({ where: { profileId: p.id } });
        }
        await tx.esimProfile.deleteMany({ where: { orderId } });
      }
      await tx.order.deleteMany({ where: { userId } });

      await tx.supportTicket.updateMany({ where: { userId } }, { data: { userId: null } });
      await tx.review.updateMany({ where: { userId } }, { data: { userId: null, userName: 'Deleted User' } });
      await tx.vCashTransaction.deleteMany({ where: { userId } });
      await tx.vCashBalance.deleteMany({ where: { userId } });
      await tx.mobileToken.deleteMany({ where: { userId } });
      await tx.topUp.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    this.logger.log(`[deleteAccount] Deleted account for user ${userId} (${user.email})`);
  }
}
