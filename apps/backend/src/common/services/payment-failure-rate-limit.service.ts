import { Injectable, Logger } from '@nestjs/common';
import { redis, rateLimitKey } from '../utils/redis';
import { AppError } from '../errors/app-error';

@Injectable()
export class PaymentFailureRateLimitService {
  private readonly logger = new Logger(PaymentFailureRateLimitService.name);

  async checkPaymentFailureLimit(userId: string): Promise<void> {
    const key = rateLimitKey(`payment_fail:${userId}`);
    const maxFailures = 3;
    const windowSeconds = 600; // 10 minutes

    try {
      const failures = await redis.incr(key);

      if (failures === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (failures > maxFailures) {
        this.logger.warn(`User ${userId} exceeded payment failure limit`);
        throw new AppError(
          'Too many failed payments. Please try again later.',
          429,
          'PAYMENT_FAILURE_LIMIT',
          {
            retryAfter: windowSeconds,
            maxFailures,
          },
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Payment failure rate limit check error:', error);
    }
  }

  async resetPaymentFailureLimit(userId: string): Promise<void> {
    const key = rateLimitKey(`payment_fail:${userId}`);
    try {
      await redis.del(key);
    } catch (error) {
      this.logger.error('Failed to reset payment failure limit:', error);
    }
  }
}


