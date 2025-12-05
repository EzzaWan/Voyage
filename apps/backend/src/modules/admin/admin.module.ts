import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminSettingsService } from './admin-settings.service';
import { CurrencyConverterService } from './currency-converter.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminEsimsController } from './controllers/admin-esims.controller';
import { AdminTopupController } from './controllers/admin-topup.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminLogsController } from './controllers/admin-logs.controller';
import { AdminAffiliatesController } from './controllers/admin-affiliates.controller';
import { PrismaService } from '../../prisma.service';
import { OrdersModule } from '../orders/orders.module';
import { EsimModule } from '../esim/esim.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/modules/common.module';

@Module({
  imports: [forwardRef(() => OrdersModule), forwardRef(() => EsimModule), AffiliateModule, ConfigModule, CommonModule],
  controllers: [
    AdminOrdersController,
    AdminEsimsController,
    AdminTopupController,
    AdminUsersController,
    AdminSettingsController,
    AdminLogsController,
    AdminAffiliatesController,
  ],
  providers: [AdminService, AdminSettingsService, CurrencyConverterService, AdminGuard, PrismaService],
  exports: [AdminService, AdminSettingsService, CurrencyConverterService, AdminGuard],
})
export class AdminModule {}

