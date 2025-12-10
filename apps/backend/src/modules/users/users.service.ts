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
    // Find user by email first
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return empty array if user doesn't exist yet (no orders)
      return [];
    }

    // Use the relation defined in schema: User -> profiles
    const profiles = await this.prisma.esimProfile.findMany({
      where: {
        userId: user.id
      },
      include: {
        Order: true // Optional: include order details if needed
      }
    });

    // Convert BigInt fields to strings for JSON serialization and fetch plan details
    const profilesWithPlans = await Promise.all(
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
          } catch (error) {
            // If plan fetch fails, just log and continue without plan details
            console.warn(`[UsersService] Failed to fetch plan details for ${profile.Order.planId}:`, error);
          }
        }

        return serialized;
      })
    );

    return profilesWithPlans;
  }
}
