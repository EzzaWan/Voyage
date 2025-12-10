import { Controller, Get, Param, Post, Body, Query, Inject, forwardRef, NotFoundException, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { EsimService } from './esim.service';
import { UsageService } from './usage.service';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { PrismaService } from '../../prisma.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { getUserIdFromEmail } from '../../common/utils/get-user-id';
import { assertOwnership } from '../../common/utils/assert-ownership';
import { EsimSyncDto, EsimSuspendDto, EsimUnsuspendDto, EsimRevokeDto } from '../../common/dto/esim-action.dto';

@Controller() // Do NOT prefix with /api. Global prefix handles it.
@UseGuards(RateLimitGuard, CsrfGuard)
export class EsimController {
  constructor(
    private readonly esimService: EsimService,
    private readonly usageService: UsageService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TopUpService))
    private readonly topUpService: TopUpService,
  ) {}

  @Get('countries')
  async getCountries() {
    const data = await this.esimService.getLocations();
    return data.locationList;
  }

  @Get('countries/:code/plans')
  async getPlans(@Param('code') code: string) {
    const data = await this.esimService.getPackages(code);
    return data.packageList;
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.esimService.getPlan(id);
  }

  @Post('esims/:id/topup')
  @RateLimit({ limit: 10, window: 60 })
  async topUp(
    @Param('id') id: string,
    @Body() body: { packageCode: string }
  ) {
    return { status: 'not_implemented_yet', id };
  }

  // ============================================
  // FEATURE: TOP-UP OPTIONS
  // ============================================
  @Get('esim/topup-options')
  async getTopUpOptions(@Query('iccid') iccid: string) {
    if (!iccid) throw new NotFoundException('ICCID required');

    // 1. Find profile
    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile || !profile.Order) {
      throw new NotFoundException('Profile not found');
    }

    // 2. Get original plan details to find location
    const planId = profile.Order.planId;
    const planDetails = await this.esimService.getPlan(planId);
    const locationCode = planDetails.location; // e.g. 'US'

    // 3. Fetch packages for that location
    // Usually top-ups are just standard packages for the region
    const packages = await this.esimService.getPackages(locationCode);
    return packages.packageList;
  }

  @Get('esim/topups')
  async getTopUps(@Query('iccid') iccid: string) {
    if (!iccid) return [];
    const topups = await this.topUpService.getTopUpsByIccid(iccid);
    // Serialize Date objects for JSON response
    return topups.map(topup => ({
      ...topup,
      createdAt: topup.createdAt ? topup.createdAt.toISOString() : null,
    }));
  }

  @Get('esim/:iccid')
  @RateLimit({ limit: 10, window: 60 })
  async getEsimProfile(@Param('iccid') iccid: string) {
    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) throw new NotFoundException('Profile not found');
    
    // Enrich with plan details
    const planId = profile.Order?.planId;
    let planDetails = null;
    if (planId) {
      try {
        const plan = await this.esimService.getPlan(planId);
        planDetails = {
          name: plan.name,
          packageCode: plan.packageCode,
          location: plan.location,
          volume: plan.volume,
          duration: plan.duration,
          durationUnit: plan.durationUnit,
        };
      } catch (e) {}
    }

    // Serialize Date and BigInt fields for JSON response
    return {
      ...profile,
      expiredTime: profile.expiredTime ? profile.expiredTime.toISOString() : null,
      totalVolume: profile.totalVolume ? profile.totalVolume.toString() : null,
      orderUsage: profile.orderUsage ? profile.orderUsage.toString() : null,
      planDetails,
    };
  }

  // ============================================
  // FEATURE 5: MANUAL SYNC TRIGGER ENDPOINT
  // ============================================
  @Get('sync-now')
  @RateLimit({ limit: 10, window: 60 })
  async syncNow() {
    await this.ordersService.syncEsimProfiles();
    return { message: 'Sync cycle completed', timestamp: new Date().toISOString() };
  }

  // ============================================
  // FEATURE: SYNC SINGLE ESIM BY ICCID
  // ============================================
  @Post('esim/:iccid/sync')
  @RateLimit({ limit: 10, window: 60 }) // 10 syncs per minute per user
  async syncEsimByIccid(
    @Param('iccid') iccid: string,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate ownership
    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

    const orderNo = profile.Order?.esimOrderNo;
    if (!orderNo) {
      throw new NotFoundException('Order not found for this profile');
    }

    // Query provider for latest profile data
    const res = await this.esimService.getEsimAccess().client.request<any>(
      'POST',
      '/esim/query',
      { orderNo, pager: { pageNum: 1, pageSize: 50 } }
    );

    if (!res?.obj?.esimList || res.obj.esimList.length === 0) {
      throw new NotFoundException('Profile data not found from provider');
    }

    // Find matching profile by iccid or esimTranNo
    const providerProfile = res.obj.esimList.find(
      (p: any) => p.iccid === iccid || p.esimTranNo === profile.esimTranNo
    ) || res.obj.esimList[0];

    // Update profile with latest data
    const updateData: any = {};

    if (providerProfile.esimStatus !== undefined) {
      updateData.esimStatus = providerProfile.esimStatus;
    }
    if (providerProfile.totalVolume !== undefined) {
      updateData.totalVolume = providerProfile.totalVolume;
    }
    if (providerProfile.expiredTime) {
      updateData.expiredTime = new Date(providerProfile.expiredTime);
    }
    if (providerProfile.smdpStatus !== undefined) {
      updateData.smdpStatus = providerProfile.smdpStatus;
    }
    if (providerProfile.qrCodeUrl !== undefined) {
      updateData.qrCodeUrl = providerProfile.qrCodeUrl;
    }
    if (providerProfile.ac !== undefined) {
      updateData.ac = providerProfile.ac;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.esimProfile.update({
        where: { id: profile.id },
        data: updateData,
      });
    }

    // Check and mark as expired if status indicates
    if (providerProfile.esimStatus === 'EXPIRED' || providerProfile.esimStatus === 'UNUSED_EXPIRED' || providerProfile.esimStatus === 'USED_EXPIRED') {
      await this.prisma.esimProfile.update({
        where: { id: profile.id },
        data: { esimStatus: 'EXPIRED' },
      });
    }

    return {
      success: true,
      message: 'Profile synced successfully',
      updated: Object.keys(updateData),
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // FEATURE: USAGE HISTORY
  // ============================================
  @Get('esim/usage/history/:profileId')
  async getUsageHistory(
    @Param('profileId') profileId: string,
    @Query('limit') limit?: string
  ) {
    // Verify profile exists
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const history = await this.usageService.getUsageHistory(
      profileId,
      limit ? parseInt(limit, 10) : undefined
    );

    // Serialize BigInt and Date fields for JSON response
    return history.map((record) => ({
      id: record.id,
      profileId: record.profileId,
      usedBytes: record.usedBytes.toString(),
      recordedAt: record.recordedAt.toISOString(),
    }));
  }

  // ============================================
  // FEATURE: ESIM ACTIONS (SUSPEND/UNSUSPEND/REVOKE)
  // ============================================
  @Post('esim/:iccid/suspend')
  @RateLimit({ limit: 5, window: 60 })
  async suspendEsim(
    @Param('iccid') iccid: string,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate ownership
    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

    if (!profile.iccid) {
      throw new BadRequestException('Profile ICCID is required for suspend');
    }

    try {
      const result = await this.esimService.getEsimAccess().profiles.suspend({
        iccid: profile.iccid,
      });

      if (result.success === 'true') {
        // Update profile status in database
        await this.prisma.esimProfile.update({
          where: { id: profile.id },
          data: { esimStatus: 'SUSPENDED' },
        });

        return {
          success: true,
          message: 'eSIM profile suspended successfully',
        };
      } else {
        throw new BadRequestException(result.errorMessage || 'Failed to suspend profile');
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to suspend profile');
    }
  }

  @Post('esim/:iccid/unsuspend')
  @RateLimit({ limit: 5, window: 60 })
  async unsuspendEsim(
    @Param('iccid') iccid: string,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate ownership
    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

    if (!profile.esimTranNo) {
      throw new BadRequestException('Profile esimTranNo is required for unsuspend');
    }

    try {
      const result = await this.esimService.getEsimAccess().profiles.unsuspend({
        esimTranNo: profile.esimTranNo,
      });

      if (result.success === 'true') {
        // Update profile status in database
        await this.prisma.esimProfile.update({
          where: { id: profile.id },
          data: { esimStatus: 'IN_USE' },
        });

        return {
          success: true,
          message: 'eSIM profile unsuspended successfully',
        };
      } else {
        throw new BadRequestException(result.errorMessage || 'Failed to unsuspend profile');
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to unsuspend profile');
    }
  }

  @Post('esim/:iccid/revoke')
  @RateLimit({ limit: 3, window: 60 })
  async revokeEsim(
    @Param('iccid') iccid: string,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate ownership
    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

    if (!profile.esimTranNo) {
      throw new BadRequestException('Profile esimTranNo is required for revoke');
    }

    try {
      const result = await this.esimService.getEsimAccess().profiles.revoke({
        esimTranNo: profile.esimTranNo,
      });

      if (result.success === 'true') {
        // Update profile status in database
        await this.prisma.esimProfile.update({
          where: { id: profile.id },
          data: { esimStatus: 'REVOKED' },
        });

        return {
          success: true,
          message: 'eSIM profile revoked successfully',
        };
      } else {
        throw new BadRequestException(result.errorMessage || 'Failed to revoke profile');
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to revoke profile');
    }
  }
}
