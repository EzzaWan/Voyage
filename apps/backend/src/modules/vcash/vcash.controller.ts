import {
  Controller,
  Get,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { VCashService } from './vcash.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('vcash')
export class VCashController {
  constructor(
    private readonly vcashService: VCashService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get V-Cash balance for current user
   */
  @Get()
  async getBalance(@Req() req: any) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist (e.g., just signed up via Clerk)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: null,
      },
      update: {},
    });

    const balanceCents = await this.vcashService.getBalance(user.id);
    const defaultCurrency = this.config.get<string>('DEFAULT_CURRENCY') || 'USD';

    return {
      balanceCents,
      currency: defaultCurrency,
    };
  }

  /**
   * Get V-Cash transactions for current user
   */
  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const email = req.headers['x-user-email'] as string;
    if (!email) {
      throw new NotFoundException('User email not found');
    }

    // Auto-create user if they don't exist (e.g., just signed up via Clerk)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: null,
      },
      update: {},
    });

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 50;

    return this.vcashService.getTransactions(user.id, pageNum, pageSizeNum);
  }
}


