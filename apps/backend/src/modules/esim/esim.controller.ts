import { Controller, Get, Param, Post, Body, Query, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { EsimService } from './esim.service';
import { UsageService } from './usage.service';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { PrismaService } from '../../prisma.service';

@Controller() // Do NOT prefix with /api. Global prefix handles it.
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
    if (!profile || !profile.order) {
      throw new NotFoundException('Profile not found');
    }

    // 2. Get original plan details to find location
    const planId = profile.order.planId;
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
  async getEsimProfile(@Param('iccid') iccid: string) {
    const profile = await this.ordersService.findByIccid(iccid);
    if (!profile) throw new NotFoundException('Profile not found');
    
    // Enrich with plan details
    const planId = profile.order?.planId;
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
  async syncNow() {
    await this.ordersService.syncEsimProfiles();
    return { message: 'Sync cycle completed', timestamp: new Date().toISOString() };
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
}
