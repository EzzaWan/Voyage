import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AffiliatePayoutService } from '../../affiliate/affiliate-payout.service';
import { SecurityLoggerService } from '../../../common/services/security-logger.service';
import { getClientIp } from '../../../common/utils/webhook-ip-whitelist';

@Controller('admin/affiliate/payouts')
@UseGuards(AdminGuard)
export class AdminPayoutsController {
  constructor(
    private payoutService: AffiliatePayoutService,
    private securityLogger: SecurityLoggerService,
  ) {}

  /**
   * Get all payout requests
   */
  @Get()
  async getAllPayoutRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('affiliateId') affiliateId?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.payoutService.getAllPayoutRequests(
      pageNum,
      limitNum,
      status,
      affiliateId,
    );
  }

  /**
   * Approve payout request
   */
  @Post(':id/approve')
  async approvePayoutRequest(@Param('id') requestId: string, @Req() req: any) {
    const adminEmail = req.adminEmail;
    const ip = getClientIp(req);

    const oldRequest = await this.payoutService.getAllPayoutRequests(
      1,
      1,
      undefined,
      undefined,
    );
    const request = oldRequest.requests.find((r) => r.id === requestId);
    const oldStatus = request?.status || 'unknown';

    const updated = await this.payoutService.approvePayoutRequest(
      requestId,
      adminEmail,
    );

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      ip,
      userId: request?.affiliateId,
      details: {
        payoutRequestId: requestId,
        oldStatus,
        newStatus: 'approved',
        adminEmail,
      },
    });

    return { request: updated };
  }

  /**
   * Decline payout request
   */
  @Post(':id/decline')
  async declinePayoutRequest(
    @Param('id') requestId: string,
    @Body() body: { adminNote?: string },
    @Req() req: any,
  ) {
    const adminEmail = req.adminEmail;
    const ip = getClientIp(req);

    const oldRequest = await this.payoutService.getAllPayoutRequests(
      1,
      1,
      undefined,
      undefined,
    );
    const request = oldRequest.requests.find((r) => r.id === requestId);
    const oldStatus = request?.status || 'unknown';

    const updated = await this.payoutService.declinePayoutRequest(
      requestId,
      adminEmail,
      body.adminNote,
    );

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      ip,
      userId: request?.affiliateId,
      details: {
        payoutRequestId: requestId,
        oldStatus,
        newStatus: 'declined',
        adminEmail,
        adminNote: body.adminNote,
      },
    });

    return { request: updated };
  }

  /**
   * Mark payout as paid
   */
  @Post(':id/mark-paid')
  async markPayoutAsPaid(@Param('id') requestId: string, @Req() req: any) {
    const adminEmail = req.adminEmail;
    const ip = getClientIp(req);

    const oldRequest = await this.payoutService.getAllPayoutRequests(
      1,
      1,
      undefined,
      undefined,
    );
    const request = oldRequest.requests.find((r) => r.id === requestId);
    const oldStatus = request?.status || 'unknown';

    const updated = await this.payoutService.markPayoutAsPaid(
      requestId,
      adminEmail,
    );

    // Log security event
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      ip,
      userId: request?.affiliateId,
      details: {
        payoutRequestId: requestId,
        oldStatus,
        newStatus: 'paid',
        adminEmail,
      },
    });

    return { request: updated };
  }
}


