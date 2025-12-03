import { Module, forwardRef } from '@nestjs/common';
import { TopUpController } from './topup.controller';
import { TopUpService } from './topup.service';
import { StripeModule } from '../stripe/stripe.module';
import { EsimModule } from '../esim/esim.module';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    StripeModule,
    forwardRef(() => EsimModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [TopUpController],
  providers: [TopUpService, PrismaService],
  exports: [TopUpService],
})
export class TopUpModule {}

