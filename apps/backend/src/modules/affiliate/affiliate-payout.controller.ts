import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AffiliatePayoutService } from './affiliate-payout.service';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { AffiliateService } from './affiliate.service';
import { PrismaService } from '../../prisma.service';

@Controller('affiliate/payout')
export class AffiliatePayoutController {
  constructor(
    private payoutService: AffiliatePayoutService,
    private commissionService: AffiliateCommissionService,
    private affiliateService: AffiliateService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get payout method
   */
  @Get('method')
  async getPayoutMethod(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      return { method: null };
    }

    const method = await this.payoutService.getPayoutMethod(affiliate.id);
    return { method };
  }

  /**
   * Save payout method
   */
  @Post('method')
  async savePayoutMethod(
    @Req() req: any,
    @Body()
    body: {
      type: 'paypal' | 'bank';
      paypalEmail?: string;
      bankHolderName?: string;
      bankIban?: string;
      bankSwift?: string;
    },
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get or create affiliate (auto-create if doesn't exist)
    let affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      // Auto-create affiliate if it doesn't exist
      await this.affiliateService.createAffiliateForUser(user.id);
      affiliate = await this.prisma.affiliate.findUnique({
        where: { userId: user.id },
      });
    }

    if (!affiliate) {
      throw new BadRequestException('Failed to create affiliate');
    }

    const method = await this.payoutService.savePayoutMethod(
      affiliate.id,
      body.type,
      body.paypalEmail,
      body.bankHolderName,
      body.bankIban,
      body.bankSwift,
    );

    return { method };
  }

  /**
   * Delete payout method
   */
  @Delete('method/:id')
  async deletePayoutMethod(@Req() req: any, @Param('id') methodId: string) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      throw new BadRequestException('Affiliate not found');
    }

    await this.payoutService.deletePayoutMethod(affiliate.id, methodId);
    return { success: true };
  }

  /**
   * Create payout request
   */
  @Post('request')
  async createPayoutRequest(
    @Req() req: any,
    @Body() body: { amountCents: number },
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      throw new BadRequestException('Affiliate not found');
    }

    if (!body.amountCents || body.amountCents <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const request = await this.payoutService.createPayoutRequest(
      affiliate.id,
      body.amountCents,
    );

    return { request };
  }

  /**
   * Get payout history
   */
  @Get('history')
  async getPayoutHistory(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId: user.id },
    });

    if (!affiliate) {
      return { history: [] };
    }

    const history = await this.payoutService.getPayoutHistory(affiliate.id);
    return { history };
  }
}

