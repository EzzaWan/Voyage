import { Module, forwardRef } from '@nestjs/common';
import { EsimController } from './esim.controller';
import { EsimService } from './esim.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  controllers: [EsimController],
  providers: [EsimService],
  exports: [EsimService],
  imports: [forwardRef(() => OrdersModule)],
})
export class EsimModule {}
