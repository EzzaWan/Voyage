import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminSettingsService } from './admin-settings.service';
import { CurrencyConverterService } from './currency-converter.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminEsimsController } from './controllers/admin-esims.controller';
import { AdminTopupController } from './controllers/admin-topup.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminSettingsController, AdminCheckController, AdminDiscountsController } from './controllers/admin-settings.controller';
import { AdminLogsController } from './controllers/admin-logs.controller';
import { AdminAffiliatesController } from './controllers/admin-affiliates.controller';
import { AdminPayoutsController } from './controllers/admin-payouts.controller';
import { AdminVCashController } from './controllers/admin-vcash.controller';
import { AdminAffiliateAnalyticsController } from './controllers/admin-affiliate-analytics.controller';
import { AdminFraudController } from './controllers/admin-fraud.controller';
import { PrismaService } from '../../prisma.service';
import { OrdersModule } from '../orders/orders.module';
import { EsimModule } from '../esim/esim.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { VCashModule } from '../vcash/vcash.module';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/modules/common.module';

@Module({
        imports: [forwardRef(() => OrdersModule), forwardRef(() => EsimModule), forwardRef(() => AffiliateModule), VCashModule, StripeModule, forwardRef(() => EmailModule), ConfigModule, CommonModule],
  controllers: [
    AdminOrdersController,
    AdminEsimsController,
    AdminTopupController,
    AdminUsersController,
    AdminSettingsController,
    AdminCheckController,
    AdminDiscountsController,
    AdminLogsController,
    AdminAffiliatesController,
    AdminPayoutsController,
    AdminVCashController,
    AdminAffiliateAnalyticsController,
    AdminFraudController,
  ],
  providers: [AdminService, AdminSettingsService, CurrencyConverterService, AdminGuard, PrismaService],
  exports: [AdminService, AdminSettingsService, CurrencyConverterService, AdminGuard],
})
export class AdminModule {}

