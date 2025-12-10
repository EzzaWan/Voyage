import { Module, forwardRef } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';
import { OrdersModule } from '../orders/orders.module';
import { TopUpModule } from '../topup/topup.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { PrismaService } from '../../prisma.service';
import { SecurityLoggerService } from '../../common/services/security-logger.service';

@Module({
  imports: [
    StripeModule,
    EsimModule,
    OrdersModule,
    forwardRef(() => AffiliateModule),
    forwardRef(() => TopUpModule),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService, SecurityLoggerService],
})
export class WebhooksModule {
  // FraudService is accessed via forwardRef from AffiliateModule
}

