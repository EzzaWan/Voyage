import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from '../modules/orders/orders.service';

@Injectable()
export class EsimSyncCron {
  private readonly logger = new Logger(EsimSyncCron.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async handleSync() {
    this.logger.log('[CRON][ESIM-SYNC] Syncing all profiles...');
    
    try {
      await this.ordersService.syncEsimProfiles();
    } catch (error) {
      this.logger.error('[CRON][ESIM-SYNC] Error in sync cycle:', error);
    }
  }
}

