import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../modules/orders/orders.service';

@Injectable()
export class EsimRetryCron {
  private readonly logger = new Logger(EsimRetryCron.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron('*/2 * * * *') // Every 2 minutes
  async handleRetry() {
    this.logger.log('[CRON][ESIM-RETRY] Running retry cycle...');
    
    try {
      await this.ordersService.retryPendingOrders();
    } catch (error) {
      this.logger.error('[CRON][ESIM-RETRY] Error in retry cycle:', error);
    }
  }
}

