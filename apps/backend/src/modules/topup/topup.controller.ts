import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TopUpService } from './topup.service';

@Controller('topup')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  @Post('create')
  async createTopUp(@Body() body: {
    profileId: string;
    planCode: string;
    amount: number;
    currency: string;
  }) {
    return this.topUpService.createStripeTopUpCheckout(
      body.profileId,
      body.planCode,
      body.amount,
      body.currency,
    );
  }

  @Post('checkout')
  async checkout(@Body() body: {
    iccid: string;
    planCode: string;
    amount: number;
    currency: string;
  }) {
    // Find profile by ICCID
    // We can use prisma directly or a service helper.
    // TopUpService has prisma access but no findByIccid helper exposed.
    // Let's just add a helper or use createStripeTopUpCheckout with profileId lookup logic.
    // Actually, createStripeTopUpCheckout takes profileId.
    // We need to find profileId from iccid first.
    
    // For now, let's handle it in controller or add a service method.
    // Adding service method is cleaner: createStripeTopUpCheckoutByIccid
    return this.topUpService.createStripeTopUpCheckoutByIccid(
      body.iccid,
      body.planCode,
      body.amount,
      body.currency
    );
  }

  @Get('me')
  async getMyTopUps(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId query parameter is required' };
    }
    return this.topUpService.getUserTopUps(userId);
  }
}

