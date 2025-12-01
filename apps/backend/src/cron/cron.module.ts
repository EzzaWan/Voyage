import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EsimRetryCron } from './esim-retry.cron';
import { EsimSyncCron } from './esim-sync.cron';
import { TopUpRetryCron } from './topup-retry.cron';
import { OrdersModule } from '../modules/orders/orders.module';
import { TopUpModule } from '../modules/topup/topup.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OrdersModule,
    forwardRef(() => TopUpModule),
  ],
  providers: [
    EsimRetryCron,
    EsimSyncCron,
    TopUpRetryCron,
  ],
})
export class CronModule {}

