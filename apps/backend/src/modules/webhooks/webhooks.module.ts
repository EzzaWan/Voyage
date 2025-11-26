import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [StripeModule, EsimModule, OrdersModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
})
export class WebhooksModule {}

