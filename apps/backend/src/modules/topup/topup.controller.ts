import { Controller, Post, Body, Get, Query, UseGuards, Headers } from '@nestjs/common';
import { TopUpService } from './topup.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CreateTopUpDto, TopUpCheckoutDto } from '../../common/dto/topup.dto';
import { PrismaService } from '../../prisma.service';
import { getUserIdFromEmail } from '../../common/utils/get-user-id';
import { assertOwnership } from '../../common/utils/assert-ownership';
import { NotFoundException } from '@nestjs/common';

@Controller('topup')
@UseGuards(RateLimitGuard, CsrfGuard)
export class TopUpController {
  constructor(
    private readonly topUpService: TopUpService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  @RateLimit({ limit: 3, window: 60 })
  async createTopUp(
    @Body() body: CreateTopUpDto,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    // Verify profile exists and user owns it
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id: body.profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

    return this.topUpService.createStripeTopUpCheckout(
      body.profileId,
      body.planCode,
      body.amount,
      body.currency,
    );
  }

  @Post('checkout')
  @RateLimit({ limit: 3, window: 60 })
  async checkout(
    @Body() body: TopUpCheckoutDto,
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    if (!userEmail) {
      throw new NotFoundException('User email required');
    }

    const userId = await getUserIdFromEmail(this.prisma, userEmail);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    // Verify profile exists and user owns it
    const profile = await this.prisma.esimProfile.findFirst({
      where: { iccid: body.iccid },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    assertOwnership({
      userId,
      ownerId: profile.userId,
      resource: 'eSIM Profile',
    });

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

