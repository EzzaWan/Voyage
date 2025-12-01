import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [StripeModule, forwardRef(() => EsimModule)],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}

