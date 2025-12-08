import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EsimModule } from './modules/esim/esim.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UsersModule } from './modules/users/users.module';
import { TopUpModule } from './modules/topup/topup.module';
import { CronModule } from './cron/cron.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';
import { ReceiptModule } from './modules/receipt/receipt.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { DeviceModule } from './modules/device/device.module';
import { CommonModule } from './common/modules/common.module';
import { LogModule } from './modules/log/log.module';
import { SupportModule } from './modules/support/support.module';
import { VCashModule } from './modules/vcash/vcash.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    EsimModule,
    UsersModule,
    OrdersModule,
    StripeModule,
    WebhooksModule,
    TopUpModule,
    CronModule,
    AdminModule,
    EmailModule,
    ReceiptModule,
    CurrencyModule,
    AffiliateModule,
    DeviceModule,
    LogModule,
    SupportModule,
    VCashModule,
  ],
})
export class AppModule {}
