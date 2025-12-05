import { Redis } from '@upstash/redis';
import { Logger } from '@nestjs/common';

const logger = new Logger('Redis');

// Initialize Redis with safe fallback
let redisInstance: Redis | null = null;

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    redisInstance = Redis.fromEnv();
  } else {
    logger.warn('Redis environment variables not set. Rate limiting will be disabled.');
  }
} catch (error) {
  logger.warn(`Failed to initialize Redis: ${error.message}. Rate limiting will be disabled.`);
}

// Export a safe wrapper that handles missing Redis (fail open)
export const redis = redisInstance || {
  incr: async () => {
    logger.debug('Redis not available, allowing request (fail open)');
    return 0;
  },
  expire: async () => {},
  get: async () => null,
  set: async () => {},
  del: async () => {},
  multi: () => ({
    incr: async () => [0, 0],
    expire: async () => {},
    exec: async () => [],
  }),
} as any;

export function rateLimitKey(key: string): string {
  return `ratelimit:${key}`;
}

