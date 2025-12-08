import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EsimRetryCron } from './esim-retry.cron';
import { EsimSyncCron } from './esim-sync.cron';
import { TopUpRetryCron } from './topup-retry.cron';
import { CommissionAvailabilityCron } from './commission-availability.cron';
import { OrdersModule } from '../modules/orders/orders.module';
import { TopUpModule } from '../modules/topup/topup.module';
import { AffiliateModule } from '../modules/affiliate/affiliate.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OrdersModule,
    forwardRef(() => TopUpModule),
    forwardRef(() => AffiliateModule),
  ],
  providers: [
    EsimRetryCron,
    EsimSyncCron,
    TopUpRetryCron,
    CommissionAvailabilityCron,
  ],
})
export class CronModule {}

