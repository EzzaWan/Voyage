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

  @Get('me')
  async getMyTopUps(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId query parameter is required' };
    }
    return this.topUpService.getUserTopUps(userId);
  }
}

