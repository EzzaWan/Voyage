import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module'; // Assuming we might need it later, though worker handles most
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [StripeModule, EsimModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
})
export class WebhooksModule {}

