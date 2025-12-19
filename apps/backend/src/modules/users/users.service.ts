import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EsimService } from '../esim/esim.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
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

    // Use the relation defined in schema: User -> profiles
    const profiles = await this.prisma.esimProfile.findMany({
      where: {
        userId: user.id
      },
      include: {
        Order: true // Optional: include order details if needed
      }
    });

    console.log(`[UsersService] Found ${profiles.length} eSIM profile(s) for user ${user.id}`);

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
}
