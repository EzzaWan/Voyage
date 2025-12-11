import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';
import { EmailModule } from '../email/email.module';
import { ReceiptModule } from '../receipt/receipt.module';
import { CurrencyModule } from '../currency/currency.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { VCashModule } from '../vcash/vcash.module';
import { AdminModule } from '../admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    StripeModule,
    forwardRef(() => EsimModule),
    forwardRef(() => EmailModule),
    forwardRef(() => ReceiptModule),
    CurrencyModule,
    forwardRef(() => AffiliateModule),
    VCashModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {
  // Note: FraudDetectionService is accessed via forwardRef from AffiliateModule
  // OrdersService injects it via @Inject(forwardRef(() => FraudDetectionService))
}

