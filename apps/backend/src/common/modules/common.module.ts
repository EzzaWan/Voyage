import { Global, Module } from '@nestjs/common';
import { ErrorLoggerService } from '../services/error-logger.service';
import { PrismaService } from '../../prisma.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { PaymentFailureRateLimitService } from '../services/payment-failure-rate-limit.service';

@Global()
@Module({
  providers: [
    ErrorLoggerService,
    PrismaService,
    RateLimitGuard,
    PaymentFailureRateLimitService,
  ],
  exports: [
    ErrorLoggerService,
    RateLimitGuard,
    PaymentFailureRateLimitService,
  ],
})
export class CommonModule {}

