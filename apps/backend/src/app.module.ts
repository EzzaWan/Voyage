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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
