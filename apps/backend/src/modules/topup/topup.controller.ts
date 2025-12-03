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
    displayCurrency?: string;
  }) {
    return this.topUpService.createStripeTopUpCheckoutByIccid(
      body.iccid,
      body.planCode,
      body.amount,
      body.currency,
      body.displayCurrency
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

