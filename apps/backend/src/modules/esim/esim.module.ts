import { Module, forwardRef } from '@nestjs/common';
import { EsimController } from './esim.controller';
import { EsimService } from './esim.service';
import { OrdersModule } from '../orders/orders.module';
import { TopUpModule } from '../topup/topup.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  controllers: [EsimController],
  providers: [EsimService],
  exports: [EsimService],
  imports: [
    forwardRef(() => OrdersModule),
    forwardRef(() => TopUpModule),
    forwardRef(() => AdminModule),
  ],
})
export class EsimModule {}
