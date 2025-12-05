import { Injectable, Logger } from '@nestjs/common';
import { redis, rateLimitKey } from '../utils/redis';
import { AppError } from '../errors/app-error';

@Injectable()
export class LoginThrottleService {
  private readonly logger = new Logger(LoginThrottleService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_SECONDS = 60; // 1 minute

  async checkLoginAttempts(ip: string): Promise<void> {
    const key = rateLimitKey(`login_attempt:${ip}`);
    
    try {
      const [count, ttl] = await redis.multi()
        .incr(key)
        .ttl(key)
        .exec() as [number, number];

      if (ttl === -1) {
        await redis.expire(key, this.WINDOW_SECONDS);
      }

      if (count > this.MAX_ATTEMPTS) {
        this.logger.warn(`IP ${ip} exceeded login attempt limit`);
        throw new AppError(
          'Too many login attempts. Please try again later.',
          429,
          'LOGIN_THROTTLED'
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Failed to check login attempts for IP ${ip}:`, error);
      // Fail open - allow login if Redis is down
    }
  }

  async resetLoginAttempts(ip: string): Promise<void> {
    const key = rateLimitKey(`login_attempt:${ip}`);
    try {
      await redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to reset login attempts for IP ${ip}:`, error);
    }
  }
}

