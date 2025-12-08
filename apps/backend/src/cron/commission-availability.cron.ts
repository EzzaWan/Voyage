import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AffiliateCommissionService } from '../modules/affiliate/affiliate-commission.service';

@Injectable()
export class CommissionAvailabilityCron {
  private readonly logger = new Logger(CommissionAvailabilityCron.name);

  constructor(private readonly commissionService: AffiliateCommissionService) {}

  @Cron(CronExpression.EVERY_HOUR) // Run every hour
  async markCommissionsAvailable() {
    this.logger.log('[CRON][COMMISSION-AVAILABILITY] Checking for commissions ready to become available...');

    try {
      const count = await this.commissionService.markCommissionsAsAvailable();
      if (count > 0) {
        this.logger.log(`[CRON][COMMISSION-AVAILABILITY] Marked ${count} commissions as available`);
      } else {
        this.logger.debug('[CRON][COMMISSION-AVAILABILITY] No commissions ready to become available');
      }
    } catch (error) {
      this.logger.error('[CRON][COMMISSION-AVAILABILITY] Error marking commissions as available:', error);
    }
  }
}


