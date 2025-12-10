import { Controller, Get, Post, Param, Body, Query, Req, UseGuards, Logger } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { FraudService } from '../../affiliate/fraud/fraud.service';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/affiliate/fraud')
@UseGuards(AdminGuard)
export class AdminFraudController {
  private readonly logger = new Logger(AdminFraudController.name);

  constructor(
    private fraudService: FraudService,
    private prisma: PrismaService,
  ) {}

  /**
   * Search affiliates for fraud review
   */
  @Get('search')
  async searchAffiliates(
    @Query('q') query?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('frozen') frozen?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 50 : limitNum;

      let where: any = {};

      if (query && query.trim()) {
        where.OR = [
          { referralCode: { contains: query.trim(), mode: 'insensitive' } },
          {
            User: {
              OR: [
                { email: { contains: query.trim(), mode: 'insensitive' } },
                { id: query.trim() },
              ],
            },
          },
        ];
      }

      // Only filter by isFrozen if the column exists (graceful degradation)
      if (frozen === 'true' || frozen === 'false') {
        where.isFrozen = frozen === 'true';
      }

      const affiliates = await this.prisma.affiliate.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          AffiliateFraudScore: true,
        },
        take: validLimit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter by risk level if provided
      let filtered = affiliates;
      if (riskLevel && riskLevel.trim()) {
        filtered = affiliates.filter((a) => a.AffiliateFraudScore?.riskLevel === riskLevel.trim());
      }

      return {
        affiliates: filtered.map((aff) => ({
          id: aff.id,
          referralCode: aff.referralCode,
          userEmail: aff.User?.email || '',
          userName: aff.User?.name || null,
          isFrozen: aff.isFrozen,
          fraudScore: aff.AffiliateFraudScore?.totalScore || 0,
          riskLevel: aff.AffiliateFraudScore?.riskLevel || 'low',
        })),
      };
    } catch (error: any) {
      this.logger.error('[AdminFraudController] Error searching affiliates:', error);
      this.logger.error('Error details:', JSON.stringify({
        code: error?.code,
        meta: error?.meta,
        message: error?.message,
        stack: error?.stack,
      }));
      throw error;
    }
  }

  /**
   * Get fraud details for affiliate
   */
  @Get(':affiliateId')
  async getFraudDetails(@Param('affiliateId') affiliateId: string) {
    const summary = await this.fraudService.getFraudSummary(affiliateId);
    return summary;
  }

  /**
   * Freeze affiliate
   */
  @Post(':affiliateId/freeze')
  async freezeAffiliate(@Param('affiliateId') affiliateId: string, @Req() req: any) {
    const adminEmail = req.headers['x-admin-email'] as string || 'unknown';
    await this.fraudService.freezeAffiliate(affiliateId, false);
    return { success: true, message: 'Affiliate frozen' };
  }

  /**
   * Unfreeze affiliate
   */
  @Post(':affiliateId/unfreeze')
  async unfreezeAffiliate(@Param('affiliateId') affiliateId: string, @Req() req: any) {
    const adminEmail = req.headers['x-admin-email'] as string || 'unknown';
    await this.fraudService.unfreezeAffiliate(affiliateId, adminEmail);
    return { success: true, message: 'Affiliate unfrozen' };
  }

  /**
   * Get fraud events for affiliate
   */
  @Get(':affiliateId/events')
  async getFraudEvents(@Param('affiliateId') affiliateId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 500 ? 100 : limitNum;

    const events = await this.fraudService.getFraudEvents(affiliateId, validLimit);
    return { events };
  }
}

