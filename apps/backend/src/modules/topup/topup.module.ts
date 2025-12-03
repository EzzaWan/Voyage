import { Module, forwardRef } from '@nestjs/common';
import { TopUpController } from './topup.controller';
import { TopUpService } from './topup.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';
import { EmailModule } from '../email/email.module';
import { CurrencyModule } from '../currency/currency.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    StripeModule,
    forwardRef(() => EsimModule),
    forwardRef(() => EmailModule),
    CurrencyModule,
    AffiliateModule,
  ],
  controllers: [TopUpController],
  providers: [TopUpService, PrismaService],
  exports: [TopUpService],
})
export class TopUpModule {}

