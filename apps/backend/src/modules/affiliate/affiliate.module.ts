import { Module, forwardRef } from '@nestjs/common';
import { AffiliateController } from './affiliate.controller';
import { AffiliatePayoutController } from './affiliate-payout.controller';
import { AffiliateService } from './affiliate.service';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { AffiliatePayoutService } from './affiliate-payout.service';
import { AffiliateAnalyticsService } from './affiliate-analytics.service';
import { FraudService } from './fraud/fraud.service';
import { FraudDetectionService } from './fraud/fraud-detection.service';
import { PrismaService } from '../../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';
import { VCashModule } from '../vcash/vcash.module';
import { CommonModule } from '../../common/modules/common.module';

@Module({
  imports: [ConfigModule, forwardRef(() => EmailModule), forwardRef(() => AdminModule), VCashModule, CommonModule],
  controllers: [AffiliateController, AffiliatePayoutController],
  providers: [
    AffiliateService,
    AffiliateCommissionService,
    AffiliatePayoutService,
    AffiliateAnalyticsService,
    FraudService,
    FraudDetectionService,
    PrismaService,
  ],
  exports: [
    AffiliateService,
    AffiliateCommissionService,
    AffiliatePayoutService,
    AffiliateAnalyticsService,
    FraudService,
    FraudDetectionService,
  ],
})
export class AffiliateModule {}

