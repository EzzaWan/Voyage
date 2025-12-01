import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EsimRetryCron } from './esim-retry.cron';
import { EsimSyncCron } from './esim-sync.cron';
import { OrdersModule } from '../modules/orders/orders.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OrdersModule,
  ],
  providers: [
    EsimRetryCron,
    EsimSyncCron,
  ],
})
export class CronModule {}

