import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

export function rateLimitKey(key: string): string {
  return `ratelimit:${key}`;
}

