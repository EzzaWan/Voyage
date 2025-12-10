import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EsimService } from './esim.service';
import { UsageItem } from '../../../../../libs/esim-access/types';
import * as crypto from 'crypto';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
  ) {}

  /**
   * Sync usage for a single profile and create history record
   */
  async syncUsageForProfile(profileId: string, esimTranNo: string): Promise<BigInt | null> {
    try {
      // Query usage using esimTranNo (provider expects array)
      const usageResponse: any = await this.esimService.sdk.usage.getUsage([esimTranNo]);

      // Check for errors
      const isError = usageResponse?.success === false || 
                     usageResponse?.success === "false" ||
                     (usageResponse?.errorCode && usageResponse.errorCode !== "0" && usageResponse.errorCode !== 0);

      if (isError) {
        this.logger.warn(`[USAGE] Usage API error for profile ${profileId}: ${usageResponse.errorCode}`);
        return null;
      }

      // Extract usage data
      let usageData: UsageItem[] = [];
      if (usageResponse?.obj) {
        if (Array.isArray(usageResponse.obj)) {
          usageData = usageResponse.obj;
        } else if ((usageResponse.obj as any).esimUsageList && Array.isArray((usageResponse.obj as any).esimUsageList)) {
          usageData = (usageResponse.obj as any).esimUsageList;
        }
      }

      if (!usageData || usageData.length === 0) {
        this.logger.log(`[USAGE] No usage data returned for profile ${profileId}`);
        return null;
      }

      const usageItem = usageData.find((u) => u.esimTranNo === esimTranNo) || usageData[0];
      
      if (!usageItem || usageItem.dataUsage === undefined) {
        return null;
      }

      const usedBytes = BigInt(usageItem.dataUsage);

      // Get current profile to check if usage changed
      const profile = await this.prisma.esimProfile.findUnique({
        where: { id: profileId },
        select: { orderUsage: true },
      });

      // Create history record if usage changed or first time recording
      const shouldCreateHistory = !profile?.orderUsage || profile.orderUsage !== usedBytes;

      if (shouldCreateHistory) {
        await this.prisma.esimUsageHistory.create({
          data: {
            id: crypto.randomUUID(),
            profileId,
            usedBytes,
          },
        });
        this.logger.log(`[USAGE] Created history record for profile ${profileId}: ${usedBytes} bytes`);
      }

      // Update profile with latest usage
      await this.prisma.esimProfile.update({
        where: { id: profileId },
        data: {
          orderUsage: usedBytes,
        },
      });

      // Also update totalVolume if provided
      if (usageItem.totalData !== undefined) {
        await this.prisma.esimProfile.update({
          where: { id: profileId },
          data: {
            totalVolume: BigInt(usageItem.totalData),
          },
        });
      }

      return usedBytes;
    } catch (err) {
      this.logger.error(`[USAGE] Usage sync failed for profile ${profileId}:`, err);
      return null;
    }
  }

  /**
   * Sync usage for all profiles (called by cron)
   */
  async syncAllProfiles() {
    this.logger.log('[USAGE] Starting usage sync for all profiles...');

    const profiles = await this.prisma.esimProfile.findMany({
      where: {
        esimTranNo: { not: null },
      },
      select: {
        id: true,
        esimTranNo: true,
      },
    });

    this.logger.log(`[USAGE] Found ${profiles.length} profile(s) to sync`);

    // Process in batches to avoid overwhelming the API
    const BATCH_SIZE = 10;
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map((profile) =>
          this.syncUsageForProfile(profile.id, profile.esimTranNo!).catch((err) => {
            this.logger.error(`[USAGE] Error syncing profile ${profile.id}:`, err);
          })
        )
      );

      // Small delay between batches
      if (i + BATCH_SIZE < profiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.logger.log('[USAGE] Usage sync completed');
  }

  /**
   * Get usage history for a profile
   */
  async getUsageHistory(profileId: string, limit?: number) {
    return this.prisma.esimUsageHistory.findMany({
      where: { profileId },
      orderBy: { recordedAt: 'asc' },
      take: limit,
    });
  }
}
