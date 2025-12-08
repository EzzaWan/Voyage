import { Module, forwardRef } from '@nestjs/common';
import { AffiliateController } from './affiliate.controller';
import { AffiliatePayoutController } from './affiliate-payout.controller';
import { AffiliateService } from './affiliate.service';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { AffiliatePayoutService } from './affiliate-payout.service';
import { PrismaService } from '../../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';
import { VCashModule } from '../vcash/vcash.module';

@Module({
  imports: [ConfigModule, forwardRef(() => EmailModule), forwardRef(() => AdminModule), VCashModule],
  controllers: [AffiliateController, AffiliatePayoutController],
  providers: [
    AffiliateService,
    AffiliateCommissionService,
    AffiliatePayoutService,
    PrismaService,
  ],
  exports: [
    AffiliateService,
    AffiliateCommissionService,
    AffiliatePayoutService,
  ],
})
export class AffiliateModule {}

