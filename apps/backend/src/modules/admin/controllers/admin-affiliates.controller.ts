import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AffiliateService } from '../../affiliate/affiliate.service';
import { AffiliateCommissionService } from '../../affiliate/affiliate-commission.service';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/affiliates')
@UseGuards(AdminGuard)
export class AdminAffiliatesController {
  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly commissionService: AffiliateCommissionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAllAffiliates(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.affiliateService.getAllAffiliates(pageNum, limitNum);
  }

  @Get('commissions')
  async getAllCommissions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.affiliateService.getAllCommissions(pageNum, limitNum);
  }

  @Get('cash-out-requests')
  async getCashOutRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where: {
          action: 'CASH_OUT_REQUEST',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      this.prisma.adminLog.count({
        where: {
          action: 'CASH_OUT_REQUEST',
        },
      }),
    ]);

    return {
      requests: requests.map((log) => ({
        id: log.id,
        ...(log.data as any),
        createdAt: log.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Post(':affiliateId/freeze')
  async freezeAffiliate(
    @Param('affiliateId') affiliateId: string,
    @Body() body: { frozen: boolean },
  ) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const updated = await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        isFrozen: body.frozen !== undefined ? body.frozen : true,
      },
    });

    return { affiliate: updated };
  }

  /**
   * Manually trigger commission availability update
   * This runs the same logic as the cron job to move pending commissions to available
   * @param force - If true, ignores holding period and moves ALL pending commissions to available
   */
  @Post('commissions/mark-available')
  async markCommissionsAvailable(@Body() body: { force?: boolean }) {
    if (body.force) {
      // Force update: Move ALL pending commissions to available (ignore holding period)
      const result = await this.prisma.commission.updateMany({
        where: {
          status: 'pending',
        },
        data: {
          status: 'available',
        },
      });

      return {
        success: true,
        message: `Force updated ${result.count} pending commissions to available`,
        count: result.count,
        force: true,
      };
    } else {
      // Normal update: Only move commissions that have passed their holding period
      const count = await this.commissionService.markCommissionsAsAvailable();
      return {
        success: true,
        message: `Marked ${count} commissions as available`,
        count,
        force: false,
      };
    }
  }
}

