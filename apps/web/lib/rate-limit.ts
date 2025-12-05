import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

interface RateLimitOptions {
  limit: number;
  window: number; // in seconds
}

export function createLimiter(options: RateLimitOptions) {
  const { limit, window } = options;

  return async function check(key: string): Promise<boolean> {
    const keyName = `web:ratelimit:${key}`;

    try {
      const res = await redis.incr(keyName);

      if (res === 1) {
        await redis.expire(keyName, window);
      }

      return res <= limit;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail open
    }
  };
}

