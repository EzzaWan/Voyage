import { Global, Module } from '@nestjs/common';
import { ErrorLoggerService } from '../services/error-logger.service';
import { PrismaService } from '../../prisma.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { PaymentFailureRateLimitService } from '../services/payment-failure-rate-limit.service';
import { SecurityLoggerService } from '../services/security-logger.service';

@Global()
@Module({
  providers: [
    ErrorLoggerService,
    PrismaService,
    RateLimitGuard,
    CsrfGuard,
    PaymentFailureRateLimitService,
    SecurityLoggerService,
  ],
  exports: [
    ErrorLoggerService,
    RateLimitGuard,
    CsrfGuard,
    PaymentFailureRateLimitService,
    SecurityLoggerService,
  ],
})
export class CommonModule {}

