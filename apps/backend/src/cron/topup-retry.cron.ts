import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TopUpService } from '../modules/topup/topup.service';

@Injectable()
export class TopUpRetryCron {
  private readonly logger = new Logger(TopUpRetryCron.name);

  constructor(private readonly topUpService: TopUpService) {}

  @Cron('*/3 * * * *') // Every 3 minutes
  async handleTopUpRetry() {
    this.logger.log('[CRON][TOPUP-RETRY] Running topup retry cycle...');

    try {
      // Get all pending or processing topups
      const topups = await this.topUpService.getPendingTopUps();

      this.logger.log(`[CRON][TOPUP-RETRY] Found ${topups.length} pending/processing topup(s)`);

      for (const topup of topups) {
        try {
          await this.topUpService.pollRechargeOrder(topup.id);
        } catch (err) {
          this.logger.error(`[CRON][TOPUP-RETRY] Error processing topup ${topup.id}:`, err);
        }
      }
    } catch (error) {
      this.logger.error('[CRON][TOPUP-RETRY] Error in retry cycle:', error);
    }
  }
}

