import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EsimModule } from './modules/esim/esim.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EsimModule,
    UsersModule,
    OrdersModule,
    StripeModule,
    WebhooksModule,
  ],
})
export class AppModule {}
