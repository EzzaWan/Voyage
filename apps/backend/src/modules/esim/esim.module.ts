import { Module, forwardRef } from '@nestjs/common';
import { EsimController } from './esim.controller';
import { EsimService } from './esim.service';
import { UsageService } from './usage.service';
import { PrismaService } from '../../prisma.service';
import { OrdersModule } from '../orders/orders.module';
import { TopUpModule } from '../topup/topup.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  controllers: [EsimController],
  providers: [EsimService, UsageService, PrismaService],
  exports: [EsimService, UsageService],
  imports: [
    forwardRef(() => OrdersModule),
    forwardRef(() => TopUpModule),
    forwardRef(() => AdminModule),
  ],
})
export class EsimModule {}
